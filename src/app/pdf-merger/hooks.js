import {useCallback, useEffect, useRef, useState} from 'react';
import {validateAdditions, parsePageRange, reorder, mergedFilename} from './utils';
import {mergePdfs, parsePdfMetadata} from './pipeline';
import {ERR_CORRUPT} from './constants';

/**
 * Trigger a browser download for a Blob via a temporary anchor.
 * Returns the object URL so the caller can track and revoke it.
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return url;
}

let nextId = 1;
const makeId = () => `pdf-${nextId++}`;

/**
 * Tool-level hook for PDF Merger.
 *
 * State machine per file:
 *   parsing -> ready (success)
 *   parsing -> error (encrypted / corrupt)
 *
 * Merge state machine:
 *   idle -> merging -> success | error -> idle (next merge attempt)
 *
 * The hook deliberately holds raw `File` references — files are private,
 * never persisted, and live only for the page session.
 */
export function usePdfMerger() {
  const [files, setFiles] = useState([]);
  const [rejections, setRejections] = useState([]); // most recent batch only
  const [mergeStatus, setMergeStatus] = useState('idle'); // idle|merging|success|error
  const [mergeError, setMergeError] = useState(null);
  const [mergedCount, setMergedCount] = useState(0);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Track object URLs created for downloads so we can revoke them on unmount.
  const urlsRef = useRef(new Set());
  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      urls.forEach(URL.revokeObjectURL);
      urls.clear();
    };
  }, []);

  // Async parse on add. We read each file's bytes once and stash them on
  // the row so the Merge step doesn't re-read (PDFs can be 50 MB each).
  const parseRef = useRef({});
  const parseFile = useCallback(async (id, file) => {
    let buffer;
    try {
      buffer = await file.arrayBuffer();
    } catch (err) {
      if (!mountedRef.current) return;
      setFiles((prev) =>
        prev.map((it) =>
          it.id === id
            ? {...it, status: 'error', parseError: 'corrupt', errorMessage: ERR_CORRUPT}
            : it
        )
      );
      return;
    }
    const result = await parsePdfMetadata(buffer);
    if (!mountedRef.current) return;
    setFiles((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        if (result.error) {
          return {
            ...it,
            status: 'error',
            parseError: result.error,
            errorMessage: result.message,
          };
        }
        // Stash the buffer on the row so merge() doesn't re-read.
        return {
          ...it,
          status: 'ready',
          pageCount: result.pageCount,
          arrayBuffer: buffer,
        };
      })
    );
  }, []);

  const addFiles = useCallback(
    (fileList) => {
      if (!fileList || fileList.length === 0) return;
      const incoming = Array.from(fileList);
      setFiles((prev) => {
        const {accepted, rejected} = validateAdditions(prev, incoming);
        setRejections(rejected);
        const newRows = accepted.map((file) => {
          const id = makeId();
          // Schedule parse outside the setState callback so React doesn't
          // warn about updates during render.
          parseRef.current[id] = file;
          return {
            id,
            file,
            name: file.name || 'untitled.pdf',
            size: file.size,
            pageCount: null,
            pageRange: '',
            parseError: null,
            errorMessage: null,
            status: 'parsing',
            arrayBuffer: null,
          };
        });
        return [...prev, ...newRows];
      });
    },
    []
  );

  // Kick off parses for any files added since the last render.
  useEffect(() => {
    const pending = parseRef.current;
    parseRef.current = {};
    for (const [id, file] of Object.entries(pending)) {
      parseFile(id, file);
    }
  }, [files, parseFile]);

  const removeFile = useCallback((id) => {
    setFiles((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const moveFile = useCallback((fromIndex, toIndex) => {
    setFiles((prev) => reorder(prev, fromIndex, toIndex));
  }, []);

  const setPageRange = useCallback((id, value) => {
    setFiles((prev) =>
      prev.map((it) => (it.id === id ? {...it, pageRange: value} : it))
    );
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
    setRejections([]);
    setMergeStatus('idle');
    setMergeError(null);
  }, []);

  const dismissRejections = useCallback(() => {
    setRejections([]);
  }, []);

  /**
   * Run the merge and trigger a browser download. Surfaces any pdf-lib
   * failure as `mergeError`. The hook owns the object URL lifecycle.
   */
  const merge = useCallback(
    async () => {
      // Snapshot current files at call time.
      const snapshot = files;
      if (snapshot.length < 2) {
        setMergeError('Add at least 2 PDFs to merge.');
        setMergeStatus('error');
        return null;
      }
      if (snapshot.some((it) => it.status !== 'ready')) {
        setMergeError('All files must finish parsing before you can merge.');
        setMergeStatus('error');
        return null;
      }

      // Resolve each file's page selection (1-based string -> 0-based indices).
      const selections = [];
      for (const it of snapshot) {
        const r = parsePageRange(it.pageRange, it.pageCount);
        if (r.error) {
          setMergeError(`"${it.name}": ${r.error}`);
          setMergeStatus('error');
          return null;
        }
        if (r.indices.length === 0) {
          setMergeError(`"${it.name}": no pages selected.`);
          setMergeStatus('error');
          return null;
        }
        selections.push(r);
      }

      setMergeStatus('merging');
      setMergeError(null);
      try {
        const blob = await mergePdfs(
          snapshot.map((it) => ({arrayBuffer: it.arrayBuffer})),
          selections
        );
        if (!mountedRef.current) return blob;
        // Capture merged count from snapshot before any further state updates.
        setMergedCount(snapshot.length);
        try {
          const url = downloadBlob(blob, mergedFilename());
          urlsRef.current.add(url);
          // Defer revocation so the browser has a chance to start the download.
          setTimeout(() => {
            URL.revokeObjectURL(url);
            urlsRef.current.delete(url);
          }, 1000);
        } catch (err) {
          // Download trigger is best-effort; surface as merge error so the
          // user doesn't think the merge silently failed.
          if (mountedRef.current) {
            setMergeStatus('error');
            setMergeError('Merge succeeded but the download could not be started.');
          }
          return blob;
        }
        if (mountedRef.current) setMergeStatus('success');
        return blob;
      } catch (err) {
        if (!mountedRef.current) return null;
        setMergeStatus('error');
        setMergeError((err && err.message) || 'Failed to merge PDFs.');
        return null;
      }
    },
    [files]
  );

  // Per-file page-range validation (UI uses this to show inline errors and
  // to gate the Merge button).
  const fileRangeErrors = files.map((it) => {
    if (it.status !== 'ready') return null;
    const r = parsePageRange(it.pageRange, it.pageCount);
    return r.error || null;
  });

  const readyCount = files.filter((it) => it.status === 'ready').length;
  const anyParseError = files.some((it) => it.status === 'error');
  const anyRangeError = fileRangeErrors.some(Boolean);
  const anyParsing = files.some((it) => it.status === 'parsing');

  const canMerge =
    readyCount >= 2 &&
    !anyParseError &&
    !anyRangeError &&
    !anyParsing &&
    mergeStatus !== 'merging';

  return {
    files,
    rejections,
    fileRangeErrors,
    canMerge,
    mergeStatus,
    mergeError,
    mergedCount,
    addFiles,
    removeFile,
    moveFile,
    setPageRange,
    clearAll,
    dismissRejections,
    merge,
  };
}
