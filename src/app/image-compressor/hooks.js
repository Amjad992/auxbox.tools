import {useCallback, useEffect, useRef, useState, useDeferredValue} from 'react';
import {
  DEFAULT_QUALITY,
  MAX_FILE_BYTES,
  SUPPORTED_INPUT_LABELS,
} from './constants';
import {formatBytes} from '../../lib/format';
import {
  buildOutputFilename,
  isSupportedInput,
  mimeForFile,
} from './utils';
import {compressImage} from './pipeline';

let nextId = 1;
const makeId = () => `img-${nextId++}`;

/**
 * Build a queued item from a File. Returns either a queued item or a
 * synthetic error item (so the user sees rejected files alongside accepted
 * ones, instead of files silently disappearing).
 */
function buildItem(file) {
  const mime = mimeForFile(file);
  const id = makeId();

  if (file.size > MAX_FILE_BYTES) {
    return {
      id,
      file,
      name: file.name || 'untitled',
      mime,
      originalSize: file.size,
      status: 'error',
      error: `File is larger than ${formatBytes(MAX_FILE_BYTES)} (max). This tool runs in your browser; oversized files would risk crashing the tab.`,
    };
  }

  if (!isSupportedInput(mime)) {
    return {
      id,
      file,
      name: file.name || 'untitled',
      mime,
      originalSize: file.size,
      status: 'error',
      error: `Unsupported format. Supported: ${SUPPORTED_INPUT_LABELS}.`,
    };
  }

  return {
    id,
    file,
    name: file.name || 'untitled',
    mime,
    originalSize: file.size,
    status: 'queued',
    error: null,
    outputBlob: null,
    outputUrl: null,
    outputName: null,
    outputMime: null,
    outputSize: null,
    outputWidth: null,
    outputHeight: null,
  };
}

/**
 * Tool-level hook: tracks the file list and runs the encode pipeline for
 * each queued item whenever options change. Encoding runs sequentially to
 * keep memory pressure predictable on the main thread (a worker upgrade
 * would change this; until then, sequential is the safe default).
 */
