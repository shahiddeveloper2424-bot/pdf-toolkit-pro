import { useState } from 'react';
import { Plus } from 'lucide-react';
import { faqs } from '../data/faqs.js';
import SectionHeading from './SectionHeading.jsx';

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="py-16 md:py-24 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[0.85fr_1.15fr] gap-10 lg:gap-16 items-start">
        <div className="lg:sticky lg:top-24">
          <SectionHeading
            eyebrow="FAQ"
            title="Frequently asked questions"
            subtitle="Straight answers about privacy, pricing and how the tools work."
            align="left"
          />
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const open = openIndex === i;
            return (
              <div
                key={faq.question}
                className={`bg-white border rounded-2xl overflow-hidden transition-colors ${
                  open ? 'border-brand-200 shadow-md shadow-brand-600/5' : 'border-zinc-200/80'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(open ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 text-left"
                  aria-expanded={open}
                >
                  <span className="font-semibold text-ink text-sm sm:text-base">
                    {faq.question}
                  </span>
                  <span
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      open ? 'bg-brand-600' : 'bg-zinc-100'
                    }`}
                  >
                    <Plus
                      className={`w-4 h-4 transition-transform ${
                        open ? 'rotate-45 text-white' : 'text-zinc-600'
                      }`}
                    />
                  </span>
                </button>
                {open && (
                  <div className="px-5 sm:px-6 pb-5">
                    <p className="text-sm sm:text-base text-ink-soft leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
