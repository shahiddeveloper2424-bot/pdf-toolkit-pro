import { useState } from 'react';
import JSZip from 'jszip';
import { Scissors, Download, FileArchive } from 'lucide-react';
import UploadZone from '../UploadZone.jsx';
import { takeHandoffFiles } from '../../lib/fileHandoff.js';
import PageGrid from '../pdf/PageGrid.jsx';
import PageZoomModal from '../pdf/PageZoomModal.jsx';
import { usePdfWorkspace } from '../pdf/usePdfWorkspace.js';
import { usePageSelection } from '../pdf/usePageSelection.js';
import { splitPdf, extractPages, baseName, downloadBytes, friendlyProcessError } from '../../lib/pdfEngine.js';
import { parsePageRanges } from '../../lib/pageRanges.js';
import {
  Alert,
  FileWarnings,
  Field,
  ProcessButton,
  StartOverButton,
  FileLine,
  inputClass,
  formatSize,
} from './shared.jsx';

export default function SplitTool() {
  const ws = usePdfWorkspace();
  const sel = usePageSelection();
  const [resetKey, setResetKey] = useState(0);
  const [initialFiles] = useState(() => takeHandoffFiles('split'));
  const [zoomPage, setZoomPage] = useState(null);
  const [mode, setMode] = useState('individual'); // 'individual' | 'combined'
  const [rangeInput, setRangeInput] = useState('');
  const [rangeError, setRangeError] = useState('');
  const [busy, setBusy] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [results, setResults] = useState(null);

  const handleFiles = (files) => {
    sel.reset();
    setResults(null);
    setRangeInput('');
    setRangeError('');
    ws.setError('');
    if (files[0]) ws.loadFile(files[0]);
    else ws.clear();
  };

  const startOver = () => {
    setResults(null);
    setRangeInput('');
    setRangeError('');
    sel.reset();
    ws.clear();
    setResetKey((k) => k + 1);
  };

  const applyRangeInput = () => {
    setRangeError('');
    const parsed = parsePageRanges(rangeInput, ws.pageCount);
    if (parsed.error) {
      setRangeError(parsed.error);
      return;
    }
    const flat = [];
    for (const r of parsed.ranges) {
      for (let p = r.start; p <= r.end; p++) flat.push(p);
    }
    sel.deselectAll();
    // set in order, deduplicated
    const seen = new Set();
    const ordered = flat.filter((p) => (seen.has(p) ? false : (seen.add(p), true)));
    ordered.forEach((p) => sel.toggle(p));
  };

  const handleSplit = async () => {
    setBusy(true);
    ws.setError('');
    setResults(null);
    try {
      if (mode === 'individual') {
        const ranges = sel.order.map((p) => ({ start: p, end: p }));
        const parts = await splitPdf(ws.file, ranges, baseName(ws.file.name));
        setResults(parts);
      } else {
        const bytes = await extractPages(ws.file, sel.order);
        setResults([
          { name: `${baseName(ws.file.name)}-split.pdf`, bytes },
        ]);
      }
    } catch (e) {
      ws.setError(friendlyProcessError(e));
    } finally {
      setBusy(false);
    }
  };

  const handleZipDownload = async () => {
    if (!results || results.length === 0) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      for (const r of results) zip.file(r.name, r.bytes);
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBytes(blob, `${baseName(ws.file.name)}-split.zip`, 'application/zip');
    } catch {
      ws.setError('Could not create the ZIP file. Try downloading the files individually.');
    } finally {
      setZipping(false);
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

            <Field
              label="Split mode"
              hint="Individual pages creates one PDF per selected page. Combined pages creates a single PDF with your selection."
            >
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'individual', label: 'Individual pages' },
                  { value: 'combined', label: 'Combined into one PDF' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMode(opt.value)}
                    aria-pressed={mode === opt.value}
                    className={`text-sm font-medium px-4 py-2 rounded-full border transition-colors ${
                      mode === opt.value
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-ink-soft border-zinc-300 hover:border-brand-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field
              label="Select by page ranges (optional)"
              hint='Type ranges like "1-3, 5-7" to select those pages visually.'
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  placeholder="1-3, 5-7"
                  className={inputClass}
                  aria-label="Select pages by ranges"
                />
                <button
                  type="button"
                  onClick={applyRangeInput}
                  disabled={!rangeInput.trim()}
                  className="shrink-0 text-sm font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded-xl px-4 hover:bg-brand-100 transition-colors disabled:opacity-40"
                >
                  Select
                </button>
              </div>
            </Field>
            {rangeError && <Alert>{rangeError}</Alert>}

            <ProcessButton
              onClick={handleSplit}
              disabled={!canProcess}
              busy={busy}
              busyLabel="Splitting…"
            >
              <Scissors className="w-4 h-4" />
              Split {sel.order.length > 0 ? `${sel.order.length} ` : ''}Page
              {sel.order.length === 1 ? '' : 's'}
              {mode === 'individual' && sel.order.length > 1
                ? ` into ${sel.order.length} PDFs`
                : ''}
            </ProcessButton>
          </div>
        )}

        {results && (
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
            <Alert type="success">
              Split complete — {results.length} file{results.length === 1 ? '' : 's'} created
              in your browser.
            </Alert>
            <ul className="mt-4 space-y-2">
              {results.map((r) => (
                <li
                  key={r.name}
                  className="flex items-center justify-between gap-3 bg-surface border border-zinc-200/80 rounded-xl px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{r.name}</p>
                    <p className="text-xs text-ink-soft">{formatSize(r.bytes.length)}</p>
                  </div>
                  <button
                    onClick={() => downloadBytes(r.bytes, r.name)}
                    className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-3">
              {results.length > 1 && (
                <button
                  onClick={handleZipDownload}
                  disabled={zipping}
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold bg-brand-600 text-white px-6 py-3 rounded-xl hover:bg-brand-700 shadow-md shadow-brand-600/25 transition-all disabled:opacity-50"
                >
                  <FileArchive className="w-4 h-4" />
                  {zipping ? 'Creating ZIP…' : 'Download all as ZIP'}
                </button>
              )}
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
