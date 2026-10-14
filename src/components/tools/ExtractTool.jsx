import { useState } from 'react';
import { FileOutput } from 'lucide-react';
import UploadZone from '../UploadZone.jsx';
import { takeHandoffFiles } from '../../lib/fileHandoff.js';
import PageGrid from '../pdf/PageGrid.jsx';
import PageZoomModal from '../pdf/PageZoomModal.jsx';
import { usePdfWorkspace } from '../pdf/usePdfWorkspace.js';
import { usePageSelection } from '../pdf/usePageSelection.js';
import { extractPages, baseName, friendlyProcessError } from '../../lib/pdfEngine.js';
import {
  Alert,
  FileWarnings,
  ProcessButton,
  DownloadResultButton,
  StartOverButton,
  FileLine,
} from './shared.jsx';

export default function ExtractTool() {
  const ws = usePdfWorkspace();
  const sel = usePageSelection();
  const [resetKey, setResetKey] = useState(0);
  const [initialFiles] = useState(() => takeHandoffFiles('extract'));
  const [zoomPage, setZoomPage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const handleFiles = (files) => {
    sel.reset();
    setResult(null);
    ws.setError('');
    if (files[0]) ws.loadFile(files[0]);
    else ws.clear();
  };

  const startOver = () => {
    setResult(null);
    sel.reset();
    ws.clear();
    setResetKey((k) => k + 1);
  };

  const handleExtract = async () => {
    setBusy(true);
    ws.setError('');
    setResult(null);
    try {
      const bytes = await extractPages(ws.file, sel.order);
      setResult({
        bytes,
        filename: `${baseName(ws.file.name)}-extracted.pdf`,
        count: sel.order.length,
      });
    } catch (e) {
      ws.setError(friendlyProcessError(e));
    } finally {
      setBusy(false);
    }
  };

  const pages = Array.from({ length: ws.pageCount }, (_, i) => i + 1);
  const canProcess = ws.pdfDoc && sel.order.length > 0 && !busy && !ws.loading;

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
              thumbnailProps={() => ({ onZoom: setZoomPage })}
            />
            <ProcessButton
              onClick={handleExtract}
              disabled={!canProcess}
              busy={busy}
              busyLabel="Extracting…"
            >
              <FileOutput className="w-4 h-4" />
              Extract {sel.order.length > 0 ? `${sel.order.length} ` : ''}Selected Page
              {sel.order.length === 1 ? '' : 's'}
            </ProcessButton>
          </div>
        )}

        {result && (
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
            <Alert type="success">
              Done — {result.count} page{result.count === 1 ? '' : 's'} extracted
              {sel.order.length > 1 ? ` in the order ${sel.order.join(', ')}` : ''}, created
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
