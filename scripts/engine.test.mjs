// Node-level tests for src/lib/pdfEngine.js + src/lib/pageRanges.js
// Run: node test-step2-engine.mjs
import { PDFDocument, degrees } from 'pdf-lib';
import {
  loadPdfDocument,
  getPageCount,
  mergePdfs,
  splitPdf,
  extractPages,
  rotatePdf,
  reorderPdf,
  watermarkPdf,
  rotatePagesByMap,
  PdfError,
} from '../src/lib/pdfEngine.js';
import {
  parsePageList,
  parsePageRanges,
  validateReorderList,
} from '../src/lib/pageRanges.js';
import {
  buildMixedPdf,
  buildImagesPdf,
  parseImageDimensions,
  imagePageSize,
} from '../src/lib/imagePdf.js';
import {
  layoutBlocksToPdf,
  txtToBlocks,
  convertFileToPdf,
} from '../src/lib/docConvert.js';
import { classifyFile } from '../src/lib/fileKinds.js';
import zlib from 'node:zlib';

let pass = 0;
let fail = 0;
const results = [];
function check(name, cond, detail = '') {
  if (cond) pass++;
  else fail++;
  results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`);
}
function makeFile(bytes, name = 'test.pdf') {
  const buf = new Uint8Array(bytes).buffer; // exact ArrayBuffer copy
  return { name, size: buf.byteLength, arrayBuffer: async () => buf.slice(0) };
}
// Doc with N pages; page i has width 200+i*10 so order is verifiable.
async function makeSizedDoc(n) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < n; i++) doc.addPage([200 + i * 10, 300]);
  return makeFile(await doc.save());
}
async function pageWidths(bytes) {
  const doc = await PDFDocument.load(bytes);
  return doc.getPages().map((p) => Math.round(p.getSize().width));
}

try {
  // ---------- merge ----------
  const a = await makeSizedDoc(2); // widths 200,210
  const b = await makeSizedDoc(3); // widths 200,210,220
  const merged = await mergePdfs([a, b]);
  check('merge: page count 2+3=5', (await pageWidths(merged)).length === 5);
  check('merge: order preserved', JSON.stringify(await pageWidths(merged)) === JSON.stringify([200, 210, 200, 210, 220]));
  try {
    await mergePdfs([a]);
    check('merge: rejects <2 files', false);
  } catch (e) {
    check('merge: rejects <2 files', e instanceof PdfError);
  }

  // ---------- split ----------
  const six = await makeSizedDoc(6);
  const parts = await splitPdf(six, [{ start: 1, end: 2 }, { start: 5, end: 6 }], 'doc');
  check('split: 2 parts', parts.length === 2);
  check('split: filenames', parts[0].name === 'doc-pages-1-2.pdf' && parts[1].name === 'doc-pages-5-6.pdf');
  check('split: part sizes correct', (await pageWidths(parts[0].bytes)).length === 2 && (await pageWidths(parts[1].bytes)).length === 2);
  check('split: part 2 content = pages 5-6', JSON.stringify(await pageWidths(parts[1].bytes)) === JSON.stringify([240, 250]));
  try {
    await splitPdf(six, [{ start: 5, end: 9 }], 'doc');
    check('split: rejects out-of-range', false);
  } catch (e) {
    check('split: rejects out-of-range', e instanceof PdfError);
  }

  // ---------- extract ----------
  const five = await makeSizedDoc(5); // widths 200..240
  const ext = await extractPages(five, [3, 1, 5]);
  check('extract: requested order preserved', JSON.stringify(await pageWidths(ext)) === JSON.stringify([220, 200, 240]));
  try {
    await extractPages(five, [0]);
    check('extract: rejects page 0', false);
  } catch (e) {
    check('extract: rejects page 0', e instanceof PdfError);
  }

  // ---------- rotate ----------
  const r1 = await makeSizedDoc(3);
  const rotAll = await rotatePdf(r1, 'all', 90);
  const rotDoc = await PDFDocument.load(rotAll);
  check('rotate: all pages 90', rotDoc.getPages().every((p) => p.getRotation().angle === 90));
  const r2 = await makeSizedDoc(3);
  const rotSome = await rotatePdf(r2, [2], 180);
  const rotDoc2 = await PDFDocument.load(rotSome);
  const angles = rotDoc2.getPages().map((p) => p.getRotation().angle);
  check('rotate: only page 2 rotated', JSON.stringify(angles) === JSON.stringify([0, 180, 0]));
  const r3 = await makeSizedDoc(2);
  const rotAdd = await rotatePdf(r3, 'all', 90);
  const rotAdd2 = await rotatePdf(makeFile(rotAdd, 'x.pdf'), 'all', 90);
  check('rotate: rotation accumulates 90+90=180', (await PDFDocument.load(rotAdd2)).getPage(0).getRotation().angle === 180);

  // ---------- reorder ----------
  const r4 = await makeSizedDoc(4);
  const reo = await reorderPdf(r4, [3, 1, 4, 2]);
  check('reorder: new order applied', JSON.stringify(await pageWidths(reo)) === JSON.stringify([220, 200, 230, 210]));
  try {
    await reorderPdf(r4, [1, 2, 2, 4]);
    check('reorder: rejects duplicates', false);
  } catch (e) {
    check('reorder: rejects duplicates', e instanceof PdfError);
  }
  try {
    await reorderPdf(r4, [1, 2, 3]);
    check('reorder: rejects missing page', false);
  } catch (e) {
    check('reorder: rejects missing page', e instanceof PdfError);
  }

  // ---------- watermark ----------
  const w1 = await makeSizedDoc(2);
  const wmAll = await watermarkPdf(w1, { text: 'DRAFT', fontSize: 72, opacity: 0.25, rotation: 45, position: 'center', pages: 'all' });
  const wmDoc = await PDFDocument.load(wmAll);
  check('watermark: page count unchanged', wmDoc.getPageCount() === 2);
  check('watermark: output is larger (content added)', wmAll.length > (await w1.arrayBuffer()).byteLength);
  const w2 = await makeSizedDoc(3);
  for (const pos of ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']) {
    const out = await watermarkPdf(w2, { text: 'X', fontSize: 24, opacity: 0.5, rotation: 0, position: pos, pages: [2] });
    await PDFDocument.load(out); // must be valid
  }
  check('watermark: all 5 positions produce valid PDFs', true);
  try {
    await watermarkPdf(w1, { text: '   ', fontSize: 72, opacity: 0.25, rotation: 0, position: 'center', pages: 'all' });
    check('watermark: rejects empty text', false);
  } catch (e) {
    check('watermark: rejects empty text', e instanceof PdfError);
  }

  // ---------- load errors ----------
  const garbage = makeFile(new Uint8Array([1, 2, 3, 4, 5]), 'bad.pdf');
  try {
    await getPageCount(garbage);
    check('load: rejects garbage bytes', false);
  } catch (e) {
    check('load: rejects garbage bytes with friendly msg', e instanceof PdfError && /could not be read/i.test(e.message), e.message);
  }

  // ---------- rotatePagesByMap ----------
  const rmDoc = await makeSizedDoc(3);
  const rmBytes = await rotatePagesByMap(rmDoc, { 1: 90, 3: 180 });
  const rmAngles = (await PDFDocument.load(rmBytes)).getPages().map((pg) => pg.getRotation().angle);
  check('rotatePagesByMap: per-page angles', JSON.stringify(rmAngles) === JSON.stringify([90, 0, 180]));

  // ---------- watermark color ----------
  const wc = await makeSizedDoc(1);
  const wcOut = await watermarkPdf(wc, { text: 'Hi', fontSize: 48, opacity: 0.5, rotation: 0, position: 'center', pages: 'all', color: '#7c3aed' });
  check('watermark: custom color accepted', (await PDFDocument.load(wcOut)).getPageCount() === 1);
  const wcBad = await watermarkPdf(wc, { text: 'Hi', fontSize: 48, opacity: 0.5, rotation: 0, position: 'center', pages: 'all', color: 'not-a-color' });
  check('watermark: invalid color falls back gracefully', (await PDFDocument.load(wcBad)).getPageCount() === 1);

  // ---------- pageRanges ----------
  let r = parsePageList('1, 3, 5-7', 10);
  check('parse: list+range', JSON.stringify(r.pages) === JSON.stringify([1, 3, 5, 6, 7]) && !r.error);
  r = parsePageList(' 2 - 4 , 9 ', 10);
  check('parse: spaces tolerated', JSON.stringify(r.pages) === JSON.stringify([2, 3, 4, 9]));
  r = parsePageList('11', 10);
  check('parse: out-of-range page', !!r.error && /out of range/.test(r.error), r.error);
  r = parsePageList('5-2', 10);
  check('parse: reversed range', !!r.error && /first page must come before/.test(r.error));
  r = parsePageList('abc', 10);
  check('parse: invalid token', !!r.error);
  r = parsePageList('', 10);
  check('parse: empty input', !!r.error);
  r = parsePageRanges('1-3, 5', 10);
  check('parseRanges: mixed', JSON.stringify(r.ranges) === JSON.stringify([{ start: 1, end: 3 }, { start: 5, end: 5 }]));
  check('validateReorder: ok', validateReorderList([3, 1, 2], 3) === null);
  check('validateReorder: dup', /more than once/.test(validateReorderList([1, 1, 2], 3)));
  check('validateReorder: wrong length', /exactly once/.test(validateReorderList([1, 2], 3)));
  check('validateReorder: out of range', /out of range/.test(validateReorderList([1, 2, 9], 3)));

  // ---------- image engine ----------
  // Minimal valid PNG encoder (solid colour) for fixtures.
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c >>> 0;
  }
  const crc32 = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  function makePng(width, height) {
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 2; // truecolour
    const row = Buffer.alloc(1 + width * 3);
    for (let x = 0; x < width; x++) {
      row[1 + x * 3] = 200;
      row[2 + x * 3] = 60;
      row[3 + x * 3] = 60;
    }
    const raw = Buffer.concat(Array.from({ length: height }, () => row));
    return new Uint8Array(
      Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', ihdr),
        chunk('IDAT', zlib.deflateSync(raw)),
        chunk('IEND', Buffer.alloc(0)),
      ]),
    );
  }
  const makeImageFile = (bytes, name, type) => ({
    name,
    size: bytes.byteLength,
    type,
    lastModified: 1,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  });
  async function makeSizedDocWidths(widths) {
    const doc = await PDFDocument.create();
    for (const w of widths) doc.addPage([w, 300]);
    return makeFile(await doc.save());
  }
  const pageSizes = async (bytes) => {
    const doc = await PDFDocument.load(bytes);
    return doc.getPages().map((p) => {
      const s = p.getSize();
      return [Math.round(s.width), Math.round(s.height)];
    });
  };

  const png400x200 = makePng(400, 200);
  check('png: dims parsed', JSON.stringify(parseImageDimensions(png400x200, 'png')) === JSON.stringify({ width: 400, height: 200 }));
  const fitSize = imagePageSize(400, 200, { pageSize: 'fit' });
  check('imagePageSize: fit uses image aspect', Math.round(fitSize[0]) === 192 && Math.round(fitSize[1]) === 96, JSON.stringify(fitSize));
  const a4Land = imagePageSize(400, 200, { pageSize: 'a4', orientation: 'auto' });
  check('imagePageSize: a4 auto -> landscape for wide image', a4Land[0] > a4Land[1]);

  const imgFile = makeImageFile(png400x200, 'photo.png', 'image/png');
  const pdfA = await makeSizedDocWidths([200, 210]);
  const pdfB = await makeSizedDocWidths([300]);
  const mixed = await buildMixedPdf(
    [
      { kind: 'pdf', file: pdfA },
      { kind: 'image', file: imgFile },
      { kind: 'pdf', file: pdfB },
    ],
    { pageSize: 'fit' },
  );
  check('mixed: page count 2+1+1=4', mixed.pageCount === 4);
  check(
    'mixed: exact order A -> image -> B',
    JSON.stringify(await pageSizes(mixed.bytes)) === JSON.stringify([[200, 300], [210, 300], [192, 96], [300, 300]]),
    JSON.stringify(await pageSizes(mixed.bytes)),
  );

  const imagesOnly = await buildImagesPdf([imgFile, imgFile], { pageSize: 'a4', orientation: 'portrait', fit: 'contain', margin: 'standard', background: '#ffffff' });
  const ioSizes = await pageSizes(imagesOnly.bytes);
  check('imagesPdf: 2 pages, A4 portrait', imagesOnly.pageCount === 2 && ioSizes[0][0] === 595 && ioSizes[0][1] === 842, JSON.stringify(ioSizes));

  try {
    await buildMixedPdf([{ kind: 'image', file: makeImageFile(new Uint8Array([1, 2, 3]), 'bad.png', 'image/png') }], {});
    check('mixed: corrupt image rejected', false);
  } catch (e) {
    check('mixed: corrupt image rejected', e instanceof PdfError);
  }

  // WebP dimension parsing (VP8X header, synthetic)
  const webp = new Uint8Array(30);
  webp.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x58], 0);
  webp[24] = 639 & 0xff; webp[25] = (639 >> 8) & 0xff; webp[26] = 0;
  webp[27] = 479 & 0xff; webp[28] = (479 >> 8) & 0xff; webp[29] = 0;
  check('webp: VP8X dims parsed', JSON.stringify(parseImageDimensions(webp, 'webp')) === JSON.stringify({ width: 640, height: 480 }));

  // ---------- classification ----------
  check('classify: docx', classifyFile({ name: 'a.docx', type: '' }) === 'docx');
  check('classify: txt by ext (empty mime)', classifyFile({ name: 'a.txt', type: '' }) === 'txt');
  check('classify: xlsx unsupported', classifyFile({ name: 'a.xlsx', type: '' }) === 'unsupported');
  check('classify: legacy doc unsupported', classifyFile({ name: 'a.doc', type: '' }) === 'unsupported');
  check('classify: webp image (generic mime)', classifyFile({ name: 'a.webp', type: 'application/octet-stream' }) === 'image');

  // ---------- document conversion ----------
  const blocks = txtToBlocks('MY TITLE\n\nFirst para line one\nline two.\n\nSecond para.');
  check('txt: blocks parsed', blocks.length === 3 && blocks[0].type === 'heading' && blocks[1].type === 'paragraph');
  const layout = await layoutBlocksToPdf(
    [
      { type: 'heading', level: 1, text: 'Report' },
      { type: 'paragraph', text: 'Hello world. '.repeat(40) },
      { type: 'list', items: ['One', 'Two'] },
      { type: 'table', rows: [['Name', 'Qty'], ['Apples', '3'], ['Pears', '5']] },
    ],
    { title: 'Doc' },
  );
  check('layout: produces valid PDF', (await PDFDocument.load(layout.bytes)).getPageCount() >= 1 && layout.pageCount >= 1);

  const txtFile = {
    name: 'note.txt',
    size: 42,
    type: 'text/plain',
    text: async () => 'SHOPPING LIST\n\nMilk and eggs.\n\nBuy on Friday.',
    arrayBuffer: async () => new ArrayBuffer(0),
  };
  const txtOut = await convertFileToPdf(txtFile);
  check('convert txt: valid PDF out', (await PDFDocument.load(txtOut.bytes)).getPageCount() === 1);

  const pngFileTxt = makeImageFile(png400x200, 'pic.png', 'image/png');
  pngFileTxt.text = async () => '';
  const imgOut = await convertFileToPdf(pngFileTxt);
  check('convert image: 1 page PDF out', imgOut.pageCount === 1);

  try {
    await convertFileToPdf({ name: 'slides.pptx', size: 10, type: '', text: async () => '', arrayBuffer: async () => new ArrayBuffer(10) });
    check('convert: pptx rejected honestly', false);
  } catch (e) {
    check('convert: pptx rejected honestly', e instanceof PdfError && /not a supported format/.test(e.message));
  }
} catch (e) {
  fail++;
  results.push('FAIL unexpected exception :: ' + (e.stack || e.message));
}

console.log(results.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
