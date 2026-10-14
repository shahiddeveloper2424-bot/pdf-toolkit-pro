import { useCallback, useRef, useState } from 'react';

const keyOfFile = (f) => `${f.name}|${f.size}|${f.lastModified}`;
let idCounter = 0;
const nextId = () => `q${++idCounter}-${Date.now().toString(36)}`;

/**
 * Ordered multi-file queue shared by Merge, PDF Maker and Convert.
 *
 * - classify(file) returns a kind string, or null when unsupported.
 *   Rejected files are named in a notice — never silently skipped.
 * - Exact duplicates (same name+size+modified) are reported, not
 *   re-added — accidental double-picks stay visible to the user.
 * - Files can be added in repeated rounds; the queue only grows.
 * - Each item: { id, file, kind, meta, error } — meta is filled by the
 *   owning tool via setItemMeta (page counts, image dimensions…).
 */
export function useFileQueue({ classify, seedFiles } = {}) {
  const [items, setItems] = useState(() => {
    if (!seedFiles || seedFiles.length === 0) return [];
    return seedFiles
      .map((file) => {
        const kind = classify ? classify(file) : null;
        return kind ? { id: nextId(), file, kind, meta: null, error: '' } : null;
      })
      .filter(Boolean);
  });
  const [notice, setNotice] = useState('');
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const addFiles = useCallback(
    (incoming) => {
      const list = Array.from(incoming || []);
      if (list.length === 0) return;
      const notes = [];
      const seen = new Set(itemsRef.current.map((i) => keyOfFile(i.file)));
      const fresh = [];
      let dupes = 0;
      const rejected = [];
      for (const file of list) {
        const kind = classify ? classify(file) : null;
        if (!kind) {
          rejected.push(file.name);
          continue;
        }
        const k = keyOfFile(file);
        if (seen.has(k)) {
          dupes++;
          continue;
        }
        seen.add(k);
        fresh.push({ id: nextId(), file, kind, meta: null, error: '' });
      }
      if (rejected.length > 0) {
        notes.push(
          `Not added (unsupported type): ${rejected.join(', ')}.`,
        );
      }
      if (dupes > 0) {
        notes.push(
          `${dupes} duplicate file${dupes > 1 ? 's were' : ' was'} already in the list — not added again.`,
        );
      }
      setNotice(notes.join(' '));
      if (fresh.length > 0) setItems((prev) => [...prev, ...fresh]);
    },
    [classify],
  );

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    setNotice('');
  }, []);

  const moveItem = useCallback((id, direction) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      const target = idx + direction;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }, []);

  const reorderItem = useCallback((fromId, toId) => {
    setItems((prev) => {
      const from = prev.findIndex((i) => i.id === fromId);
      const to = prev.findIndex((i) => i.id === toId);
      if (from < 0 || to < 0 || from === to) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const setItemMeta = useCallback((id, patch) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, meta: { ...(i.meta || {}), ...patch } } : i,
      ),
    );
  }, []);

  const setItemError = useCallback((id, error) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, error } : i)));
  }, []);

  return {
    items,
    setItems,
    notice,
    setNotice,
    addFiles,
    removeItem,
    clearAll,
    moveItem,
    reorderItem,
    setItemMeta,
    setItemError,
  };
}
