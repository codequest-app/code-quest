import { describe, expect, it } from 'vitest';
import { messageHandlers } from '../handler-sets.ts';

describe('messageHandlers', () => {
  it('includes message event handlers', () => {
    expect('message:assistant' in messageHandlers).toBe(true);
    expect('message:user' in messageHandlers).toBe(true);
  });

  it('includes streaming handlers', () => {
    expect('stream:chunk' in messageHandlers).toBe(true);
    expect('stream:end' in messageHandlers).toBe(true);
  });

  it('excludes session lifecycle events that must not replay', () => {
    expect('session:closed' in messageHandlers).toBe(false);
    expect('session:status' in messageHandlers).toBe(false);
    expect('disconnect' in messageHandlers).toBe(false);
  });
});

describe('messageHandlers', () => {
  it('includes message event handlers', () => {
    expect('message:assistant' in messageHandlers).toBe(true);
    expect('message:user' in messageHandlers).toBe(true);
  });

  it('includes streaming handlers', () => {
    expect('stream:chunk' in messageHandlers).toBe(true);
    expect('stream:end' in messageHandlers).toBe(true);
  });

  it('excludes session lifecycle events that must not replay', () => {
    expect('session:closed' in messageHandlers).toBe(false);
    expect('session:status' in messageHandlers).toBe(false);
    expect('disconnect' in messageHandlers).toBe(false);
  });

  it('messageHandlers and messageHandlers are identical', () => {
    expect(Object.keys(messageHandlers).sort()).toEqual(Object.keys(messageHandlers).sort());
  });
});
