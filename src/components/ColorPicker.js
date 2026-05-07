'use client';
import PropTypes from 'prop-types';
import {useCallback, useEffect, useId, useRef, useState} from 'react';
import {hsvToRgb, parseColor, rgbToHex, rgbToHsv} from '../lib/color';

/**
 * In-page color picker. Renders a swatch button that opens a popover below
 * when clicked. The popover contains:
 *   - A 2D saturation/value (SV) area
 *   - A hue strip slider
 *   - A hex text input (round-trips with the outer caller)
 *
 * Props:
 *   value     — hex/rgb/hsl string (the source of truth lives in the parent)
 *   onChange  — called with a lowercase 6-digit hex string when color changes
 *   id        — optional id for the trigger button
 *   label     — aria-label for the trigger button (default: "Pick color")
 *
 * The text input is the source of truth in the parent; typing a valid color
 * there updates the picker. The picker writes hex back to the parent via onChange.
 *
 * Closes on: click-outside, Escape key.
 */
export default function ColorPicker({value, onChange, id, label = 'Pick color'}) {
  const reactId = useId();
  const buttonId = id || `cp-trigger-${reactId}`;
  const popoverId = `cp-popover-${reactId}`;

  const [open, setOpen] = useState(false);
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);
  const svAreaRef = useRef(null);
  const svDraggingRef = useRef(false);
  const hueDraggingRef = useRef(false);

  // Internal HSV state — updated from the incoming `value` prop.
  const [hsv, setHsv] = useState(() => {
    const parsed = parseColor(value);
    if (parsed) return rgbToHsv(parsed);
    return {h: 0, s: 1, v: 1};
  });

  // Hex input inside the popover — only used internally so user can type in it.
  const [hexInput, setHexInput] = useState(() => {
    const parsed = parseColor(value);
    return parsed ? rgbToHex(parsed) : '#ff0000';
  });

  // Sync from external value prop when it changes (e.g. user typed in the text input).
  useEffect(() => {
    const parsed = parseColor(value);
    if (!parsed) return;
    const newHex = rgbToHex(parsed);
    setHexInput(newHex);
    setHsv(rgbToHsv(parsed));
  }, [value]);

  // Derive display hex from current HSV.
  const currentRgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const currentHex = rgbToHex(currentRgb);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const applyHsv = useCallback(
    (newHsv) => {
      setHsv(newHsv);
      const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
      const hex = rgbToHex(rgb);
      setHexInput(hex);
      onChange(hex);
    },
    [onChange]
  );

  // ── SV area pointer interaction ────────────────────────────────────────────
  const getSvFromEvent = useCallback((e, rect) => {
    const s = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const v = Math.max(
      0,
      Math.min(1, 1 - (e.clientY - rect.top) / rect.height)
    );
    return {s, v};
  }, []);

  const handleSvPointerDown = useCallback(
    (e) => {
      e.preventDefault();
      svDraggingRef.current = true;
      const rect = svAreaRef.current.getBoundingClientRect();
      const {s, v} = getSvFromEvent(e, rect);
      applyHsv({...hsv, s, v});
    },
    [hsv, getSvFromEvent, applyHsv]
  );

  useEffect(() => {
    const handleMove = (e) => {
      if (!svDraggingRef.current) return;
      const rect = svAreaRef.current?.getBoundingClientRect();
      if (!rect) return;
      const {s, v} = getSvFromEvent(e, rect);
      setHsv((prev) => {
        const newHsv = {...prev, s, v};
        const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
        const hex = rgbToHex(rgb);
        setHexInput(hex);
        onChange(hex);
        return newHsv;
      });
    };
    const handleUp = () => {
      svDraggingRef.current = false;
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [getSvFromEvent, onChange]);

  // ── Hue slider ─────────────────────────────────────────────────────────────
  const handleHueChange = useCallback(
    (e) => {
      const h = Number(e.target.value);
      applyHsv({...hsv, h});
    },
    [hsv, applyHsv]
  );

  // ── Hex input inside popover ───────────────────────────────────────────────
  const handleHexInput = (e) => {
    const raw = e.target.value;
    setHexInput(raw);
    const parsed = parseColor(raw);
    if (parsed) {
      const newHsv = rgbToHsv(parsed);
      setHsv(newHsv);
      onChange(rgbToHex(parsed));
    }
  };

  // SV area cursor position as percentages.
  const cursorLeft = `${hsv.s * 100}%`;
  const cursorTop = `${(1 - hsv.v) * 100}%`;

  // Hue-only colour for the SV background.
  const hueOnlyHex = rgbToHex(hsvToRgb(hsv.h, 1, 1));

  return (
    <div className="cp-wrap" style={{position: 'relative', display: 'inline-block'}}>
      <button
        id={buttonId}
        ref={triggerRef}
        type="button"
        className="cp-swatch-btn"
        style={{'--cp-color': currentHex}}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        onClick={() => setOpen((prev) => !prev)}
      />

      {open && (
        <div
          id={popoverId}
          ref={popoverRef}
          role="dialog"
          aria-label="Color picker"
          className="cp-popover"
        >
          {/* Saturation/Value area */}
          <div
            ref={svAreaRef}
            className="cp-sv-area"
            style={{'--cp-hue-color': hueOnlyHex}}
            onMouseDown={handleSvPointerDown}
          >
            <div className="cp-sv-white" />
            <div className="cp-sv-black" />
            <div
              className="cp-sv-cursor"
              style={{left: cursorLeft, top: cursorTop}}
            />
          </div>

          {/* Hue strip */}
          <div className="cp-hue-row">
            <input
              type="range"
              className="cp-hue-slider"
              min={0}
              max={360}
              step={1}
              value={hsv.h}
              onChange={handleHueChange}
              aria-label="Hue"
            />
          </div>

          {/* Hex input */}
          <div className="cp-hex-row">
            <label className="cp-hex-label" htmlFor={`${buttonId}-hex`}>
              Hex
            </label>
            <input
              id={`${buttonId}-hex`}
              type="text"
              className="cp-hex-input"
              value={hexInput}
              onChange={handleHexInput}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              maxLength={9}
              aria-label="Hex color value"
            />
            {/* Color preview swatch in popover */}
            <span
              className="cp-hex-preview"
              style={{'--cp-color': currentHex}}
            />
          </div>
        </div>
      )}
    </div>
  );
}

ColorPicker.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  id: PropTypes.string,
  label: PropTypes.string,
};
