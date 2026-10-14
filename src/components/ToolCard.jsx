import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

/**
 * Tool card. `featured` renders the wide bento variant used for Merge:
 * bigger icon, description text, and a row of mini page thumbnails that
 * hint at the visual workspace inside.
 */
export default function ToolCard({ tool, index, featured = false }) {
  const Icon = tool.icon;
  const num = String((index ?? 0) + 1).padStart(2, '0');

  if (featured) {
    return (
      <Link
        to={`/tools/${tool.slug}`}
        className={`group relative h-full overflow-hidden bg-navy-950 rounded-[1.75rem] p-7 sm:p-8 shadow-lg hover:shadow-2xl hover:shadow-violet-600/25 transition-all flex flex-col ${tool.accentHoverBorder}`}
      >
        <div
          className="pointer-events-none absolute -top-20 -right-16 w-64 h-64 bg-violet-600/30 rounded-full blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex items-start justify-between mb-6">
          <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-600/40">
            <Icon className="w-7 h-7 text-white" />
          </span>
          <span className="text-sm font-extrabold tracking-widest text-white/30">{num}</span>
        </div>
        <h3 className="relative text-2xl font-extrabold text-white mb-2">{tool.name}</h3>
        <p className="relative text-sm sm:text-base text-white/65 leading-relaxed max-w-md">
          {tool.description}
        </p>

        {/* mini page-strip hint */}
        <div className="relative mt-7 flex gap-2" aria-hidden="true">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="w-14 h-[4.5rem] sm:w-16 sm:h-20 rounded-lg bg-white/95 p-1.5 shadow-md rotate-[-1deg] group-hover:rotate-0 transition-transform"
              style={{ transform: `rotate(${(n - 2.5) * 1.6}deg)` }}
            >
              <div className="doc-line doc-line-dark w-3/5 mb-1" />
              <div className="doc-line w-full mb-1" />
              <div className="doc-line w-full mb-1" />
              <div className="doc-line w-2/3" />
              <p className="mt-1 text-[8px] font-bold text-zinc-400">{n}</p>
            </div>
          ))}
          <div className="self-center ml-1 text-white/50 text-xs font-semibold leading-tight">
            + more
            <br />
            files
          </div>
        </div>

        <span className="relative mt-auto pt-7 inline-flex items-center gap-2 text-sm font-bold text-white">
          <span className="inline-flex items-center gap-1.5 bg-white text-navy-950 rounded-full px-4 py-2 group-hover:bg-brand-100 transition-colors">
            Open tool
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      to={`/tools/${tool.slug}`}
      className={`group h-full bg-white border border-zinc-200/90 rounded-[1.75rem] p-6 shadow-[0_1px_2px_rgb(28_26_36/0.05)] hover:shadow-xl hover:shadow-zinc-900/10 transition-all flex flex-col ${tool.accentHoverBorder}`}
    >
      <div className="flex items-start justify-between mb-5">
        <span
          className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${tool.accentSoft}`}
        >
          <Icon className={`w-6 h-6 ${tool.accentText}`} />
        </span>
        <span className="flex items-center gap-2">
          <span className="text-xs font-extrabold tracking-widest text-zinc-300">{num}</span>
          <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </span>
      </div>
      <h3 className="text-lg font-bold text-ink mb-1.5">{tool.name}</h3>
      <p className="text-sm text-ink-soft leading-relaxed flex-1">{tool.tagline}</p>
      <span className={`mt-5 inline-flex items-center gap-1.5 text-sm font-bold ${tool.accentText}`}>
        Open tool
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </span>
    </Link>
  );
}
