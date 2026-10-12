# PDF Toolkit Pro

Professional, sellable PDF tools website with **real visual page previews**.
No backend, no database, no API keys, no AI APIs. All processing and page
rendering happens locally via `pdf-lib` (+ `jszip` for multi-file split downloads)
and PDF.js for true page thumbnails.

## Stack

- React 19 + JavaScript only, Vite 6, Tailwind CSS v4
- `lucide-react` icons, `react-router-dom` routing
- `pdf-lib` (PDF engine), `pdfjs-dist` (real page rendering), `jszip` (split ZIP downloads)
- `@fontsource-variable/inter` (self-hosted font)

## Run it

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # production build → dist/
npm test         # 32 engine tests (Node, no browser needed)
```

## Deploy to GitHub + Vercel

The app is a static Vite frontend — no server, no environment variables needed.

**1. Push to GitHub** (from the project folder):

```bash
git init
git add .
git commit -m "PDF Toolkit Pro"
gh repo create pdf-toolkit-pro --public --source=. --push
```

No `gh` CLI? Create an empty repo at github.com/new, then:

```bash
git remote add origin https://github.com/YOUR-USERNAME/pdf-toolkit-pro.git
git branch -M main
git push -u origin main
```

**2. Deploy on Vercel:**

1. Go to vercel.com → **Add New… → Project → Import** your `pdf-toolkit-pro` repo.
2. Framework preset is auto-detected as **Vite**. Build command `npm run build`,
   output directory `dist` — leave the defaults.
3. Click **Deploy**. No environment variables are required.

`vercel.json` is already included so refreshing a nested URL like
`/tools/merge` serves `index.html` instead of a 404.

## Tools (all fully functional, client-side, visual page selection)

Every tool renders the actual PDF pages as thumbnails — click to select,
zoom to inspect. No typing page numbers blind.

| Route | What it does |
|---|---|
| `/tools/merge` | Merge 2+ PDFs in chosen order; per-file page preview strips |
| `/tools/split` | Visually select pages → individual PDFs or one combined PDF (+ ZIP) |
| `/tools/extract` | Click pages in any order → new PDF with just those pages |
| `/tools/rotate` | Select pages, rotate left/right 90° with live thumbnail preview |
| `/tools/reorder` | Drag thumbnails (or arrows) to reorder → new PDF |
| `/tools/watermark` | Live watermark preview; text, size, opacity, rotation, color, position |

## Structure

```
src/
  main.jsx                 # entry point
  App.jsx                  # router + layout (tool pages lazy-loaded)
  index.css                # Tailwind v4 theme (violet/blue on off-white)
  lib/
    pdfEngine.js           # load/merge/split/extract/rotate/reorder/watermark/download
    pdfPreview.js          # PDF.js worker setup, page rendering helpers
    pageRanges.js          # "1, 3, 5-8" parsing + validation (kept for split range input)
  data/
    tools.js               # 6 tool definitions (slug, copy, icon, how-to steps)
    faqs.js                # FAQ content
  components/
    Navbar.jsx / Hero.jsx / UploadZone.jsx / ToolCard.jsx / ToolsGrid.jsx
    HowItWorks.jsx / PrivacySection.jsx / Faq.jsx / Footer.jsx
    SectionHeading.jsx / ScrollToTop.jsx / ErrorBoundary.jsx
    pdf/
      usePdfWorkspace.js   # file → bytes + PDF.js doc + page count, with cleanup
      usePageSelection.js   # ordered click selection
      PageThumbnail.jsx    # lazy-rendered real page thumbnail (select/zoom/rotate/drag)
      PageGrid.jsx         # scrollable selectable grid + select-all controls
      PageZoomModal.jsx    # high-res page zoom with keyboard navigation
    tools/
      shared.jsx           # Alert, Field, buttons, FileLine, FileWarnings, usePdfFiles
      MergeTool.jsx / SplitTool.jsx / ExtractTool.jsx
      RotateTool.jsx / ReorderTool.jsx / WatermarkTool.jsx
  pages/
    Home.jsx               # landing page composition
    ToolPage.jsx           # per-tool workspace page (/tools/:slug)
    NotFound.jsx
```

## Verified 2026-10-11

- `npm run build` clean. Tool pages (pdf-lib + pdf.js + jszip) lazy-load, so the
  landing page ships ~296 KB raw / 93 KB gzip; the tool chunk (~1 MB raw /
  369 KB gzip) loads only when a tool is opened.
- `npm test` — 35/35 Node engine tests green (all 6 tools on generated PDFs,
  incl. per-page rotation maps and watermark colors).
- Headless-Chromium visual E2E — 21/21 checks green: real PDF.js thumbnails with
  document content, click-to-select (aria-pressed), zoom modal, extract (2 pages
  in click order), rotate (only page 2 at 90° in the downloaded PDF), reorder
  (visual order + download), watermark (live preview + valid download), split
  ZIP (2 correct PDFs), merge (preview strips + 5-page PDF), mobile layout,
  zero JS errors.

## Limitations (stated honestly in the UI too)

- Processing happens in the browser's memory: files over ~50 MB trigger a
  warning, and very large PDFs may be slow or fail on low-RAM devices. No
  fixed limit is claimed.
- Password-protected PDFs must be unlocked first (pdf-lib cannot open them).
- Watermark placement assumes unrotated page geometry; pages with a
  pre-existing rotation may position the watermark oddly.
