import PropTypes from 'prop-types';
import {useEffect, useId, useRef, useState} from 'react';
import {CURRENCIES} from '../lib/currencies';

/**
 * Popover-style currency picker. Replaces the native `<select>` with a
 * styled trigger button + dropdown panel that sits flush with the rest
 * of the dark-theme inputs. The trigger shows the chosen currency code;
 * the panel lists each currency as `CODE — Full Label`.
 *
 * Keyboard:
 *   - Enter / Space on the trigger toggles the panel.
 *   - When open: Arrow Up/Down moves through options, Enter selects,
 *     Escape closes and refocuses the trigger.
 *   - Tab away closes the panel.
 *
 * Click-outside also closes.
 */
export default function CurrencySelect({
  id,
  value,
  onChange,
  label = 'Currency',
  className,
}) {
  const reactId = useId();
  const triggerId = id || `currency-${reactId}`;
  const labelId = `${triggerId}-label`;
  const listboxId = `${triggerId}-listbox`;
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef({});
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, CURRENCIES.findIndex((c) => c.value === value))
  );

  // Keep activeIndex in sync with the controlled value when closed.
  useEffect(() => {
    if (!open) {
      const idx = CURRENCIES.findIndex((c) => c.value === value);
      if (idx !== -1) setActiveIndex(idx);
    }
  }, [value, open]);

  // Click-outside to close.
  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  // When opening, focus the active option so keyboard nav and screen
  // readers track the current selection.
  useEffect(() => {
    if (open) {
      const opt = optionRefs.current[CURRENCIES[activeIndex]?.value];
      opt?.focus();
    }
  }, [open, activeIndex]);

  const select = (next) => {
    onChange(next);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onTriggerKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onOptionKeyDown = (e, idx) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((idx + 1) % CURRENCIES.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((idx - 1 + CURRENCIES.length) % CURRENCIES.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select(CURRENCIES[idx].value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'Tab') {
      setOpen(false);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(CURRENCIES.length - 1);
    }
  };

  const selected =
    CURRENCIES.find((c) => c.value === value) || CURRENCIES[0];

  return (
    <div
      ref={wrapperRef}
      className={`tool-currency-select-wrap${className ? ` ${className}` : ''}`}
    >
      <span id={labelId} className="tool-currency-select-label">
        {label}
      </span>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className="tool-currency-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${labelId} ${triggerId}`}
        aria-controls={open ? listboxId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="tool-currency-select-trigger-code">
          {selected.value}
        </span>
        <span className="tool-currency-select-trigger-name">
          {selected.label.replace(/^\S+\s—\s/, '')}
        </span>
        <span className="tool-currency-select-trigger-chevron" aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={labelId}
          className="tool-currency-select-listbox"
          tabIndex={-1}
        >
          {CURRENCIES.map((c, i) => {
            const isSelected = c.value === value;
            const isActive = i === activeIndex;
            return (
              <li
                key={c.value}
                ref={(el) => {
                  optionRefs.current[c.value] = el;
                }}
                role="option"
                aria-selected={isSelected}
                tabIndex={isActive ? 0 : -1}
                className={`tool-currency-select-option${
                  isSelected ? ' tool-currency-select-option--selected' : ''
                }${isActive ? ' tool-currency-select-option--active' : ''}`}
                onClick={() => select(c.value)}
                onMouseEnter={() => setActiveIndex(i)}
                onKeyDown={(e) => onOptionKeyDown(e, i)}
              >
                <span className="tool-currency-select-option-code">
                  {c.value}
                </span>
                <span className="tool-currency-select-option-name">
                  {c.label.replace(/^\S+\s—\s/, '')}
                </span>
                {isSelected && (
                  <span
                    className="tool-currency-select-option-check"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

CurrencySelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  className: PropTypes.string,
};
