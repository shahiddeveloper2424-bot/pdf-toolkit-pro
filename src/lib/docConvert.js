import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { PdfError } from './pdfEngine.js';
import { classifyFile } from './fileKinds.js';
import { buildImagesPdf, parseImageDimensions } from './imagePdf.js';

/**
 * Document → PDF conversion (browser-local).
 *
 * Supported: images (via the image engine), .txt, .html and .docx.
 * DOCX is parsed with mammoth (BSD-2) into HTML, then laid out with the
 * same block engine as HTML: headings, paragraphs, lists, tables and
 * embedded images survive; pixel-perfect Word layout does not — that
 * limitation is stated in the UI.
 *
 * Everything is laid out with pdf-lib standard fonts (WinAnsi), so text
 * is normalised by cleanText() before measuring/drawing.
 */

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_X = 54;
const MARGIN_Y = 54;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const INK = rgb(0.11, 0.1, 0.16);
const SOFT = rgb(0.36, 0.34, 0.44);
const RULE = rgb(0.85, 0.83, 0.9);

export function cleanText(str) {
  return String(str ?? '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[—–]/g, '-')
    .replace(/…/g, '...')
    .replace(/ /g, ' ')
    .replace(/[^\x20-\x7E\xA0-\xFF•]/g, '');
}

function wrapText(text, font, size, maxWidth) {
  const words = cleanText(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(trial, size) <= maxWidth || !line) {
      line = trial;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

/** Lay out content blocks into a PDF. Blocks:
 * {type:'heading', level, text} | {type:'paragraph', text} |
 * {type:'list', items:[text]} | {type:'table', rows:[[cell]]} |
 * {type:'image', bytes:Uint8Array, format:'png'|'jpeg'}
 */
export async function layoutBlocksToPdf(blocks, { title } = {}) {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN_Y;

  const newPage = () => {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN_Y;
  };
  const ensure = (h) => {
    if (y - h < MARGIN_Y) newPage();
  };

  if (title) {
    const lines = wrapText(title, bold, 20, CONTENT_W);
    ensure(lines.length * 25 + 14);
    for (const l of lines) {
      page.drawText(l, { x: MARGIN_X, y: y - 20, size: 20, font: bold, color: INK });
      y -= 25;
    }
    y -= 6;
    page.drawLine({
      start: { x: MARGIN_X, y },
      end: { x: PAGE_W - MARGIN_X, y },
      thickness: 1,
      color: RULE,
    });
    y -= 16;
  }

  for (const block of blocks) {
    if (block.type === 'heading') {
      const size = block.level <= 1 ? 18 : block.level === 2 ? 15 : 12.5;
      const leading = size * 1.35;
      const lines = wrapText(block.text, bold, size, CONTENT_W);
      y -= 8;
      ensure(lines.length * leading + 4);
      for (const l of lines) {
        page.drawText(l, { x: MARGIN_X, y: y - size, size, font: bold, color: INK });
        y -= leading;
      }
      y -= 2;
    } else if (block.type === 'paragraph') {
      const size = 11;
      const leading = 15.5;
      const lines = wrapText(block.text, regular, size, CONTENT_W);
      for (const l of lines) {
        ensure(leading);
        page.drawText(l, { x: MARGIN_X, y: y - size, size, font: regular, color: INK });
        y -= leading;
      }
      y -= 7;
    } else if (block.type === 'list') {
      const size = 11;
      const leading = 15.5;
      for (const item of block.items) {
        const lines = wrapText(item, regular, size, CONTENT_W - 16);
        lines.forEach((l, i) => {
          ensure(leading);
          if (i === 0) {
            page.drawText('•', { x: MARGIN_X + 2, y: y - size, size, font: regular, color: SOFT });
          }
          page.drawText(l, { x: MARGIN_X + 16, y: y - size, size, font: regular, color: INK });
          y -= leading;
        });
        y -= 2;
      }
      y -= 5;
    } else if (block.type === 'table') {
      const rows = block.rows.filter((r) => r.some((c) => cleanText(c).trim()));
      if (rows.length === 0) continue;
      const cols = Math.max(...rows.map((r) => r.length));
      const size = 9;
      const leading = 12;
      const pad = 4;
      // Column widths proportional to the longest cell content.
      const weights = Array.from({ length: cols }, (_, c) =>
        Math.max(4, ...rows.map((r) => cleanText(r[c] || '').length)),
      );
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      const widths = weights.map((w) => Math.max(48, (w / totalWeight) * CONTENT_W));
      const scale = CONTENT_W / widths.reduce((a, b) => a + b, 0);
      const colW = widths.map((w) => w * scale);

      for (let r = 0; r < rows.length; r++) {
        const cellLines = Array.from({ length: cols }, (_, c) =>
          wrapText(rows[r][c] || '', r === 0 ? bold : regular, size, colW[c] - pad * 2),
        );
        const rowH = Math.max(...cellLines.map((l) => l.length)) * leading + pad * 2;
        ensure(rowH + 2);
        let x = MARGIN_X;
        const topY = y;
        cellLines.forEach((lines, c) => {
          lines.forEach((l, li) => {
            page.drawText(l, {
              x: x + pad,
              y: topY - pad - size - li * leading + 2,
              size,
              font: r === 0 ? bold : regular,
              color: INK,
            });
          });
          x += colW[c];
        });
        y -= rowH;
        page.drawLine({
          start: { x: MARGIN_X, y: y + 1 },
          end: { x: PAGE_W - MARGIN_X, y: y + 1 },
          thickness: 0.7,
          color: RULE,
        });
        y -= 2;
      }
      y -= 8;
    } else if (block.type === 'image') {
      try {
        const img =
          block.format === 'jpeg'
            ? await doc.embedJpg(block.bytes)
            : await doc.embedPng(block.bytes);
        const dims = parseImageDimensions(block.bytes, block.format) || {
          width: img.width,
          height: img.height,
        };
        const maxH = PAGE_H - MARGIN_Y * 2;
        const scale = Math.min(CONTENT_W / dims.width, maxH / dims.height, 1.5);
        const w = dims.width * scale;
        const h = dims.height * scale;
        ensure(h + 6);
        page.drawImage(img, { x: MARGIN_X + (CONTENT_W - w) / 2, y: y - h, width: w, height: h });
        y -= h + 10;
      } catch {
        // A single un-embeddable image must not sink the whole document.
      }
    }
  }

  if (doc.getPageCount() === 1 && y === PAGE_H - MARGIN_Y && !title) {
    page.drawText('(empty document)', {
      x: MARGIN_X,
      y: y - 12,
      size: 11,
      font: regular,
      color: SOFT,
    });
  }
  return { bytes: await doc.save(), pageCount: doc.getPageCount() };
}

/* ---------- source parsers ---------- */

export function txtToBlocks(text) {
  const blocks = [];
  const chunks = String(text).replace(/\r\n/g, '\n').split(/\n\s*\n/);
  for (const chunk of chunks) {
    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    if (lines.length === 1 && lines[0].length <= 80 && lines[0] === lines[0].toUpperCase() && /[A-Z]/.test(lines[0])) {
      blocks.push({ type: 'heading', level: 2, text: lines[0] });
    } else {
      blocks.push({ type: 'paragraph', text: lines.join(' ') });
    }
  }
  return blocks;
}

function dataUriToBytes(src) {
  const m = /^data:(image\/(png|jpeg));base64,(.+)$/.exec(src || '');
  if (!m) return null;
  const bin = atob(m[3]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, format: m[2] === 'jpeg' ? 'jpeg' : 'png' };
}

/** HTML string → blocks. Browser-only (DOMParser). Returns {blocks, skippedImages}. */
export function htmlToBlocks(html) {
  if (typeof DOMParser === 'undefined') {
    throw new PdfError('HTML conversion needs a browser — open this tool in your browser.');
  }
  const dom = new DOMParser().parseFromString(html, 'text/html');
  const blocks = [];
  let skippedImages = 0;

  const textOf = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim();

  const walk = (node) => {
    for (const child of node.childNodes) {
      if (child.nodeType !== 1) continue;
      const tag = child.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tag)) {
        const t = textOf(child);
        if (t) blocks.push({ type: 'heading', level: Number(tag[1]), text: t });
      } else if (tag === 'p' || tag === 'blockquote') {
        const img = child.querySelector?.('img');
        if (img) {
          const d = dataUriToBytes(img.getAttribute('src'));
          if (d) blocks.push({ type: 'image', ...d });
          else skippedImages++;
        }
        const t = textOf(child);
        if (t) blocks.push({ type: 'paragraph', text: t });
      } else if (tag === 'ul' || tag === 'ol') {
        const items = [...child.querySelectorAll(':scope > li')].map(textOf).filter(Boolean);
        if (items.length) blocks.push({ type: 'list', items });
      } else if (tag === 'table') {
        const rows = [...child.querySelectorAll('tr')].map((tr) =>
          [...tr.querySelectorAll('th,td')].map(textOf),
        );
        if (rows.length) blocks.push({ type: 'table', rows });
      } else if (tag === 'img') {
        const d = dataUriToBytes(child.getAttribute('src'));
        if (d) blocks.push({ type: 'image', ...d });
        else skippedImages++;
      } else if (tag === 'pre') {
        const t = (child.textContent || '').trim();
        if (t) t.split('\n').forEach((line) => blocks.push({ type: 'paragraph', text: line }));
      } else if (tag === 'hr' || tag === 'script' || tag === 'style') {
        // skip
      } else {
        walk(child);
      }
    }
  };
  walk(dom.body);
  return { blocks, skippedImages };
}

/** DOCX File → blocks via mammoth (headings, lists, tables, inline images). */
export async function docxToBlocks(file) {
  const mod = await import('mammoth/mammoth.browser.js');
  const mammoth = mod.default || mod;
  const arrayBuffer = await file.arrayBuffer();
  let result;
  try {
    result = await mammoth.convertToHtml({ arrayBuffer });
  } catch {
    throw new PdfError(
      `"${file.name}" could not be read as a DOCX file — it may be corrupted or an older .doc file renamed. Save it as .docx and try again.`,
    );
  }
  const { blocks, skippedImages } = htmlToBlocks(result.value);
  if (blocks.length === 0) {
    throw new PdfError(`"${file.name}" appears to contain no readable text.`);
  }
  const notes = [];
  if (skippedImages > 0) notes.push(`${skippedImages} image(s) could not be embedded and were skipped.`);
  const warnings = (result.messages || []).filter((m) => m.type === 'warning').length;
  if (warnings > 0) notes.push('Some Word formatting elements were simplified during conversion.');
  return { blocks, notes };
}

/** Convert one supported file to a PDF. Returns {bytes, pageCount, notes}. */
export async function convertFileToPdf(file) {
  const kind = classifyFile(file);
  if (file.size === 0) throw new PdfError(`"${file.name}" is empty (0 bytes).`);
  if (kind === 'image') {
    const { bytes, pageCount } = await buildImagesPdf([file]);
    return { bytes, pageCount, notes: [] };
  }
  if (kind === 'txt') {
    const text = await file.text();
    const blocks = txtToBlocks(text);
    if (blocks.length === 0) throw new PdfError(`"${file.name}" contains no text.`);
    const { bytes, pageCount } = await layoutBlocksToPdf(blocks, {
      title: file.name.replace(/\.txt$/i, ''),
    });
    return { bytes, pageCount, notes: [] };
  }
  if (kind === 'html') {
    const html = await file.text();
    const { blocks, skippedImages } = htmlToBlocks(html);
    if (blocks.length === 0) throw new PdfError(`"${file.name}" contains no readable content.`);
    const notes = [];
    if (skippedImages > 0) {
      notes.push(
        `${skippedImages} linked image(s) were not embedded — only images embedded in the HTML file itself (data URIs) can be included.`,
      );
    }
    const { bytes, pageCount } = await layoutBlocksToPdf(blocks, {
      title: file.name.replace(/\.html?$/i, ''),
    });
    return { bytes, pageCount, notes };
  }
  if (kind === 'docx') {
    const { blocks, notes } = await docxToBlocks(file);
    const { bytes, pageCount } = await layoutBlocksToPdf(blocks, {
      title: file.name.replace(/\.docx$/i, ''),
    });
    return { bytes, pageCount, notes };
  }
  throw new PdfError(
    `"${file.name}" is not a supported format. Supported: JPG/PNG/WebP images, .txt, .html and .docx files. Legacy .doc, Excel and PowerPoint files cannot be converted in the browser — convert them to .docx or PDF first.`,
  );
}
