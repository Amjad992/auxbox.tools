'use client';
import {useEffect, useMemo, useState} from 'react';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ToastContainer from '../../components/ToastContainer';
import {useToast} from '../../hooks/useToast';
import {useAutoSave} from '../../hooks/useAutoSave';
import {useHydrateStorage} from '../../hooks/useHydrateStorage';
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard';
import {StorageProvider, useStorageData} from './StorageContext';
import {
  DEFAULT_STATE,
  STATE_AUTOSAVE_DEBOUNCE_MS,
  THRESHOLDS,
} from './constants';
import {
  compositeOver,
  contrastRatio,
  parseColor,
  rgbToCss,
  rgbToHex,
} from './utils';
import './contrast-checker.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Color Contrast Checker',
  description:
    'WCAG 2.1 contrast ratio checker with AA/AAA pass/fail for normal and large text. Browser-only.',
  url: 'https://auxbox.tools/contrast-checker',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function Grade({label, threshold, ratio}) {
  // When no valid color pair is entered (ratio === 0), show a neutral state
  // rather than a misleading Fail badge.
  if (ratio === 0) {
    return (
      <div className="cc-grade cc-grade--neutral">
        <span className="cc-grade-label">{label}</span>
        <span className="cc-grade-status">— · {threshold.toFixed(1)}:1</span>
      </div>
    );
  }
  const passed = ratio >= threshold;
  return (
    <div className={`cc-grade cc-grade--${passed ? 'pass' : 'fail'}`}>
      <span className="cc-grade-label">{label}</span>
      <span className="cc-grade-status">
        {passed ? 'Pass' : 'Fail'} · {threshold.toFixed(1)}:1
      </span>
    </div>
  );
}

function ContrastCheckerContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {loadState, saveState, clearState, storageErrors} = useStorageData();

  const [fg, setFg] = useState(DEFAULT_STATE.fg);
  const [bg, setBg] = useState(DEFAULT_STATE.bg);

  const hydrated = useHydrateStorage(() => {
    const saved = loadState();
    if (saved && typeof saved === 'object') {
      if (typeof saved.fg === 'string') setFg(saved.fg);
      if (typeof saved.bg === 'string') setBg(saved.bg);
    }
  });

  useEffect(() => {
    if (storageErrors?.state) {
      showToast(`${storageErrors.state}. Using defaults.`, 'error');
    }
  }, [storageErrors?.state, showToast]);

  const {markDirty, markClean} = useAutoSave({
    onSave: () => saveState({fg, bg}),
    enabled: hydrated,
    deps: [fg, bg],
    debounceMs: STATE_AUTOSAVE_DEBOUNCE_MS,
  });

  const fgParsed = useMemo(() => parseColor(fg), [fg]);
  const bgParsed = useMemo(() => parseColor(bg), [bg]);

  // Compose semi-transparent foregrounds onto the background so the
  // contrast figure reflects what the user actually sees.
  const composedFg = useMemo(() => {
    if (!fgParsed || !bgParsed) return null;
    return compositeOver(fgParsed, bgParsed);
  }, [fgParsed, bgParsed]);

  const ratio = useMemo(() => {
    if (!composedFg || !bgParsed) return 0;
    return contrastRatio(composedFg, bgParsed);
  }, [composedFg, bgParsed]);

  const handleSwap = () => {
    markDirty();
    setFg(bg);
    setBg(fg);
  };

  const handleClear = () => {
    setFg(DEFAULT_STATE.fg);
    setBg(DEFAULT_STATE.bg);
    clearState();
    markClean();
    showToast('Reset to defaults', 'success');
  };

  const copy = useCopyToClipboard({
    showToast,
    successMessage: 'Copied',
  });

  const summaryText = ratio
    ? `${fg} on ${bg} → ${ratio.toFixed(2)}:1`
    : '';

  // Visible swatches use opaque CSS string. The native picker
  // <input type="color"> requires a 6-digit hex.
  const fgPickerHex = fgParsed ? rgbToHex(fgParsed) : '#000000';
  const bgPickerHex = bgParsed ? rgbToHex(bgParsed) : '#ffffff';

  return (
    <ToolPage
      title="Color Contrast Checker"
      tagline="Pick a foreground and background. See the WCAG contrast ratio + AA/AAA pass/fail for normal and large text. Hex, RGB, RGBA, HSL, HSLA all accepted."
      schema={SCHEMA}
      schemaId="contrast-checker-schema"
      errorMessage="There was an error loading the contrast checker. Please refresh the page."
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="tool-stack">
        <Card>
          <h2 className="tool-card-title">Colors</h2>
          <p className="cc-card-hint">
            Accepts <code>#abc</code>, <code>#aabbcc</code>,{' '}
            <code>rgb(...)</code>, <code>rgba(...)</code>,{' '}
            <code>hsl(...)</code>, <code>hsla(...)</code>. Click the swatch
            for the OS color picker.
          </p>

          <div className="cc-color-row">
            <label htmlFor="cc-fg" className="cc-color-label">
              Foreground
            </label>
            <input
              id="cc-fg"
              type="text"
              className={`cc-color-input${
                fg && !fgParsed ? ' cc-color-input--error' : ''
              }`}
              value={fg}
              onChange={(e) => {
                markDirty();
                setFg(e.target.value);
              }}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
            />
            <span
              className="cc-swatch"
              style={{
                '--cc-swatch-color': fgParsed ? rgbToCss(fgParsed) : 'transparent',
              }}
            >
              <input
                type="color"
                className="cc-color-picker"
                value={fgPickerHex}
                onChange={(e) => {
                  markDirty();
                  setFg(e.target.value);
                }}
                aria-label="Foreground color picker"
                tabIndex={-1}
              />
            </span>
          </div>

          <div className="cc-swap-row">
            <Button variant="neutral" onClick={handleSwap}>
              ↕ Swap
            </Button>
          </div>

          <div className="cc-color-row">
            <label htmlFor="cc-bg" className="cc-color-label">
              Background
            </label>
            <input
              id="cc-bg"
              type="text"
              className={`cc-color-input${
                bg && !bgParsed ? ' cc-color-input--error' : ''
              }`}
              value={bg}
              onChange={(e) => {
                markDirty();
                setBg(e.target.value);
              }}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
            />
            <span
              className="cc-swatch"
              style={{
                '--cc-swatch-color': bgParsed ? rgbToCss(bgParsed) : 'transparent',
              }}
            >
              <input
                type="color"
                className="cc-color-picker"
                value={bgPickerHex}
                onChange={(e) => {
                  markDirty();
                  setBg(e.target.value);
                }}
                aria-label="Background color picker"
                tabIndex={-1}
              />
            </span>
          </div>
        </Card>

        <Card>
          <h2 className="tool-card-title">Preview</h2>
          <div
            className="cc-preview"
            style={{
              color: fgParsed ? rgbToCss(fgParsed) : 'inherit',
              background: bgParsed ? rgbToCss(bgParsed) : 'inherit',
            }}
            aria-hidden="false"
          >
            <p className="cc-preview-large">
              Large text — the quick brown fox.
            </p>
            <p className="cc-preview-normal">
              Normal body text. The quick brown fox jumps over the lazy dog.
              Sphinx of black quartz, judge my vow.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="tool-card-title">Result</h2>
          <div className="cc-ratio" aria-live="polite" aria-atomic="true">
            <p className="cc-ratio-label">Contrast ratio</p>
            <p className="cc-ratio-value">
              {ratio ? ratio.toFixed(2) : '—'}
              <span className="cc-ratio-suffix">:1</span>
            </p>
          </div>

          <div className="cc-grades">
            <Grade
              label="AA · normal text"
              threshold={THRESHOLDS.AA_NORMAL}
              ratio={ratio}
            />
            <Grade
              label="AA · large text"
              threshold={THRESHOLDS.AA_LARGE}
              ratio={ratio}
            />
            <Grade
              label="AAA · normal text"
              threshold={THRESHOLDS.AAA_NORMAL}
              ratio={ratio}
            />
            <Grade
              label="AAA · large text"
              threshold={THRESHOLDS.AAA_LARGE}
              ratio={ratio}
            />
          </div>
        </Card>

        <div className="cc-actions">
          <Button
            variant="primary"
            onClick={() => copy(summaryText)}
            disabled={!ratio}
          >
            Copy summary
          </Button>
          <Button variant="neutral" onClick={handleClear}>
            Reset
          </Button>
        </div>
      </div>
    </ToolPage>
  );
}

export default function ContrastChecker() {
  return (
    <StorageProvider>
      <ContrastCheckerContent />
    </StorageProvider>
  );
}
