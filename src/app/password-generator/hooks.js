import {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {DEFAULT_SETTINGS} from './constants';
import {
  generatePassword,
  buildAlphabets,
  estimateEntropyBits,
  strengthBucket,
} from './utils';
import {useStorageData} from './StorageContext';

/**
 * Drive the password generator: settings state, persistence, and generation.
 *
 * Persists settings to localStorage on change (debounced via useEffect).
 * NEVER persists the generated password.
 */
export function usePasswordGenerator() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const {loadSettings, saveSettings} = useStorageData();
  const loadedRef = useRef(false);

  // Load saved settings on mount.
  useEffect(() => {
    try {
      const loaded = loadSettings();
      if (loaded) setSettings(loaded);
    } catch (e) {
      console.error('Error loading password settings:', e);
    } finally {
      loadedRef.current = true;
    }
  }, [loadSettings]);

  // Persist settings whenever they change (after the initial load).
  useEffect(() => {
    if (!loadedRef.current) return;
    saveSettings(settings);
  }, [settings, saveSettings]);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({...prev, [key]: value}));
  }, []);

  const generate = useCallback(() => {
    try {
      setError(null);
      setPassword(generatePassword(settings));
    } catch (e) {
      setError(e.message || 'Failed to generate password');
      setPassword('');
    }
  }, [settings]);

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setPassword('');
    setError(null);
  }, []);

  // Derived: pool size, entropy, strength tier — based on current settings,
  // not the generated password (so the meter updates as the user toggles).
  const meter = useMemo(() => {
    const {pool} = buildAlphabets(settings);
    const bits = estimateEntropyBits(settings.length, pool.length);
    return {
      poolSize: pool.length,
      bits,
      strength: strengthBucket(bits),
    };
  }, [settings]);

  const hasAnyClass =
    settings.upper || settings.lower || settings.digits || settings.symbols;

  return {
    settings,
    password,
    error,
    meter,
    hasAnyClass,
    updateSetting,
    generate,
    reset,
  };
}

/**
 * Tiny tool-local copy-to-clipboard helper. Promotes to a shared hook
 * (`src/hooks/useCopyToClipboard`) once a second tool needs it.
 */
export async function copyToClipboard(text) {
  if (!text) return false;
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    // Fall through to the legacy fallback.
  }
  // Legacy fallback for older browsers / non-secure contexts.
  if (typeof document === 'undefined') return false;
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand && document.execCommand('copy');
    document.body.removeChild(ta);
    return !!ok;
  } catch (e) {
    return false;
  }
}
