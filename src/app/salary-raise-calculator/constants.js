// Salary Raise Calculator Constants

export const DEFAULT_HOURS_PER_WEEK = 40;
export const WEEKS_PER_YEAR = 52;
export const MONTHS_PER_YEAR = 12;

export const PERIODS = ['hourly', 'weekly', 'monthly', 'annual'];

export const DEFAULT_STATE = {
  hpw: DEFAULT_HOURS_PER_WEEK,
  beforeAnnual: 0,
  raiseMode: null, // 'percent' | 'amount' | null
  raiseValue: 0,   // when mode='percent' this is %; when 'amount' this is annual amount
  beforeSet: false,
  raiseSet: false,
};
