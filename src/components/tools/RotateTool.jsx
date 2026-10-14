import { useState } from 'react';
import { RotateCcw, RotateCw } from 'lucide-react';
import UploadZone from '../UploadZone.jsx';
import { takeHandoffFiles } from '../../lib/fileHandoff.js';
import PageGrid from '../pdf/PageGrid.jsx';
import PageZoomModal from '../pdf/PageZoomModal.jsx';
import { usePdfWorkspace } from '../pdf/usePdfWorkspace.js';
import { usePageSelection } from '../pdf/usePageSelection.js';
import { rotatePagesByMap, baseName, friendlyProcessError } from '../../lib/pdfEngine.js';
import {
  Alert,
  FileWarnings,
  ProcessButton,
  DownloadResultButton,
  StartOverButton,
  FileLine,
} from './shared.jsx';

export default function RotateTool() {
  const ws = usePdfWorkspace();
  const sel = usePageSelection();
  const [resetKey, setResetKey] = useState(0);
  const [initialFiles] = useState(() => takeHandoffFiles('rotate'));
  const [zoomPage, setZoomPage] = useState(null);
  const [rotations, setRotations] = useState({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const handleFiles = (files) => {
    sel.reset();
    setRotations({});
    setResult(null);
    ws.setError('');
    if (files[0]) ws.loadFile(files[0]);
    else ws.clear();
  };

  const startOver = () => {
    setResult(null);
    setRotations({});
    sel.reset();
    ws.clear();
    setResetKey((k) => k + 1);
  };

  const rotateSelected = (delta) => {
    if (sel.order.length === 0) return;
    setRotations((prev) => {
      const next = { ...prev };
      for (const p of sel.order) {
        next[p] = (((next[p] || 0) + delta) % 360 + 360) % 360;
      }
      return next;
    });
  };

  const resetRotations = () => setRotations({});

  const rotatedPages = Object.entries(rotations).filter(([, a]) => a !== 0);

  const handleDownload = async () => {
    setBusy(true);
    ws.setError('');
    setResult(null);
    try {
      const map = {};
      for (const [p, a] of rotatedPages) map[p] = a;
      const bytes = await rotatePagesByMap(ws.file, map);
      setResult({
        bytes,
        filename: `${baseName(ws.file.name)}-rotated.pdf`,
        count: rotatedPages.length,
      });
    } catch (e) {
      ws.setError(friendlyProcessError(e));
    } finally {
      setBusy(false);
    }
  };

  const pages = Array.from({ length: ws.pageCount }, (_, i) => i + 1);
  const canProcess = ws.pdfDoc && rotatedPages.length > 0 && !busy && !ws.loading;

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
            <PageGrid
              pdfDoc={ws.pdfDoc}
              pages={pages}
              selected={sel.selected}
              onToggle={sel.toggle}
              onSelectAll={() => sel.selectAll(ws.pageCount)}
              onDeselectAll={sel.deselectAll}
              thumbnailProps={(p) => ({
                onZoom: setZoomPage,
                rotation: rotations[p] || 0,
              })}
            />

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => rotateSelected(-90)}
                disabled={sel.order.length === 0}
                className="inline-flex items-center gap-2 text-sm font-semibold text-ink bg-white border border-zinc-300 rounded-xl px-5 py-2.5 hover:border-brand-600 hover:text-brand-700 transition-all disabled:opacity-40"
              >
                <RotateCcw className="w-4 h-4" />
                Rotate Left 90°
              </button>
              <button
                type="button"
                onClick={() => rotateSelected(90)}
                disabled={sel.order.length === 0}
                className="inline-flex items-center gap-2 text-sm font-semibold text-ink bg-white border border-zinc-300 rounded-xl px-5 py-2.5 hover:border-brand-600 hover:text-brand-700 transition-all disabled:opacity-40"
              >
                <RotateCw className="w-4 h-4" />
                Rotate Right 90°
              </button>
              {rotatedPages.length > 0 && (
                <button
                  type="button"
                  onClick={resetRotations}
                  className="text-sm font-semibold text-ink-soft hover:text-ink underline underline-offset-2"
                >
                  Reset rotations
                </button>
              )}
            </div>
            {sel.order.length === 0 ? (
              <p className="text-xs text-ink-soft">
                Select one or more pages above, then rotate them — the thumbnails
                preview the rotation instantly.
              </p>
            ) : (
              <p className="text-xs text-ink-soft">
                {rotatedPages.length} page{rotatedPages.length === 1 ? '' : 's'} rotated so
                far. Rotations add up with each click.
              </p>
            )}

            <ProcessButton
              onClick={handleDownload}
              disabled={!canProcess}
              busy={busy}
              busyLabel="Applying…"
            >
              <RotateCw className="w-4 h-4" />
              Download Rotated PDF
            </ProcessButton>
          </div>
        )}

        {result && (
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
            <Alert type="success">
              Done — {result.count} page{result.count === 1 ? '' : 's'} rotated, created
              entirely in your browser.
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
