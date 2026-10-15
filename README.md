# PDF Toolkit Pro

**Live demo:** https://pdf-toolkit-pro-shahiddeveloper2424-1108.vercel.app/

Eight professional PDF tools in the browser, with **real visual page previews**.
No backend, no database, no API keys, no AI APIs. All processing and page
rendering happens locally in the user's browser via `pdf-lib` (+ `jszip` for
multi-file split downloads) and PDF.js for true page thumbnails. Files never
leave the device.

Current build: commit `92f72cf` — Merge PDFs + Images, PDF Maker, Convert to
PDF, cross-tool handoff, and the design-first bento homepage.

## Stack

- React 19 + JavaScript only, Vite 6, Tailwind CSS v4
- `lucide-react` icons, `react-router-dom` routing
- `pdf-lib` (PDF engine), `pdfjs-dist` (real page rendering), `jszip` (split ZIP downloads)
- `motion` (`motion/react`) for interface animation, `mammoth` for .docx conversion (lazy-loaded, only when a Word file is converted)
- `@fontsource-variable/inter` (self-hosted font)

## Run it

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # production build → dist/
npm test         # 53 engine tests (Node, no browser needed)
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

## Tools (all fully functional, client-side)

PDF tools render the actual pages as thumbnails — click to select, zoom to
inspect. No typing page numbers blind. Every generated PDF offers **Download**
plus **Open in…** actions that hand the file straight into Merge, Split,
Rotate, Extract or Reorder without re-uploading.

| Route | What it does |
|---|---|
| `/tools/merge` | **Merge PDF & Images** — combine PDFs and JPG/PNG/WebP images in one ordered queue; every PDF page is kept, each image becomes one page at its exact queue position; image page size (A4/Letter/fit), orientation, fit mode, margins and background are adjustable |
| `/tools/pdf-maker` | **PDF Maker** — build a PDF from images only; preview, reorder, choose page settings, and name the output file |
| `/tools/convert` | **Convert to PDF** — images, `.txt`, `.html` and `.docx` (via mammoth) converted in-browser, keeping headings, paragraphs, lists, tables and embedded images as closely as possible; unsupported formats (`.doc`, `.xlsx`, `.pptx`, …) are refused with an honest, named error |
| `/tools/split` | Visually select pages → individual PDFs or one combined PDF (+ ZIP) |
| `/tools/extract` | Click pages in any order → new PDF with just those pages |
| `/tools/rotate` | Select pages, rotate 90°/180°/270° with live thumbnail preview |
| `/tools/reorder` | Select pages and move them as a block (or drag / use arrows), with undo and reset-to-original |
| `/tools/watermark` | Live watermark preview; text, size, opacity, rotation, color, position |

## Structure

```
src/
  main.jsx                 # entry point
  App.jsx                  # router + layout (tool pages lazy-loaded, MotionConfig)
  index.css                # Tailwind v4 theme (navy + warm paper surface, per-tool accents)
  lib/
    pdfEngine.js           # load/merge/split/extract/rotate/reorder/watermark/download
    pdfPreview.js          # PDF.js worker setup, DPR-sharp page rendering helpers
    pageRanges.js          # "1, 3, 5-8" parsing + validation (kept for split range input)
    imagePdf.js            # image → PDF pages (size/orientation/fit/margins/background)
    fileKinds.js           # file classification + image dimension header parsers
    docConvert.js          # .txt/.html/.docx → PDF text-layout engine (mammoth for .docx)
    fileHandoff.js         # in-memory per-tool file handoff between tools (nothing persisted)
    motionVariants.js      # shared Motion variants
  data/
    tools.js               # 8 tool definitions (slug, copy, icon, accent, how-to steps)
    faqs.js                # FAQ content
  components/
    Navbar.jsx / Hero.jsx / UploadZone.jsx / ToolCard.jsx / ToolsGrid.jsx
    HowItWorks.jsx / PrivacySection.jsx / Faq.jsx / Footer.jsx
    SectionHeading.jsx / ScrollToTop.jsx / ErrorBoundary.jsx
    files/
      DropZoneCard.jsx / QueueList.jsx / useFileQueue.js   # shared mixed-file queue
      ImageSettings.jsx                                    # image page settings panel
    pdf/
      usePdfWorkspace.js   # file → bytes + PDF.js doc + page count, with safe teardown
      usePageSelection.js  # ordered click selection
      PageThumbnail.jsx    # lazy-rendered real page thumbnail (select/zoom/rotate/drag)
      PageGrid.jsx         # selectable grid (1 col on mobile) + select-all controls
      PageZoomModal.jsx    # high-res page zoom with fit/zoom controls, pan, keyboard nav
    tools/
      shared.jsx           # Alert, Field, buttons, FileWarnings, GeneratedPdfActions
      MergeTool.jsx / PdfMakerTool.jsx / ConvertTool.jsx
      SplitTool.jsx / ExtractTool.jsx
      RotateTool.jsx / ReorderTool.jsx / WatermarkTool.jsx
  pages/
    Home.jsx               # landing page (split hero + 8-tool bento grid)
    ToolPage.jsx           # per-tool workspace page (/tools/:slug)
    NotFound.jsx
```

## Verified 2026-10-12 (commit `92f72cf`)

- `npm test` — **53/53** Node tests green, re-run 2026-10-12: all original tools
  plus mixed PDF+image merge order byte-verified, image page sizing, corrupt
  image rejection, file classification, .txt conversion and honest .pptx refusal.
- `npm run build` — clean production build (re-run 2026-10-12). Tool pages
  lazy-load; the mammoth chunk (~305 KB) loads only for .docx conversion.
- Browser E2E for this build — `verify-upgrade2` **20/20** and updated
  `verify-design` **20/20**: mixed-queue merge order in the downloaded PDF,
  PDF Maker orientation by image aspect, .txt + .docx conversion with output
  text verified, .xlsx refusal, Merge → Split handoff, mobile 375px with no
  horizontal overflow and 44px touch targets, zero JS errors.
- Mobile was verified in Chromium emulation only — no physical phone was
  available. Nothing in this section claims on-device testing.

## Limitations (stated honestly in the UI too)

- Processing happens in the browser's memory: files over ~50 MB trigger a
  warning, and very large PDFs may be slow or fail on low-RAM devices. No
  fixed limit is claimed.
- Password-protected PDFs must be unlocked first (pdf-lib cannot open them).
- .docx conversion is content-faithful, not pixel-faithful: complex Word
  layout (columns, text boxes, exact fonts) is simplified.
- .html conversion only embeds images that are embedded in the file itself
  (data URIs); linked images are counted and reported as skipped.
- WebP images are decoded via the browser Canvas; a browser that cannot
  decode WebP there will ask for JPG/PNG instead.
- Watermark placement assumes unrotated page geometry; pages with a
  pre-existing rotation may position the watermark oddly.
