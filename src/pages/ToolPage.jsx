import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { getTool, tools } from '../data/tools.js';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import MergeTool from '../components/tools/MergeTool.jsx';
import SplitTool from '../components/tools/SplitTool.jsx';
import ExtractTool from '../components/tools/ExtractTool.jsx';
import RotateTool from '../components/tools/RotateTool.jsx';
import ReorderTool from '../components/tools/ReorderTool.jsx';
import WatermarkTool from '../components/tools/WatermarkTool.jsx';
import PdfMakerTool from '../components/tools/PdfMakerTool.jsx';
import ConvertTool from '../components/tools/ConvertTool.jsx';
import NotFound from './NotFound.jsx';

const toolComponents = {
  merge: MergeTool,
  split: SplitTool,
  extract: ExtractTool,
  rotate: RotateTool,
  reorder: ReorderTool,
  watermark: WatermarkTool,
  'pdf-maker': PdfMakerTool,
  convert: ConvertTool,
};

export default function ToolPage() {
  const { slug } = useParams();
  const tool = getTool(slug);
  const ToolComponent = toolComponents[slug];

  if (!tool || !ToolComponent) return <NotFound />;

  const Icon = tool.icon;
  const others = tools.filter((t) => t.slug !== slug).slice(0, 3);

  return (
    <main>
      <motion.div
        key={slug}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-brand-700 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Tools
        </Link>

        {/* Two-column workspace header: identity left, how-to panel right */}
        <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-8 lg:gap-12 items-start mb-10">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <span
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.accentGradient} flex items-center justify-center shrink-0 shadow-md`}
              >
                <Icon className="w-7 h-7 text-white" />
              </span>
              <p className={`text-xs font-extrabold uppercase tracking-[0.22em] ${tool.accentText}`}>
                PDF Tool
              </p>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-ink tracking-tight leading-[1.05]">
              {tool.name}
            </h1>
            <p className="mt-4 text-base md:text-lg text-ink-soft leading-relaxed max-w-xl">
              {tool.description}
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1.5">
              Runs in your browser — nothing is uploaded
            </p>
          </div>

          {tool.howTo && (
            <div className={`rounded-[1.5rem] border p-6 ${tool.accentSoft}`}>
              <p className={`text-xs font-bold uppercase tracking-[0.18em] mb-4 ${tool.accentText}`}>
                How to use
              </p>
              <ol className="space-y-3.5">
                {tool.howTo.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-ink leading-relaxed">
                    <span
                      className={`shrink-0 w-6 h-6 rounded-full ${tool.accentSolid} text-white text-[11px] font-bold flex items-center justify-center mt-0.5`}
                    >
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <ErrorBoundary key={slug}>
          <ToolComponent />
        </ErrorBoundary>

        <div className="mt-14 pt-8 border-t border-zinc-200">
          <h2 className="text-xs font-bold text-ink uppercase tracking-[0.18em] mb-4">
            Other tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {others.map((t) => {
              const OtherIcon = t.icon;
              return (
                <Link
                  key={t.slug}
                  to={`/tools/${t.slug}`}
                  className={`group flex items-center gap-3 bg-white border border-zinc-200 rounded-2xl px-4 py-3.5 transition-colors shadow-sm ${t.accentHoverBorder}`}
                >
                  <span
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${t.accentSoft}`}
                  >
                    <OtherIcon className={`w-5 h-5 ${t.accentText}`} />
                  </span>
                  <span className="text-sm font-semibold text-ink">{t.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </motion.div>
    </main>
  );
}
