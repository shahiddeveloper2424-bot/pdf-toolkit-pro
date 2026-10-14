import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Image as ImageIcon } from 'lucide-react';
import DropZoneCard from '../files/DropZoneCard.jsx';
import QueueList from '../files/QueueList.jsx';
import ImageSettings from '../files/ImageSettings.jsx';
import { useFileQueue } from '../files/useFileQueue.js';
import { classifyFile, IMAGE_ACCEPT } from '../../lib/fileKinds.js';
import { getImageInfo, buildImagesPdf, IMAGE_PDF_DEFAULTS } from '../../lib/imagePdf.js';
import { friendlyProcessError } from '../../lib/pdfEngine.js';
import GeneratedPdfActions from './GeneratedPdfActions.jsx';
import {
  Alert,
  FileWarnings,
  ProcessButton,
  StartOverButton,
  formatSize,
  inputClass,
  Field,
} from './shared.jsx';

const classifyImage = (file) => (classifyFile(file) === 'image' ? 'image' : null);

/**
 * PDF Maker (Image to PDF): multiple images → one PDF, with page
 * settings and a custom output name. Pure browser processing.
 */
export default function PdfMakerTool() {
  const queue = useFileQueue({ classify: classifyImage });
  const [settings, setSettings] = useState(IMAGE_PDF_DEFAULTS);
  const [outputName, setOutputName] = useState('my-images');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const enrichingRef = useRef(new Set());
  const thumbUrlRef = useRef(new Map());

  useEffect(() => {
    for (const item of queue.items) {
      if (item.meta || enrichingRef.current.has(item.id)) continue;
      enrichingRef.current.add(item.id);
      (async () => {
        try {
          const info = await getImageInfo(item.file);
          const url = URL.createObjectURL(item.file);
          thumbUrlRef.current.set(item.id, url);
          queue.setItemMeta(item.id, {
            width: info.width,
            height: info.height,
            thumbUrl: url,
          });
        } catch (e) {
          queue.setItemError(item.id, e.message || 'Could not read this image.');
          queue.setItemMeta(item.id, { failed: true });
        } finally {
          enrichingRef.current.delete(item.id);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.items]);

  useEffect(() => {
    const alive = new Set(queue.items.map((i) => i.id));
    for (const [id, url] of thumbUrlRef.current) {
      if (!alive.has(id)) {
        URL.revokeObjectURL(url);
        thumbUrlRef.current.delete(id);
      }
    }
  }, [queue.items]);
  useEffect(
    () => () => thumbUrlRef.current.forEach((u) => URL.revokeObjectURL(u)),
    [],
  );

  const { items } = queue;
  const blocked = items.some((i) => i.error);
  const safeName =
    (outputName || 'my-images').replace(/[^\w\- ]+/g, '').trim() || 'my-images';
  const canProcess = items.length >= 1 && !blocked && !busy;

  const handleCreate = async () => {
    setBusy(true);
    setError('');
    setResult(null);
    setProgress({ done: 0, total: items.length, label: '' });
    try {
      const { bytes, pageCount } = await buildImagesPdf(
        items.map((i) => i.file),
        settings,
        (done, total, label) => setProgress({ done, total, label }),
      );
      setResult({ bytes, filename: `${safeName}.pdf`, pages: pageCount });
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

  return (
    <div className="space-y-4">
      <DropZoneCard
        accept={IMAGE_ACCEPT}
        onFiles={queue.addFiles}
        title="Drop your images here"
        subtitle="Turn a set of images into one tidy PDF"
        supportedLabel="Supported: JPG · PNG · WebP"
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
        accept={IMAGE_ACCEPT}
        addLabel="Add Images"
        renderThumb={(item) =>
          item.meta?.thumbUrl ? (
            <img
              src={item.meta.thumbUrl}
              alt=""
              className="w-11 h-14 object-cover rounded-lg border border-zinc-200 shrink-0"
            />
          ) : (
            <span className="w-11 h-14 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5 text-emerald-700" />
            </span>
          )
        }
        renderMeta={(item) => (
          <p className="text-xs text-ink-soft">
            <span className="font-bold uppercase tracking-wide text-emerald-700">Image</span>
            {' · '}
            {formatSize(item.file.size)}
            {item.meta?.width && ` · ${item.meta.width}×${item.meta.height}px`}
          </p>
        )}
      />

      {items.length > 0 && (
        <>
          <ImageSettings settings={settings} onChange={setSettings} defaultOpen />
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-end mb-5">
              <Field label="Output file name">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={outputName}
                    onChange={(e) => setOutputName(e.target.value)}
                    className={inputClass}
                    aria-label="Output file name"
                    placeholder="my-images"
                  />
                  <span className="text-sm text-ink-soft shrink-0">.pdf</span>
                </div>
              </Field>
              <p className="text-sm text-ink-soft pb-1">
                <span className="font-semibold text-ink">{items.length} images</span>
                {' → '}
                {items.length} page{items.length === 1 ? '' : 's'} ·{' '}
                {settings.pageSize === 'fit' ? 'Fit to image' : settings.pageSize.toUpperCase()}
              </p>
            </div>
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
              onClick={handleCreate}
              disabled={!canProcess}
              busy={busy}
              busyLabel="Creating PDF…"
            >
              <ImagePlus className="w-4 h-4" />
              Create PDF from {items.length} Image{items.length === 1 ? '' : 's'}
            </ProcessButton>
            {blocked && (
              <p className="mt-3 text-xs text-red-700">
                One image above could not be read — remove it to continue.
              </p>
            )}
          </div>
        </>
      )}

      {result && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
          <Alert type="success">
            Done — {result.pages} page{result.pages === 1 ? '' : 's'} created (
            {formatSize(result.bytes.length)}), entirely in your browser.
          </Alert>
          <div className="mt-4">
            <GeneratedPdfActions bytes={result.bytes} filename={result.filename} />
          </div>
          <div className="mt-4">
            <StartOverButton onClick={startOver} />
          </div>
        </div>
      )}
    </div>
  );
}
