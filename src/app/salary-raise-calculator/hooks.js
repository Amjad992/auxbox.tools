import {useState, useEffect, useCallback, useMemo} from 'react';
import {DEFAULT_STATE, PERIODS} from './constants';
import {
  toAnnual,
  fromAnnual,
  parseNumeric,
  formatNumber,
  deriveRaiseAnnual,
  deriveRaisePercent,
} from './utils';
import {useStorageData} from './StorageContext';

function emptyInputs() {
  return {
    hpw: String(DEFAULT_STATE.hpw),
    before: {hourly: '', weekly: '', monthly: '', annual: ''},
    raise: {percent: '', hourly: '', weekly: '', monthly: '', annual: ''},
    after: {hourly: '', weekly: '', monthly: '', annual: ''},
  };
}

function deriveInputsFromState(state, exclude = null) {
  const {hpw, beforeAnnual, beforeSet, raiseSet} = state;
  const raiseAnnual = deriveRaiseAnnual(state);
  const raisePercent = deriveRaisePercent(state);
  const afterAnnual = beforeAnnual + raiseAnnual;
  const showAfter = beforeSet || raiseSet;

  const inputs = emptyInputs();
  inputs.hpw = String(hpw ?? '');

  for (const p of PERIODS) {
    if (beforeSet) inputs.before[p] = formatNumber(fromAnnual(beforeAnnual, p, hpw));
    if (raiseSet) inputs.raise[p] = formatNumber(fromAnnual(raiseAnnual, p, hpw));
    if (showAfter) inputs.after[p] = formatNumber(fromAnnual(afterAnnual, p, hpw));
  }
  if (raiseSet && raisePercent !== null) {
    inputs.raise.percent = formatNumber(raisePercent);
  }

  // Preserve the field the user is currently typing in (do not overwrite).
  if (exclude) {
    const {group, field, raw} = exclude;
    if (group === 'hpw') inputs.hpw = raw;
    else inputs[group][field] = raw;
  }

  return inputs;
}

export function useRaiseCalculator() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [inputs, setInputs] = useState(() => deriveInputsFromState(DEFAULT_STATE));
  const {loadState, saveState, clearState, hasSavedData} = useStorageData();
  const isSaved = !!hasSavedData?.state;

  // Load on mount
  useEffect(() => {
    try {
      const loaded = loadState();
      if (loaded) {
        setState(loaded);
        setInputs(deriveInputsFromState(loaded));
      }
    } catch (e) {
      console.error('Error loading raise state:', e);
    }
  }, [loadState]);

  const applyState = useCallback((nextState, exclude) => {
    setState(nextState);
    setInputs(deriveInputsFromState(nextState, exclude));
  }, []);

  const handleChange = useCallback(
    (group, field, raw) => {
      // Always update the visible input first so typing feels immediate.
      const num = parseNumeric(raw);
      const exclude = {group, field, raw};

      setState((prev) => {
        let next = {...prev};

        if (group === 'hpw') {
          // Hours per week — keep canonical annual values stable; this just
          // rescales the hourly display.
          next.hpw = num === null ? 0 : num;
        } else if (group === 'before') {
          if (num === null) {
            // Cleared the field — reset before but keep raise (mode/value).
            next.beforeAnnual = 0;
            next.beforeSet = false;
          } else {
            next.beforeAnnual = toAnnual(num, field, prev.hpw);
            next.beforeSet = true;
          }
        } else if (group === 'raise') {
          if (num === null) {
            next.raiseMode = null;
            next.raiseValue = 0;
            next.raiseSet = false;
          } else if (field === 'percent') {
            next.raiseMode = 'percent';
            next.raiseValue = num;
            next.raiseSet = true;
          } else {
            next.raiseMode = 'amount';
            next.raiseValue = toAnnual(num, field, prev.hpw);
            next.raiseSet = true;
          }
        } else if (group === 'after') {
          if (num === null) {
            // Treat clearing after as zeroing the raise (before stays).
            next.raiseMode = null;
            next.raiseValue = 0;
            next.raiseSet = false;
          } else {
            const afterAnnual = toAnnual(num, field, prev.hpw);
            next.raiseMode = 'amount';
            next.raiseValue = afterAnnual - prev.beforeAnnual;
            next.raiseSet = true;
          }
        }

        // Update inputs from the new canonical state, preserving the typed field.
        setInputs(deriveInputsFromState(next, exclude));
        return next;
      });
    },
    []
  );

  const reset = useCallback(() => {
    applyState(DEFAULT_STATE);
  }, [applyState]);

  const save = useCallback(() => {
    return saveState(state);
  }, [saveState, state]);

  const clearSaved = useCallback(() => {
    clearState();
    applyState(DEFAULT_STATE);
  }, [clearState, applyState]);

  const summary = useMemo(() => {
    const raiseAnnual = deriveRaiseAnnual(state);
    return {
      beforeAnnual: state.beforeAnnual,
      raiseAnnual,
      raisePercent: deriveRaisePercent(state),
      afterAnnual: state.beforeAnnual + raiseAnnual,
      beforeSet: state.beforeSet,
      raiseSet: state.raiseSet,
    };
  }, [state]);

  return {
    state,
    inputs,
    handleChange,
    reset,
    save,
    clearSaved,
    hasSavedData: isSaved,
    summary,
  };
}
