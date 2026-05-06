import { describe, expect, it } from 'vitest';
import { historyHandlers, liveHandlers } from '../handler-sets.ts';

describe('liveHandlers', () => {
  it('includes message event handlers', () => {
    expect('message:assistant' in liveHandlers).toBe(true);
    expect('message:user' in liveHandlers).toBe(true);
  });

  it('includes streaming handlers', () => {
    expect('stream:chunk' in liveHandlers).toBe(true);
    expect('stream:end' in liveHandlers).toBe(true);
  });

  it('excludes session lifecycle events that must not replay', () => {
    expect('session:closed' in liveHandlers).toBe(false);
    expect('session:status' in liveHandlers).toBe(false);
    expect('disconnect' in liveHandlers).toBe(false);
  });
});

describe('historyHandlers', () => {
  it('includes message event handlers', () => {
    expect('message:assistant' in historyHandlers).toBe(true);
    expect('message:user' in historyHandlers).toBe(true);
  });

  it('includes streaming handlers', () => {
    expect('stream:chunk' in historyHandlers).toBe(true);
    expect('stream:end' in historyHandlers).toBe(true);
  });

  it('excludes session lifecycle events that must not replay', () => {
    expect('session:closed' in historyHandlers).toBe(false);
    expect('session:status' in historyHandlers).toBe(false);
    expect('disconnect' in historyHandlers).toBe(false);
  });

  it('liveHandlers and historyHandlers are identical', () => {
    expect(Object.keys(liveHandlers).sort()).toEqual(Object.keys(historyHandlers).sort());
  });
});
