import ClipboardJS from 'clipboard';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { copyToClipboard } from '../clipboard.ts';

describe('copyToClipboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses navigator.clipboard.writeText when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    await copyToClipboard('hello');
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('falls back to ClipboardJS.copy when navigator.clipboard is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    const copy = vi.spyOn(ClipboardJS, 'copy').mockReturnValue('hello');

    await copyToClipboard('fallback text');
    expect(copy).toHaveBeenCalledWith('fallback text');
  });

  it('propagates error when ClipboardJS.copy throws', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    vi.spyOn(ClipboardJS, 'copy').mockImplementation(() => {
      throw new Error('copy failed');
    });

    await expect(copyToClipboard('text')).rejects.toThrow('copy failed');
  });

  it('propagates error when navigator.clipboard.writeText rejects (no fallback)', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('not allowed'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    await expect(copyToClipboard('text')).rejects.toThrow('not allowed');
  });
});
