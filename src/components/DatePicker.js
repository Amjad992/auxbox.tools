'use client';
import {useCallback, useEffect, useId, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import {DateTime} from 'luxon';
import {DayPicker} from 'react-day-picker';
import 'react-day-picker/style.css';

const THIS_YEAR = new Date().getFullYear();
const startMonth = new Date(1900, 0);
const endMonth = new Date(THIS_YEAR + 100, 11);

/**
 * Shared date picker. Renders a text input (YYYY-MM-DD) with a calendar toggle.
 * The public API uses Luxon DateTime exclusively — consumers never touch native Date.
 * Internally react-day-picker receives a native Date (no Luxon adapter in v9).
 *
 * Props:
 *   value       — Luxon DateTime or null (empty)
 *   onChange    — called with DateTime|null: on valid blur parse OR on calendar selection
 *   label       — visible label text
 *   id          — form id; auto-generated if absent
 *   ariaDescribedBy — links the input to an external description element
 *   placeholder — default 'YYYY-MM-DD'
 *   disabled    — disables both the input and the calendar button
 *
 * On invalid text input, onChange is called with null (not garbage).
 */
export default function DatePicker({
  value,
  onChange,
  label,
  id: idProp,
  ariaDescribedBy,
  placeholder = 'YYYY-MM-DD',
  disabled = false,
}) {
  const autoId = useId();
  const inputId = idProp ?? autoId;

  const errorId = `${inputId}-error`;

  // Local display text — tracks what the user typed; syncs to value on external changes.
  const [inputText, setInputText] = useState(
    value?.isValid ? value.toISODate() : ''
  );
  const [popupOpen, setPopupOpen] = useState(false);
  const containerRef = useRef(null);

  // showError: true when the user has typed a non-empty string that fails to parse.
  // Cleared on blur (input is wiped) or when a valid date is committed.
  const showError = inputText.trim() !== '' && !DateTime.fromISO(inputText.trim()).isValid;

  // Keep the text input in sync when value changes from outside (e.g. "Today" button, Clear).
  // Gate on the ISO string rather than reference identity so that a fresh Luxon instance
  // representing the same date does not clobber in-progress typing.
  const valueIso = value?.isValid ? value.toISODate() : '';
  useEffect(() => {
    setInputText(valueIso);
  }, [valueIso]);

  // Close popup on click-outside.
  useEffect(() => {
    if (!popupOpen) return;
    function handleOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setPopupOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [popupOpen]);

  // Close popup on Escape.
  useEffect(() => {
    if (!popupOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setPopupOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [popupOpen]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleInputBlur = useCallback(() => {
    const trimmed = inputText.trim();
    if (trimmed === '') {
      onChange(null);
      return;
    }
    const dt = DateTime.fromISO(trimmed);
    if (dt.isValid) {
      onChange(dt.startOf('day'));
    } else {
      // Invalid string: fire onChange(null) and clear the display.
      onChange(null);
      setInputText('');
    }
  }, [inputText, onChange]);

  const handleDaySelect = useCallback(
    (jsDate) => {
      if (!jsDate) {
        onChange(null);
        return;
      }
      const dt = DateTime.fromJSDate(jsDate).startOf('day');
      onChange(dt);
      setPopupOpen(false);
    },
    [onChange]
  );

  const togglePopup = () => {
    if (!disabled) setPopupOpen((prev) => !prev);
  };

  // react-day-picker expects a native Date.
  const selectedJsDate = value?.isValid ? value.toJSDate() : undefined;

  return (
    <div className="tool-datepicker" ref={containerRef}>
      <label className="tool-datepicker-label" htmlFor={inputId}>
        {label}
      </label>
      <div className="tool-datepicker-input-row">
        <input
          id={inputId}
          type="text"
          className="tool-datepicker-input"
          value={inputText}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={showError || undefined}
          aria-describedby={
            [ariaDescribedBy, showError ? errorId : null].filter(Boolean).join(' ') || undefined
          }
          onChange={handleInputChange}
          onBlur={handleInputBlur}
        />
        <button
          type="button"
          className="tool-datepicker-toggle"
          aria-label="Open calendar"
          aria-expanded={popupOpen}
          disabled={disabled}
          onClick={togglePopup}
        >
          {/* Calendar icon (inline SVG — no extra dep, no emoji). */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
      </div>

      {showError && (
        <p id={errorId} className="tool-datepicker-hint">Use YYYY-MM-DD</p>
      )}

      {popupOpen && (
        <div className="tool-datepicker-popup" role="dialog" aria-modal="true">
          <DayPicker
            mode="single"
            selected={selectedJsDate}
            onSelect={handleDaySelect}
            captionLayout="dropdown"
            startMonth={startMonth}
            endMonth={endMonth}
            defaultMonth={selectedJsDate ?? new Date()}
          />
        </div>
      )}
    </div>
  );
}

DatePicker.propTypes = {
  value: PropTypes.object, // Luxon DateTime or null
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  id: PropTypes.string,
  ariaDescribedBy: PropTypes.string,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
};
