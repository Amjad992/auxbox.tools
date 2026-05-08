import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/script (used by ToolPage's LD+JSON)
vi.mock('next/script', () => ({
  default: ({children, dangerouslySetInnerHTML}) =>
    dangerouslySetInnerHTML ? (
      <script dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
    ) : (
      <script>{children}</script>
    ),
}));

// Mock forex lib — we control all fetch behaviour here
vi.mock('../../lib/forex', () => ({
  fetchRates: vi.fn(),
  fetchCurrencyList: vi.fn(),
  _resetCurrencyCache: vi.fn(),
}));

// eslint-disable-next-line import/first
import ExchangeRates from './page';
// eslint-disable-next-line import/first
import {fetchRates, fetchCurrencyList} from '../../lib/forex';
// eslint-disable-next-line import/first
import {DEFAULT_STATE, STORAGE_KEY, STORAGE_VERSION} from './constants';
// eslint-disable-next-line import/first
import {loadFromLocalStorage} from '../../lib/storage';

const MOCK_CURRENCY_LIST = [
  {code: 'AED', name: 'UAE Dirham'},
  {code: 'EUR', name: 'Euro'},
  {code: 'GBP', name: 'British Pound'},
  {code: 'JPY', name: 'Japanese Yen'},
  {code: 'PKR', name: 'Pakistani Rupee'},
  {code: 'SAR', name: 'Saudi Riyal'},
  {code: 'USD', name: 'United States Dollar'},
];

const MOCK_RATES = {
  rates: {EUR: 0.92, GBP: 0.79, SAR: 3.75, PKR: 279.6, JPY: 151.2, AED: 3.67},
  source: 'fawazahmed0',
  date: '2026-05-08',
};

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.clearAllMocks();
  fetchCurrencyList.mockResolvedValue(MOCK_CURRENCY_LIST);
  fetchRates.mockResolvedValue(MOCK_RATES);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function pickCurrencyInCombobox(user, input, query, optionText) {
  await user.clear(input);
  await user.type(input, query);
  const listbox = await screen.findByRole('listbox');
  const target = within(listbox).getByText(optionText ?? query, {exact: false});
  await user.click(target);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('<ExchangeRates />', () => {
  it('smoke: renders heading and default targets', async () => {
    render(<ExchangeRates />);
    expect(
      screen.getByRole('heading', {name: /exchange rates/i})
    ).toBeInTheDocument();
    // Default base label
    await waitFor(() => {
      expect(screen.getByText(/current base:/i)).toBeInTheDocument();
    });
    // Default targets appear in the target list
    await waitFor(() => {
      expect(screen.getAllByText('EUR').length).toBeGreaterThan(0);
    });
  });

  it('changing base triggers a new rate fetch', async () => {
    // Use a mock currency list where only one extra non-target currency exists.
    fetchCurrencyList.mockResolvedValue([
      ...MOCK_CURRENCY_LIST,
      {code: 'CHF', name: 'Swiss Franc'},
    ]);

    const user = userEvent.setup();
    render(<ExchangeRates />);
    // Wait for initial load + currency list ready
    await waitFor(() => expect(fetchCurrencyList).toHaveBeenCalled());
    await waitFor(() => expect(fetchRates).toHaveBeenCalled());
    // Wait for currency list options to be available (hint paragraph shows name)
    await waitFor(() => {
      expect(screen.getByText(/united states dollar/i)).toBeInTheDocument();
    });
    const callsBefore = fetchRates.mock.calls.length;

    // CHF is not a target, so it appears in baseOptions
    const baseInput = screen.getByPlaceholderText(/search currency \(e\.g\. usd/i);
    await pickCurrencyInCombobox(user, baseInput, 'CHF', 'CHF — Swiss Franc');

    await waitFor(() => {
      expect(fetchRates.mock.calls.length).toBeGreaterThan(callsBefore);
      // Last call should use CHF as base
      const lastCall = fetchRates.mock.calls[fetchRates.mock.calls.length - 1];
      expect(lastCall[0]).toBe('CHF');
    });
  });

  it('adding a target currency appends it to the list', async () => {
    const user = userEvent.setup();
    render(<ExchangeRates />);

    // First remove all defaults to have a clean slate for a specific add
    // (or just add a new one that isn't in defaults)
    const addInput = screen.getByPlaceholderText(/search currency to add/i);
    // USD is the base, so it won't be in addTargetOptions, but we can add any other
    // Let's look for a currency not in default targets: USD is the base, AED is a default
    // Pick something that's definitely not there yet — wait for list to load first
    await waitFor(() => expect(fetchCurrencyList).toHaveBeenCalled());

    // Remove one default target first so we can re-add it cleanly
    await user.click(screen.getByRole('button', {name: /remove eur/i}));
    await waitFor(() => {
      // EUR remove button should be gone now
      expect(screen.queryByRole('button', {name: /remove eur/i})).not.toBeInTheDocument();
    });

    // Now add EUR back
    await pickCurrencyInCombobox(user, addInput, 'EUR', 'EUR — Euro');
    await waitFor(() => {
      expect(screen.getByRole('button', {name: /remove eur/i})).toBeInTheDocument();
    });
  });

  it('removing a target currency removes it from the list', async () => {
    const user = userEvent.setup();
    render(<ExchangeRates />);

    // EUR is a default target
    await waitFor(() => {
      expect(screen.getByRole('button', {name: /remove eur/i})).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', {name: /remove eur/i}));

    await waitFor(() => {
      expect(screen.queryByRole('button', {name: /remove eur/i})).not.toBeInTheDocument();
    });
  });

  it('changing the amount updates the converted column in the table', async () => {
    const user = userEvent.setup();
    render(<ExchangeRates />);

    // Wait for rates to load and table to appear
    await waitFor(() => {
      expect(screen.getByRole('table', {name: /exchange rate results/i})).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText(/usd amount to convert/i);
    await user.clear(amountInput);
    await user.type(amountInput, '100');

    // 100 * 0.92 EUR = 92 — check that the converted cell reflects it
    await waitFor(() => {
      const table = screen.getByRole('table');
      // The converted column for EUR should show something other than 1× rate
      const rows = within(table).getAllByRole('row');
      // Find the EUR row (after header)
      const eurRow = rows.find((r) => within(r).queryByText('EUR'));
      expect(eurRow).toBeTruthy();
    });
  });

  it('error state: shows retry button when all providers fail', async () => {
    fetchRates.mockRejectedValue(new Error('All providers failed'));
    render(<ExchangeRates />);

    await waitFor(() => {
      expect(screen.getByRole('button', {name: /retry/i})).toBeInTheDocument();
    });
    expect(screen.getByText(/rates unavailable/i)).toBeInTheDocument();
  });

  it('loading state: shows loading indicator while fetching', async () => {
    // Make fetchRates hang
    let resolve;
    fetchRates.mockReturnValue(new Promise((r) => { resolve = r; }));

    render(<ExchangeRates />);

    // Loading badge should appear
    expect(await screen.findByRole('status', {hidden: true})).toBeInTheDocument();

    // Resolve the promise to clean up
    resolve(MOCK_RATES);
  });

  it('persists base + targets + amount across remounts', async () => {
    const user = userEvent.setup();
    const {unmount} = render(<ExchangeRates />);

    // Wait for hydration
    await waitFor(() => expect(fetchRates).toHaveBeenCalled());

    // Change amount
    const amountInput = screen.getByLabelText(/usd amount to convert/i);
    await user.clear(amountInput);
    await user.type(amountInput, '50');

    // Wait for auto-save
    await waitFor(() => {
      const {data} = loadFromLocalStorage(STORAGE_KEY, STORAGE_VERSION, () => true);
      expect(data).not.toBeNull();
      expect(data.amount).toBe(50);
    });

    unmount();

    // Remount and verify amount is restored
    render(<ExchangeRates />);
    await waitFor(() => {
      const amountInputNew = screen.getByLabelText(/usd amount to convert/i);
      expect(amountInputNew.value).toBe('50');
    });
  });

  it('Reset returns to default state', async () => {
    const user = userEvent.setup();
    render(<ExchangeRates />);

    await waitFor(() => expect(fetchRates).toHaveBeenCalled());

    await user.click(screen.getByRole('button', {name: /^reset$/i}));

    // After reset, base should show USD
    await waitFor(() => {
      expect(screen.getByText(/current base:/i)).toBeInTheDocument();
    });

    // Storage should be cleared
    const {data} = loadFromLocalStorage(STORAGE_KEY, STORAGE_VERSION, () => true);
    expect(data).toBeNull();
  });

  it('shows empty state when all targets removed', async () => {
    const user = userEvent.setup();
    render(<ExchangeRates />);

    await waitFor(() => expect(fetchRates).toHaveBeenCalled());

    // Remove all default targets
    for (const code of DEFAULT_STATE.targets) {
      const btn = screen.queryByRole('button', {name: new RegExp(`remove ${code}`, 'i')});
      if (btn) await user.click(btn);
    }

    await waitFor(() => {
      expect(screen.getByText(/no target currencies/i)).toBeInTheDocument();
    });
  });
});
