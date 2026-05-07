import { describe, expect, it } from 'vitest';
import { initialChannelState } from '@/types/chat';
import { applyHistoryBatch, shouldApplyBatch } from '../history.ts';

describe('shouldApplyBatch', () => {
  it('accepts first batch and stores replayId', () => {
    const ref = { current: null as string | null };
    expect(shouldApplyBatch(ref, 'replay-1')).toBe(true);
    expect(ref.current).toBe('replay-1');
  });

  it('accepts subsequent batches with same replayId', () => {
    const ref = { current: 'replay-1' };
    expect(shouldApplyBatch(ref, 'replay-1')).toBe(true);
  });

  it('rejects batches with different replayId', () => {
    const ref = { current: 'replay-1' };
    expect(shouldApplyBatch(ref, 'replay-2')).toBe(false);
  });
});

describe('applyHistoryBatch', () => {
  const state = initialChannelState('ch-test');

  it('applies known handler events', () => {
    const handler = (s: typeof state) => ({ ...s, statusText: 'applied' as string | null });
    const result = applyHistoryBatch(state, [{ name: 'test:event', payload: {} }], {
      'test:event': handler,
    });
    expect(result.statusText).toBe('applied');
  });

  it('skips unknown events', () => {
    const result = applyHistoryBatch(state, [{ name: 'unknown:event', payload: {} }], {});
    expect(result).toBe(state);
  });
});
