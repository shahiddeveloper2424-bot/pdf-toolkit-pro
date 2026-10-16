import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { Loader2 } from 'lucide-react';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import SeoHead from './components/SeoHead.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';

// Tool pages (and the pdf-lib/jszip processing engine they use) load on
// demand so the landing page stays light.
const ToolPage = lazy(() => import('./pages/ToolPage.jsx'));

function PageLoader() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-28"
      role="status"
      aria-label="Loading tool"
    >
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <p className="text-sm text-zinc-500">Loading tool…</p>
    </div>
  );
}

export default function App() {
  return (
    // reducedMotion="user": Motion automatically drops transform/layout
    // animations when the OS asks for reduced motion.
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-surface">
        <ScrollToTop />
        <SeoHead />
        <Navbar />
        <div className="flex-1">
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/tools/:slug" element={<ToolPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </div>
        <Footer />
      </div>
    </MotionConfig>
  );
}
