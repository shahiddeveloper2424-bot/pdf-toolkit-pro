import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { FileStack, Menu, X } from 'lucide-react';

const sectionLinks = [
  { label: 'Home', target: null },
  { label: 'All Tools', target: 'tools' },
  { label: 'How It Works', target: 'how-it-works' },
  { label: 'Privacy', target: 'privacy' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const goToSection = (target) => {
    setOpen(false);
    const scroll = (id) =>
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    if (target === null) {
      if (location.pathname !== '/') navigate('/');
      else window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => scroll(target), 80);
    } else {
      scroll(target);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-navy-950/95 backdrop-blur-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[68px] flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="PDF Toolkit Pro home">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center shadow-md shadow-brand-600/40">
            <FileStack className="w-5 h-5 text-white" />
          </span>
          <span className="text-lg font-bold text-white tracking-tight">
            PDF Toolkit <span className="text-brand-200">Pro</span>
          </span>
        </Link>

        {/* Center pill navigation — sits inside a single floating capsule */}
        <div className="hidden md:flex items-center gap-1 bg-white/[0.06] border border-white/10 rounded-full p-1.5">
          {sectionLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => goToSection(link.target)}
              className="text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.08] rounded-full px-4 py-1.5 transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="hidden md:block shrink-0">
          <button
            onClick={() => goToSection('tools')}
            className="text-sm font-semibold bg-white text-navy-950 px-5 py-2.5 rounded-full hover:bg-brand-100 active:scale-[0.98] shadow-md transition-all"
          >
            Get Started
          </button>
        </div>

        <button
          className="md:hidden p-2.5 text-white touch-manipulation"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Animated mobile menu (Motion height/opacity, closes on selection). */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden"
          >
            <div className="border-t border-white/10 px-4 py-3 space-y-1">
              {sectionLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => goToSection(link.target)}
                  className="block w-full text-left px-3 py-3 text-sm font-medium text-white/75 hover:bg-white/5 hover:text-white rounded-xl transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={() => goToSection('tools')}
                className="block w-full text-center mt-2 text-sm font-semibold bg-brand-600 text-white px-5 py-3 rounded-xl hover:bg-brand-700"
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
