import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getTool } from '../data/tools.js';

const SITE = 'https://pdf-toolkit-pro-shahiddeveloper2424-1108.vercel.app';
const HOME_TITLE = 'PDF Toolkit Pro — Work with PDFs, privately';
const HOME_DESC =
  'PDF Toolkit Pro — 8 free PDF tools that run entirely in your browser: merge PDFs & images, split, extract, rotate, reorder, watermark, make PDFs from images, convert Word & text to PDF. Private, no sign-up, no uploads.';

function upsertMeta(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Keeps document title, meta description and canonical URL in sync with the
 * current route. Googlebot renders JavaScript, so these JS-injected tags are
 * picked up on crawl. (Social-media scrapers read only the static tags in
 * index.html, which describe the homepage.)
 */
export default function SeoHead() {
  const { pathname } = useLocation();

  useEffect(() => {
    let title = HOME_TITLE;
    let desc = HOME_DESC;
    let canonical = `${SITE}/`;

    // Derive the tool slug from the path (this component sits above <Routes>,
    // so useParams() would always be empty here).
    const match = pathname.match(/^\/tools\/([a-z-]+)\/?$/);
    const tool = match ? getTool(match[1]) : null;
    if (tool) {
      title = `${tool.name} — PDF Toolkit Pro`;
      desc = `${tool.name}: ${tool.tagline} Free, private, runs entirely in your browser — no sign-up, no uploads.`;
      canonical = `${SITE}/tools/${tool.slug}`;
    } else if (pathname !== '/') {
      title = 'Page not found — PDF Toolkit Pro';
      desc = HOME_DESC;
      canonical = `${SITE}/`;
    }

    document.title = title;
    upsertMeta('description', desc);
    upsertCanonical(canonical);
  }, [pathname]);

  return null;
}