export function useImageCompressor() {
  const [items, setItems] = useState([]);
  const [quality, setQuality] = useState(DEFAULT_QUALITY);
  const [maxWidth, setMaxWidth] = useState('');
  const [maxHeight, setMaxHeight] = useState('');
  const [convertPngToWebp, setConvertPngToWebp] = useState(false);

  // Debounce dimension inputs (MIN-1): the deferred values are used only for
  // the encode opts and the reencode effect, not for the input display value.
  const deferredMaxWidth = useDeferredValue(maxWidth);
  const deferredMaxHeight = useDeferredValue(maxHeight);

  // BLK-1 fix: decouple the encode loop from `items` so that calling
  // setItems(... 'encoding') inside the effect does not re-trigger cleanup
  // (which would set `cancelled = true` before the await resolves). Instead:
  // - `encodeTick` is a counter that only goes up; the encode effect depends
  //   on it (not on `items`) so its cleanup only fires on genuine unmount or
  //   when a new tick is requested.
  // - `isEncodingRef` prevents concurrent runs.
  // - `itemsRef` gives the effect synchronous access to the latest items
  //   without adding `items` to the dep array.
  const [encodeTick, setEncodeTick] = useState(0);
  const isEncodingRef = useRef(false);
  const itemsRef = useRef([]);
  const mountedRef = useRef(true);

  // Keep itemsRef current on every render.
  itemsRef.current = items;

  // Track object URLs so we can revoke them on replace / unmount.
  const urlsRef = useRef(new Set());

  const registerUrl = useCallback((url) => {
    if (url) urlsRef.current.add(url);
  }, []);

  const revokeUrl = useCallback((url) => {
    if (url && urlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      urlsRef.current.delete(url);
    }
  }, []);

  // Revoke every outstanding object URL on unmount; mark component as gone.
  useEffect(() => {
    mountedRef.current = true;
    const urls = urlsRef.current;
    return () => {
      mountedRef.current = false;
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  const addFiles = useCallback((fileList) => {
    if (!fileList || fileList.length === 0) return;
    const incoming = Array.from(fileList).map(buildItem);
    setItems((prev) => [...prev, ...incoming]);
    setEncodeTick((t) => t + 1);
  }, []);

  const removeItem = useCallback(
    (id) => {
      setItems((prev) => {
        const target = prev.find((it) => it.id === id);
        if (target?.outputUrl) revokeUrl(target.outputUrl);
        return prev.filter((it) => it.id !== id);
      });
    },
    [revokeUrl]
  );

  const clearAll = useCallback(() => {
    setItems((prev) => {
      for (const it of prev) {
        if (it.outputUrl) revokeUrl(it.outputUrl);
      }
      return [];
    });
  }, [revokeUrl]);

  // Re-encode all currently queued / done items when options change.
  // We mark them queued again and bump encodeTick to wake the encode effect.
  const reencodeAll = useCallback(() => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.status === 'error') return it;
        if (it.outputUrl) revokeUrl(it.outputUrl);
        return {
          ...it,
          status: 'queued',
          error: null,
          outputBlob: null,
          outputUrl: null,
          outputName: null,
          outputMime: null,
          outputSize: null,
          outputWidth: null,
          outputHeight: null,
        };
      })
    );
    setEncodeTick((t) => t + 1);
  }, [revokeUrl]);

  // Whenever options change, mark non-error items as queued so they
  // re-encode with the new settings.
  // Use refs to detect "real" changes vs first mount.
  // deferredMaxWidth / deferredMaxHeight (MIN-1) are used here so keystroke
  // changes are batched by React's scheduler before triggering a reencode.
  const firstRunRef = useRef(true);
  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }
    reencodeAll();
  }, [quality, deferredMaxWidth, deferredMaxHeight, convertPngToWebp, reencodeAll]);

  // Sequential encode loop (BLK-1 fix).
  //
  // Previously the effect depended on `items`, so the synchronous
  // setItems(...'encoding') inside it triggered cleanup (cancelled=true)
  // before the awaited compressImage resolved — every encode silently aborted.
  //
  // Fix: the effect depends only on `encodeTick` (a monotonically increasing
  // counter bumped by addFiles / reencodeAll). `isEncodingRef` prevents
  // concurrent runs. `itemsRef` gives synchronous read access to the latest
  // items array without re-triggering the effect. `mountedRef` replaces the
  // per-effect `cancelled` flag for genuine unmount protection.
  useEffect(() => {
    async function runNext() {
      if (isEncodingRef.current) return;
      const queued = itemsRef.current.find((it) => it.status === 'queued');
      if (!queued) return;

      isEncodingRef.current = true;
      const idToEncode = queued.id;

      setItems((prev) =>
        prev.map((it) =>
          it.id === idToEncode ? {...it, status: 'encoding'} : it
        )
      );

      try {
        const opts = {
          quality,
          maxWidth: parseDim(deferredMaxWidth),
          maxHeight: parseDim(deferredMaxHeight),
          convertPngToWebp,
        };
        const {blob, width, height, mimeType} = await compressImage(
          queued.file,
          opts
        );
        if (!mountedRef.current) return;
        const url = URL.createObjectURL(blob);
        registerUrl(url);
        setItems((prev) =>
          prev.map((it) =>
            it.id === idToEncode
              ? {
                  ...it,
                  status: 'done',
                  outputBlob: blob,
                  outputUrl: url,
                  outputMime: mimeType,
                  outputName: buildOutputFilename(it.name, mimeType),
                  outputSize: blob.size,
                  outputWidth: width,
                  outputHeight: height,
                  error: null,
                }
              : it
          )
        );
      } catch (err) {
        if (!mountedRef.current) return;
        setItems((prev) =>
          prev.map((it) =>
            it.id === idToEncode
              ? {
                  ...it,
                  status: 'error',
                  error: err?.message || 'Failed to compress image.',
                }
              : it
          )
        );
      } finally {
        isEncodingRef.current = false;
        // After finishing (success or error), nudge the loop to pick up the
        // next queued item, if any.
        if (mountedRef.current) {
          setEncodeTick((t) => t + 1);
        }
      }
    }

    runNext();
    // This effect intentionally does NOT depend on `items`. The encode loop is
    // driven by `encodeTick` alone; options are read at call time via closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encodeTick]);

  return {
    items,
    quality,
    setQuality,
    maxWidth,
    setMaxWidth,
    maxHeight,
    setMaxHeight,
    convertPngToWebp,
    setConvertPngToWebp,
    addFiles,
    removeItem,
    clearAll,
  };
}

function parseDim(value) {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.floor(num);
}
