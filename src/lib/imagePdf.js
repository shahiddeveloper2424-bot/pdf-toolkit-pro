import { PDFDocument, rgb } from 'pdf-lib';
import { PdfError, loadPdfDocument } from './pdfEngine.js';
import { imageFormat } from './fileKinds.js';

/**
 * Image → PDF engine (browser-local, pdf-lib based).
 *
 * - JPG/PNG are embedded directly (no quality loss).
 * - WebP (and anything pdf-lib cannot embed) is decoded through a
 *   browser Canvas and re-encoded as PNG — Chrome/Edge/Firefox and
 *   modern Safari can decode WebP in an <img>/canvas.
 * - Page layout honours page size, orientation, fit, margins and
 *   background colour. Defaults (A4, auto, contain, standard margins,
 *   white) never crop an image.
 */

export const IMAGE_PDF_DEFAULTS = {
  pageSize: 'a4', // 'a4' | 'letter' | 'fit'
  orientation: 'auto', // 'auto' | 'portrait' | 'landscape'
  fit: 'contain', // 'contain' | 'cover'
  margin: 'standard', // 'none' | 'small' | 'standard'
  background: '#ffffff',
};

const PAGE_SIZES = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};
const MARGINS = { none: 0, small: 18, standard: 36 };

function hexToRgb(hex) {
  const h = String(hex || '').replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (!/^[0-9a-fA-F]{6}$/.test(v)) return rgb(1, 1, 1);
  const n = parseInt(v, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/* ---------- pure dimension parsers (no DOM needed) ---------- */

export function parseImageDimensions(bytes, format) {
  try {
    if (format === 'png') {
      if (bytes.length < 24 || bytes[0] !== 0x89 || bytes[1] !== 0x50) return null;
      const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      return { width: dv.getUint32(16), height: dv.getUint32(20) };
    }
    if (format === 'jpeg') {
      let i = 2;
      const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      while (i < bytes.length - 9) {
        if (bytes[i] !== 0xff) { i++; continue; }
        const marker = bytes[i + 1];
        if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
          return { width: dv.getUint16(i + 7), height: dv.getUint16(i + 5) };
        }
        const len = dv.getUint16(i + 2);
        if (len < 2) break;
        i += 2 + len;
      }
      return null;
    }
    if (format === 'webp') {
      const tag = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
      const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      if (tag === 'VP8X') {
        const w = bytes[24] | (bytes[25] << 8) | (bytes[26] << 16);
        const h = bytes[27] | (bytes[28] << 8) | (bytes[29] << 16);
        return { width: w + 1, height: h + 1 };
      }
      if (tag === 'VP8L') {
        const b = dv.getUint32(21, true);
        return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
      }
      if (tag === 'VP8 ') {
        return {
          width: dv.getUint16(26, true) & 0x3fff,
          height: dv.getUint16(28, true) & 0x3fff,
        };
      }
      return null;
    }
  } catch {
    return null;
  }
  return null;
}

/** Dimensions of an image File: header parse first, DOM decode fallback. */
export async function getImageInfo(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (file.size === 0) throw new PdfError(`"${file.name}" is empty (0 bytes).`);
  const format = imageFormat(file);
  let dims = parseImageDimensions(bytes, format);
  if (!dims && typeof document !== 'undefined') {
    dims = await decodeDimensionsViaImage(file).catch(() => null);
  }
  if (!dims) {
    throw new PdfError(
      `"${file.name}" could not be read as an image — it may be corrupted. Convert it to JPG or PNG and try again.`,
    );
  }
  return { bytes, format, width: dims.width, height: dims.height };
}

function decodeDimensionsViaImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const d = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      d.width && d.height ? resolve(d) : reject(new Error('empty image'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('decode failed'));
    };
    img.src = url;
  });
}

