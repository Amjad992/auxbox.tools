import { describe, it, expect } from 'vitest';
import {
  validateGradesData,
  validateSemestersData,
  STORAGE_KEYS,
  STORAGE_VERSION,
} from './storageUtils';

describe('CGPA storage constants', () => {
  it('exposes the expected keys', () => {
    expect(STORAGE_KEYS.CUSTOM_GRADES).toBe('cgpa_calculator_custom_grades');
    expect(STORAGE_KEYS.SEMESTERS_DATA).toBe('cgpa_calculator_semesters');
  });

  it('exposes a version string', () => {
    expect(typeof STORAGE_VERSION).toBe('string');
    expect(STORAGE_VERSION.length).toBeGreaterThan(0);
  });
});

describe('validateGradesData', () => {
  it('accepts a non-empty grade map with numeric points in [0,8]', () => {
    expect(validateGradesData({ A: 4, B: 3, F: 0 })).toBe(true);
    expect(validateGradesData({ X: 8 })).toBe(true);
  });

  it.each([
    null,
    undefined,
    'not-an-object',
    [],
    [{ A: 4 }],
  ])('rejects non-object input: %p', (input) => {
    expect(validateGradesData(input)).toBe(false);
  });

  it('rejects an empty object', () => {
    expect(validateGradesData({})).toBe(false);
  });

  it('rejects entries whose value is not a number', () => {
    expect(validateGradesData({ A: '4' })).toBe(false);
    expect(validateGradesData({ A: null })).toBe(false);
  });

  it('rejects entries out of [0,8]', () => {
    expect(validateGradesData({ A: -1 })).toBe(false);
    expect(validateGradesData({ A: 9 })).toBe(false);
  });

  it('rejects empty-string keys', () => {
    expect(validateGradesData({ '': 4 })).toBe(false);
  });
});

describe('validateSemestersData', () => {
  const valid = [
    {
      id: 's1',
      name: 'Sem 1',
      subjects: [{ name: 'Math', creditHours: '3', grade: 'A' }],
    },
  ];

  it('accepts a valid shape', () => {
    expect(validateSemestersData(valid)).toBe(true);
  });

  it('accepts numeric creditHours as well as string', () => {
    expect(
      validateSemestersData([
        {
          id: 's1',
          name: 'Sem',
          subjects: [{ name: 'X', creditHours: 3, grade: 'A' }],
        },
      ])
    ).toBe(true);
  });

  it.each([
    null,
    undefined,
    {},
    'string',
    [],
  ])('rejects non-array / empty input: %p', (input) => {
    expect(validateSemestersData(input)).toBe(false);
  });

  it('rejects a semester missing id', () => {
    expect(
      validateSemestersData([
        { name: 'S', subjects: [{ name: 'M', creditHours: '3', grade: 'A' }] },
      ])
    ).toBe(false);
  });

  it('rejects a semester whose name is not a string', () => {
    expect(
      validateSemestersData([
        {
          id: 's',
          name: 5,
          subjects: [{ name: 'M', creditHours: '3', grade: 'A' }],
        },
      ])
    ).toBe(false);
  });

  it('rejects a semester with no subjects', () => {
    expect(
      validateSemestersData([{ id: 's', name: 'S', subjects: [] }])
    ).toBe(false);
  });

  it('rejects a subject with non-string name', () => {
    expect(
      validateSemestersData([
        {
          id: 's',
          name: 'S',
          subjects: [{ name: 5, creditHours: '3', grade: 'A' }],
        },
      ])
    ).toBe(false);
  });

  it('rejects a subject whose creditHours is neither string nor number', () => {
    expect(
      validateSemestersData([
        {
          id: 's',
          name: 'S',
          subjects: [{ name: 'M', creditHours: null, grade: 'A' }],
        },
      ])
    ).toBe(false);
  });

  it('rejects a subject with non-string grade', () => {
    expect(
      validateSemestersData([
        {
          id: 's',
          name: 'S',
          subjects: [{ name: 'M', creditHours: '3', grade: 4 }],
        },
      ])
    ).toBe(false);
  });
});
