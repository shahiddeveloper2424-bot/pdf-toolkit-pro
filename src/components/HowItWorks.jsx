import { MousePointerClick, Layers, Download } from 'lucide-react';

const steps = [
  {
    icon: MousePointerClick,
    num: '01',
    title: 'Choose a tool & upload',
    text: 'Pick one of the six tools and drop in your PDF. It opens right in your browser — nothing is uploaded anywhere.',
  },
  {
    icon: Layers,
    num: '02',
    title: 'See & select pages',
    text: 'Every page renders as a real thumbnail. Click pages to select them, drag to reorder, or tune your settings visually.',
  },
  {
    icon: Download,
    num: '03',
    title: 'Process & download',
    text: 'Hit the action button and your new PDF is generated on your device, ready to download in seconds.',
  },
];

/**
 * Horizontal timeline instead of three identical cards: a connecting
 * line runs behind oversized step numbers, so the section reads as a
 * journey, left to right.
 */
export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 scroll-mt-16 bg-paper border-y border-zinc-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12 md:mb-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600 mb-3">
              How it works
            </p>
            <h2 className="text-3xl md:text-[2.6rem] font-extrabold tracking-tight text-ink leading-[1.1]">
              Three simple steps
            </h2>
          </div>
          <p className="text-base md:text-lg text-ink-soft leading-relaxed max-w-md md:text-right">
            A visual workflow from start to finish — no typing page numbers blind.
          </p>
        </div>

        <div className="relative">
          {/* connecting line (desktop) */}
          <div
            className="hidden md:block absolute top-7 left-[16%] right-[16%] h-px bg-gradient-to-r from-brand-200 via-brand-600/40 to-brand-200"
            aria-hidden="true"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.num} className="relative md:text-center">
                  <div className="flex md:justify-center items-center gap-4 md:gap-0 mb-4">
                    <span className="relative z-10 w-14 h-14 rounded-full bg-navy-950 flex items-center justify-center shadow-lg shadow-navy-950/20 ring-8 ring-paper">
                      <Icon className="w-6 h-6 text-white" />
                    </span>
                    <span className="md:hidden text-4xl font-extrabold text-zinc-200">
                      {s.num}
                    </span>
                  </div>
                  <p className="hidden md:block text-xs font-extrabold tracking-[0.22em] text-brand-600 mb-2">
                    STEP {s.num}
                  </p>
                  <h3 className="text-lg font-bold text-ink mb-2">{s.title}</h3>
                  <p className="text-sm text-ink-soft leading-relaxed max-w-xs md:mx-auto">
                    {s.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
