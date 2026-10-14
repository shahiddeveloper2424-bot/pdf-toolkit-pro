import { useEffect, useMemo, useRef, useState } from 'react';
import { Combine, FileText, Image as ImageIcon } from 'lucide-react';
import DropZoneCard from '../files/DropZoneCard.jsx';
import QueueList from '../files/QueueList.jsx';
import ImageSettings from '../files/ImageSettings.jsx';
import { useFileQueue } from '../files/useFileQueue.js';
import PageThumbnail from '../pdf/PageThumbnail.jsx';
import { loadPreviewDocument } from '../../lib/pdfPreview.js';
import { takeHandoffFiles } from '../../lib/fileHandoff.js';
import { classifyFile, MERGE_ACCEPT } from '../../lib/fileKinds.js';
import { getImageInfo, buildMixedPdf, IMAGE_PDF_DEFAULTS } from '../../lib/imagePdf.js';
import { baseName, friendlyProcessError } from '../../lib/pdfEngine.js';
import GeneratedPdfActions from './GeneratedPdfActions.jsx';
import {
  Alert,
  FileWarnings,
  ProcessButton,
  StartOverButton,
  formatSize,
} from './shared.jsx';

const classifyMerge = (file) => {
  const kind = classifyFile(file);
  return kind === 'pdf' || kind === 'image' ? kind : null;
};

/**
 * Merge workspace (PDFs + images): one ordered queue. PDFs keep every
 * page; each image becomes one page at its queue position, laid out
 * with the image page settings. Processing is pdf-lib, in-browser.
 */
