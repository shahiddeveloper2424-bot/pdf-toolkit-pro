import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Expand } from 'lucide-react';
import { renderPageToCanvas } from '../../lib/pdfPreview.js';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const MAX_RENDER_WIDTH = 2400;

/**
 * Full-page preview modal. The page is re-rendered from the original PDF
 * at the requested zoom level (never a stretched thumbnail), at
 * devicePixelRatio resolution, so text stays sharp. Zoom levels:
 * 100% = fit-to-screen; use +/− to zoom, Fit to reset. When zoomed in,
 * the scroll area pans natively (touch drag / scroll) around the page.
 * Re-renders cancel any in-flight render on the same canvas (handled in
 * pdfPreview), so rapid page/zoom changes can't conflict or leak.
 */
export default function PageZoomModal({ pdfDoc, pageNumber, pageCount, onClose, onNavigate }) {
  const canvasRef = useRef(null);
  const scrollRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(720);
  const [leaving, setLeaving] = useState(false);

  // Play the exit animation, then hand control back to the parent.
  const requestClose = () => {
    setLeaving(true);
    window.setTimeout(onClose, 170);
  };

  // Reset zoom when a different document opens.
  useEffect(() => {
    setZoom(1);
  }, [pdfDoc]);

  // Measure the available width so "fit" is exact on any screen.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width);
      if (w > 0) setFitWidth((prev) => (Math.abs(prev - w) > 4 ? w : prev));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') requestClose();
      if (e.key === 'ArrowLeft') onNavigate?.(-1);
      if (e.key === 'ArrowRight') onNavigate?.(1);
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(MAX_ZOOM, z * 1.25));
      if (e.key === '-') setZoom((z) => Math.max(MIN_ZOOM, z / 1.25));
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, onNavigate]);

  const renderWidth = Math.max(
    160,
    Math.min(MAX_RENDER_WIDTH, Math.round(fitWidth * zoom)),
  );

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    renderPageToCanvas(pdfDoc, pageNumber, canvasRef.current, renderWidth).catch(
      () => {},
    );
  }, [pdfDoc, pageNumber, renderWidth]);

  const fit = () => {
    setZoom(1);
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, left: 0 });
  };

  const btn =
    'p-2.5 rounded-lg text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 touch-manipulation';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-sm"
      onClick={requestClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Page ${pageNumber} preview`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={
          leaving
            ? { opacity: 0, scale: 0.97, y: 6 }
            : { opacity: 1, scale: 1, y: 0 }
        }
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b border-zinc-100">
          <p className="text-sm font-semibold text-ink">
            Page {pageNumber}
            <span className="font-normal text-ink-soft"> of {pageCount}</span>
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.25))}
              disabled={zoom <= MIN_ZOOM}
              aria-label="Zoom out"
              className={btn}
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-xs font-semibold text-ink-soft w-12 text-center tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.25))}
              disabled={zoom >= MAX_ZOOM}
              aria-label="Zoom in"
              className={btn}
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={fit}
              aria-label="Fit to screen"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-100 touch-manipulation"
            >
              <Expand className="w-4 h-4" />
              Fit
            </button>
            {onNavigate && (
              <>
                <span className="w-px h-6 bg-zinc-200 mx-1" aria-hidden="true" />
                <button
                  onClick={() => onNavigate(-1)}
                  disabled={pageNumber <= 1}
                  aria-label="Previous page"
                  className={btn}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onNavigate(1)}
                  disabled={pageNumber >= pageCount}
                  aria-label="Next page"
                  className={btn}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            <button onClick={requestClose} aria-label="Close preview" className={btn}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="thin-scroll flex-1 overflow-auto bg-zinc-100/60 p-3 sm:p-4"
        >
          <div className="w-max min-w-full flex justify-center">
            <canvas
              ref={canvasRef}
              className="block h-auto rounded-md ring-1 ring-zinc-200 bg-white shadow"
              style={{ width: renderWidth }}
            />
          </div>
        </div>
        <p className="px-4 py-2 text-[11px] text-ink-soft border-t border-zinc-100">
          100% fits the page to the screen. Zoom in for sharper detail — drag to pan
          around the page.
        </p>
      </motion.div>
    </motion.div>
  );
}
