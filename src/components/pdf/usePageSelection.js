import { useMemo, useState } from 'react';

/**
 * Ordered page selection: keeps click order (for extract/split),
 * exposes a Set for fast membership checks.
 */
export function usePageSelection() {
  const [order, setOrder] = useState([]);

  const selected = useMemo(() => new Set(order), [order]);

  const toggle = (page) => {
    setOrder((prev) =>
      prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page],
    );
  };

  const selectAll = (pageCount) => {
    setOrder(Array.from({ length: pageCount }, (_, i) => i + 1));
  };

  const deselectAll = () => setOrder([]);

  const reset = () => setOrder([]);

  return { order, selected, toggle, selectAll, deselectAll, reset };
}
