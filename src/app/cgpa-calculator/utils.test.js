import { describe, it, expect } from 'vitest';
import {
  calculateSemesterGPA,
  calculateCGPA,
  getPerformanceLevel,
  getPerformanceBarWidth,
  validateGradePoints,
  generateUniqueGradeName,
  formatToDecimalPlaces,
} from './utils';
import { DEFAULT_GRADES } from './constants';

const grades = DEFAULT_GRADES;

describe('calculateSemesterGPA', () => {
  it('returns 0 GPA and 0 credits for an empty subject list', () => {
    const r = calculateSemesterGPA([], grades);
    expect(r).toEqual({ gpa: 0, totalCredits: 0 });
  });

  it('treats subjects with no credit hours as zero contribution', () => {
    const r = calculateSemesterGPA(
      [{ creditHours: '', grade: 'A' }],
      grades
    );
    expect(r).toEqual({ gpa: 0, totalCredits: 0 });
  });

  it('treats unknown grades as 0 grade points', () => {
    const r = calculateSemesterGPA(
      [{ creditHours: '3', grade: 'NOT_A_REAL_GRADE' }],
      grades
    );
    expect(r.gpa).toBe(0);
    expect(r.totalCredits).toBe(3);
  });

  it('computes a weighted average across mixed grades', () => {
    // 3 cr A+ (4.0) + 2 cr B (3.0) = (12 + 6) / 5 = 3.6
    const r = calculateSemesterGPA(
      [
        { creditHours: '3', grade: 'A+' },
        { creditHours: '2', grade: 'B' },
      ],
      grades
    );
    expect(r.totalCredits).toBe(5);
    expect(r.gpa).toBeCloseTo(3.6, 5);
  });

  it('accepts numeric and string credit hours equivalently', () => {
    const a = calculateSemesterGPA([{ creditHours: 3, grade: 'A' }], grades);
    const b = calculateSemesterGPA([{ creditHours: '3', grade: 'A' }], grades);
    expect(a).toEqual(b);
  });
});

describe('calculateCGPA', () => {
  it('returns 0 for no semesters', () => {
    const r = calculateCGPA([], grades);
    expect(r.cgpa).toBe(0);
    expect(r.totalCredits).toBe(0);
    expect(r.semesterStats).toEqual([]);
  });

  it('returns 0 when all semesters have zero credits', () => {
    const r = calculateCGPA(
      [{ subjects: [{ creditHours: '', grade: '' }] }],
      grades
    );
    expect(r.cgpa).toBe(0);
    expect(r.totalCredits).toBe(0);
  });

  it('aggregates credits across semesters and produces per-semester stats', () => {
    const semesters = [
      { subjects: [{ creditHours: '3', grade: 'A+' }] }, // 3 * 4.0 = 12
      { subjects: [{ creditHours: '3', grade: 'B' }] },  // 3 * 3.0 = 9
    ];
    const r = calculateCGPA(semesters, grades);
    expect(r.totalCredits).toBe(6);
    expect(r.cgpa).toBeCloseTo(3.5, 5);
    expect(r.semesterStats).toHaveLength(2);
    expect(r.semesterStats[0].gpa).toBeCloseTo(4.0, 5);
    expect(r.semesterStats[1].gpa).toBeCloseTo(3.0, 5);
  });
});

describe('getPerformanceLevel', () => {
  it('returns the no-data label when totalCredits is 0', () => {
    expect(getPerformanceLevel(3.5, 0)).toBe('No data entered yet');
  });

  it.each([
    [4.0, 'Excellent'],
    [3.5, 'Excellent'],
    [3.49, 'Very Good'],
    [3.0, 'Very Good'],
    [2.99, 'Good'],
    [2.5, 'Good'],
    [2.49, 'Satisfactory'],
    [2.0, 'Satisfactory'],
    [1.99, 'Poor'],
    [1.0, 'Poor'],
    [0.5, 'Fail'],
    [0, 'Fail'],
  ])('cgpa=%s -> %s', (cgpa, label) => {
    expect(getPerformanceLevel(cgpa, 1)).toBe(label);
  });
});

describe('getPerformanceBarWidth', () => {
  it('clamps below 0 to 0', () => {
    expect(getPerformanceBarWidth(-1)).toBe(0);
  });

  it('clamps above max to 100', () => {
    expect(getPerformanceBarWidth(5)).toBe(100);
  });

  it('linearly maps cgpa to a percentage', () => {
    expect(getPerformanceBarWidth(0)).toBe(0);
    expect(getPerformanceBarWidth(2)).toBe(50);
    expect(getPerformanceBarWidth(4)).toBe(100);
  });
});

describe('validateGradePoints', () => {
  it('treats empty/null/undefined as 0', () => {
    expect(validateGradePoints('')).toBe(0);
    expect(validateGradePoints(null)).toBe(0);
    expect(validateGradePoints(undefined)).toBe(0);
  });

  it('treats non-numeric strings as 0', () => {
    expect(validateGradePoints('hi')).toBe(0);
    expect(validateGradePoints('NaN')).toBe(0);
  });

  it('clamps below min and above max', () => {
    expect(validateGradePoints(-1)).toBe(0);
    expect(validateGradePoints(99)).toBe(8);
  });

  it('respects custom min/max bounds', () => {
    expect(validateGradePoints(5, 1, 4)).toBe(4);
    expect(validateGradePoints(0, 1, 4)).toBe(1);
  });

  it('parses numeric strings', () => {
    expect(validateGradePoints('3.5')).toBe(3.5);
  });
});

describe('generateUniqueGradeName', () => {
  it('returns the base name when not present', () => {
    expect(generateUniqueGradeName({})).toBe('New');
    expect(generateUniqueGradeName({}, 'Custom')).toBe('Custom');
  });

  it('appends an incrementing counter to avoid collisions', () => {
    expect(generateUniqueGradeName({ New: 0 })).toBe('New1');
    expect(generateUniqueGradeName({ New: 0, New1: 0 })).toBe('New2');
    expect(generateUniqueGradeName({ A: 1, B: 2, C: 3 })).toBe('New');
  });
});

describe('formatToDecimalPlaces', () => {
  it('defaults to 2 decimals', () => {
    expect(formatToDecimalPlaces(3.4567)).toBe('3.46');
  });

  it('respects custom decimal counts', () => {
    expect(formatToDecimalPlaces(3.4567, 0)).toBe('3');
    expect(formatToDecimalPlaces(3.4567, 4)).toBe('3.4567');
  });

  it('rounds half-away-from-zero per toFixed semantics', () => {
    expect(formatToDecimalPlaces(0)).toBe('0.00');
  });
});
