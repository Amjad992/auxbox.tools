import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {act, fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Stub next/script — App Router runtime isn't available in jsdom.
vi.mock('next/script', () => ({
  default: ({children, dangerouslySetInnerHTML}) =>
    dangerouslySetInnerHTML
      ? <script dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
      : <script>{children}</script>,
}));

// Mutable stub for the field-sizing feature flag (MIN-3/MIN-4).
// Tests that need a specific value call featureDetect.__setHasFieldSizing(bool)
// in a beforeEach; the default (false) matches jsdom which has no CSS.supports.
vi.mock('../../lib/featureDetect', () => {
  let _hasFieldSizing = false;
  return {
    get HAS_FIELD_SIZING() {
      return _hasFieldSizing;
    },
    __setHasFieldSizing(v) {
      _hasFieldSizing = v;
    },
  };
});

// eslint-disable-next-line import/first
import MarkdownToPdf from './page';
// eslint-disable-next-line import/first
import {presetClass, PRESETS} from './constants';
// eslint-disable-next-line import/first
import * as featureDetect from '../../lib/featureDetect';

const STORAGE_KEY = 'markdown_to_pdf_state';

function getEditor() {
  return screen.getByLabelText(/markdown editor/i);
}

function getPrintRoot() {
  return document.getElementById('mtp-print-root');
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  // Clean up any window.print stub between tests.
  if ('print' in window) {
    try {
      delete window.print;
    } catch {
      window.print = undefined;
    }
  }
  delete window.__pwned;
});

describe('presetClass — pure mapping', () => {
  it('maps each known preset to its scoped class', () => {
    expect(presetClass(PRESETS.DEFAULT)).toBe('mtp-preset-default');
    expect(presetClass(PRESETS.ACADEMIC)).toBe('mtp-preset-academic');
    expect(presetClass(PRESETS.MINIMAL)).toBe('mtp-preset-minimal');
  });

  it('falls back to default for unknown values', () => {
    expect(presetClass('bogus')).toBe('mtp-preset-default');
    expect(presetClass(undefined)).toBe('mtp-preset-default');
  });
});

describe('<MarkdownToPdf /> — page render', () => {
  it('renders editor, preview, preset picker, Download, and Clear buttons', () => {
    render(<MarkdownToPdf />);
    expect(
      screen.getByRole('heading', {name: /markdown to pdf/i})
    ).toBeInTheDocument();
    expect(getEditor()).toBeInTheDocument();
    expect(getPrintRoot()).not.toBeNull();
    // Preset picker exposed as a radiogroup.
    expect(
      screen.getByRole('radiogroup', {name: /print preset/i})
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', {name: 'Modern'})).toBeInTheDocument();
    expect(screen.getByRole('radio', {name: 'Academic'})).toBeInTheDocument();
    expect(screen.getByRole('radio', {name: 'Compact'})).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /download as pdf/i})
    ).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /^clear$/i})).toBeInTheDocument();
  });

  it('typing in the editor updates the preview', async () => {
    const user = userEvent.setup();
    render(<MarkdownToPdf />);
    await user.type(getEditor(), '# Hello pdf');
    const root = getPrintRoot();
    expect(root.querySelector('h1')).not.toBeNull();
    expect(root.querySelector('h1').textContent).toBe('Hello pdf');
  });
});

describe('<MarkdownToPdf /> — preset picker class wiring', () => {
  it('default preset class is applied on initial render', () => {
    render(<MarkdownToPdf />);
    const root = getPrintRoot();
    expect(root.className).toMatch(/mtp-preset-default/);
    expect(root.className).not.toMatch(/mtp-preset-academic/);
  });

  it('switching to Academic adds the academic class and drops the default class', async () => {
    const user = userEvent.setup();
    render(<MarkdownToPdf />);
    await user.click(screen.getByRole('radio', {name: 'Academic'}));
    const root = getPrintRoot();
    expect(root.className).toMatch(/mtp-preset-academic/);
    expect(root.className).not.toMatch(/mtp-preset-default/);
  });

  it('switching to Compact applies the minimal class', async () => {
    const user = userEvent.setup();
    render(<MarkdownToPdf />);
    await user.click(screen.getByRole('radio', {name: 'Compact'}));
    const root = getPrintRoot();
    expect(root.className).toMatch(/mtp-preset-minimal/);
  });
});

describe('<MarkdownToPdf /> — preset description', () => {
  it('shows the Modern description by default', () => {
    render(<MarkdownToPdf />);
    expect(
      screen.getByText(/Sans-serif, 11 pt, 2 cm margins/i)
    ).toBeInTheDocument();
  });

  it('shows the Academic description after selecting Academic', async () => {
    const user = userEvent.setup();
    render(<MarkdownToPdf />);
    await user.click(screen.getByRole('radio', {name: 'Academic'}));
    expect(
      screen.getByText(/Serif \(Georgia\), 12 pt, 2\.5 cm margins/i)
    ).toBeInTheDocument();
  });

  it('shows the Compact description after selecting Compact', async () => {
    const user = userEvent.setup();
    render(<MarkdownToPdf />);
    await user.click(screen.getByRole('radio', {name: 'Compact'}));
    expect(
      screen.getByText(/Sans-serif, 10 pt, 1\.5 cm margins/i)
    ).toBeInTheDocument();
  });
});

