import { useEffect, useRef, useState } from 'react';
import { Check, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { renderPageToCanvas } from '../../lib/pdfPreview.js';


/**
 * One PDF page rendered from the real document (lazy via IntersectionObserver).
 * Clicking toggles selection; shows a checkmark badge when selected.
 *
 * Sizing: when `width` is omitted the thumbnail measures its grid cell
 * (ResizeObserver) and renders at exactly that CSS width × devicePixelRatio,
 * so a one-column mobile layout shows one complete, sharp page per row and
 * multi-column layouts stay proportional. Passing `width` pins a fixed size
 * (used by the merge preview strips).
 */
export default function PageThumbnail({
  pdfDoc,
  pageNumber,
  selected = false,
  onToggle,
  rotation = 0,
  onZoom,
  moveControls,
  disabled = false,
  width,
  draggableProps,
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  const [measuredWidth, setMeasuredWidth] = useState(0);

  const renderWidth = width ?? measuredWidth;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Measure the cell width in fluid (grid) mode.
  useEffect(() => {
    if (width) return;
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      setMeasuredWidth(300);
      return;
    }
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width);
      if (w > 0) {
        setMeasuredWidth((prev) => (Math.abs(prev - w) > 3 ? w : prev));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  useEffect(() => {
    if (!visible || !pdfDoc || !canvasRef.current || !renderWidth) return;
    let cancelled = false;
    renderPageToCanvas(pdfDoc, pageNumber, canvasRef.current, renderWidth)
      .then(() => {
        if (!cancelled) setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, pdfDoc, pageNumber, renderWidth]);

  return (
    <div
      ref={wrapRef}
      className={`flex flex-col items-center gap-1.5 select-none ${width ? '' : 'w-full'}`}
      {...draggableProps}
    >
      <div
        className="relative w-full"
        style={width ? { width, flexShrink: 0 } : undefined}
      >
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled || !onToggle}
          aria-pressed={selected}
          aria-label={`Page ${pageNumber}${selected ? ', selected' : ''}`}
          className={`relative block w-full rounded-lg bg-white transition-all focus-visible:outline-2 ${
            selected
              ? 'ring-[3px] ring-brand-600 ring-offset-2 ring-offset-surface shadow-lg shadow-brand-600/20'
              : 'ring-1 ring-zinc-300 hover:ring-2 hover:ring-brand-600/60 hover:shadow-md'
          } ${onToggle && !disabled ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <div
            className="overflow-hidden rounded-lg transition-transform duration-200"
            style={rotation ? { transform: `rotate(${rotation}deg)` } : undefined}
          >
            {failed ? (
              <div
                className="flex items-center justify-center bg-zinc-100 text-xs text-zinc-400 rounded-lg w-full"
                style={{ height: (renderWidth || 220) * 1.3 }}
              >
                Preview unavailable
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                className="block w-full h-auto rounded-lg"
              />
            )}
          </div>

          {/* selection checkbox */}
          <span
            className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
              selected
                ? 'bg-brand-600 border-brand-600'
                : 'bg-white border-zinc-300'
            }`}
            aria-hidden="true"
          >
            {selected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
          </span>

          {/* rotation badge */}
          {!!rotation && (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-zinc-900 text-white rounded-full px-2 py-0.5">
              {rotation}°
            </span>
          )}
        </button>

        {onZoom && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onZoom(pageNumber);
            }}
            aria-label={`Zoom page ${pageNumber}`}
            className="absolute top-1.5 right-1.5 w-9 h-9 rounded-full bg-zinc-900/70 text-white flex items-center justify-center opacity-80 sm:opacity-0 hover:opacity-100 focus-visible:opacity-100 transition-opacity touch-manipulation"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1">
        {moveControls && (
          <button
            type="button"
            onClick={() => moveControls.onMove(-1)}
            disabled={!moveControls.canLeft}
            aria-label={`Move page ${pageNumber} earlier`}
            className="p-2 rounded-md text-zinc-500 hover:bg-brand-100 hover:text-brand-700 disabled:opacity-25 disabled:hover:bg-transparent touch-manipulation"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <span className="text-xs font-medium text-ink-soft min-w-12 text-center">
          Page {pageNumber}
        </span>
        {moveControls && (
          <button
            type="button"
            onClick={() => moveControls.onMove(1)}
            disabled={!moveControls.canRight}
            aria-label={`Move page ${pageNumber} later`}
            className="p-2 rounded-md text-zinc-500 hover:bg-brand-100 hover:text-brand-700 disabled:opacity-25 disabled:hover:bg-transparent touch-manipulation"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
