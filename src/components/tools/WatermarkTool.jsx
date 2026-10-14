import { useEffect, useRef, useState } from 'react';
import { Stamp, ChevronLeft, ChevronRight } from 'lucide-react';
import UploadZone from '../UploadZone.jsx';
import { takeHandoffFiles } from '../../lib/fileHandoff.js';
import PageGrid from '../pdf/PageGrid.jsx';
import PageZoomModal from '../pdf/PageZoomModal.jsx';
import { usePdfWorkspace } from '../pdf/usePdfWorkspace.js';
import { usePageSelection } from '../pdf/usePageSelection.js';
import { renderPageToCanvas } from '../../lib/pdfPreview.js';
import { watermarkPdf, baseName, friendlyProcessError } from '../../lib/pdfEngine.js';
import {
  Alert,
  FileWarnings,
  Field,
  ProcessButton,
  DownloadResultButton,
  StartOverButton,
  FileLine,
  inputClass,
} from './shared.jsx';

const POSITIONS = [
  { value: 'center', label: 'Center' },
  { value: 'top-left', label: 'Top left' },
  { value: 'top-right', label: 'Top right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-right', label: 'Bottom right' },
];

const ROTATIONS = [
  { value: 0, label: 'Horizontal' },
  { value: 45, label: 'Diagonal ↗' },
  { value: -45, label: 'Diagonal ↘' },
];

const COLORS = [
  { value: '#7c3aed', label: 'Violet' },
  { value: '#2563eb', label: 'Blue' },
  { value: '#dc2626', label: 'Red' },
  { value: '#6b7280', label: 'Gray' },
  { value: '#111111', label: 'Black' },
];

const ALIGN = {
  center: 'justify-center items-center',
  'top-left': 'justify-start items-start',
  'top-right': 'justify-end items-start',
  'bottom-left': 'justify-start items-end',
  'bottom-right': 'justify-end items-end',
};

