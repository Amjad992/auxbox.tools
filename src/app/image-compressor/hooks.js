import {useCallback, useEffect, useRef, useState} from 'react';
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

  // Revoke every outstanding object URL on unmount.
  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  const addFiles = useCallback((fileList) => {
    if (!fileList || fileList.length === 0) return;
    const incoming = Array.from(fileList).map(buildItem);
    setItems((prev) => [...prev, ...incoming]);
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
  // We mark them queued again and let the encode effect pick them up.
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
  }, [revokeUrl]);

  // Whenever options change, mark non-error items as queued so they
  // re-encode with the new settings.
  // Use refs to detect "real" changes vs first mount.
  const firstRunRef = useRef(true);
  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }
    reencodeAll();
  }, [quality, maxWidth, maxHeight, convertPngToWebp, reencodeAll]);

  // Sequential encode loop. Watches for the first 'queued' item and runs it.
  useEffect(() => {
    const queued = items.find((it) => it.status === 'queued');
    if (!queued) return;

    let cancelled = false;
    const idToEncode = queued.id;

    setItems((prev) =>
      prev.map((it) =>
        it.id === idToEncode ? {...it, status: 'encoding'} : it
      )
    );

    (async () => {
      try {
        const opts = {
          quality,
          maxWidth: parseDim(maxWidth),
          maxHeight: parseDim(maxHeight),
          convertPngToWebp,
        };
        const {blob, width, height, mimeType} = await compressImage(
          queued.file,
          opts
        );
        if (cancelled) return;
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
        if (cancelled) return;
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
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [items, quality, maxWidth, maxHeight, convertPngToWebp, registerUrl]);

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
