import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, ArrowUp, ArrowDown, GripVertical, Trash2 } from 'lucide-react';
import { AddFilesButton } from './DropZoneCard.jsx';

/**
 * Animated, reorderable file queue.
 * - Motion layout animations on add/remove/reorder.
 * - HTML5 drag-and-drop reordering on desktop, plus 44px touch-friendly
 *   move up/down buttons (drag is unreliable on touch screens).
 * - renderThumb / renderMeta let each tool show its own preview and
 *   metadata while the row chrome stays identical everywhere.
 */
export default function QueueList({
  items,
  onMove,
  onRemove,
  onReorder,
  onClearAll,
  onAddFiles,
  accept,
  addLabel = 'Add Files',
  renderThumb,
  renderMeta,
  itemClassName = '',
}) {
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

  if (items.length === 0) return null;

  return (
    <div>
      <ul className="space-y-2.5">
        <AnimatePresence initial={false}>
          {items.map((item, index) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              draggable
              onDragStart={() => setDragId(item.id)}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setOverId(item.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId && dragId !== item.id) onReorder?.(dragId, item.id);
                setDragId(null);
                setOverId(null);
              }}
              className={`flex items-center gap-3 bg-white border rounded-2xl px-3.5 py-3 shadow-sm ${
                overId === item.id && dragId !== item.id
                  ? 'border-brand-500 ring-2 ring-brand-500/25'
                  : 'border-zinc-200/80'
              } ${dragId === item.id ? 'opacity-50' : ''} ${itemClassName}`}
            >
              <span className="hidden sm:flex text-zinc-300 cursor-grab shrink-0" aria-hidden="true">
                <GripVertical className="w-4 h-4" />
              </span>
              <span className="shrink-0 w-6 h-6 rounded-full bg-navy-950 text-white text-[11px] font-bold flex items-center justify-center">
                {index + 1}
              </span>
              {renderThumb?.(item)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{item.file.name}</p>
                {renderMeta?.(item)}
                {item.error && (
                  <p className="text-xs text-red-700 mt-0.5 leading-snug">{item.error}</p>
                )}
              </div>
              <div className="flex items-center shrink-0">
                <button
                  onClick={() => onMove(item.id, -1)}
                  disabled={index === 0}
                  className="p-2.5 rounded-lg text-zinc-500 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-30 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={`Move ${item.file.name} up`}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onMove(item.id, 1)}
                  disabled={index === items.length - 1}
                  className="p-2.5 rounded-lg text-zinc-500 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-30 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={`Move ${item.file.name} down`}
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onRemove(item.id)}
                  className="p-2.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={`Remove ${item.file.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
        {onAddFiles && (
          <AddFilesButton accept={accept} onFiles={onAddFiles} label={addLabel} />
        )}
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 bg-white border border-zinc-300 px-5 py-3 rounded-xl hover:border-red-300 hover:text-red-600 transition-colors touch-manipulation min-h-[48px]"
        >
          <Trash2 className="w-4 h-4" />
          Clear All
        </button>
        <span className="text-xs text-ink-soft ml-1">
          {items.length} file{items.length === 1 ? '' : 's'} in queue
        </span>
      </div>
    </div>
  );
}
