import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {copyToClipboard} from './hooks';

// jsdom does not implement document.execCommand. Define it once so vi.spyOn can
// replace it per test. The function is a no-op by default.
if (!document.execCommand) {
  document.execCommand = () => false;
}

describe('copyToClipboard', () => {
  describe('modern path (navigator.clipboard.writeText)', () => {
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
      const result = await copyToClipboard('abc123');
      expect(result).toBe(true);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('abc123');
    });

    it('falls through to legacy path when writeText rejects', async () => {
      navigator.clipboard.writeText.mockRejectedValueOnce(new Error('denied'));
      // With document.execCommand stubbed to return true, legacy succeeds.
      const execCommand = vi.spyOn(document, 'execCommand').mockReturnValue(true);
      const result = await copyToClipboard('fallback');
      expect(result).toBe(true);
      execCommand.mockRestore();
    });
  });

  describe('legacy path (document.execCommand)', () => {
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
  });

  it('returns false for empty or falsy text', async () => {
    expect(await copyToClipboard('')).toBe(false);
    expect(await copyToClipboard(null)).toBe(false);
    expect(await copyToClipboard(undefined)).toBe(false);
  });
});
