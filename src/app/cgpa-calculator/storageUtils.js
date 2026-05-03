// CGPA-specific storage keys, version, and validators.
// Generic primitives live in src/lib/storage.js.

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

export const STORAGE_KEYS = {
  CUSTOM_GRADES: 'cgpa_calculator_custom_grades',
  SEMESTERS_DATA: 'cgpa_calculator_semesters',
};

export const STORAGE_VERSION = '1.0.0';

export function validateGradesData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;

  const entries = Object.entries(data);
  if (entries.length === 0) return false;

  return entries.every(([key, value]) => {
    return (
      typeof key === 'string' &&
      key.length > 0 &&
      typeof value === 'number' &&
      value >= 0 &&
      value <= 8
    );
  });
}

export function validateSemestersData(data) {
  if (!Array.isArray(data) || data.length === 0) return false;

  return data.every((semester) => {
    if (
      !semester ||
      typeof semester !== 'object' ||
      !semester.id ||
      typeof semester.name !== 'string' ||
      !Array.isArray(semester.subjects) ||
      semester.subjects.length === 0
    ) {
      return false;
    }

    return semester.subjects.every((subject) => {
      return (
        subject &&
        typeof subject === 'object' &&
        typeof subject.name === 'string' &&
        (typeof subject.creditHours === 'string' ||
          typeof subject.creditHours === 'number') &&
        typeof subject.grade === 'string'
      );
    });
  });
}
