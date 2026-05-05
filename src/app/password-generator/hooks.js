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
 * Persists settings to localStorage only on explicit user actions (updateSetting,
 * reset). Never writes on mount. NEVER persists the generated password.
 */
export function usePasswordGenerator() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const {loadSettings, saveSettings} = useStorageData();
  // pendingSaveRef holds the next settings value to persist. It is set by
  // updateSetting and reset to null after the effect commits. This avoids
  // calling saveSettings (which triggers StorageContext setState) inside
  // React's render or state-updater phase.
  const pendingSaveRef = useRef(null);
  // Guard so the auto-generate-on-mount effect fires exactly once.
  const didAutoGenerateRef = useRef(false);

  // Load saved settings on mount — does not trigger a save.
  useEffect(() => {
    try {
      const loaded = loadSettings();
      if (loaded) setSettings(loaded);
    } catch (e) {
      console.error('Error loading password settings:', e);
    } finally {
      setSettingsLoaded(true);
    }
  }, [loadSettings]);

  // Flush any pending save that was queued by updateSetting or reset.
  useEffect(() => {
    if (pendingSaveRef.current === null) return;
    saveSettings(pendingSaveRef.current);
    pendingSaveRef.current = null;
  });

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => {
      const next = {...prev, [key]: value};
      pendingSaveRef.current = next;
      return next;
    });
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

  // Auto-generate one password on first visit, after the load effect has
  // committed (so the auto-generate uses persisted settings if any, defaults
  // otherwise). Fires exactly once per mount.
  useEffect(() => {
    if (!settingsLoaded || didAutoGenerateRef.current) return;
    didAutoGenerateRef.current = true;
    generate();
  }, [settingsLoaded, generate]);

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    pendingSaveRef.current = DEFAULT_SETTINGS;
    setPassword('');
    setError(null);
  }, []);

  // Derived: pool size, entropy, strength tier — based on current settings,
  // not the generated password (so the meter updates as the user toggles).
  const meter = useMemo(() => {
    const {classes, pool} = buildAlphabets(settings);
    const classSizes = classes.map((c) => c.length);
    const bits = estimateEntropyBits(settings.length, pool.length, classSizes);
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
