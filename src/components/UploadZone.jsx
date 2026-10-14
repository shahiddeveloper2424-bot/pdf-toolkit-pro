import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CloudUpload,
  FileText,
  X,
  ArrowUp,
  ArrowDown,
  Lock,
  TriangleAlert,
  FolderOpen,
  Plus,
  Trash2,
} from 'lucide-react';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdf(file) {
  const name = (file.name || '').toLowerCase();
  // Some Android file providers report an empty or generic MIME type
  // (e.g. application/octet-stream) for real PDFs. Trust the .pdf
  // extension here; the PDF parser validates the content afterwards and
  // reports a friendly error for non-PDF data.
  return name.endsWith('.pdf') || file.type === 'application/pdf';
}

function keyOfFile(file) {
  return `${file.name}|${file.size}|${file.lastModified}`;
}

/**
 * Reusable drag-and-drop PDF upload zone with a Browse Files button.
 * PDF-only validation, file queue with sizes, remove, and reorder controls
 * for multi-file tools. Touch devices get "tap to browse" wording.
 *
 * Mobile note: the visible "Browse Files" button is a transparent real
 * <input type="file"> overlay — the tap lands directly on the input, so
 * the OS file picker opens from a genuine user gesture on iOS and
 * Android. No programmatic input.click() on a hidden input is used.
 */
