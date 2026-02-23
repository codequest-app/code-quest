import { describe, expect, it, vi } from 'vitest';
import { createTavernChatHandler } from '../useTavernChat';

describe('createTavernChatHandler', () => {
  it('emits tavern:message and resolves with reply', async () => {
    const emit = vi.fn((_event: string, _msg: string, callback: (reply: string) => void) => {
      callback('Bartender says hi');
    });
    const handler = createTavernChatHandler(emit);
    if (!handler) throw new Error('expected handler');
    const reply = await handler('Hello');
    expect(emit).toHaveBeenCalledWith('tavern:message', 'Hello', expect.any(Function));
    expect(reply).toBe('Bartender says hi');
  });

  it('rejects on timeout', async () => {
    vi.useFakeTimers();
    const emit = vi.fn();
    const handler = createTavernChatHandler(emit, 100);
    if (!handler) throw new Error('expected handler');
    const promise = handler('Hello');
    vi.advanceTimersByTime(101);
    await expect(promise).rejects.toThrow('timeout');
    vi.useRealTimers();
  });

  it('returns null handler when emit is null', () => {
    const handler = createTavernChatHandler(null);
    expect(handler).toBeNull();
  });
});
