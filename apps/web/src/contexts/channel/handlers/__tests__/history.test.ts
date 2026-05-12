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

describe('replayHandlers', () => {
  it('excludes transient stream events from replay handlers', async () => {
    const { replayHandlers } = await import('../handler-sets.ts');
    const transient = [
      'stream:chunk',
      'stream:block_start',
      'stream:block_stop',
      'stream:end',
      'stream:message_start',
      'stream:message_delta',
    ];
    for (const name of transient) {
      expect(replayHandlers[name]).toBeUndefined();
    }
  });

  it('keeps stream events that carry unique content in replay handlers', async () => {
    const { replayHandlers } = await import('../handler-sets.ts');
    expect(replayHandlers['stream:text']).toBeDefined();
    expect(replayHandlers['stream:tool_summary']).toBeDefined();
    expect(replayHandlers['stream:compaction']).toBeDefined();
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
