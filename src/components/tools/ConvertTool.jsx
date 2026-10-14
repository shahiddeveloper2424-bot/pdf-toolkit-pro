import { useState } from 'react';
import JSZip from 'jszip';
import {
  FileUp,
  FileText,
  FileCode2,
  FileType2,
  Image as ImageIcon,
  FileArchive,
} from 'lucide-react';
import DropZoneCard from '../files/DropZoneCard.jsx';
import QueueList from '../files/QueueList.jsx';
import { useFileQueue } from '../files/useFileQueue.js';
import {
  classifyFile,
  CONVERT_ACCEPT,
  CONVERT_SUPPORTED_LABEL,
  CONVERT_UNSUPPORTED_NOTE,
} from '../../lib/fileKinds.js';
import { convertFileToPdf } from '../../lib/docConvert.js';
import { downloadBytes, friendlyProcessError } from '../../lib/pdfEngine.js';
import GeneratedPdfActions from './GeneratedPdfActions.jsx';
import {
  Alert,
  FileWarnings,
  ProcessButton,
  StartOverButton,
  formatSize,
} from './shared.jsx';

const classifyConvert = (file) => {
  const kind = classifyFile(file);
  return ['image', 'txt', 'html', 'docx'].includes(kind) ? kind : null;
};

const KIND_UI = {
  image: { label: 'Image', Icon: ImageIcon, cls: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
  txt: { label: 'Text', Icon: FileText, cls: 'bg-blue-50 border-blue-100 text-blue-700' },
  html: { label: 'HTML', Icon: FileCode2, cls: 'bg-orange-50 border-orange-100 text-orange-700' },
  docx: { label: 'Word', Icon: FileType2, cls: 'bg-violet-50 border-violet-100 text-violet-700' },
};

const outName = (file) => file.name.replace(/\.[^.]+$/, '') + '.pdf';

/**
 * Convert to PDF: images, .txt, .html and .docx → real PDFs, converted
 * one by one in the browser. DOCX goes through mammoth; complex Word
 * layouts are simplified (stated honestly in the UI). Unsupported
 * formats are refused with an explanation, never faked.
 */
export default function ConvertTool() {
  const queue = useFileQueue({ classify: classifyConvert });
  const [busy, setBusy] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null); // [{name, bytes, pageCount, notes}]

  const { items } = queue;
  const canProcess = items.length >= 1 && !busy;

  const handleConvert = async () => {
    setBusy(true);
    setError('');
    setResults(null);
    const done = [];
    const failures = [];
    for (const item of items) {
      try {
        const { bytes, pageCount, notes } = await convertFileToPdf(item.file);
        done.push({ name: outName(item.file), bytes, pageCount, notes });
      } catch (e) {
        failures.push(e.message || `${item.file.name}: conversion failed.`);
      }
    }
    if (failures.length > 0) setError(failures.join(' '));
    setResults(done.length > 0 ? done : null);
    setBusy(false);
  };

  const downloadAllZip = async () => {
    if (!results) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      for (const r of results) zip.file(r.name, r.bytes);
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBytes(blob, 'converted-pdfs.zip', 'application/zip');
    } catch {
      setError('Could not create the ZIP file. Download the PDFs individually instead.');
    } finally {
      setZipping(false);
    }
  };

  const startOver = () => {
    queue.clearAll();
    setResults(null);
    setError('');
  };

  return (
    <div className="space-y-4">
      <DropZoneCard
        accept={CONVERT_ACCEPT}
        onFiles={queue.addFiles}
        title="Drop documents and images here"
        subtitle="Each file is converted into its own PDF, locally in your browser"
        supportedLabel={`Supported: ${CONVERT_SUPPORTED_LABEL}`}
      />

      <Alert type="info">{CONVERT_UNSUPPORTED_NOTE}</Alert>
      <Alert type="warning">
        DOCX conversion keeps text, headings, lists, tables and images, but
        complex Word layouts (columns, text boxes, exact fonts) may not look
        identical to the original.
      </Alert>

      {queue.notice && <Alert type="warning">{queue.notice}</Alert>}
      {error && <Alert>{error}</Alert>}
      {items.length > 0 && <FileWarnings files={items.map((i) => i.file)} />}

      <QueueList
        items={items}
        onMove={queue.moveItem}
        onRemove={queue.removeItem}
        onReorder={queue.reorderItem}
        onClearAll={startOver}
        onAddFiles={queue.addFiles}
        accept={CONVERT_ACCEPT}
        addLabel="Add Files"
        renderThumb={(item) => {
          const ui = KIND_UI[item.kind] || KIND_UI.txt;
          const Icon = ui.Icon;
          return (
            <span
              className={`w-11 h-14 rounded-lg border flex items-center justify-center shrink-0 ${ui.cls}`}
            >
              <Icon className="w-5 h-5" />
            </span>
          );
        }}
        renderMeta={(item) => {
          const ui = KIND_UI[item.kind] || KIND_UI.txt;
          return (
            <p className="text-xs text-ink-soft">
              <span className={`font-bold uppercase tracking-wide ${ui.cls.split(' ').pop()}`}>
                {ui.label}
              </span>
              {' · '}
              {formatSize(item.file.size)}
              {' → '}
              {outName(item.file)}
            </p>
          );
        }}
      />

      {items.length > 0 && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
          <p className="text-sm text-ink-soft mb-4">
            <span className="font-semibold text-ink">{items.length} file{items.length === 1 ? '' : 's'}</span>{' '}
            will be converted, one PDF per file.
          </p>
          <ProcessButton
            onClick={handleConvert}
            disabled={!canProcess}
            busy={busy}
            busyLabel="Converting…"
          >
            <FileUp className="w-4 h-4" />
            Convert to PDF
          </ProcessButton>
        </div>
      )}

      {results && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
          <Alert type="success">
            Conversion complete — {results.length} PDF{results.length === 1 ? '' : 's'} created
            in your browser.
          </Alert>
          <ul className="mt-4 space-y-3">
            {results.map((r) => (
              <li
                key={r.name}
                className="bg-surface border border-zinc-200/80 rounded-2xl px-4 py-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{r.name}</p>
                  <p className="text-xs text-ink-soft">
                    {r.pageCount} page{r.pageCount === 1 ? '' : 's'} · {formatSize(r.bytes.length)}
                  </p>
                </div>
                {r.notes?.length > 0 && (
                  <p className="mt-2 text-xs text-amber-800">{r.notes.join(' ')}</p>
                )}
                <div className="mt-2">
                  <GeneratedPdfActions bytes={r.bytes} filename={r.name} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            {results.length > 1 && (
              <button
                onClick={downloadAllZip}
                disabled={zipping}
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold bg-brand-600 text-white px-6 py-3 rounded-xl hover:bg-brand-700 shadow-md shadow-brand-600/25 transition-all disabled:opacity-50 touch-manipulation min-h-[48px]"
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
  );
}
