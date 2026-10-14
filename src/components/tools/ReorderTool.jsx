import { useEffect, useRef, useState } from 'react';
import { ArrowUpDown, Undo2, ChevronLeft, ChevronRight } from 'lucide-react';
import UploadZone from '../UploadZone.jsx';
import { takeHandoffFiles } from '../../lib/fileHandoff.js';
import PageGrid from '../pdf/PageGrid.jsx';
import PageZoomModal from '../pdf/PageZoomModal.jsx';
import { usePdfWorkspace } from '../pdf/usePdfWorkspace.js';
import { usePageSelection } from '../pdf/usePageSelection.js';
import { reorderPdf, baseName, friendlyProcessError } from '../../lib/pdfEngine.js';
import {
  Alert,
  FileWarnings,
  ProcessButton,
  DownloadResultButton,
  StartOverButton,
  FileLine,
} from './shared.jsx';

export default function ReorderTool() {
  const ws = usePdfWorkspace();
  const sel = usePageSelection();
  const [resetKey, setResetKey] = useState(0);
  const [initialFiles] = useState(() => takeHandoffFiles('reorder'));
  const [zoomPage, setZoomPage] = useState(null);
  const [order, setOrder] = useState([]);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const dragIndex = useRef(null);

  useEffect(() => {
    if (ws.pdfDoc) {
      setOrder(Array.from({ length: ws.pageCount }, (_, i) => i + 1));
    } else {
      setOrder([]);
    }
    setHistory([]);
    sel.reset();
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws.pdfDoc, ws.pageCount]);

  const handleFiles = (files) => {
    setResult(null);
    ws.setError('');
    if (files[0]) ws.loadFile(files[0]);
    else ws.clear();
  };

  const startOver = () => {
    setResult(null);
    ws.clear();
    setResetKey((k) => k + 1);
  };

  // Every order change goes through here so Undo can restore the previous one.
  const applyOrder = (next) => {
    setHistory((h) => [...h.slice(-24), order]);
    setOrder(next);
    setResult(null);
  };

  const undoLastMove = () => {
    if (history.length === 0) return;
    setOrder(history[history.length - 1]);
    setHistory(history.slice(0, -1));
    setResult(null);
  };

  const movePage = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    applyOrder(next);
  };

  /**
   * Move all selected pages one step earlier/later. Selected pages keep
   * their relative order; each selected page swaps with an unselected
   * neighbour, so a contiguous block moves as a unit.
   */
  const moveSelected = (direction) => {
    if (sel.selected.size === 0) return;
    const next = [...order];
    if (direction < 0) {
      for (let i = 1; i < next.length; i++) {
        if (sel.selected.has(next[i]) && !sel.selected.has(next[i - 1])) {
          [next[i - 1], next[i]] = [next[i], next[i - 1]];
        }
      }
    } else {
      for (let i = next.length - 2; i >= 0; i--) {
        if (sel.selected.has(next[i]) && !sel.selected.has(next[i + 1])) {
          [next[i + 1], next[i]] = [next[i], next[i + 1]];
        }
      }
    }
    if (next.some((p, i) => p !== order[i])) applyOrder(next);
  };

  const handleDrop = (index) => (e) => {
    e.preventDefault();
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from == null || from === index) return;
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    applyOrder(next);
  };

  const resetOrder = () => {
    applyOrder(Array.from({ length: ws.pageCount }, (_, i) => i + 1));
  };

  const handleDownload = async () => {
    setBusy(true);
    ws.setError('');
    setResult(null);
    try {
      const bytes = await reorderPdf(ws.file, order);
      setResult({ bytes, filename: `${baseName(ws.file.name)}-reordered.pdf` });
    } catch (e) {
      ws.setError(friendlyProcessError(e));
    } finally {
      setBusy(false);
    }
  };

  const isDefaultOrder = order.every((p, i) => p === i + 1);
  const canProcess = ws.pdfDoc && order.length > 0 && !isDefaultOrder && !busy && !ws.loading;

  return (
    <div>
      <UploadZone
        key={resetKey}
        initialFiles={initialFiles}
        onFilesChange={handleFiles}
        title="Drop your PDF file here"
      />

      <div className="mt-4 space-y-4">
        {ws.error && <Alert>{ws.error}</Alert>}
        {ws.file && <FileWarnings files={[ws.file]} />}
        {ws.loading && <Alert type="info">Loading your PDF and rendering pages…</Alert>}

        {ws.pdfDoc && (
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
            <FileLine file={ws.file} pageCount={ws.pageCount} />
            {sel.selected.size > 0 && (
              <div className="anim-fade-in flex flex-wrap items-center gap-2 rounded-xl bg-brand-50 border border-brand-100 px-3.5 py-2.5">
                <span className="text-xs font-semibold text-brand-700 mr-1">
                  {sel.selected.size} page{sel.selected.size === 1 ? '' : 's'} selected
                </span>
                <button
                  type="button"
                  onClick={() => moveSelected(-1)}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-white border border-brand-200 text-brand-700 rounded-full px-3.5 py-2 hover:bg-brand-100 transition-colors touch-manipulation"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Move earlier
                </button>
                <button
                  type="button"
                  onClick={() => moveSelected(1)}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-white border border-brand-200 text-brand-700 rounded-full px-3.5 py-2 hover:bg-brand-100 transition-colors touch-manipulation"
                >
                  Move later
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={sel.deselectAll}
                  className="text-xs font-semibold text-ink-soft hover:text-ink px-2 py-2 touch-manipulation"
                >
                  Clear selection
                </button>
              </div>
            )}
            <PageGrid
              pdfDoc={ws.pdfDoc}
              pages={order}
              selected={sel.selected}
              onToggle={sel.toggle}
              onSelectAll={() => sel.selectAll(ws.pageCount)}
              onDeselectAll={sel.deselectAll}
              thumbnailProps={(pageNumber, index) => ({
                onZoom: setZoomPage,
                moveControls: {
                  canLeft: index > 0,
                  canRight: index < order.length - 1,
                  onMove: (d) => movePage(index, d),
                },
                draggableProps: {
                  draggable: true,
                  onDragStart: () => {
                    dragIndex.current = index;
                  },
                  onDragOver: (e) => e.preventDefault(),
                  onDrop: handleDrop(index),
                },
              })}
            />
            <p className="text-xs text-ink-soft">
              Click pages to select them, drag thumbnails or use the arrows to reorder.
              Current order:{' '}
              <span className="font-semibold text-ink">{order.join(' → ')}</span>
            </p>
            <div className="flex flex-wrap gap-3">
              <ProcessButton
                onClick={handleDownload}
                disabled={!canProcess}
                busy={busy}
                busyLabel="Reordering…"
              >
                <ArrowUpDown className="w-4 h-4" />
                Download Reordered PDF
              </ProcessButton>
              <button
                type="button"
                onClick={undoLastMove}
                disabled={history.length === 0}
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-ink bg-white border border-zinc-300 px-5 py-3 rounded-xl hover:border-brand-600 hover:text-brand-700 transition-all disabled:opacity-40 touch-manipulation"
              >
                <Undo2 className="w-4 h-4" />
                Undo Last Move
              </button>
              <button
                type="button"
                onClick={resetOrder}
                disabled={isDefaultOrder}
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-ink bg-white border border-zinc-300 px-5 py-3 rounded-xl hover:border-brand-600 hover:text-brand-700 transition-all disabled:opacity-40 touch-manipulation"
              >
                Reset Original Order
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
            <Alert type="success">
              Done — pages reordered, created entirely in your browser.
            </Alert>
            <div className="mt-4 flex flex-wrap gap-3">
              <DownloadResultButton
                bytes={result.bytes}
                filename={result.filename}
                label={`Download ${result.filename}`}
              />
              <StartOverButton onClick={startOver} />
            </div>
          </div>
        )}
      </div>

      {zoomPage && ws.pdfDoc && (
        <PageZoomModal
          pdfDoc={ws.pdfDoc}
          pageNumber={zoomPage}
          pageCount={ws.pageCount}
          onClose={() => setZoomPage(null)}
          onNavigate={(d) =>
            setZoomPage((p) => Math.min(ws.pageCount, Math.max(1, p + d)))
          }
        />
      )}
    </div>
  );
}
