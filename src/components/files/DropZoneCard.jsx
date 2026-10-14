import { useRef, useState } from 'react';
import { CloudUpload, FolderOpen, Lock } from 'lucide-react';

/**
 * Drop zone with the proven mobile pattern: the real file input sits
 * transparently on top of the Browse button, so the tap lands directly
 * on the input and the OS picker opens from a genuine gesture (iOS
 * Safari / Android Chrome ignore programmatic clicks on hidden inputs).
 * The input value is reset after every pick, so the same file can be
 * selected again after it was removed.
 */
export default function DropZoneCard({
  accept,
  multiple = true,
  onFiles,
  title,
  subtitle,
  supportedLabel,
  browseLabel = 'Browse Files',
}) {
  const [dragActive, setDragActive] = useState(false);
  const dragCounter = useRef(0);

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        dragCounter.current += 1;
        setDragActive(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        dragCounter.current -= 1;
        if (dragCounter.current <= 0) {
          dragCounter.current = 0;
          setDragActive(false);
        }
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        dragCounter.current = 0;
        setDragActive(false);
        onFiles?.(e.dataTransfer.files);
      }}
      className={`relative border-2 border-dashed rounded-3xl px-6 py-10 sm:py-12 text-center transition-all ${
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
        {subtitle && <p className="mt-1.5 text-sm text-ink-soft">{subtitle}</p>}
        <span className="relative mt-5 inline-flex rounded-xl touch-manipulation focus-within:ring-4 focus-within:ring-brand-300 focus-within:ring-offset-2 focus-within:ring-offset-white">
          <span className="inline-flex items-center gap-2 text-sm font-semibold bg-brand-600 text-white px-6 py-3 rounded-xl hover:bg-brand-700 shadow-md shadow-brand-600/25 transition-colors select-none min-h-[48px]">
            <FolderOpen className="w-4 h-4" />
            {browseLabel}
          </span>
          <input
            type="file"
            accept={accept}
            multiple={multiple}
            aria-label={title}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => {
              onFiles?.(e.target.files);
              e.target.value = '';
            }}
          />
        </span>
        {supportedLabel && (
          <p className="mt-4 text-xs font-semibold text-ink-soft bg-surface border border-zinc-200 rounded-full px-3.5 py-1.5">
            {supportedLabel}
          </p>
        )}
        <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft">
          <Lock className="w-3.5 h-3.5 text-brand-600" />
          Files stay on this device — nothing is uploaded
        </span>
      </div>
    </div>
  );
}

/** "Add more" button with the same direct-tap input overlay pattern. */
export function AddFilesButton({ accept, onFiles, label = 'Add Files' }) {
  return (
    <span className="relative inline-flex rounded-xl touch-manipulation focus-within:ring-4 focus-within:ring-brand-300 focus-within:ring-offset-2">
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-5 py-3 rounded-xl hover:bg-brand-100 transition-colors select-none min-h-[48px]">
        <FolderOpen className="w-4 h-4" />
        {label}
      </span>
      <input
        type="file"
        accept={accept}
        multiple
        aria-label={label}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={(e) => {
          onFiles?.(e.target.files);
          e.target.value = '';
        }}
      />
    </span>
  );
}
