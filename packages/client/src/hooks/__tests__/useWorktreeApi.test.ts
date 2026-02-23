import { describe, expect, it, vi } from 'vitest';
import { createWorktreeApi } from '../useWorktreeApi';

describe('createWorktreeApi', () => {
  it('create emits worktree:create and resolves on ack', async () => {
    const emit = vi.fn(
      (_event: string, _data: unknown, callback: (result: { ok: boolean }) => void) => {
        callback({ ok: true });
      },
    );
    const api = createWorktreeApi(emit);
    if (!api) throw new Error('expected api');
    const result = await api.create('feat', 'feature/x');
    expect(emit).toHaveBeenCalledWith(
      'worktree:create',
      { name: 'feat', branch: 'feature/x' },
      expect.any(Function),
    );
    expect(result).toEqual({ ok: true });
  });

  it('remove emits worktree:remove and resolves on ack', async () => {
    const emit = vi.fn(
      (_event: string, _data: unknown, callback: (result: { ok: boolean }) => void) => {
        callback({ ok: true });
      },
    );
    const api = createWorktreeApi(emit);
    if (!api) throw new Error('expected api');
    const result = await api.remove('feat');
    expect(emit).toHaveBeenCalledWith('worktree:remove', { name: 'feat' }, expect.any(Function));
    expect(result).toEqual({ ok: true });
  });

  it('returns null when emit is null', () => {
    const api = createWorktreeApi(null);
    expect(api).toBeNull();
  });
});
