import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {copyToClipboard} from './clipboard';

// jsdom does not implement document.execCommand. Define it once so vi.spyOn
// can replace it per test. The function is a no-op by default.
if (!document.execCommand) {
  document.execCommand = () => false;
}

describe('copyToClipboard — empty / nullish input', () => {
  it('returns false for empty string', async () => {
    expect(await copyToClipboard('')).toBe(false);
  });

  it('returns false for null', async () => {
    expect(await copyToClipboard(null)).toBe(false);
  });

  it('returns false for undefined', async () => {
    expect(await copyToClipboard(undefined)).toBe(false);
  });
});

describe('copyToClipboard — modern path (navigator.clipboard.writeText)', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when writeText resolves', async () => {
    const result = await copyToClipboard('hello');
    expect(result).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello');
  });

  it('falls through to legacy path when writeText rejects', async () => {
    navigator.clipboard.writeText.mockRejectedValueOnce(new Error('denied'));
    const execCommand = vi.spyOn(document, 'execCommand').mockReturnValue(true);
    const result = await copyToClipboard('fallback-text');
    expect(result).toBe(true);
    execCommand.mockRestore();
  });
});

describe('copyToClipboard — legacy path (document.execCommand)', () => {
  beforeEach(() => {
    // Remove navigator.clipboard to force legacy path.
    Object.defineProperty(globalThis, 'navigator', {
      value: {},
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when execCommand("copy") returns truthy', async () => {
    const execCommand = vi.spyOn(document, 'execCommand').mockReturnValue(true);
    const result = await copyToClipboard('legacy-text');
    expect(result).toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
    execCommand.mockRestore();
  });

  it('returns false when execCommand("copy") returns falsy', async () => {
    const execCommand = vi.spyOn(document, 'execCommand').mockReturnValue(false);
    const result = await copyToClipboard('legacy-text');
    expect(result).toBe(false);
    execCommand.mockRestore();
  });

  it('returns false when both paths fail', async () => {
    const execCommand = vi
      .spyOn(document, 'execCommand')
      .mockImplementation(() => {
        throw new Error('not supported');
      });
    const result = await copyToClipboard('boom');
    expect(result).toBe(false);
    execCommand.mockRestore();
  });

  it('creates an offscreen textarea and removes it afterward', async () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');
    vi.spyOn(document, 'execCommand').mockReturnValue(true);

    await copyToClipboard('check-cleanup');

    // A textarea was appended and then removed.
    expect(appendSpy).toHaveBeenCalledOnce();
    const appended = appendSpy.mock.calls[0][0];
    expect(appended.tagName).toBe('TEXTAREA');
    expect(removeSpy).toHaveBeenCalledWith(appended);

    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
