import {
  Loader2,
  CheckCircle2,
  TriangleAlert,
  Info,
  Download,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { motion } from 'motion/react';
import { downloadBytes } from '../../lib/pdfEngine.js';

export const inputClass =
  'w-full border border-zinc-300 rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600 bg-white';

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function Alert({ type = 'error', children }) {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    info: 'bg-brand-50 border-brand-200 text-brand-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
  };
  const Icon =
    type === 'error' || type === 'warning'
      ? TriangleAlert
      : type === 'success'
        ? CheckCircle2
        : Info;
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex items-start gap-2.5 text-sm border rounded-xl px-4 py-3 ${styles[type]}`}
      role={type === 'error' ? 'alert' : 'status'}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="leading-relaxed">{children}</div>
    </motion.div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <div className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {hint && <span className="block text-xs text-ink-soft mt-1">{hint}</span>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function ProcessButton({ onClick, disabled, busy, children, busyLabel = 'Working…' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      className="inline-flex items-center justify-center gap-2 text-sm font-semibold bg-brand-600 text-white px-6 py-3 rounded-xl hover:bg-brand-700 active:scale-[0.98] shadow-md shadow-brand-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:bg-brand-600"
    >
      {busy ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {busyLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function DownloadResultButton({ bytes, filename, mimeType, label = 'Download' }) {
  return (
    <button
      onClick={() => downloadBytes(bytes, filename, mimeType)}
      className="inline-flex items-center justify-center gap-2 text-sm font-semibold bg-brand-600 text-white px-6 py-3 rounded-xl hover:bg-brand-700 active:scale-[0.98] shadow-md shadow-brand-600/25 transition-all"
    >
      <Download className="w-4 h-4" />
      {label}
    </button>
  );
}

export function StartOverButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-ink bg-white border border-zinc-300 px-6 py-3 rounded-xl hover:border-brand-600 hover:text-brand-700 transition-all"
    >
      <RotateCcw className="w-4 h-4" />
      Start Again
    </button>
  );
}

export function FileLine({ file, pageCount }) {
  return (
    <div className="flex items-center gap-3 bg-surface border border-zinc-200/80 rounded-xl px-4 py-3">
      <span className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
        <FileText className="w-5 h-5 text-brand-600" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink truncate">{file.name}</p>
        <p className="text-xs text-ink-soft">
          {formatSize(file.size)}
          {pageCount != null && ` · ${pageCount} page${pageCount === 1 ? '' : 's'}`}
        </p>
      </div>
    </div>
  );
}

/** Files larger than this trigger a "large file" warning (processed in memory). */
export const LARGE_FILE_BYTES = 50 * 1024 * 1024;

/** Warning shown when a selected file is large enough to strain browser memory. */
export function FileWarnings({ files }) {
  const large = files.filter((f) => f.size > LARGE_FILE_BYTES);
  if (large.length === 0) return null;
  return (
    <Alert type="warning">
      {large.length === 1 ? 'This file is' : 'Some of these files are'} over 50 MB.
      PDFs are processed in your browser&rsquo;s memory, so very large files may be
      slow or fail on devices with limited RAM. There is no fixed limit, but smaller
      files work best.
    </Alert>
  );
}

