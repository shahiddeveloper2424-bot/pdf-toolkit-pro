import { useEffect } from 'react';
import { getToolSeo } from '../data/toolSeo.js';

/**
 * SEO content section for a tool page: descriptive copy plus an FAQ.
 * Injects FAQPage JSON-LD so search engines can show rich results.
 * Rendered below the interactive workspace.
 */
export default function ToolSeo({ tool }) {
  const seo = getToolSeo(tool.slug);

  useEffect(() => {
    if (!seo) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'tool-faq-jsonld';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: seo.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
    document.head.appendChild(script);
    return () => {
      document.getElementById('tool-faq-jsonld')?.remove();
    };
  }, [tool.slug, seo]);

  if (!seo) return null;

  return (
    <div className="mt-14 space-y-12">
      {/* About this tool */}
      <section aria-label={`About ${tool.name}`}>
        <h2 className="text-xs font-bold text-ink uppercase tracking-[0.18em] mb-4">
          About {tool.name}
        </h2>
        <div className="space-y-4 max-w-3xl">
          {seo.paragraphs.map((p, i) => (
            <p key={i} className="text-[15px] text-ink-soft leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section aria-label="Frequently asked questions">
        <h2 className="text-xs font-bold text-ink uppercase tracking-[0.18em] mb-4">
          Frequently asked questions
        </h2>
        <div className="space-y-3 max-w-3xl">
          {seo.faqs.map((f, i) => (
            <details
              key={i}
              className="group bg-white border border-zinc-200 rounded-2xl shadow-sm open:shadow-md transition-shadow"
            >
              <summary className="cursor-pointer list-none px-5 py-4 text-[15px] font-semibold text-ink flex items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden="true"
                  className="shrink-0 w-7 h-7 rounded-full bg-zinc-100 text-zinc-500 text-lg leading-none flex items-center justify-center group-open:rotate-45 transition-transform"
                >
                  +
                </span>
              </summary>
              <p className="px-5 pb-5 text-sm text-ink-soft leading-relaxed">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
