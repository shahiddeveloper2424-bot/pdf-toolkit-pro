/**
 * In-memory file handoff between tools and pages.
 *
 * Generated PDFs (from PDF Maker / Convert to PDF) and files picked in
 * the hero are passed to a target tool through here: the sender stores
 * the files under the tool's slug, navigates, and the tool consumes them
 * once on mount. Files are held only in memory — never in localStorage
 * and never uploaded anywhere. Closing the tab clears them.
 */
const store = new Map();

export function setHandoffFiles(toolSlug, files) {
  store.set(toolSlug, Array.from(files || []));
}

export function takeHandoffFiles(toolSlug) {
  const files = store.get(toolSlug) || [];
  store.delete(toolSlug);
  return files;
}

export function hasHandoffFiles(toolSlug) {
  return (store.get(toolSlug) || []).length > 0;
}
