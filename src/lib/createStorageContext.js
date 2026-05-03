import {createContext, useContext, useState, useCallback, useMemo} from 'react';
import PropTypes from 'prop-types';
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
  deepEqual,
} from './storage';

/**
 * Build a Provider + hook for persisting one or more named slices of state.
 *
 * @param {Object} config
 * @param {string} config.version - Schema version, used by load/save.
 * @param {Array<{name: string, key: string, validate?: Function, getDefault?: Function}>} config.entries
 *   For each entry, the returned hook exposes `load{Name}`, `save{Name}`, `clear{Name}`.
 *   `getDefault()` is optional — if provided, saving data deep-equal to the default
 *   clears storage instead (matches the CGPA calculator's behavior).
 * @returns {{Provider: Function, useStorage: Function}}
 */
export function createStorageContext({version, entries}) {
  const Context = createContext(null);

  function Provider({children}) {
    const initialFlags = useMemo(() => {
      const errors = {};
      const saved = {};
      for (const e of entries) {
        errors[e.name] = null;
        saved[e.name] = false;
      }
      return {errors, saved};
    }, []);

    const [storageErrors, setStorageErrors] = useState(initialFlags.errors);
    const [hasSavedData, setHasSavedData] = useState(initialFlags.saved);

    const load = useCallback((entry) => {
      try {
        const {data, wasCorrupted} = loadFromLocalStorage(
          entry.key,
          version,
          entry.validate
        );

        if (wasCorrupted) {
          setStorageErrors((prev) => ({
            ...prev,
            [entry.name]: `Failed to load saved ${entry.name}`,
          }));
          setHasSavedData((prev) => ({...prev, [entry.name]: false}));
        } else if (data === null) {
          setHasSavedData((prev) => ({...prev, [entry.name]: false}));
        } else {
          setHasSavedData((prev) => ({...prev, [entry.name]: true}));
        }

        return data;
      } catch (error) {
        console.error(`Error loading ${entry.name}:`, error);
        setStorageErrors((prev) => ({
          ...prev,
          [entry.name]: `Failed to load saved ${entry.name}`,
        }));
        setHasSavedData((prev) => ({...prev, [entry.name]: false}));
        return null;
      }
    }, []);

    const save = useCallback((entry, data) => {
      try {
        // If a default is registered and the data matches it, drop the slot
        // instead of storing redundant defaults.
        if (entry.getDefault) {
          const defaults = entry.getDefault();
          if (deepEqual(data, defaults)) {
            clearLocalStorage(entry.key);
            setStorageErrors((prev) => ({...prev, [entry.name]: null}));
            setHasSavedData((prev) => ({...prev, [entry.name]: false}));
            return true;
          }
        }

        saveToLocalStorage(entry.key, data, version);
        setStorageErrors((prev) => ({...prev, [entry.name]: null}));
        setHasSavedData((prev) => ({...prev, [entry.name]: true}));
        return true;
      } catch (error) {
        setStorageErrors((prev) => ({
          ...prev,
          [entry.name]: error.message || `Failed to save ${entry.name}`,
        }));
        return false;
      }
    }, []);

    const clear = useCallback((entry) => {
      clearLocalStorage(entry.key);
      setStorageErrors((prev) => ({...prev, [entry.name]: null}));
      setHasSavedData((prev) => ({...prev, [entry.name]: false}));
    }, []);

    // Build the load/save/clear wrappers once. Their identity must NOT depend
    // on storageErrors / hasSavedData — consumers use them as useEffect deps,
    // and a new identity on every state change would loop indefinitely.
    const wrappers = useMemo(() => {
      const api = {};
      for (const entry of entries) {
        const Cap = entry.name.charAt(0).toUpperCase() + entry.name.slice(1);
        api[`load${Cap}`] = () => load(entry);
        api[`save${Cap}`] = (data) => save(entry, data);
        api[`clear${Cap}`] = () => clear(entry);
      }
      return api;
    }, [load, save, clear]);

    const value = useMemo(
      () => ({...wrappers, storageErrors, hasSavedData}),
      [wrappers, storageErrors, hasSavedData]
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  Provider.propTypes = {children: PropTypes.node.isRequired};

  function useStorage() {
    const ctx = useContext(Context);
    if (!ctx) {
      throw new Error('useStorage must be used within its StorageProvider');
    }
    return ctx;
  }

  return {Provider, useStorage};
}
