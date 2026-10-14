import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';

/**
 * Client-side PDF engine for PDF Toolkit Pro.
 *
 * Everything runs locally in the browser — no uploads, no backend.
 * All functions throw PdfError with a user-friendly message on failure.
 */

export class PdfError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PdfError';
  }
}

function friendlyLoadError(err) {
  const msg = String(err?.message || err);
  if (/password|encrypt/i.test(msg)) {
    return 'This PDF is password-protected. Please unlock it and try again.';
  }
  if (/parse|invalid|catalog|trailer|xref|corrupt/i.test(msg)) {
    return 'This file could not be read as a PDF. It may be corrupted or in an unsupported format.';
  }
  return 'Could not read this PDF file.';
}

/** Load a File into a PDFDocument. Returns { doc, pageCount }. */
export async function loadPdfDocument(file) {
  let bytes;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    throw new PdfError('Could not read the selected file.');
  }
  try {
    const doc = await PDFDocument.load(bytes);
    return { doc, pageCount: doc.getPageCount() };
  } catch (err) {
    throw new PdfError(friendlyLoadError(err));
  }
}

/** Page count of a File without keeping the document around. */
export async function getPageCount(file) {
  const { pageCount } = await loadPdfDocument(file);
  return pageCount;
}

/** Merge files in order into a single PDF. Returns Uint8Array. */
export async function mergePdfs(files) {
  if (files.length < 2) {
    throw new PdfError('Select at least two PDF files to merge.');
  }
  const out = await PDFDocument.create();
  for (const file of files) {
    const { doc } = await loadPdfDocument(file);
    const pages = await out.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  return out.save();
}

/**
 * Split a PDF into one document per range.
 * ranges: [{ start, end }] — 1-based, inclusive.
 * Returns [{ name, bytes }] in the requested order.
 */
export async function splitPdf(file, ranges, baseName) {
  const { doc } = await loadPdfDocument(file);
  const total = doc.getPageCount();
  const results = [];
  for (const { start, end } of ranges) {
    if (start < 1 || end > total || start > end) {
      throw new PdfError(
        `Range ${start}-${end} is invalid for a ${total}-page document.`,
      );
    }
    const out = await PDFDocument.create();
    const indices = [];
    for (let p = start; p <= end; p++) indices.push(p - 1);
    const copied = await out.copyPages(doc, indices);
    copied.forEach((p) => out.addPage(p));
    results.push({
      name: `${baseName}-pages-${start}-${end}.pdf`,
      bytes: await out.save(),
    });
  }
  return results;
}

/** Extract pages (1-based, requested order preserved) into one PDF. */
export async function extractPages(file, pages) {
  const { doc } = await loadPdfDocument(file);
  const total = doc.getPageCount();
  for (const p of pages) {
    if (p < 1 || p > total) {
      throw new PdfError(`Page ${p} is out of range — this PDF has ${total} pages.`);
    }
  }
  const out = await PDFDocument.create();
  const copied = await out.copyPages(
    doc,
    pages.map((p) => p - 1),
  );
  copied.forEach((p) => out.addPage(p));
  return out.save();
}

/**
 * Rotate pages. pageNums is 'all' or a 1-based array. angle is 90/180/270.
 * Rotation is added to each page's existing rotation.
 */
export async function rotatePdf(file, pageNums, angle) {
  const { doc } = await loadPdfDocument(file);
  const total = doc.getPageCount();
  const indices =
    pageNums === 'all'
      ? doc.getPageIndices()
      : pageNums.map((p) => {
          if (p < 1 || p > total) {
            throw new PdfError(
              `Page ${p} is out of range — this PDF has ${total} pages.`,
            );
          }
          return p - 1;
        });
  for (const i of indices) {
    const page = doc.getPage(i);
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + angle) % 360));
  }
  return doc.save();
}

/** Reorder pages. order is 1-based, every page exactly once. */
export async function reorderPdf(file, order) {
  const { doc } = await loadPdfDocument(file);
  const total = doc.getPageCount();
  if (order.length !== total) {
    throw new PdfError(
      `The new order must list all ${total} pages exactly once.`,
    );
  }
  const seen = new Set(order);
  if (seen.size !== total || [...seen].some((p) => p < 1 || p > total)) {
    throw new PdfError(
      `The new order must contain every page from 1 to ${total} exactly once.`,
    );
  }
  const out = await PDFDocument.create();
  const copied = await out.copyPages(
    doc,
    order.map((p) => p - 1),
  );
  copied.forEach((p) => out.addPage(p));
  return out.save();
}

