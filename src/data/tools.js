import {
  Files,
  Scissors,
  FileOutput,
  RotateCw,
  ArrowUpDown,
  Stamp,
  ImagePlus,
  FileUp,
} from 'lucide-react';

/**
 * Tool catalogue for PDF Toolkit Pro.
 *
 * `multiple` controls whether the tool's upload zone accepts more than one
 * file. `step2` is the honest roadmap note shown on each tool page until the
 * real processing engine lands in Step 2.
 */
export const tools = [
  {
    slug: 'merge',
    name: 'Merge PDF & Images',
    tagline: 'Combine PDFs and images into a single document, in your order.',
    description:
      'Select PDFs, images, or a mixture of both, arrange them in one ordered list, and create a single PDF that follows exactly that sequence.',
    icon: Files,
    accentSoft: 'bg-violet-50 border-violet-100',
    accentSolid: 'bg-violet-600',
    accentText: 'text-violet-700',
    accentGradient: 'from-violet-600 to-blue-600',
    accentHoverBorder: 'group-hover:border-violet-300',
    multiple: true,
    step2: 'Step 2 will add drag-to-reorder merging and one-click download of the combined file.',
    howTo: [
      'Add PDFs and images below — in any mixture.',
      'Drag or use the arrows to arrange the exact order.',
      'Tune the image page settings, then Create Merged PDF.'
    ],
  },
  {
    slug: 'pdf-maker',
    name: 'PDF Maker',
    tagline: 'Create a PDF from your images — no PDF file needed.',
    description:
      'Select multiple JPG, PNG or WebP images, preview and reorder them, choose page size, orientation, fit and margins, and generate a real PDF you can name.',
    icon: ImagePlus,
    accentSoft: 'bg-emerald-50 border-emerald-100',
    accentSolid: 'bg-emerald-600',
    accentText: 'text-emerald-700',
    accentGradient: 'from-emerald-600 to-teal-500',
    accentHoverBorder: 'group-hover:border-emerald-300',
    multiple: true,
    howTo: [
      'Add your images below — as many rounds as you like.',
      'Reorder them and choose page size, fit and margins.',
      'Name the output and create your PDF.'
    ],
  },
  {
    slug: 'convert',
    name: 'Convert to PDF',
    tagline: 'Turn images, text, HTML and Word files into PDFs.',
    description:
      'Convert supported non-PDF documents into PDFs, entirely in your browser: JPG/PNG/WebP images, plain text (.txt), HTML files and Word (.docx) documents with headings, tables and images kept as closely as possible.',
    icon: FileUp,
    accentSoft: 'bg-orange-50 border-orange-100',
    accentSolid: 'bg-orange-500',
    accentText: 'text-orange-700',
    accentGradient: 'from-orange-500 to-rose-500',
    accentHoverBorder: 'group-hover:border-orange-300',
    multiple: true,
    howTo: [
      'Add supported files: images, .txt, .html or .docx.',
      'Check the list — unsupported formats are refused honestly.',
      'Convert and download each PDF, or open it in another tool.'
    ],
  },
  {
    slug: 'split',
    name: 'Split PDF',
    tagline: 'Split one PDF into separate files.',
    description:
      'Break a single PDF apart — split by page ranges or extract every page into its own file.',
    icon: Scissors,
    accentSoft: 'bg-rose-50 border-rose-100',
    accentSolid: 'bg-rose-600',
    accentText: 'text-rose-700',
    accentGradient: 'from-rose-600 to-orange-500',
    accentHoverBorder: 'group-hover:border-rose-300',
    multiple: false,
    step2: 'Step 2 will add page-range selection and split previews.',
    howTo: [
      'Add your PDF and see all its pages.',
      'Click pages to select them, then pick a split mode.',
      'Download the files individually, or all as a ZIP.'
    ],
  },
  {
    slug: 'extract',
    name: 'Extract Pages',
    tagline: 'Pull selected pages out of a PDF.',
    description:
      'Pick the pages you need from a PDF and save them as a brand-new document.',
    icon: FileOutput,
    accentSoft: 'bg-emerald-50 border-emerald-100',
    accentSolid: 'bg-emerald-600',
    accentText: 'text-emerald-700',
    accentGradient: 'from-emerald-600 to-teal-500',
    accentHoverBorder: 'group-hover:border-emerald-300',
    multiple: false,
    step2: 'Step 2 will add a visual page picker with thumbnails.',
    howTo: [
      'Add your PDF and see all its pages.',
      'Click pages to select them, in any order you like.',
      'Download the new PDF with just those pages.'
    ],
  },
  {
    slug: 'rotate',
    name: 'Rotate PDF',
    tagline: 'Rotate pages to the correct orientation.',
    description:
      'Fix sideways or upside-down pages by rotating all pages — or just the ones you select.',
    icon: RotateCw,
    accentSoft: 'bg-amber-50 border-amber-100',
    accentSolid: 'bg-amber-500',
    accentText: 'text-amber-700',
    accentGradient: 'from-amber-500 to-orange-600',
    accentHoverBorder: 'group-hover:border-amber-300',
    multiple: false,
    step2: 'Step 2 will add per-page rotation controls with live preview.',
    howTo: [
      'Add your PDF and see all its pages.',
      'Select pages, then rotate left or right — previewed live.',
      'Download the rotated PDF.'
    ],
  },
  {
    slug: 'reorder',
    name: 'Reorder Pages',
    tagline: 'Rearrange pages in any order.',
    description:
      'Drag pages into the perfect sequence and save the reordered document.',
    icon: ArrowUpDown,
    accentSoft: 'bg-blue-50 border-blue-100',
    accentSolid: 'bg-blue-600',
    accentText: 'text-blue-700',
    accentGradient: 'from-blue-600 to-cyan-500',
    accentHoverBorder: 'group-hover:border-blue-300',
    multiple: false,
    step2: 'Step 2 will add drag-and-drop page thumbnails for reordering.',
    howTo: [
      'Add your PDF and see all its pages.',
      'Drag thumbnails — or use the arrows — to reorder.',
      'Download the reordered PDF.'
    ],
  },
  {
    slug: 'watermark',
    name: 'Add Watermark',
    tagline: 'Stamp text across your PDF pages.',
    description:
      'Overlay a custom text watermark — like “DRAFT” or “CONFIDENTIAL” — on every page of your PDF.',
    icon: Stamp,
    accentSoft: 'bg-fuchsia-50 border-fuchsia-100',
    accentSolid: 'bg-fuchsia-600',
    accentText: 'text-fuchsia-700',
    accentGradient: 'from-fuchsia-600 to-violet-600',
    accentHoverBorder: 'group-hover:border-fuchsia-300',
    multiple: false,
    step2: 'Step 2 will add watermark text, opacity and position controls.',
    howTo: [
      'Add your PDF and preview the watermark live.',
      'Tune text, size, opacity, rotation, color and position.',
      'Download the watermarked PDF.'
    ],
  },
];

export function getTool(slug) {
  return tools.find((t) => t.slug === slug);
}
