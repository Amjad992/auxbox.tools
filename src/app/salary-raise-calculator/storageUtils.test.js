import { describe, it, expect } from 'vitest';
import {
  validateRaiseState,
  STORAGE_KEYS,
  STORAGE_VERSION,
} from './storageUtils';

const valid = {
  hpw: 40,
  beforeAnnual: 50000,
  raiseMode: 'percent',
  raiseValue: 5,
  beforeSet: true,
  raiseSet: true,
};

describe('salary-raise storage constants', () => {
  it('exposes a STATE key', () => {
    expect(STORAGE_KEYS.STATE).toBe('salary_raise_calculator_state');
  });
  it('exposes a version string', () => {
    expect(typeof STORAGE_VERSION).toBe('string');
  });
});

describe('validateRaiseState', () => {
  it('accepts a fully-formed state', () => {
    expect(validateRaiseState(valid)).toBe(true);
  });

  it.each(['percent', 'amount', null])('accepts raiseMode=%p', (mode) => {
    expect(validateRaiseState({ ...valid, raiseMode: mode })).toBe(true);
  });

  it('rejects unknown raiseMode strings', () => {
    expect(validateRaiseState({ ...valid, raiseMode: 'flat' })).toBe(false);
  });

  it.each([null, undefined, 'no', 42])('rejects non-object input: %p', (input) => {
    expect(validateRaiseState(input)).toBe(false);
  });

  it('rejects when hpw is not a number', () => {
    expect(validateRaiseState({ ...valid, hpw: '40' })).toBe(false);
  });

  it('rejects when beforeAnnual is not a number', () => {
    expect(validateRaiseState({ ...valid, beforeAnnual: '50000' })).toBe(false);
  });

  it('rejects when raiseValue is not a number', () => {
    expect(validateRaiseState({ ...valid, raiseValue: '5' })).toBe(false);
  });

  it('rejects when beforeSet/raiseSet are not booleans', () => {
    expect(validateRaiseState({ ...valid, beforeSet: 'yes' })).toBe(false);
    expect(validateRaiseState({ ...valid, raiseSet: 1 })).toBe(false);
  });
});