/** Large live preview of the watermark on a real rendered page. */
function WatermarkPreview({ pdfDoc, pageNumber, text, fontSize, opacity, rotation, color, position }) {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let cancelled = false;
    renderPageToCanvas(pdfDoc, pageNumber, canvasRef.current, 560)
      .then(({ scale: s }) => {
        if (!cancelled) setScale(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageNumber]);

  return (
    <div className="relative rounded-xl overflow-hidden ring-1 ring-zinc-200 bg-white">
      <canvas ref={canvasRef} className="block w-full h-auto" />
      {text.trim() && (
        <div
          className={`absolute inset-0 flex pointer-events-none ${ALIGN[position]}`}
          style={{ padding: Math.max(8, 56 * scale) }}
        >
          <span
            style={{
              fontSize: Math.max(6, fontSize * scale),
              opacity,
              color,
              transform: `rotate(${rotation}deg)`,
              fontWeight: 800,
              whiteSpace: 'nowrap',
              lineHeight: 1,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {text}
          </span>
        </div>
      )}
    </div>
  );
}

export default function WatermarkTool() {
  const ws = usePdfWorkspace();
  const sel = usePageSelection();
  const [resetKey, setResetKey] = useState(0);
  const [initialFiles] = useState(() => takeHandoffFiles('watermark'));
  const [zoomPage, setZoomPage] = useState(null);
  const [text, setText] = useState('DRAFT');
  const [fontSize, setFontSize] = useState(72);
  const [opacityPct, setOpacityPct] = useState(25);
  const [rotation, setRotation] = useState(45);
  const [position, setPosition] = useState('center');
  const [color, setColor] = useState('#7c3aed');
  const [scope, setScope] = useState('all');
  const [previewPage, setPreviewPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const handleFiles = (files) => {
    sel.reset();
    setResult(null);
    setPreviewPage(1);
    ws.setError('');
    if (files[0]) ws.loadFile(files[0]);
    else ws.clear();
  };

  const startOver = () => {
    setResult(null);
    sel.reset();
    setPreviewPage(1);
    ws.clear();
    setResetKey((k) => k + 1);
  };

  const pages = Array.from({ length: ws.pageCount }, (_, i) => i + 1);
  const canProcess =
    ws.pdfDoc &&
    !busy &&
    !ws.loading &&
    text.trim().length > 0 &&
    (scope === 'all' || sel.order.length > 0);

  const handleWatermark = async () => {
    setBusy(true);
    ws.setError('');
    setResult(null);
    try {
      const bytes = await watermarkPdf(ws.file, {
        text,
        fontSize,
        opacity: opacityPct / 100,
        rotation,
        position,
        color,
        pages: scope === 'all' ? 'all' : sel.order,
      });
      setResult({ bytes, filename: `${baseName(ws.file.name)}-watermarked.pdf` });
    } catch (e) {
      ws.setError(friendlyProcessError(e));
    } finally {
      setBusy(false);
    }
  };

  const sliderClass = 'w-full accent-brand-600 cursor-pointer';

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
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 space-y-6 shadow-sm">
            <FileLine file={ws.file} pageCount={ws.pageCount} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-ink">Live preview</p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                      disabled={previewPage <= 1}
                      aria-label="Previous preview page"
                      className="p-1.5 rounded-lg text-zinc-600 hover:bg-brand-50 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-medium text-ink-soft min-w-16 text-center">
                      Page {previewPage} of {ws.pageCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewPage((p) => Math.min(ws.pageCount, p + 1))}
                      disabled={previewPage >= ws.pageCount}
                      aria-label="Next preview page"
                      className="p-1.5 rounded-lg text-zinc-600 hover:bg-brand-50 disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <WatermarkPreview
                  pdfDoc={ws.pdfDoc}
                  pageNumber={previewPage}
                  text={text}
                  fontSize={fontSize}
                  opacity={opacityPct / 100}
                  rotation={rotation}
                  color={color}
                  position={position}
                />
              </div>

              <div className="space-y-5">
                <Field label="Watermark text">
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="e.g. DRAFT, CONFIDENTIAL"
                    maxLength={60}
                    className={inputClass}
                    aria-label="Watermark text"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label={`Size — ${fontSize}px`}>
                    <input
                      type="range" min={24} max={144} value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className={sliderClass} aria-label="Watermark font size"
                    />
                  </Field>
                  <Field label={`Opacity — ${opacityPct}%`}>
                    <input
                      type="range" min={5} max={80} value={opacityPct}
                      onChange={(e) => setOpacityPct(Number(e.target.value))}
                      className={sliderClass} aria-label="Watermark opacity"
                    />
                  </Field>
                </div>

                <Field label="Rotation">
                  <div className="flex flex-wrap gap-2">
                    {ROTATIONS.map((r) => (
                      <button
                        key={r.value} type="button"
                        onClick={() => setRotation(r.value)}
                        aria-pressed={rotation === r.value}
                        className={`text-sm font-medium px-4 py-2 rounded-full border transition-colors ${
                          rotation === r.value
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-ink-soft border-zinc-300 hover:border-brand-600'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Position">
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className={inputClass}
                      aria-label="Watermark position"
                    >
                      {POSITIONS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Color">
                    <div className="flex items-center gap-2">
                      {COLORS.map((c) => (
                        <button
                          key={c.value} type="button"
                          onClick={() => setColor(c.value)}
                          aria-pressed={color === c.value}
                          aria-label={`${c.label} watermark`}
                          title={c.label}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            color === c.value
                              ? 'border-ink scale-110'
                              : 'border-zinc-200 hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.value }}
                        />
                      ))}
                      <input
                        type="color" value={color}
                        onChange={(e) => setColor(e.target.value)}
                        aria-label="Custom watermark color"
                        title="Custom color"
                        className="w-8 h-8 rounded-full cursor-pointer border-2 border-zinc-200 p-0.5 bg-white"
                      />
                    </div>
                  </Field>
                </div>

                <Field label="Apply to">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: `All ${ws.pageCount} pages` },
                      { value: 'custom', label: 'Selected pages' },
                    ].map((opt) => (
                      <button
                        key={opt.value} type="button"
                        onClick={() => setScope(opt.value)}
                        aria-pressed={scope === opt.value}
                        className={`text-sm font-medium px-4 py-2 rounded-full border transition-colors ${
                          scope === opt.value
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-ink-soft border-zinc-300 hover:border-brand-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </div>

            {scope === 'custom' && (
              <PageGrid
                pdfDoc={ws.pdfDoc}
                pages={pages}
                selected={sel.selected}
                onToggle={sel.toggle}
                onSelectAll={() => sel.selectAll(ws.pageCount)}
                onDeselectAll={sel.deselectAll}
                thumbnailProps={() => ({ onZoom: setZoomPage })}
              />
            )}

            <ProcessButton
              onClick={handleWatermark}
              disabled={!canProcess}
              busy={busy}
              busyLabel="Applying watermark…"
            >
              <Stamp className="w-4 h-4" />
              Add Watermark{scope === 'custom' && sel.order.length > 0 ? ` to ${sel.order.length} Pages` : ''}
            </ProcessButton>
            {text.trim().length === 0 && (
              <p className="-mt-3 text-xs text-ink-soft">Enter watermark text to continue.</p>
            )}
          </div>
        )}

        {result && (
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
            <Alert type="success">
              Done — watermark applied in your browser. Download the result below.
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
