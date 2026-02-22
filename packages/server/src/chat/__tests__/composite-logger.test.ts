import 'reflect-metadata';
import { Container } from 'inversify';
import { describe, expect, it, vi } from 'vitest';
import { TYPES } from '../../types.symbols.ts';
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

  describe('DI multi-binding', () => {
    it('should resolve ChatLogger as CompositeChatLogger with all bound ChatLoggerItem loggers', () => {
      const container = new Container();
      const a = createMockLogger();
      const b = createMockLogger();

      container.bind<ChatLogger>(TYPES.ChatLoggerItem).toConstantValue(a);
      container.bind<ChatLogger>(TYPES.ChatLoggerItem).toConstantValue(b);
      container
        .bind<ChatLogger>(TYPES.ChatLogger)
        .toDynamicValue((context) => {
          const loggers = context.getAll<ChatLogger>(TYPES.ChatLoggerItem);
          return new CompositeChatLogger(loggers);
        })
        .inSingletonScope();

      const logger = container.get<ChatLogger>(TYPES.ChatLogger);
      const metadata = { provider: 'claude', command: 'claude', args: [], mode: 'print' };
      logger.createSession('s1', metadata);

      expect(a.createSession).toHaveBeenCalledWith('s1', metadata);
      expect(b.createSession).toHaveBeenCalledWith('s1', metadata);
    });

    it('should allow adding loggers via additional bindings', () => {
      const container = new Container();
      const a = createMockLogger();

      container.bind<ChatLogger>(TYPES.ChatLoggerItem).toConstantValue(a);
      container
        .bind<ChatLogger>(TYPES.ChatLogger)
        .toDynamicValue((context) => {
          const loggers = context.getAll<ChatLogger>(TYPES.ChatLoggerItem);
          return new CompositeChatLogger(loggers);
        })
        .inSingletonScope();

      const logger = container.get<ChatLogger>(TYPES.ChatLogger);
      logger.log('s1', { dir: 'in', type: 'user_message', data: { message: 'hi' } });

      expect(a.log).toHaveBeenCalledOnce();
    });
  });
});