/** Decode any image via Canvas → PNG bytes (used for WebP and cover-fit fallbacks). */
async function decodeToPngBytes(file) {
  if (typeof document === 'undefined') {
    throw new PdfError(
      `"${file.name}": WebP conversion needs a browser — open this tool in your browser to convert WebP images.`,
    );
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('decode failed'));
      el.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
    if (!blob) throw new Error('encode failed');
    return new Uint8Array(await blob.arrayBuffer());
  } catch {
    throw new PdfError(
      `"${file.name}" could not be decoded as a WebP image in this browser. Convert it to JPG or PNG first, then add it again.`,
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function embedImage(doc, file, info) {
  const fmt = info?.format || imageFormat(file);
  const bytes = info?.bytes || new Uint8Array(await file.arrayBuffer());
  if (fmt === 'png') return doc.embedPng(bytes);
  if (fmt === 'jpeg') return doc.embedJpg(bytes);
  // WebP / other: decode via canvas to PNG, then embed.
  const pngBytes = await decodeToPngBytes(file);
  return doc.embedPng(pngBytes);
}

/* ---------- layout ---------- */

export function imagePageSize(imgW, imgH, settings) {
  const s = { ...IMAGE_PDF_DEFAULTS, ...settings };
  if (s.pageSize === 'fit') {
    // Image-sized page at ~150 dpi, clamped so huge photos don't create
    // absurd page boxes and tiny icons don't create postage stamps.
    const scale = Math.min(72 / 150, 1000 / Math.max(imgW, imgH));
    const w = Math.max(72, Math.round(imgW * scale * 100) / 100);
    const h = Math.max(72, Math.round(imgH * scale * 100) / 100);
    return [w, h];
  }
  let [w, h] = PAGE_SIZES[s.pageSize] || PAGE_SIZES.a4;
  const landscapeWanted =
    s.orientation === 'landscape' ||
    (s.orientation === 'auto' && imgW > imgH);
  if (landscapeWanted && h > w) [w, h] = [h, w];
  if (s.orientation === 'portrait' && w > h) [w, h] = [h, w];
  return [w, h];
}

/** Add one image as a full page of `doc`. Returns the page. */
export async function addImagePage(doc, file, settings, info) {
  const s = { ...IMAGE_PDF_DEFAULTS, ...settings };
  const meta = info || (await getImageInfo(file));
  const [pageW, pageH] = imagePageSize(meta.width, meta.height, s);
  const page = doc.addPage([pageW, pageH]);
  // Background first (also the letterbox colour for contain fit).
  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageW,
    height: pageH,
    color: hexToRgb(s.background),
  });

  const margin = MARGINS[s.margin] ?? MARGINS.standard;
  const boxW = Math.max(10, pageW - margin * 2);
  const boxH = Math.max(10, pageH - margin * 2);
  const img = await embedImage(doc, file, meta);

  if (s.fit === 'cover') {
    // Scale to fill the box; overflow is clipped by the page edge /
    // box — drawn centred, so the crop is symmetric.
    const scale = Math.max(boxW / meta.width, boxH / meta.height);
    const w = meta.width * scale;
    const h = meta.height * scale;
    page.drawImage(img, {
      x: margin + (boxW - w) / 2,
      y: margin + (boxH - h) / 2,
      width: w,
      height: h,
    });
  } else {
    const scale = Math.min(boxW / meta.width, boxH / meta.height);
    const w = meta.width * scale;
    const h = meta.height * scale;
    page.drawImage(img, {
      x: margin + (boxW - w) / 2,
      y: margin + (boxH - h) / 2,
      width: w,
      height: h,
    });
  }
  return page;
}

/**
 * Build one PDF from an ordered mix of items:
 * items: [{ kind: 'pdf' | 'image', file }]
 * Every page of each PDF is preserved; each image becomes one page at
 * its position. onProgress(done, total, label) is optional.
 */
export async function buildMixedPdf(items, settings, onProgress) {
  if (!items || items.length === 0) throw new PdfError('Add at least one file first.');
  const out = await PDFDocument.create();
  let pages = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    onProgress?.(i, items.length, item.file.name);
    if (item.kind === 'pdf') {
      const { doc } = await loadPdfDocument(item.file);
      const copied = await out.copyPages(doc, doc.getPageIndices());
      copied.forEach((p) => out.addPage(p));
      pages += copied.length;
    } else if (item.kind === 'image') {
      await addImagePage(out, item.file, settings);
      pages += 1;
    } else {
      throw new PdfError(`"${item.file.name}" is not a PDF or a supported image.`);
    }
  }
  onProgress?.(items.length, items.length, '');
  return { bytes: await out.save(), pageCount: pages };
}

/** Build a PDF purely from image files (PDF Maker). */
export async function buildImagesPdf(files, settings, onProgress) {
  if (!files || files.length === 0) throw new PdfError('Add at least one image first.');
  return buildMixedPdf(
    files.map((file) => ({ kind: 'image', file })),
    settings,
    onProgress,
  );
}