export default function UploadZone({
  id,
  multiple = false,
  onFilesChange,
  title = 'Drop your PDF files here',
  subtitle,
  initialFiles,
}) {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const dragCounter = useRef(0);
  const seededRef = useRef(false);

  // Seed the queue once (e.g. PDFs handed off from the hero drop zone).
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    if (initialFiles && initialFiles.length > 0) {
      const seeded = multiple ? initialFiles : [initialFiles[0]];
      setFiles(seeded);
      onFilesChange?.(seeded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isTouch = useMemo(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches,
    [],
  );

  const resolvedSubtitle =
    subtitle ??
    (isTouch
      ? multiple
        ? 'Tap Browse Files to select multiple PDFs'
        : 'Tap Browse Files to select a PDF'
      : multiple
        ? 'Drag & drop multiple PDFs here'
        : 'Drag & drop a PDF here');

  const updateFiles = (next) => {
    setFiles(next);
    onFilesChange?.(next);
  };

  const addFiles = (incoming) => {
    const list = Array.from(incoming);
    const pdfs = list.filter(isPdf);
    const rejected = list.length - pdfs.length;

    const notes = [];
    if (rejected > 0) {
      notes.push(
        `${rejected} file${rejected > 1 ? 's were' : ' was'} skipped — only PDF files are accepted.`,
      );
    }

    let toAdd = pdfs;
    if (multiple) {
      // Guard against accidental duplicates (same name + size + modified
      // date as a file already queued, or repeated within this selection).
      // Duplicates are reported, never silently dropped.
      const seen = new Set(files.map(keyOfFile));
      const fresh = [];
      let dupes = 0;
      for (const f of pdfs) {
        const k = keyOfFile(f);
        if (seen.has(k)) {
          dupes++;
        } else {
          seen.add(k);
          fresh.push(f);
        }
      }
      if (dupes > 0) {
        notes.push(
          `${dupes} duplicate file${dupes > 1 ? 's were' : ' was'} already in the list — not added again.`,
        );
      }
      toAdd = fresh;
    }

    setError(notes.join(' '));

    if (toAdd.length === 0) return;

    const next = multiple ? [...files, ...toAdd] : [toAdd[0]];
    updateFiles(next);
  };

  const clearAll = () => {
    setError('');
    updateFiles([]);
  };

  const removeFile = (index) => {
    updateFiles(files.filter((_, i) => i !== index));
  };

  const moveFile = (index, direction) => {
    const next = [...files];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    updateFiles(next);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current += 1;
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div id={id} className="w-full scroll-mt-24">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl px-6 py-10 sm:py-14 text-center transition-all ${
          dragActive
            ? 'border-brand-600 bg-brand-50 scale-[1.01] shadow-lg shadow-brand-600/10'
            : 'border-violet-300 bg-white hover:border-brand-600 hover:bg-brand-50/40'
        }`}
      >
        <div className="flex flex-col items-center">
          <span
            className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-5 shadow-md transition-colors ${
              dragActive
                ? 'bg-brand-600 shadow-brand-600/30'
                : 'bg-gradient-to-br from-brand-600 to-blue-600 shadow-brand-600/25'
            }`}
          >
            <CloudUpload className="w-8 h-8 text-white" />
          </span>
          <p className="text-xl font-bold text-ink">
            {dragActive ? 'Release to add your files' : title}
          </p>
          <p className="mt-1.5 text-sm text-ink-soft">{resolvedSubtitle}</p>
          {/*
            The file input sits transparently ON TOP of the styled button, so
            a tap/click lands directly on the real input. This opens the
            native OS file picker reliably on touch devices (iOS Safari and
            Android Chrome can ignore programmatic .click() on hidden inputs).
          */}
          <span className="relative mt-5 inline-flex rounded-xl touch-manipulation focus-within:ring-4 focus-within:ring-brand-300 focus-within:ring-offset-2 focus-within:ring-offset-white">
            <span className="inline-flex items-center gap-2 text-sm font-semibold bg-brand-600 text-white px-6 py-3 rounded-xl hover:bg-brand-700 shadow-md shadow-brand-600/25 transition-colors select-none min-h-[48px]">
              <FolderOpen className="w-4 h-4" />
              Browse Files
            </span>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple={multiple}
              aria-label={title}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </span>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft bg-surface border border-zinc-200 rounded-full px-3 py-1.5">
            <Lock className="w-3.5 h-3.5 text-brand-600" />
            Files stay on this device — nothing is uploaded
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          <AnimatePresence initial={false}>
            {files.map((file, index) => (
              <motion.li
                key={keyOfFile(file)}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="flex items-center gap-3 bg-white border border-zinc-200/80 rounded-2xl px-4 py-3 shadow-sm"
              >
              <span className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-brand-600" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{file.name}</p>
                <p className="text-xs text-ink-soft">{formatSize(file.size)}</p>
              </div>
              {multiple && files.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveFile(index, -1)}
                    disabled={index === 0}
                    className="p-2.5 rounded-lg text-zinc-500 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-30 touch-manipulation"
                    aria-label={`Move ${file.name} up`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveFile(index, 1)}
                    disabled={index === files.length - 1}
                    className="p-2.5 rounded-lg text-zinc-500 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-30 touch-manipulation"
                    aria-label={`Move ${file.name} down`}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button
                onClick={() => removeFile(index)}
                className="p-2.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 touch-manipulation"
                aria-label={`Remove ${file.name}`}
              >
                <X className="w-4 h-4" />
              </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {multiple && files.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          {/* Same direct-tap overlay pattern as Browse Files: the tap lands
              on a real file input, so the mobile picker opens reliably. */}
          <span className="relative inline-flex rounded-xl touch-manipulation focus-within:ring-4 focus-within:ring-brand-300 focus-within:ring-offset-2">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-5 py-3 rounded-xl hover:bg-brand-100 transition-colors select-none min-h-[48px]">
              <Plus className="w-4 h-4" />
              Add More PDFs
            </span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              multiple
              aria-label="Add more PDF files"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </span>
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 bg-white border border-zinc-300 px-5 py-3 rounded-xl hover:border-red-300 hover:text-red-600 transition-colors touch-manipulation min-h-[48px]"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
          <span className="text-xs text-ink-soft ml-1">
            {files.length} file{files.length === 1 ? '' : 's'} selected
          </span>
        </div>
      )}
    </div>
  );
}
