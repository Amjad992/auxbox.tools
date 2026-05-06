/**
 * Shared currency selector list.
 *
 * Used by every "money" tool that wants to let the user pick a currency
 * label for their inputs/outputs. The currency code is treated as a
 * label only — no FX conversion.
 *
 * `Intl.NumberFormat` resolves the symbol per-locale, so "CAD" renders
 * as "CA$" in en-US, "INR" as "₹", etc. (See `<CurrencyInput>` and
 * `formatCurrency`.)
 */
export const CURRENCIES = [
  {value: 'USD', label: 'USD — US Dollar'},
  {value: 'EUR', label: 'EUR — Euro'},
  {value: 'GBP', label: 'GBP — Pound Sterling'},
  {value: 'SAR', label: 'SAR — Saudi Riyal'},
  {value: 'AED', label: 'AED — Emirati Dirham'},
  {value: 'JPY', label: 'JPY — Japanese Yen'},
  {value: 'CAD', label: 'CAD — Canadian Dollar'},
  {value: 'AUD', label: 'AUD — Australian Dollar'},
  {value: 'INR', label: 'INR — Indian Rupee'},
  {value: 'CNY', label: 'CNY — Chinese Yuan'},
];

export const CURRENCY_VALUES = CURRENCIES.map((c) => c.value);
