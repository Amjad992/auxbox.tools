'use client';
import PropTypes from 'prop-types';
import {useEffect, useId, useRef, useState} from 'react';

/**
 * Accessible searchable combobox. Renders a text input that filters a list
 * of options. A popover dropdown shows matching results; arrow keys navigate,
 * Enter selects, Escape/Tab close.
 *
 * Props:
 *   options       — [{value, label}] full option list (filtered on query change)
 *   onSelect      — called with selected {value, label} when the user picks one
 *   placeholder   — input placeholder text
 *   maxVisible    — max number of results shown (default 20)
 *   id            — id forwarded to the <input> element
 *   label         — visible <label> text (required for a11y; use aria-label if hidden)
 *   labelHidden   — if true, renders a visually-hidden label (default: false)
 *   disabled      — disables the input
 *   renderOption  — optional (option, isActive) => ReactNode to customise option rendering
 *
 * Designed to be unstyled by default; apply `.tool-combobox-*` classes from tools.css.
 */
export default function Combobox({
  options,
  onSelect,
  placeholder = 'Search…',
  maxVisible = 20,
  id,
  label,
  labelHidden = false,
  disabled = false,
  renderOption,
}) {
  const reactId = useId();
  const inputId = id || `combobox-${reactId}`;
  const listId = `${inputId}-list`;

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Filter options based on query
  const filtered = query.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(query.toLowerCase()) ||
        opt.value.toLowerCase().includes(query.toLowerCase())
      ).slice(0, maxVisible)
    : options.slice(0, maxVisible);

  // Reset activeIndex when filtered list changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  // Scroll active item into view (guarded — scrollIntoView may not exist in jsdom)
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const activeEl = listRef.current.querySelector('[aria-selected="true"]');
    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      activeEl.scrollIntoView({block: 'nearest'});
    }
  }, [activeIndex]);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setOpen(true);
    setActiveIndex(-1);
  };

  const handleSelect = (option) => {
    setQuery('');
    setOpen(false);
    setActiveIndex(-1);
    onSelect(option);
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setOpen(true);
        return;
      }
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
        break;
      case 'Enter':
        if (activeIndex >= 0 && filtered[activeIndex]) {
          e.preventDefault();
          handleSelect(filtered[activeIndex]);
        }
        break;
      case 'Escape':
        setOpen(false);
        setQuery('');
        setActiveIndex(-1);
        break;
      case 'Tab':
        setOpen(false);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (
        inputRef.current &&
        !inputRef.current.closest('.tool-combobox')?.contains(e.target)
      ) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const activeId = activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined;

  return (
    <div className="tool-combobox">
      <label
        htmlFor={inputId}
        className={
          labelHidden ? 'tool-sr-only' : 'tool-combobox-label'
        }
      >
        {label}
      </label>
      <div className="tool-combobox-input-wrap">
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open && filtered.length > 0}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={activeId}
          className="tool-combobox-input"
          value={query}
          placeholder={placeholder}
          disabled={disabled}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (query) setOpen(true); }}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      {open && filtered.length > 0 && (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          className="tool-combobox-list"
          aria-label={label}
        >
          {filtered.map((option, idx) => {
            const isActive = idx === activeIndex;
            return (
              <li
                key={option.value}
                id={`${listId}-opt-${idx}`}
                role="option"
                aria-selected={isActive}
                className={`tool-combobox-option${isActive ? ' tool-combobox-option--active' : ''}`}
                onMouseDown={(e) => {
                  // Prevent input blur before click registers.
                  e.preventDefault();
                  handleSelect(option);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                {renderOption ? renderOption(option, isActive) : option.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

Combobox.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  maxVisible: PropTypes.number,
  id: PropTypes.string,
  label: PropTypes.string.isRequired,
  labelHidden: PropTypes.bool,
  disabled: PropTypes.bool,
  renderOption: PropTypes.func,
};
