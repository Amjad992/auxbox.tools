// Bill Splitter constants.

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'bill_splitter_state';
export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

export const TIP_PRESETS = [0, 5, 10, 15, 18, 20];
export const TAX_PRESETS = [0, 5, 8, 10, 13, 15];

export const SHARED_ASSIGNMENT = 'shared';

export const BOUNDS = {
  TIP_PCT_MIN: 0,
  TIP_PCT_MAX: 30,
  TAX_PCT_MIN: 0,
  TAX_PCT_MAX: 20,
};

export const DEFAULT_STATE = {
  currency: 'USD',
  people: [
    {id: 'p1', name: 'Person 1'},
    {id: 'p2', name: 'Person 2'},
  ],
  items: [],
  taxPct: 0,
  tipPct: 0,
};

// Built-in demo scenario for the "Add demo" button. Three diners
// sharing appetisers and drinks plus their own mains.
export const DEMO_STATE = {
  currency: 'USD',
  people: [
    {id: 'd1', name: 'Alex'},
    {id: 'd2', name: 'Sam'},
    {id: 'd3', name: 'Jordan'},
  ],
  items: [
    {id: 'i1', label: 'Bruschetta', amount: 12, assignedTo: SHARED_ASSIGNMENT},
    {id: 'i2', label: 'House red wine', amount: 28, assignedTo: SHARED_ASSIGNMENT},
    {id: 'i3', label: 'Carbonara', amount: 22, assignedTo: 'd1'},
    {id: 'i4', label: 'Risotto', amount: 24, assignedTo: 'd2'},
    {id: 'i5', label: 'Steak', amount: 38, assignedTo: 'd3'},
  ],
  taxPct: 8,
  tipPct: 18,
};
