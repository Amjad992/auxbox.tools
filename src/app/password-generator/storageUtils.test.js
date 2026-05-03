import {describe, it, expect} from 'vitest';
import {
  validatePasswordSettings,
  STORAGE_KEYS,
  STORAGE_VERSION,
} from './storageUtils';

const valid = {
  length: 16,
  upper: true,
  lower: true,
  digits: true,
  symbols: false,
  excludeAmbiguous: false,
};

describe('password-generator storage constants', () => {
  it('exposes a SETTINGS key', () => {
    expect(STORAGE_KEYS.SETTINGS).toBe('password_generator_settings');
  });
  it('exposes a version string', () => {
    expect(typeof STORAGE_VERSION).toBe('string');
  });
});

describe('validatePasswordSettings', () => {
  it('accepts a fully-formed settings object', () => {
    expect(validatePasswordSettings(valid)).toBe(true);
  });

  it.each([null, undefined, 'no', 42, []])(
    'rejects non-object input: %p',
    (input) => {
      expect(validatePasswordSettings(input)).toBe(false);
    }
  );

  it.each([5, 65, 0, -1, 16.5, '16'])(
    'rejects out-of-range or non-integer length: %p',
    (length) => {
      expect(validatePasswordSettings({...valid, length})).toBe(false);
    }
  );

  it.each(['upper', 'lower', 'digits', 'symbols', 'excludeAmbiguous'])(
    'rejects when %s is not a boolean',
    (key) => {
      expect(validatePasswordSettings({...valid, [key]: 'yes'})).toBe(false);
    }
  );

  it('rejects when no character class is enabled', () => {
    expect(
      validatePasswordSettings({
        ...valid,
        upper: false,
        lower: false,
        digits: false,
        symbols: false,
      })
    ).toBe(false);
  });
});
