// Password Generator — constants and defaults.

export const MIN_LENGTH = 6;
export const MAX_LENGTH = 64;

// Character pools. Ambiguous characters are listed separately so the
// "Exclude ambiguous" toggle can subtract them from the active pool.
export const CHARS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>/?~',
};

// Easily-confused characters: 0/O, 1/l/I.
export const AMBIGUOUS = '0O1lI';

export const DEFAULT_SETTINGS = {
  length: 16,
  upper: true,
  lower: true,
  digits: true,
  symbols: false,
  excludeAmbiguous: false,
};

export const STRENGTH_BUCKETS = [
  {label: 'Very weak', minBits: 0, className: 'pw-strength--very-weak'},
  {label: 'Weak', minBits: 36, className: 'pw-strength--weak'},
  {label: 'Fair', minBits: 60, className: 'pw-strength--fair'},
  {label: 'Strong', minBits: 80, className: 'pw-strength--strong'},
  {label: 'Very strong', minBits: 112, className: 'pw-strength--very-strong'},
];
