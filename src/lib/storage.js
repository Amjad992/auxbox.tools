// Shared, framework-agnostic localStorage primitives.
// Used by every calculator/tool that persists state.

export function saveToLocalStorage(key, data, version) {
  if (typeof window === 'undefined') return false;
  try {
    const toStore = {version, timestamp: Date.now(), data};
    window.localStorage.setItem(key, JSON.stringify(toStore));
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
    throw error;
  }
}

/**
 * @returns {{data: any|null, wasCorrupted: boolean}}
 */
export function loadFromLocalStorage(key, version, validateFn) {
  if (typeof window === 'undefined') return {data: null, wasCorrupted: false};

  try {
    const item = window.localStorage.getItem(key);
    if (!item) return {data: null, wasCorrupted: false};

    const parsed = JSON.parse(item);

    if (parsed.version !== version) {
      console.warn(
        `Version mismatch for ${key}. Expected: ${version}, Got: ${parsed.version}`
      );
      window.localStorage.removeItem(key);
      return {data: null, wasCorrupted: true};
    }

    if (validateFn && !validateFn(parsed.data)) {
      console.warn(`Invalid data structure for ${key}`);
      window.localStorage.removeItem(key);
      return {data: null, wasCorrupted: true};
    }

    return {data: parsed.data, wasCorrupted: false};
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error);
    try {
      window.localStorage.removeItem(key);
    } catch (clearError) {
      console.error(`Error clearing corrupted data (${key}):`, clearError);
    }
    return {data: null, wasCorrupted: true};
  }
}

export function clearLocalStorage(key) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error clearing localStorage (${key}):`, error);
  }
}

export function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!kb.includes(k)) return false;
    if (!deepEqual(a[k], b[k])) return false;
  }
  return true;
}
