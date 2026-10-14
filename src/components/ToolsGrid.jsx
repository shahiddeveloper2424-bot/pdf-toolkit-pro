import { motion } from 'motion/react';
import { tools } from '../data/tools.js';
import ToolCard from './ToolCard.jsx';
import { fadeUp, staggerParent } from '../lib/motionVariants.js';

/**
 * Bento tools grid: Merge gets a wide, dark, featured tile; the other
 * five tools sit in smaller tiles with their own accent colour. The
 * heading is left-aligned with the description beside it — not another
 * centred stack.
 */
export default function ToolsGrid() {
  const [featured, ...rest] = tools;
  return (
    <section id="tools" className="py-16 md:py-24 scroll-mt-16 bg-dots">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 md:mb-12">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600 mb-3">
              All Tools
            </p>
            <h2 className="text-3xl md:text-[2.6rem] font-extrabold tracking-tight text-ink leading-[1.1]">
              Eight tools.
              <br className="hidden sm:block" /> Zero uploads.
            </h2>
          </div>
          <p className="text-base md:text-lg text-ink-soft leading-relaxed max-w-md md:text-right">
            Every tool renders your actual PDF pages as thumbnails — click to
            select, then process right in your browser.
          </p>
        </div>

        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.99 }}
            className="sm:col-span-2 lg:row-span-2 h-full"
          >
            <ToolCard tool={featured} index={0} featured />
          </motion.div>
          {rest.map((tool, i) => (
            <motion.div
              key={tool.slug}
              variants={fadeUp}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.99 }}
              className="h-full"
            >
              <ToolCard tool={tool} index={i + 1} />
            </motion.div>
          ))}
          {/* filler tile completes the bento on large screens (4-col
              grid: featured takes 2x2, seven tools take 7 cells, this
              tile takes the last of 12 cells) */}
          <div className="hidden lg:flex rounded-[1.75rem] border-2 border-dashed border-zinc-300/80 p-6 flex-col justify-between">
            <p className="text-sm font-bold text-ink leading-snug">
              Everything, in your browser.
              <br />
              <span className="text-ink-soft font-medium">
                No server. No waiting room. Your files never leave.
              </span>
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400 mt-6">
              8 tools — 0 uploads
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
