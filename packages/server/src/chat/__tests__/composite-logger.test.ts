import { describe, expect, it, vi } from 'vitest';
import { CompositeChatLogger } from '../composite-logger.ts';
import type { ChatLogger } from '../logger.ts';

function createMockLogger(): ChatLogger {
  return {
    createSession: vi.fn(),
    log: vi.fn(),
    close: vi.fn(),
  };
}

describe('CompositeChatLogger', () => {
  it('should delegate createSession to all loggers', () => {
    const a = createMockLogger();
    const b = createMockLogger();
    const composite = new CompositeChatLogger([a, b]);

    const metadata = { provider: 'claude', command: 'claude', args: [], mode: 'print' };
    composite.createSession('s1', metadata);

    expect(a.createSession).toHaveBeenCalledWith('s1', metadata);
    expect(b.createSession).toHaveBeenCalledWith('s1', metadata);
  });

  it('should delegate log to all loggers', () => {
    const a = createMockLogger();
    const b = createMockLogger();
    const composite = new CompositeChatLogger([a, b]);

    const entry = { dir: 'in' as const, type: 'user_message', data: { message: 'hi' } };
    composite.log('s1', entry);

    expect(a.log).toHaveBeenCalledWith('s1', entry);
    expect(b.log).toHaveBeenCalledWith('s1', entry);
  });

  it('should delegate close to all loggers', () => {
    const a = createMockLogger();
    const b = createMockLogger();
    const composite = new CompositeChatLogger([a, b]);

    composite.close('s1');

    expect(a.close).toHaveBeenCalledWith('s1');
    expect(b.close).toHaveBeenCalledWith('s1');
  });
});
