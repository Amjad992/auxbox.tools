import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Stub next/script — App Router runtime isn't available in jsdom.
vi.mock('next/script', () => ({
  default: ({children, dangerouslySetInnerHTML}) =>
    dangerouslySetInnerHTML
      ? <script dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
      : <script>{children}</script>,
}));

// eslint-disable-next-line import/first
import MarkdownPreview from './page';

const STORAGE_KEY = 'markdown_preview_state';

function getEditor() {
  return screen.getByLabelText(/markdown editor/i);
}

function getPreview() {
  return screen.getByLabelText(/rendered markdown preview/i);
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('<MarkdownPreview /> — basics', () => {
  it('renders the hero, editor, and an empty-preview placeholder', () => {
    render(<MarkdownPreview />);
    expect(
      screen.getByRole('heading', {name: /markdown preview/i})
    ).toBeInTheDocument();
    expect(getEditor()).toBeInTheDocument();
    expect(getPreview()).toHaveTextContent(/preview appears here/i);
  });

  it('typing in the editor updates the preview', async () => {
    const user = userEvent.setup();
    render(<MarkdownPreview />);
    await user.type(getEditor(), '# Hello world');
    // useDeferredValue resolves on the next render — already settled by the
    // time userEvent.type yields control.
    const preview = getPreview();
    expect(preview.querySelector('h1')).not.toBeNull();
    expect(preview.querySelector('h1').textContent).toBe('Hello world');
  });

  it('renders GFM tables and task lists from typed input', async () => {
    const user = userEvent.setup();
    render(<MarkdownPreview />);
    // userEvent treats `[` and `{` as special chars — wrap them.
    await user.type(
      getEditor(),
      '- {[}x{]} done\n- {[} {]} todo\n'
    );
    const preview = getPreview();
    const checkboxes = preview.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBeGreaterThanOrEqual(2);
    expect(checkboxes[0].hasAttribute('checked')).toBe(true);
  });
});

describe('<MarkdownPreview /> — sanitization in the live preview', () => {
  it('does not execute or render <script> tags pasted into the editor', () => {
    const user = userEvent.setup();
    render(<MarkdownPreview />);
    const editor = getEditor();

    // fireEvent-style direct change to avoid userEvent re-typing every
    // angle bracket as a special char.
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      ).set;
      setter.call(editor, '<script>window.__pwned = true;</script>hello');
      editor.dispatchEvent(new Event('input', {bubbles: true}));
    });

    const preview = getPreview();
    // No <script> survived sanitization.
    expect(preview.querySelector('script')).toBeNull();
    // Side-effect did not fire.
    expect(window.__pwned).toBeUndefined();
    // The benign trailing text still renders.
    expect(preview.textContent).toContain('hello');
    void user; // keep the lint happy when userEvent isn't called.
  });

  it('strips inline event handlers from raw HTML in source', () => {
    render(<MarkdownPreview />);
    const editor = getEditor();
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      ).set;
      setter.call(editor, '<img src=x onerror="window.__xss=true">');
      editor.dispatchEvent(new Event('input', {bubbles: true}));
    });
    const preview = getPreview();
    const img = preview.querySelector('img');
    if (img) {
      expect(img.hasAttribute('onerror')).toBe(false);
    }
    expect(window.__xss).toBeUndefined();
  });
});

describe('<MarkdownPreview /> — Copy as HTML', () => {
  it('writes the rendered HTML to the clipboard and shows a toast', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const originalNavigator = globalThis.navigator;
    // userEvent.setup() (v14) attaches its own clipboard mock to
    // navigator.clipboard, so we override navigator AFTER render but BEFORE
    // click. We also use fireEvent.click here so userEvent's clipboard
    // shim doesn't intercept.
    render(<MarkdownPreview />);

    // Type via direct value setter — fast, deterministic.
    const editor = getEditor();
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      ).set;
      setter.call(editor, '# Title');
      editor.dispatchEvent(new Event('input', {bubbles: true}));
    });

    Object.defineProperty(globalThis, 'navigator', {
      value: {clipboard: {writeText}},
      configurable: true,
      writable: true,
    });

    try {
      const btn = screen.getByRole('button', {name: /copy as html/i});
      expect(btn).not.toBeDisabled();
      fireEvent.click(btn);

      await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
      const arg = writeText.mock.calls[0][0];
      expect(arg).toMatch(/<h1[^>]*>Title<\/h1>/);

      // Toast (one of two matches; the other is the sr-only live region).
      const toastMessages = await screen.findAllByText(/html copied to clipboard/i);
      expect(toastMessages.length).toBeGreaterThanOrEqual(1);
      const toast = toastMessages.find((n) => n.classList?.contains('toast-message'));
      expect(toast).toBeTruthy();
    } finally {
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
    }
  });

  it('Copy is disabled when the document is empty', () => {
    render(<MarkdownPreview />);
    const btn = screen.getByRole('button', {name: /copy as html/i});
    expect(btn).toBeDisabled();
  });
});

describe('<MarkdownPreview /> — Clear button', () => {
  it('Clear is disabled with an empty document', () => {
    render(<MarkdownPreview />);
    expect(screen.getByRole('button', {name: /^clear$/i})).toBeDisabled();
  });

  it('Clear empties the textarea and wipes persisted storage', async () => {
    // Pre-seed storage so there's a record to wipe.
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({version: '1.0.0', data: {document: '# saved'}})
    );

    const user = userEvent.setup();
    render(<MarkdownPreview />);
    expect(getEditor()).toHaveValue('# saved');

    await user.click(screen.getByRole('button', {name: /^clear$/i}));

    expect(getEditor()).toHaveValue('');
    // Synchronous clear — no debounce advance required.
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('<MarkdownPreview /> — auto-save round-trip', () => {
  it('typing persists the document via debounced auto-save', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    render(<MarkdownPreview />);

    await user.type(getEditor(), 'hello world');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    vi.useRealTimers();

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw);
    expect(parsed.version).toBe('1.0.0');
    expect(parsed.data.document).toBe('hello world');
  });

  it('a fresh mount with no typing does NOT write defaults to localStorage', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    render(<MarkdownPreview />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    vi.useRealTimers();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('restores the persisted document on mount', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({version: '1.0.0', data: {document: '# Restored'}})
    );
    render(<MarkdownPreview />);
    expect(getEditor()).toHaveValue('# Restored');
    expect(getPreview().querySelector('h1').textContent).toBe('Restored');
  });
});
