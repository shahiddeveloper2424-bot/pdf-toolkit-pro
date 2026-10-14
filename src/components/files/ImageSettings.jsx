import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Settings2 } from 'lucide-react';
import { Field } from '../tools/shared.jsx';

function PillGroup({ value, onChange, options, ariaLabel }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={`text-sm font-medium px-4 py-2.5 rounded-full border transition-colors touch-manipulation min-h-[44px] ${
            value === opt.value
              ? 'bg-brand-600 text-white border-brand-600'
              : 'bg-white text-ink-soft border-zinc-300 hover:border-brand-600'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Image page settings used by Merge and PDF Maker: page size,
 * orientation, fit, margins and background. Lives in an expandable
 * panel so the workspace stays clean until the user wants control.
 * Defaults (A4 / Auto / Contain / Standard / white) never crop.
 */
export default function ImageSettings({ settings, onChange, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const set = (patch) => onChange({ ...settings, ...patch });

  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-5 sm:px-6 py-4 text-left touch-manipulation min-h-[52px]"
      >
        <span className="inline-flex items-center gap-2.5 text-sm font-bold text-ink">
          <Settings2 className="w-4 h-4 text-brand-600" />
          Image page settings
          <span className="hidden sm:inline text-xs font-medium text-ink-soft">
            {settings.pageSize === 'fit'
              ? 'Fit to image'
              : settings.pageSize.toUpperCase()}{' '}
            · {settings.fit} · {settings.margin} margins
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="settings"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 sm:px-6 pb-6 pt-1 grid sm:grid-cols-2 gap-5 border-t border-zinc-100">
              <Field label="Page size">
                <PillGroup
                  ariaLabel="Page size"
                  value={settings.pageSize}
                  onChange={(v) => set({ pageSize: v })}
                  options={[
                    { value: 'a4', label: 'A4' },
                    { value: 'letter', label: 'Letter' },
                    { value: 'fit', label: 'Fit to image' },
                  ]}
                />
              </Field>
              <Field label="Orientation">
                <PillGroup
                  ariaLabel="Orientation"
                  value={settings.orientation}
                  onChange={(v) => set({ orientation: v })}
                  options={[
                    { value: 'auto', label: 'Auto' },
                    { value: 'portrait', label: 'Portrait' },
                    { value: 'landscape', label: 'Landscape' },
                  ]}
                />
              </Field>
              <Field
                label="Image fit"
                hint="Contain shows the whole image. Cover fills the page and crops edges."
              >
                <PillGroup
                  ariaLabel="Image fit"
                  value={settings.fit}
                  onChange={(v) => set({ fit: v })}
                  options={[
                    { value: 'contain', label: 'Contain' },
                    { value: 'cover', label: 'Cover' },
                  ]}
                />
              </Field>
              <Field label="Margins">
                <PillGroup
                  ariaLabel="Margins"
                  value={settings.margin}
                  onChange={(v) => set({ margin: v })}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'small', label: 'Small' },
                    { value: 'standard', label: 'Standard' },
                  ]}
                />
              </Field>
              <Field label="Background colour" hint="Shown behind contained images.">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.background}
                    onChange={(e) => set({ background: e.target.value })}
                    className="w-11 h-11 rounded-xl border border-zinc-300 bg-white p-1 cursor-pointer touch-manipulation"
                    aria-label="Background colour"
                  />
                  <span className="text-sm text-ink-soft font-mono uppercase">
                    {settings.background}
                  </span>
                  <button
                    type="button"
                    onClick={() => set({ background: '#ffffff' })}
                    className="text-sm font-semibold text-brand-700 hover:text-brand-600"
                  >
                    Reset to white
                  </button>
                </div>
              </Field>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