/**
 * Stamp a text watermark. opts:
 * { text, fontSize, opacity (0-1), rotation (deg), position, pages ('all' | 1-based[]), color (hex) }
 * position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
 */
export async function watermarkPdf(file, opts) {
  const { text, fontSize, opacity, rotation, position, pages, color } = opts;
  const clean = text.trim();
  if (!clean) throw new PdfError('Enter the watermark text first.');
  const { doc } = await loadPdfDocument(file);
  const total = doc.getPageCount();
  const indices =
    pages === 'all'
      ? doc.getPageIndices()
      : pages.map((p) => {
          if (p < 1 || p > total) {
            throw new PdfError(
              `Page ${p} is out of range — this PDF has ${total} pages.`,
            );
          }
          return p - 1;
        });
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const textWidth = font.widthOfTextAtSize(clean, fontSize);
  const rad = (rotation * Math.PI) / 180;
  // Offset of the text's visual center from the draw origin (baseline start).
  const cxOff = textWidth / 2;
  const cyOff = fontSize * 0.35;
  const rx = cxOff * Math.cos(rad) - cyOff * Math.sin(rad);
  const ry = cxOff * Math.sin(rad) + cyOff * Math.cos(rad);

  for (const i of indices) {
    const page = doc.getPage(i);
    const { width, height } = page.getSize();
    const m = 56; // margin from edges
    let ax;
    let ay;
    switch (position) {
      case 'top-left':
        ax = textWidth / 2 + m;
        ay = height - m - fontSize / 2;
        break;
      case 'top-right':
        ax = width - textWidth / 2 - m;
        ay = height - m - fontSize / 2;
        break;
      case 'bottom-left':
        ax = textWidth / 2 + m;
        ay = m + fontSize / 2;
        break;
      case 'bottom-right':
        ax = width - textWidth / 2 - m;
        ay = m + fontSize / 2;
        break;
      default:
        ax = width / 2;
        ay = height / 2;
    }
    page.drawText(clean, {
      x: ax - rx,
      y: ay - ry,
      size: fontSize,
      font,
      color: hexToPdfRgb(color),
      opacity,
      rotate: degrees(rotation),
    });
  }
  return doc.save();
}

/**
 * Map an unexpected processing failure to a user-friendly message.
 * PdfErrors already carry friendly text and pass through unchanged.
 */
export function friendlyProcessError(err) {
  if (err instanceof PdfError) return err.message;
  const msg = String(err?.message || '');
  if (/memory|allocation|out of memory|maximum call stack/i.test(msg)) {
    return 'Your browser ran out of memory while processing this file. Try a smaller PDF or fewer pages at a time.';
  }
  return 'Something went wrong while processing the PDF. The file may use an unsupported feature or be corrupted.';
}

/**
 * Rotate pages by a per-page map. anglesByPage: { [1-based page]: extra degrees }.
 * Each page's rotation is added to its existing rotation.
 */
export async function rotatePagesByMap(file, anglesByPage) {
  const { doc } = await loadPdfDocument(file);
  const total = doc.getPageCount();
  for (const [pageStr, angle] of Object.entries(anglesByPage)) {
    const p = Number(pageStr);
    if (!Number.isInteger(p) || p < 1 || p > total) {
      throw new PdfError(
        `Page ${pageStr} is out of range — this PDF has ${total} pages.`,
      );
    }
    const page = doc.getPage(p - 1);
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + angle) % 360));
  }
  return doc.save();
}

function hexToPdfRgb(hex) {
  const h = String(hex || '').replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (!/^[0-9a-fA-F]{6}$/.test(v)) return rgb(0.42, 0.42, 0.42);
  const n = parseInt(v, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/**
 * Trigger a download of PDF bytes. Creates a temporary object URL and
 * revokes it shortly after the download starts.
 */
export function downloadBytes(bytes, filename, mimeType = 'application/pdf') {
  const blob = bytes instanceof Blob ? bytes : new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

/** "report.pdf" -> "report"; used to build output filenames. */
export function baseName(filename) {
  return filename.replace(/\.pdf$/i, '') || 'document';
}
