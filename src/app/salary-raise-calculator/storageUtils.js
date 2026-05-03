// Salary-raise-specific storage keys, version, and validators.
// Generic primitives live in src/lib/storage.js.

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

export const STORAGE_KEYS = {
  STATE: 'salary_raise_calculator_state',
};

export const STORAGE_VERSION = '1.0.0';

export function validateRaiseState(data) {
  if (!data || typeof data !== 'object') return false;
  const validModes = ['percent', 'amount', null];
  return (
    typeof data.hpw === 'number' &&
    typeof data.beforeAnnual === 'number' &&
    validModes.includes(data.raiseMode) &&
    typeof data.raiseValue === 'number' &&
    typeof data.beforeSet === 'boolean' &&
    typeof data.raiseSet === 'boolean'
  );
}
