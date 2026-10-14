import { ShieldCheck, WifiOff, UserX, EyeOff } from 'lucide-react';

const points = [
  {
    icon: EyeOff,
    title: 'Files never leave your device',
    text: 'All processing and page rendering happens locally in your browser. There is no server receiving, storing or analyzing your documents.',
  },
  {
    icon: UserX,
    title: 'No accounts or tracking of documents',
    text: 'No sign-up, no email, no document history. What you open here stays between you and your device.',
  },
  {
    icon: WifiOff,
    title: 'Works after the page loads',
    text: 'Once loaded, the tools run fully offline. You can even disconnect from the internet and keep working.',
  },
];

/**
 * Two-column privacy band: sticky story on the left, the three points
 * as open rows (not boxed cards) on the right.
 */
export default function PrivacySection() {
  return (
    <section id="privacy" className="py-16 md:py-24 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden bg-navy-950 rounded-[2rem] px-6 py-12 md:p-14 shadow-xl">
          <div
            className="pointer-events-none absolute inset-0 bg-blueprint opacity-60 [mask-image:radial-gradient(ellipse_70%_80%_at_30%_20%,black,transparent)]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 bg-brand-600/25 rounded-full blur-3xl"
            aria-hidden="true"
          />
          <div className="relative grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-200 mb-3">
                Privacy
              </p>
              <h2 className="text-3xl md:text-[2.6rem] font-extrabold tracking-tight text-white leading-[1.1]">
                Your documents stay yours
              </h2>
              <p className="mt-4 text-base md:text-lg text-[#c9c4dd] leading-relaxed max-w-md">
                Most online PDF tools upload your files to their servers. PDF
                Toolkit Pro is built the opposite way.
              </p>
              <div className="mt-8 flex items-start gap-2.5 text-sm text-[#c9c4dd] bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 max-w-md">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  No backend, no database, no API keys — there is nowhere for
                  your files to go.
                </span>
              </div>
            </div>

            <div className="divide-y divide-white/10">
              {points.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.title} className="flex gap-4 sm:gap-5 py-6 first:pt-0 last:pb-0">
                    <span className="shrink-0 w-11 h-11 rounded-xl bg-brand-600/25 border border-white/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-brand-200" />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-white mb-1.5">{p.title}</h3>
                      <p className="text-sm text-[#c9c4dd] leading-relaxed">{p.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
