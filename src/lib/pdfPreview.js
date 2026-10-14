import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

/**
 * Real PDF page rendering for thumbnails and zoom previews, powered by PDF.js.
 * Everything runs locally — the document bytes never leave the browser.
 */

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export class PreviewError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PreviewError';
  }
}

function friendlyPreviewError(err) {
  const name = err?.name || '';
  if (name === 'PasswordException') {
    return 'This PDF is password-protected. Please unlock it and try again.';
  }
  if (name === 'InvalidPDFException') {
    return 'This file could not be read as a PDF. It may be corrupted or in an unsupported format.';
  }
  const msg = String(err?.message || '');
  if (/memory|allocation|out of memory/i.test(msg)) {
    return 'Your browser ran out of memory while rendering this PDF. Try a smaller file.';
  }
  return 'Could not render this PDF in the browser.';
}

/**
 * Open a PDF.js document from raw bytes.
 * Returns { doc, destroy } — the PDFDocumentProxy for rendering and a
 * teardown function for it.
 *
 * NOTE: in current pdfjs-dist versions PDFDocumentProxy has no destroy()
 * method of its own. The PDFDocumentLoadingTask owns the worker and
 * transport and is the supported teardown handle: task.destroy() works
 * both while the document is still loading and after it has resolved.
 *
 * Throws PreviewError with a user-friendly message on failure.
 */
export async function loadPreviewDocument(data) {
  const loadingTask = pdfjsLib.getDocument({ data: data.slice() });
  const destroy = () => {
    try {
      const result = loadingTask.destroy();
      if (result && typeof result.catch === 'function') result.catch(() => {});
    } catch {
      /* already torn down — safe to ignore */
    }
  };
  try {
    const doc = await loadingTask.promise;
    return { doc, destroy };
  } catch (err) {
    destroy();
    throw new PreviewError(friendlyPreviewError(err));
  }
}

/**
 * Render a 1-based page into a canvas.
 *
 * `targetWidth` is the CSS width the page will be displayed at. The canvas
 * backing store is rendered at that width × devicePixelRatio (capped) so
 * text stays sharp on retina / mobile displays, while the CSS size is left
 * to the caller (canvas width/height attributes carry the aspect ratio,
 * so `w-full h-auto` style layouts keep the page proportions).
 *
 * Memory safety: the backing store is capped at MAX_CANVAS_SIDE px per
 * side and MAX_CANVAS_PIXELS total, so huge pages on low-RAM phones
 * degrade to a slightly softer render instead of crashing the tab.
 *
 * Starting a render on a canvas that already has one in flight cancels
 * the previous task first — PDF.js rejects overlapping renders on the
 * same canvas, which previously caused intermittent "preview failed"
 * states on rapid page/zoom changes.
 *
 * Returns { width, height, scale } in CSS pixels.
 */
const MAX_CANVAS_SIDE = 3400;
const MAX_CANVAS_PIXELS = 12_000_000;
const activeRenders = new WeakMap();

export async function renderPageToCanvas(pdfDoc, pageNumber, canvas, targetWidth, opts = {}) {
  const previous = activeRenders.get(canvas);
  if (previous) {
    try {
      previous.cancel();
    } catch {
      /* already finished */
    }
    // Wait for the cancelled task to settle before reusing the canvas.
    try {
      await previous.promise;
    } catch {
      /* cancellation rejection is expected */
    }
  }

  const page = await pdfDoc.getPage(pageNumber);
  try {
    const natural = page.getViewport({ scale: 1 });
    const cssScale = targetWidth / natural.width;
    let outputScale = Math.min(
      typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      opts.pixelRatioCap ?? 2,
    );
    // Apply memory caps.
    const rawW = natural.width * cssScale * outputScale;
    const rawH = natural.height * cssScale * outputScale;
    const sideRatio = Math.max(rawW / MAX_CANVAS_SIDE, rawH / MAX_CANVAS_SIDE);
    if (sideRatio > 1) outputScale /= sideRatio;
    const pixelRatio = (natural.width * cssScale * outputScale) * (natural.height * cssScale * outputScale);
    if (pixelRatio > MAX_CANVAS_PIXELS) {
      outputScale *= Math.sqrt(MAX_CANVAS_PIXELS / pixelRatio);
    }

    const viewport = page.getViewport({ scale: cssScale * outputScale });
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const task = page.render({ canvasContext: ctx, viewport });
    activeRenders.set(canvas, task);
    try {
      await task.promise;
    } finally {
      if (activeRenders.get(canvas) === task) activeRenders.delete(canvas);
    }
    return {
      width: viewport.width / outputScale,
      height: viewport.height / outputScale,
      scale: cssScale,
    };
  } finally {
    page.cleanup();
  }
}

/** Natural (unscaled) size of a 1-based page in PDF points. */
export async function getPageNaturalSize(pdfDoc, pageNumber) {
  const page = await pdfDoc.getPage(pageNumber);
  try {
    const v = page.getViewport({ scale: 1 });
    return { width: v.width, height: v.height };
  } finally {
    page.cleanup();
  }
}