describe('<MarkdownToPdf /> — Download button', () => {
  it('calls window.print() when there is content', async () => {
    const printMock = vi.fn();
    window.print = printMock;

    const user = userEvent.setup();
    render(<MarkdownToPdf />);
    await user.type(getEditor(), 'something');

    const btn = screen.getByRole('button', {name: /download as pdf/i});
    expect(btn).not.toBeDisabled();
    await user.click(btn);

    expect(printMock).toHaveBeenCalledTimes(1);
  });

  it('Download is disabled when the document is empty', () => {
    render(<MarkdownToPdf />);
    expect(
      screen.getByRole('button', {name: /download as pdf/i})
    ).toBeDisabled();
  });
});

describe('<MarkdownToPdf /> — sanitization (live preview)', () => {
  it('does not execute <script> typed into the editor', () => {
    render(<MarkdownToPdf />);
    const editor = getEditor();

    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      ).set;
      setter.call(editor, '<script>window.__pwned = true;</script>hello');
      editor.dispatchEvent(new Event('input', {bubbles: true}));
    });

    const root = getPrintRoot();
    expect(root.querySelector('script')).toBeNull();
    expect(window.__pwned).toBeUndefined();
    expect(root.textContent).toContain('hello');
  });
});

describe('<MarkdownToPdf /> — auto-save round-trip', () => {
  it('typing persists document + preset via debounced auto-save', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    render(<MarkdownToPdf />);

    await user.type(getEditor(), 'persist me');
    await user.click(screen.getByRole('radio', {name: 'Academic'}));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    vi.useRealTimers();

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw);
    expect(parsed.version).toBe('1.0.0');
    expect(parsed.data.document).toBe('persist me');
    expect(parsed.data.preset).toBe('academic');
  });

  it('a fresh mount with no interaction does NOT write defaults', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    render(<MarkdownToPdf />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    vi.useRealTimers();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('restores persisted document + preset on mount', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        data: {document: '# Restored', preset: 'minimal'},
      })
    );
    render(<MarkdownToPdf />);
    expect(getEditor()).toHaveValue('# Restored');
    const root = getPrintRoot();
    expect(root.className).toMatch(/mtp-preset-minimal/);
    expect(root.querySelector('h1').textContent).toBe('Restored');
  });
});

describe('<MarkdownToPdf /> — Clear synchronous wipe', () => {
  it('Clear is disabled when document is empty AND preset is default', () => {
    render(<MarkdownToPdf />);
    expect(screen.getByRole('button', {name: /^clear$/i})).toBeDisabled();
  });

  it('Clear empties the textarea, resets preset, and wipes storage synchronously', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        data: {document: '# saved', preset: 'academic'},
      })
    );

    const user = userEvent.setup();
    render(<MarkdownToPdf />);
    expect(getEditor()).toHaveValue('# saved');

    await user.click(screen.getByRole('button', {name: /^clear$/i}));

    expect(getEditor()).toHaveValue('');
    expect(getPrintRoot().className).toMatch(/mtp-preset-default/);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('Clear does NOT write a phantom record after the debounce window', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        data: {document: '# draft', preset: 'default'},
      })
    );

    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    render(<MarkdownToPdf />);

    await user.click(screen.getByRole('button', {name: /^clear$/i}));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('<MarkdownToPdf /> — print-time preset class (MAJ-3)', () => {
  it('print root carries the active preset class at the moment window.print() is called', async () => {
    let capturedClassName = '';
    window.print = vi.fn(() => {
      capturedClassName = document.getElementById('mtp-print-root').className;
    });

    const user = userEvent.setup();
    render(<MarkdownToPdf />);

    // Type something so the Download button is enabled.
    await user.type(getEditor(), 'test content');
    // Switch to Academic preset.
    await user.click(screen.getByRole('radio', {name: 'Academic'}));
    // Click Download — should invoke window.print() with academic class on the root.
    await user.click(screen.getByRole('button', {name: /download as pdf/i}));

    expect(window.print).toHaveBeenCalledTimes(1);
    expect(capturedClassName).toMatch(/mtp-preset-academic/);
    expect(capturedClassName).not.toMatch(/mtp-preset-default/);
  });
});

describe('<MarkdownToPdf /> — field-sizing feature gate (MIN-4)', () => {
  afterEach(() => {
    // Reset to false (jsdom default) after each test in this block.
    featureDetect.__setHasFieldSizing(false);
  });

  it('when HAS_FIELD_SIZING is true, the autosize effect does NOT set inline height', async () => {
    featureDetect.__setHasFieldSizing(true);
    const user = userEvent.setup();
    render(<MarkdownToPdf />);
    await user.type(getEditor(), 'hello');
    const editor = getEditor();
    // With field-sizing active, the JS path bails out — no inline height set.
    expect(editor.style.height).toBe('');
  });

  it('when HAS_FIELD_SIZING is false, the autosize effect sets inline height', async () => {
    featureDetect.__setHasFieldSizing(false);
    const user = userEvent.setup();
    render(<MarkdownToPdf />);
    await user.type(getEditor(), 'hello');
    const editor = getEditor();
    // With field-sizing inactive, the JS fallback sets inline height.
    // jsdom scrollHeight is 0 so height will be set (may be '0px' or 'auto' reset).
    // The important assertion is that the style was touched, not that it's empty.
    // We verify by checking the effect ran (height property was written).
    expect(editor.style.height).not.toBe('');
  });
});

describe('<MarkdownToPdf /> — auto-save round-trip (MIN-6 Compact preset)', () => {
  it('selecting Compact persists preset as "minimal"', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    render(<MarkdownToPdf />);

    await user.type(getEditor(), 'compact test');
    await user.click(screen.getByRole('radio', {name: 'Compact'}));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    vi.useRealTimers();

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw);
    expect(parsed.data.preset).toBe('minimal');
  });
});
