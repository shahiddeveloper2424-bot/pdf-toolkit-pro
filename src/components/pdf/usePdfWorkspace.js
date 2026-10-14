import { useCallback, useEffect, useRef, useState } from 'react';
import { loadPreviewDocument } from '../../lib/pdfPreview.js';

/**
 * Single-file PDF workspace: holds the File, its raw bytes, the PDF.js
 * document proxy (for real page rendering) and the page count.
 * Destroys the PDF.js document on clear/unmount so workers don't leak.
 */
export function usePdfWorkspace() {
  const [file, setFile] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const destroyRef = useRef(null);
  const loadToken = useRef(0);
  // destroyRef holds the teardown function returned by loadPreviewDocument
  // (which tears down the PDFDocumentLoadingTask — the supported cleanup
  // handle in current pdfjs-dist; PDFDocumentProxy itself has no destroy()
  // method). destroyDoc never throws: cleanup paths (unmount, rapid file
  // switches) must not crash the app. loadToken guards against overlapping
  // loads so a slow earlier file can't clobber a newer one.

  const destroyDoc = () => {
    const destroy = destroyRef.current;
    destroyRef.current = null;
    if (typeof destroy === 'function') destroy();
  };

  const loadFile = useCallback(async (f) => {
    const token = ++loadToken.current;
    destroyDoc();
    setFile(f);
    setPdfData(null);
    setPdfDoc(null);
    setPageCount(0);
    setError('');
    if (!f) return;
    setLoading(true);
    try {
      const buf = new Uint8Array(await f.arrayBuffer());
      const { doc, destroy } = await loadPreviewDocument(buf);
      if (token !== loadToken.current) {
        // A newer file was picked while this one loaded — tear it down
        // without touching state that now belongs to the newer load.
        destroy();
        return;
      }
      destroyRef.current = destroy;
      setPdfData(buf);
      setPdfDoc(doc);
      setPageCount(doc.numPages);
    } catch (e) {
      if (token === loadToken.current) setError(e.message);
    } finally {
      if (token === loadToken.current) setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    loadToken.current++;
    destroyDoc();
    setFile(null);
    setPdfData(null);
    setPdfDoc(null);
    setPageCount(0);
    setError('');
  }, []);

  useEffect(() => () => {
    loadToken.current++;
    destroyDoc();
  }, []);

  return { file, pdfData, pdfDoc, pageCount, loading, error, setError, loadFile, clear };
}
