'use client';
import {useEffect, useMemo, useState} from 'react';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import CurrencyInput from '../../components/CurrencyInput';
import CurrencySelect from '../../components/CurrencySelect';
import InputField from '../../components/InputField';
import Slider from '../../components/Slider';
import ToastContainer from '../../components/ToastContainer';
import {useToast} from '../../hooks/useToast';
import {useAutoSave} from '../../hooks/useAutoSave';
import {useHydrateStorage} from '../../hooks/useHydrateStorage';
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard';
import {formatCurrency} from '../../lib/format';
import {StorageProvider, useStorageData} from './StorageContext';
import {
  BOUNDS,
  DEFAULT_STATE,
  DEMO_STATE,
  SHARED_ASSIGNMENT,
  STATE_AUTOSAVE_DEBOUNCE_MS,
  TAX_PRESETS,
  TIP_PRESETS,
} from './constants';
import {newId, splitBill} from './utils';
import './bill-splitter.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Bill Splitter',
  description:
    'Free bill splitter for groups. Add diners and items, set tax and tip, see who owes what. Browser-only, no upload.',
  url: 'https://auxbox.tools/bill-splitter',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function toNumberOrNull(raw) {
  if (raw === '' || raw === null || raw === undefined) return null;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

function BillSplitterContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {loadState, saveState, clearState, storageErrors} = useStorageData();
  const [state, setState] = useState(DEFAULT_STATE);

  const hydrated = useHydrateStorage(() => {
    const saved = loadState();
    if (saved && typeof saved === 'object') {
      setState((prev) => ({...prev, ...saved}));
    }
  });

  useEffect(() => {
    if (storageErrors?.state) {
      showToast(`${storageErrors.state}. Using defaults.`, 'error');
    }
  }, [storageErrors?.state, showToast]);

  const {markDirty, markClean} = useAutoSave({
    onSave: () => saveState(state),
    enabled: hydrated,
    deps: [state],
    debounceMs: STATE_AUTOSAVE_DEBOUNCE_MS,
  });

  const update = (patch) => {
    markDirty();
    setState((prev) => ({...prev, ...patch}));
  };

  // People
  const addPerson = () => {
    const n = state.people.length + 1;
    update({
      people: [
        ...state.people,
        {id: newId('p'), name: `Person ${n}`},
      ],
    });
  };
  const removePerson = (id) => {
    update({people: state.people.filter((p) => p.id !== id)});
  };
  const renamePerson = (id, name) => {
    update({
      people: state.people.map((p) => (p.id === id ? {...p, name} : p)),
    });
  };

  // Items
  const addItem = () => {
    update({
      items: [
        ...state.items,
        {
          id: newId('i'),
          label: '',
          amount: null,
          assignedTo:
            state.people[0]?.id || SHARED_ASSIGNMENT,
        },
      ],
    });
  };
  const removeItem = (id) => {
    update({items: state.items.filter((i) => i.id !== id)});
  };
  const updateItem = (id, patch) => {
    update({
      items: state.items.map((i) => (i.id === id ? {...i, ...patch} : i)),
    });
  };

  const handleClear = () => {
    clearState();
    setState(DEFAULT_STATE);
    markClean();
    showToast('Cleared', 'success');
  };

  const canClear = useMemo(
    () =>
      state.currency !== DEFAULT_STATE.currency ||
      state.taxPct !== DEFAULT_STATE.taxPct ||
      state.tipPct !== DEFAULT_STATE.tipPct ||
      state.items.length !== DEFAULT_STATE.items.length ||
      state.people.length !== DEFAULT_STATE.people.length ||
      state.people.some(
        (p, i) =>
          DEFAULT_STATE.people[i] &&
          (p.name !== DEFAULT_STATE.people[i].name ||
            p.id !== DEFAULT_STATE.people[i].id)
      ),
    [state]
  );

  const handleAddDemo = () => {
    if (
      canClear &&
      typeof window !== 'undefined' &&
      !window.confirm(
        'Loading the demo will replace your current bill. Continue?'
      )
    ) {
      return;
    }
    update(DEMO_STATE);
    showToast('Demo loaded', 'success');
  };

  const result = useMemo(
    () =>
      splitBill({
        people: state.people,
        items: state.items,
        taxPct: state.taxPct,
        tipPct: state.tipPct,
      }),
    [state.people, state.items, state.taxPct, state.tipPct]
  );

  const fmt = (n) =>
    formatCurrency(n, state.currency, {alwaysDecimals: true});
  const hasAnything = state.items.length > 0;

  const summaryText = hasAnything
    ? [
        `Bill split (${formatCurrency(result.totals.grandTotal, state.currency)} total):`,
        ...result.perPerson.map(
          (p) => `  ${p.name}: ${fmt(p.total)}`
        ),
        `(subtotal ${fmt(result.totals.subtotal)} + tax ${fmt(
          result.totals.tax
        )} + tip ${fmt(result.totals.tip)})`,
      ].join('\n')
    : '';

  const copy = useCopyToClipboard({
    showToast,
    successMessage: 'Summary copied',
  });

  return (
    <ToolPage
      title="Bill Splitter"
      tagline="Split a restaurant bill by item — add diners, what they ordered, tax and tip, and see who owes what."
      schema={SCHEMA}
      schemaId="bill-splitter-schema"
      errorMessage="There was an error loading the bill splitter. Please refresh the page."
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="tool-stack">
        <Card>
          <div className="bs-card-header">
            <h2 className="bs-card-title">People</h2>
            <Button variant="neutral" onClick={addPerson}>
              + Add person
            </Button>
          </div>
          <div className="bs-people-list">
            {state.people.map((p, idx) => (
              <div key={p.id} className="bs-person-row">
                <InputField
                  id={`bs-person-${p.id}`}
                  label={`Person ${idx + 1}`}
                  type="text"
                  value={p.name}
                  onChange={(e) => renamePerson(p.id, e.target.value)}
                  placeholder={`Person ${idx + 1}`}
                />
                <Button
                  variant="neutral"
                  onClick={() => removePerson(p.id)}
                  disabled={state.people.length <= 1}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="bs-card-header">
            <h2 className="bs-card-title">Items</h2>
            <Button variant="neutral" onClick={addItem}>
              + Add item
            </Button>
          </div>
          {state.items.length === 0 ? (
            <p className="bs-empty">
              No items yet. Add a line item or load the demo to see the shape.
            </p>
          ) : (
            <div className="bs-items-list">
              {state.items.map((it) => (
                <div key={it.id} className="bs-item-row">
                  <InputField
                    id={`bs-item-${it.id}-label`}
                    label="Item"
                    type="text"
                    value={it.label}
                    onChange={(e) =>
                      updateItem(it.id, {label: e.target.value})
                    }
                    placeholder="e.g. Pasta"
                  />
                  <CurrencyInput
                    id={`bs-item-${it.id}-amount`}
                    label="Amount"
                    currency={state.currency}
                    step="0.01"
                    min="0"
                    value={it.amount ?? ''}
                    onChange={(e) =>
                      updateItem(it.id, {
                        amount: toNumberOrNull(e.target.value),
                      })
                    }
                    placeholder="0.00"
                  />
                  <div className="tool-select-wrap">
                    <label
                      htmlFor={`bs-item-${it.id}-assign`}
                      className="tool-select-label"
                    >
                      Who ordered it?
                    </label>
                    <select
                      id={`bs-item-${it.id}-assign`}
                      className="tool-select"
                      value={it.assignedTo}
                      onChange={(e) =>
                        updateItem(it.id, {assignedTo: e.target.value})
                      }
                    >
                      <option value={SHARED_ASSIGNMENT}>Shared</option>
                      {state.people.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    variant="neutral"
                    onClick={() => removeItem(it.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="bs-card-title">Tax &amp; tip</h2>
          <div className="bs-rate-card-stack">
            <div>
              <Slider
                id="bs-tax-pct"
                label="Tax percent"
                value={state.taxPct}
                min={BOUNDS.TAX_PCT_MIN}
                max={BOUNDS.TAX_PCT_MAX}
                step={0.5}
                integerOnly={false}
                onChange={(v) => update({taxPct: v})}
                formatValue={(v) => `${v}%`}
                leftHint={`${BOUNDS.TAX_PCT_MIN}%`}
                rightHint={`${BOUNDS.TAX_PCT_MAX}%`}
              />
              <div className="tool-presets">
                {TAX_PRESETS.map((p) => {
                  const active = state.taxPct === p;
                  return (
                    <button
                      type="button"
                      key={p}
                      className={`tool-preset${active ? ' tool-preset--active' : ''}`}
                      onClick={() => update({taxPct: p})}
                      aria-pressed={active}
                    >
                      {p}%
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Slider
                id="bs-tip-pct"
                label="Tip percent"
                value={state.tipPct}
                min={BOUNDS.TIP_PCT_MIN}
                max={BOUNDS.TIP_PCT_MAX}
                step={1}
                integerOnly
                onChange={(v) => update({tipPct: v})}
                formatValue={(v) => `${v}%`}
                leftHint={`${BOUNDS.TIP_PCT_MIN}%`}
                rightHint={`${BOUNDS.TIP_PCT_MAX}%`}
              />
              <div className="tool-presets">
                {TIP_PRESETS.map((p) => {
                  const active = state.tipPct === p;
                  return (
                    <button
                      type="button"
                      key={p}
                      className={`tool-preset${active ? ' tool-preset--active' : ''}`}
                      onClick={() => update({tipPct: p})}
                      aria-pressed={active}
                    >
                      {p}%
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="bs-card-title">Currency</h2>
          <CurrencySelect
            id="bs-currency"
            value={state.currency}
            onChange={(v) => update({currency: v})}
          />
        </Card>

        <Card>
          <h2 className="bs-card-title">Result</h2>
          <div className="bs-result-region" aria-live="polite" aria-atomic="true">
            {hasAnything ? (
              <>
                <table className="bs-result-table">
                  <thead>
                    <tr>
                      <th scope="col">Person</th>
                      <th scope="col">Subtotal</th>
                      <th scope="col">Tax</th>
                      <th scope="col">Tip</th>
                      <th scope="col">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.perPerson.map((p) => (
                      <tr key={p.personId}>
                        <td>{p.name}</td>
                        <td>{fmt(p.subtotal)}</td>
                        <td>{fmt(p.taxShare)}</td>
                        <td>{fmt(p.tipShare)}</td>
                        <td className="bs-result-total">{fmt(p.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th scope="row">Total</th>
                      <td>{fmt(result.totals.subtotal)}</td>
                      <td>{fmt(result.totals.tax)}</td>
                      <td>{fmt(result.totals.tip)}</td>
                      <td className="bs-result-total">
                        {fmt(result.totals.grandTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <div className="bs-result-cards">
                  {result.perPerson.map((p) => (
                    <div key={p.personId} className="bs-result-card">
                      <p className="bs-result-card-name">{p.name}</p>
                      <div className="bs-result-card-row">
                        <span>Subtotal</span>
                        <span className="bs-result-card-amount">
                          {fmt(p.subtotal)}
                        </span>
                      </div>
                      <div className="bs-result-card-row">
                        <span>Tax</span>
                        <span className="bs-result-card-amount">
                          {fmt(p.taxShare)}
                        </span>
                      </div>
                      <div className="bs-result-card-row">
                        <span>Tip</span>
                        <span className="bs-result-card-amount">
                          {fmt(p.tipShare)}
                        </span>
                      </div>
                      <div className="bs-result-card-row bs-result-card-row--total">
                        <span>Total</span>
                        <span className="bs-result-card-amount">
                          {fmt(p.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bs-totals-row">
                  <span className="bs-totals-chip">
                    Subtotal {fmt(result.totals.subtotal)}
                  </span>
                  <span className="bs-totals-chip">
                    Tax {fmt(result.totals.tax)}
                  </span>
                  <span className="bs-totals-chip">
                    Tip {fmt(result.totals.tip)}
                  </span>
                  <span className="bs-totals-chip bs-totals-chip--grand">
                    Grand total {fmt(result.totals.grandTotal)}
                  </span>
                </div>
              </>
            ) : (
              <p className="bs-empty">
                Add people and items to see the breakdown.
              </p>
            )}
          </div>
        </Card>

        <div className="bs-actions">
          <Button
            variant="primary"
            onClick={() => copy(summaryText)}
            disabled={!hasAnything}
          >
            Copy summary
          </Button>
          <Button variant="neutral" onClick={handleAddDemo}>
            Load demo
          </Button>
          <Button
            variant="neutral"
            onClick={handleClear}
            disabled={!canClear}
          >
            Clear
          </Button>
        </div>
      </div>
    </ToolPage>
  );
}

export default function BillSplitter() {
  return (
    <StorageProvider>
      <BillSplitterContent />
    </StorageProvider>
  );
}
