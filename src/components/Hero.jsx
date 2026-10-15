import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { fadeUp, staggerParent } from '../lib/motionVariants.js';
import {
  ShieldCheck,
  CloudUpload,
  FolderOpen,
  Lock,
  TriangleAlert,
  Check,
  Files,
  MousePointerClick,
  WifiOff,
  UserX,
} from 'lucide-react';
import { setHandoffFiles } from '../lib/fileHandoff.js';
import { classifyFile, MERGE_ACCEPT } from '../lib/fileKinds.js';

function isMergeable(file) {
  const kind = classifyFile(file);
  return kind === 'pdf' || kind === 'image';
}

/** One fake-but-honest page thumbnail inside the workspace mock. */
function MockPage({ n, selected, wide }) {
  return (
    <div
      className={`relative bg-white rounded-lg border shadow-sm p-2.5 ${
        selected ? 'border-violet-500 ring-2 ring-violet-500/30' : 'border-zinc-200'
      } ${wide ? 'col-span-2' : ''}`}
    >
      {selected && (
        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center shadow">
          <Check className="w-3 h-3 text-white" strokeWidth={3.5} />
        </span>
      )}
      <div className="doc-line doc-line-dark w-3/5 mb-2" />
      <div className="doc-line w-full mb-1.5" />
      <div className="doc-line w-full mb-1.5" />
      <div className="doc-line w-4/5 mb-1.5" />
      <div className="doc-line w-2/3" />
      <p className="mt-2 text-[10px] font-semibold text-zinc-400">Page {n}</p>
    </div>
  );
}

/**
 * Visual workspace mock: this is what a tool actually looks like —
 * real page thumbnails, click-to-select, files in a queue. Built in CSS
 * so the hero shows the product instead of only describing it.
 */
function WorkspaceMock() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]" aria-hidden="true">
      {/* main workspace window */}
      <div className="relative rounded-3xl bg-[#12122b] border border-white/12 shadow-2xl shadow-black/50 p-4 sm:p-5 rotate-[0.5deg]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/80 bg-white/8 border border-white/10 rounded-full px-2.5 py-1">
            <Files className="w-3 h-3 text-violet-300" />
            Merge PDF — workspace
          </span>
        </div>

        <div className="rounded-2xl bg-[#f4f2fa] p-3.5">
          <div className="grid grid-cols-3 gap-2.5">
            <MockPage n={1} selected />
            <MockPage n={2} selected />
            <MockPage n={3} />
            <MockPage n={4} />
            <MockPage n={5} selected />
            <MockPage n={6} />
          </div>
          <div className="mt-3.5 flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold text-zinc-500">
              3 of 6 pages selected
            </p>
            <span className="text-[11px] font-bold text-white bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg px-3 py-1.5 shadow-md shadow-violet-600/30">
              Merge &amp; Download
            </span>
          </div>
        </div>
      </div>

      {/* floating chips */}
      <div className="anim-bob absolute -left-3 sm:-left-8 top-16 rounded-2xl bg-white shadow-xl shadow-black/30 px-3.5 py-2.5 flex items-center gap-2 rotate-[-3deg]">
        <span className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
          <MousePointerClick className="w-4 h-4 text-emerald-700" />
        </span>
        <div className="leading-tight">
          <p className="text-[11px] font-bold text-zinc-800">Click to select</p>
          <p className="text-[10px] text-zinc-500">real page previews</p>
        </div>
      </div>
      <div className="anim-bob-late absolute -right-2 sm:-right-6 bottom-14 rounded-2xl bg-white shadow-xl shadow-black/30 px-3.5 py-2.5 flex items-center gap-2 rotate-[2.5deg]">
        <span className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
          <Lock className="w-4 h-4 text-violet-700" />
        </span>
        <div className="leading-tight">
          <p className="text-[11px] font-bold text-zinc-800">Nothing uploaded</p>
          <p className="text-[10px] text-zinc-500">runs 100% in-browser</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Split-layout hero: story + working drop zone on the left, a visual
 * workspace mock on the right. Dropping or picking PDFs hands them
 * straight to the Merge tool — files stay in memory on this device.
 */
