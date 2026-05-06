// Freelance Rate Calculator constants.

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'freelance_rate_calculator_state';
export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

export const MODES = {
  QUOTE: 'quote',
  INCOME: 'income',
  RATE: 'rate',
};

export const MODE_VALUES = [MODES.QUOTE, MODES.INCOME, MODES.RATE];

export const MODE_OPTIONS = [
  {value: MODES.QUOTE, label: 'Quote a job'},
  {value: MODES.INCOME, label: 'Income from rate'},
  {value: MODES.RATE, label: 'Rate from target'},
];

// Currency selector — re-exported from the shared lib.
export {CURRENCIES, CURRENCY_VALUES} from '../../lib/currencies';

export const COSTS_VIEW = {
  QUICK: 'quick',
  DETAILED: 'detailed',
};
export const COSTS_VIEW_VALUES = [COSTS_VIEW.QUICK, COSTS_VIEW.DETAILED];

export const COST_PERIOD = {
  MONTHLY: 'monthly',
  ANNUAL: 'annual',
};
export const COST_PERIOD_VALUES = [
  COST_PERIOD.MONTHLY,
  COST_PERIOD.ANNUAL,
];

// Suggested labels for the detailed-costs picker.
export const COST_SUGGESTIONS = [
  'Software & subscriptions',
  'Equipment & hardware',
  'Office / coworking / rent',
  'Insurance',
  'Internet, utilities, phone',
  'Marketing & advertising',
  'Professional fees (accountant, lawyer)',
  'Training & education',
  'Other',
];

export const DEFAULT_STATE = {
  mode: MODES.QUOTE,
  currency: 'USD',
  // Time & utilization
  time: {
    hoursPerDay: 8,
    daysPerWeek: 5,
    weeksPerYear: 48,
    utilization: 70, // 0..100 (whole percent)
  },
  // Quote mode
  hours: null,
  rate: null,
  // Rate mode
  targetIncome: null,
  // Team
  team: {people: 1},
  // Operating costs
  costs: {
    view: COSTS_VIEW.QUICK,
    quickAmount: null,
    quickPeriod: COST_PERIOD.MONTHLY,
    lineItems: [], // [{id, label, amount, period}]
  },
  // Fees & taxes
  fees: {
    platformFee: 0, // 0..100 (whole percent)
    processorFee: 0,
    incomeTax: 0, // user override default 0%
    otherFee: 0,
  },
  // Profit buffer
  profitMargin: 0, // 0..100
};
