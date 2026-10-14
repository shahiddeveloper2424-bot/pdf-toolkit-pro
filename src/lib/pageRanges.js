/**
 * Parsing and validation for user-entered page selections.
 * All page numbers are 1-based, matching what users see.
 */

/**
 * Parse "1, 3, 5-8" into a flat page list, preserving the requested order.
 * Returns { pages: number[] | null, error: string | null }.
 */
export function parsePageList(input, pageCount) {
  const segments = splitSegments(input);
  if (segments.error) return { pages: null, error: segments.error };

  const pages = [];
  for (const seg of segments.list) {
    if (seg.type === 'single') {
      const p = seg.page;
      if (p < 1 || p > pageCount) {
        return {
          pages: null,
          error: `Page ${p} is out of range — this PDF has ${pageCount} page${pageCount === 1 ? '' : 's'}.`,
        };
      }
      pages.push(p);
    } else {
      if (seg.start > seg.end) {
        return {
          pages: null,
          error: `Invalid range "${seg.raw}" — the first page must come before the last.`,
        };
      }
      if (seg.start < 1 || seg.end > pageCount) {
        return {
          pages: null,
          error: `Range "${seg.raw}" is out of range — this PDF has ${pageCount} page${pageCount === 1 ? '' : 's'}.`,
        };
      }
      for (let p = seg.start; p <= seg.end; p++) pages.push(p);
    }
  }
  if (pages.length === 0) {
    return { pages: null, error: 'Enter at least one page, e.g. 1, 3, 5-8.' };
  }
  return { pages, error: null };
}

/**
 * Parse "1-3, 5-7" into ranges. Single numbers become { start: n, end: n }.
 * Returns { ranges: [{ start, end }] | null, error: string | null }.
 */
export function parsePageRanges(input, pageCount) {
  const segments = splitSegments(input);
  if (segments.error) return { ranges: null, error: segments.error };

  const ranges = [];
  for (const seg of segments.list) {
    const start = seg.type === 'single' ? seg.page : seg.start;
    const end = seg.type === 'single' ? seg.page : seg.end;
    if (seg.type === 'range' && seg.start > seg.end) {
      return {
        ranges: null,
        error: `Invalid range "${seg.raw}" — the first page must come before the last.`,
      };
    }
    if (start < 1 || end > pageCount) {
      return {
        ranges: null,
        error: `Range "${seg.raw}" is out of range — this PDF has ${pageCount} page${pageCount === 1 ? '' : 's'}.`,
      };
    }
    ranges.push({ start, end });
  }
  if (ranges.length === 0) {
    return { ranges: null, error: 'Enter at least one range, e.g. 1-3, 5-7.' };
  }
  return { ranges, error: null };
}

/**
 * Validate a reorder list: must contain every page 1..pageCount exactly once.
 * Returns an error string, or null when valid.
 */
export function validateReorderList(pages, pageCount) {
  if (pages.length !== pageCount) {
    return `List all ${pageCount} pages exactly once — you entered ${pages.length} number${pages.length === 1 ? '' : 's'}.`;
  }
  const seen = new Set();
  for (const p of pages) {
    if (p < 1 || p > pageCount) {
      return `Page ${p} is out of range — this PDF has ${pageCount} pages.`;
    }
    if (seen.has(p)) {
      return `Page ${p} appears more than once — each page must appear exactly once.`;
    }
    seen.add(p);
  }
  return null;
}

function splitSegments(input) {
  const raw = (input || '').trim();
  if (!raw) {
    return { list: null, error: 'Enter page numbers first, e.g. 1, 3, 5-8.' };
  }
  const list = [];
  const parts = raw.split(',');
  for (const part of parts) {
    const token = part.trim();
    if (!token) continue;
    const rangeMatch = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      list.push({
        type: 'range',
        start: parseInt(rangeMatch[1], 10),
        end: parseInt(rangeMatch[2], 10),
        raw: token,
      });
      continue;
    }
    if (/^\d+$/.test(token)) {
      list.push({ type: 'single', page: parseInt(token, 10), raw: token });
      continue;
    }
    return {
      list: null,
      error: `"${token}" isn't valid — use numbers like 1, 3 or ranges like 5-8, separated by commas.`,
    };
  }
  if (list.length === 0) {
    return { list: null, error: 'Enter page numbers first, e.g. 1, 3, 5-8.' };
  }
  return { list, error: null };
}