export default function Hero() {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const dragCounter = useRef(0);

  const startWithFiles = (list) => {
    const pdfs = Array.from(list || []).filter(isMergeable);
    if (pdfs.length === 0) {
      setError('That did not include a PDF or image — please choose PDF, JPG, PNG or WebP files.');
      return;
    }
    setError('');
    setHandoffFiles('merge', pdfs);
    navigate('/tools/merge');
  };

  const scrollToTools = () =>
    document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section className="relative overflow-hidden bg-navy-950">
      {/* blueprint grid + ambient glows */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900 via-navy-950 to-navy-950" />
        <div className="absolute inset-0 bg-blueprint [mask-image:radial-gradient(ellipse_75%_65%_at_50%_35%,black,transparent)]" />
        <div className="anim-float-slow absolute -top-40 left-[4%] w-[440px] h-[440px] bg-brand-600/25 rounded-full blur-3xl" />
        <div
          className="anim-float-slow absolute -bottom-48 right-[2%] w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-3xl"
          style={{ animationDelay: '-8s' }}
        />
      </div>

      <motion.div
        variants={staggerParent}
        initial="hidden"
        animate="show"
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-16 md:pb-20 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-10 items-center"
      >
        {/* Left: story + drop zone */}
        <div className="text-center lg:text-left">
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-100 bg-white/5 border border-white/15 rounded-full px-3.5 py-1.5 mb-6 backdrop-blur"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            100% private — everything runs in your browser
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="text-[2.6rem] sm:text-6xl xl:text-[4.2rem] font-extrabold text-white tracking-tight leading-[1.04]"
          >
            Your PDFs.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-200 via-violet-300 to-blue-300">
              Perfectly Handled.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-5 text-lg text-white/65 leading-relaxed max-w-xl mx-auto lg:mx-0"
          >
            Merge, split, extract, rotate, reorder and watermark documents with
            real visual page previews. No uploads, no sign-ups — your files
            never leave this device.
          </motion.p>

          {/* Functional drop zone → hands the files to the Merge tool */}
          <motion.div variants={fadeUp} className="mt-8 max-w-xl mx-auto lg:mx-0">
            <div
              onDragEnter={(e) => {
                e.preventDefault();
                dragCounter.current += 1;
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                dragCounter.current -= 1;
                if (dragCounter.current <= 0) {
                  dragCounter.current = 0;
                  setDragActive(false);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                dragCounter.current = 0;
                setDragActive(false);
                startWithFiles(e.dataTransfer.files);
              }}
              className={`relative rounded-3xl border-2 border-dashed px-6 py-6 backdrop-blur transition-all text-left ${
                dragActive
                  ? 'border-brand-300 bg-white/10 scale-[1.01]'
                  : 'border-white/20 bg-white/5 hover:border-brand-300/60 hover:bg-white/[0.07]'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center shadow-lg shadow-brand-600/40">
                  <CloudUpload className="w-6 h-6 text-white" />
                </span>
                <div className="min-w-0">
                  <p className="text-base font-bold text-white">
                    {dragActive ? 'Release to start merging' : 'Drop PDFs or images to start merging'}
                  </p>
                  <p className="mt-0.5 text-sm text-white/55">
                    Pick several at once — reorder them on the next screen.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                <span className="relative inline-flex rounded-xl touch-manipulation focus-within:ring-4 focus-within:ring-brand-300/60">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold bg-brand-600 text-white px-6 py-3 rounded-xl hover:bg-brand-700 shadow-md shadow-brand-600/40 transition-colors select-none min-h-[48px]">
                    <FolderOpen className="w-4 h-4" />
                    Browse Files
                  </span>
                  <input
                    type="file"
                    accept={MERGE_ACCEPT}
                    multiple
                    aria-label="Choose PDF or image files to merge"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      startWithFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </span>
                <button
                  onClick={scrollToTools}
                  className="text-sm font-semibold text-white/70 hover:text-white transition-colors"
                >
                  or explore all eight tools ↓
                </button>
              </div>
            </div>

            {error && (
              <div className="anim-fade-in mt-3 flex items-start gap-2 text-left text-sm text-amber-200 bg-amber-400/10 border border-amber-300/30 rounded-xl px-4 py-3">
                <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 text-xs font-medium text-white/55">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> Files stay on this device
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UserX className="w-3.5 h-3.5 text-emerald-400" /> No sign-up
              </span>
              <span className="inline-flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5 text-emerald-400" /> Works offline after load
              </span>
            </div>
          </motion.div>
        </div>

        {/* Right: visual workspace mock */}
        <motion.div variants={fadeUp} className="px-2 sm:px-6 lg:px-0">
          <WorkspaceMock />
        </motion.div>
      </motion.div>
    </section>
  );
}
