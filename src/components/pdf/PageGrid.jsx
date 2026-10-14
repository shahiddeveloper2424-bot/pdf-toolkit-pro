import PageThumbnail from './PageThumbnail.jsx';

/**
 * Scrollable grid of real page thumbnails with click-to-select.
 * `pages` is an array of 1-based page numbers in display order
 * (lets Reorder show its working order while others pass 1..N).
 */
export default function PageGrid({
  pdfDoc,
  pages,
  selected,
  onToggle,
  onSelectAll,
  onDeselectAll,
  thumbnailProps,
  maxHeightClass = 'max-h-[520px]',
}) {
  const selectedCount = selected ? selected.size : 0;

  return (
    <div>
      {(onSelectAll || onDeselectAll || selected) && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <p className="text-sm text-ink-soft">
            <span className="font-semibold text-ink">{pages.length}</span> pages
            {selected && (
              <>
                {' · '}
                <span className="font-semibold text-brand-700">{selectedCount}</span> selected
              </>
            )}
          </p>
          <div className="flex gap-2">
            {onSelectAll && (
              <button
                type="button"
                onClick={onSelectAll}
                className="text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded-full px-4 py-2.5 hover:bg-brand-100 transition-colors touch-manipulation"
              >
                Select all
              </button>
            )}
            {onDeselectAll && (
              <button
                type="button"
                onClick={onDeselectAll}
                disabled={selectedCount === 0}
                className="text-xs font-semibold text-zinc-600 bg-white border border-zinc-300 rounded-full px-4 py-2.5 hover:bg-zinc-50 transition-colors disabled:opacity-40 touch-manipulation"
              >
                Deselect all
              </button>
            )}
          </div>
        </div>
      )}
      <div
        className={`thin-scroll overflow-y-auto rounded-2xl border border-zinc-200 bg-white/60 p-4 sm:p-5 ${maxHeightClass}`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
          {pages.map((pageNumber, index) => (
            <PageThumbnail
              key={`${pageNumber}-${index}`}
              pdfDoc={pdfDoc}
              pageNumber={pageNumber}
              selected={selected ? selected.has(pageNumber) : false}
              onToggle={onToggle ? () => onToggle(pageNumber) : undefined}
              {...(thumbnailProps ? thumbnailProps(pageNumber, index) : {})}
            />
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs text-zinc-500">Click a page to select or deselect it.</p>
    </div>
  );
}