export default function MergeTool() {
  const [seedFiles] = useState(() => takeHandoffFiles('merge'));
  const queue = useFileQueue({ classify: classifyMerge, seedFiles });
  const [settings, setSettings] = useState(IMAGE_PDF_DEFAULTS);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const enrichingRef = useRef(new Set());
  const destroyRef = useRef(new Map()); // itemId -> pdf.js destroy fn
  const thumbUrlRef = useRef(new Map()); // itemId -> object URL

  // Enrich new items: page count + first-page thumbnail for PDFs,
  // dimensions + thumbnail for images.
  useEffect(() => {
    for (const item of queue.items) {
      if (item.meta || enrichingRef.current.has(item.id)) continue;
      enrichingRef.current.add(item.id);
      (async () => {
        try {
          if (item.kind === 'pdf') {
            const buf = new Uint8Array(await item.file.arrayBuffer());
            const { doc, destroy } = await loadPreviewDocument(buf);
            destroyRef.current.set(item.id, destroy);
            queue.setItemMeta(item.id, { pageCount: doc.numPages, pdfDoc: doc });
          } else {
            const info = await getImageInfo(item.file);
            const url = URL.createObjectURL(item.file);
            thumbUrlRef.current.set(item.id, url);
            queue.setItemMeta(item.id, {
              width: info.width,
              height: info.height,
              thumbUrl: url,
            });
          }
        } catch (e) {
          queue.setItemError(item.id, e.message || 'Could not read this file.');
          queue.setItemMeta(item.id, { failed: true });
        } finally {
          enrichingRef.current.delete(item.id);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.items]);

  // Tear down PDF.js docs / object URLs for removed items + on unmount.
  useEffect(() => {
    const alive = new Set(queue.items.map((i) => i.id));
    for (const [id, destroy] of destroyRef.current) {
      if (!alive.has(id)) {
        try { destroy(); } catch { /* never throw in cleanup */ }
        destroyRef.current.delete(id);
      }
    }
    for (const [id, url] of thumbUrlRef.current) {
      if (!alive.has(id)) {
        URL.revokeObjectURL(url);
        thumbUrlRef.current.delete(id);
      }
    }
  }, [queue.items]);
  useEffect(
    () => () => {
      destroyRef.current.forEach((d) => { try { d(); } catch { /* noop */ } });
      thumbUrlRef.current.forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );

  const { items } = queue;
  const hasImages = items.some((i) => i.kind === 'image');
  const blocked = items.some((i) => i.error);
  const totalPages = useMemo(
    () =>
      items.reduce(
        (acc, i) => acc + (i.kind === 'pdf' ? i.meta?.pageCount || 0 : 1),
        0,
      ),
    [items],
  );
  const canProcess = items.length >= 2 && !blocked && !busy;

  const handleMerge = async () => {
    setBusy(true);
    setError('');
    setResult(null);
    setProgress({ done: 0, total: items.length, label: '' });
    try {
      const { bytes, pageCount } = await buildMixedPdf(
        items.map((i) => ({ kind: i.kind, file: i.file })),
        settings,
        (done, total, label) => setProgress({ done, total, label }),
      );
      setResult({
        bytes,
        filename: `${baseName(items[0].file.name)}-merged.pdf`,
        pages: pageCount,
      });
    } catch (e) {
      setError(friendlyProcessError(e));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const startOver = () => {
    queue.clearAll();
    setResult(null);
    setError('');
  };

  const renderThumb = (item) => {
    if (item.kind === 'image') {
      return item.meta?.thumbUrl ? (
        <img
          src={item.meta.thumbUrl}
          alt=""
          className="w-11 h-14 object-cover rounded-lg border border-zinc-200 shrink-0"
        />
      ) : (
        <span className="w-11 h-14 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
          <ImageIcon className="w-5 h-5 text-rose-600" />
        </span>
      );
    }
    return item.meta?.pdfDoc ? (
      <span className="w-11 shrink-0 rounded-lg overflow-hidden border border-zinc-200">
        <PageThumbnail pdfDoc={item.meta.pdfDoc} pageNumber={1} width={44} />
      </span>
    ) : (
      <span className="w-11 h-14 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
        <FileText className="w-5 h-5 text-violet-700" />
      </span>
    );
  };

  const renderMeta = (item) => (
    <p className="text-xs text-ink-soft">
      <span
        className={`font-bold uppercase tracking-wide ${
          item.kind === 'pdf' ? 'text-violet-700' : 'text-rose-700'
        }`}
      >
        {item.kind === 'pdf' ? 'PDF' : 'Image'}
      </span>
      {' · '}
      {formatSize(item.file.size)}
      {item.kind === 'pdf' &&
        item.meta?.pageCount != null &&
        ` · ${item.meta.pageCount} page${item.meta.pageCount === 1 ? '' : 's'}`}
      {item.kind === 'image' &&
        item.meta?.width &&
        ` · ${item.meta.width}×${item.meta.height}px`}
      {item.kind === 'image' && ' · becomes 1 page'}
    </p>
  );

  return (
    <div className="space-y-4">
      <DropZoneCard
        accept={MERGE_ACCEPT}
        onFiles={queue.addFiles}
        title="Drop PDFs and images here"
        subtitle="Combine PDFs and images into one document, in your order"
        supportedLabel="Supported: PDF · JPG · PNG · WebP"
      />

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
        accept={MERGE_ACCEPT}
        addLabel="Add Files"
        renderThumb={renderThumb}
        renderMeta={renderMeta}
      />

      {items.length > 0 && hasImages && (
        <ImageSettings settings={settings} onChange={setSettings} />
      )}

      {items.length > 0 && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
          <p className="text-sm text-ink-soft mb-4">
            <span className="font-semibold text-ink">{items.length} files</span>
            {' · '}
            {totalPages} page{totalPages === 1 ? '' : 's'} in the final PDF, in
            exactly the order shown above. Drag rows or use the arrows to reorder.
          </p>
          {progress && (
            <div className="mb-4" role="status">
              <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className="h-full bg-brand-600 rounded-full transition-all duration-300"
                  style={{
                    width: `${progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-ink-soft">
                Processing {Math.min(progress.done + 1, progress.total)} of {progress.total}
                {progress.label ? ` — ${progress.label}` : ''}…
              </p>
            </div>
          )}
          <ProcessButton
            onClick={handleMerge}
            disabled={!canProcess}
            busy={busy}
            busyLabel="Creating merged PDF…"
          >
            <Combine className="w-4 h-4" />
            Create Merged PDF
          </ProcessButton>
          {items.length < 2 && (
            <p className="mt-3 text-xs text-ink-soft">
              Add at least one more file to enable merging.
            </p>
          )}
          {blocked && (
            <p className="mt-3 text-xs text-red-700">
              One file above could not be read — remove it to continue.
            </p>
          )}
        </div>
      )}

      {result && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
          <Alert type="success">
            Done — {result.pages} pages combined into a single PDF (
            {formatSize(result.bytes.length)}), created entirely in your browser.
          </Alert>
          <div className="mt-4">
            <GeneratedPdfActions
              bytes={result.bytes}
              filename={result.filename}
              excludeSlug="merge"
            />
          </div>
          <div className="mt-4">
            <StartOverButton onClick={startOver} />
          </div>
        </div>
      )}
    </div>
  );
}
