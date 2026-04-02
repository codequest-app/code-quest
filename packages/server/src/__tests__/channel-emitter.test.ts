import type { SocketEvent } from '@code-quest/shared';
import type { ServerAction } from '@code-quest/summoner';
import { describe, expect, it, vi } from 'vitest';
import type { Channel } from '../socket/channel.ts';
import { ChannelEmitter } from '../socket/channel-emitter.ts';

function fakeChannel(id = 'ch-1'): Channel {
  return { id } as unknown as Channel;
}

function fakeEvent(name: string): SocketEvent {
  return { name, payload: {} };
}

describe('ChannelEmitter', () => {
  describe('on / dispatchEvent', () => {
    it('dispatches to registered handler by event name', () => {
      const emitter = new ChannelEmitter();
      const handler = vi.fn();
      emitter.on('message:result', handler);

      const ch = fakeChannel();
      const se = fakeEvent('message:result');
      emitter.dispatchEvent('ch-1', ch, se);

      expect(handler).toHaveBeenCalledWith('ch-1', ch, se);
    });

    it('does not dispatch unregistered event names', () => {
      const emitter = new ChannelEmitter();
      const handler = vi.fn();
      emitter.on('message:result', handler);

      emitter.dispatchEvent('ch-1', fakeChannel(), fakeEvent('session:init'));

      expect(handler).not.toHaveBeenCalled();
    });

    it('supports multiple subscribers for the same event', () => {
      const emitter = new ChannelEmitter();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      emitter.on('message:result', handler1);
      emitter.on('message:result', handler2);

      const ch = fakeChannel();
      const se = fakeEvent('message:result');
      emitter.dispatchEvent('ch-1', ch, se);

      expect(handler1).toHaveBeenCalledWith('ch-1', ch, se);
      expect(handler2).toHaveBeenCalledWith('ch-1', ch, se);
    });
  });

  describe('onAction / dispatchAction', () => {
    it('dispatches to first handler that returns true', () => {
      const emitter = new ChannelEmitter();
      const handler1 = vi.fn().mockReturnValue(false);
      const handler2 = vi.fn().mockReturnValue(true);
      const handler3 = vi.fn().mockReturnValue(false);
      emitter.onAction(handler1);
      emitter.onAction(handler2);
      emitter.onAction(handler3);

      const ch = fakeChannel();
      const action = { action: 'test' } as unknown as ServerAction;
      emitter.dispatchAction('ch-1', ch, action);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(handler3).not.toHaveBeenCalled();
    });
  });

  describe('onExit / dispatchExit', () => {
    it('dispatches to all exit handlers', () => {
      const emitter = new ChannelEmitter();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      emitter.onExit(handler1);
      emitter.onExit(handler2);

      const ch = fakeChannel();
      emitter.dispatchExit('ch-1', ch, 0);

      expect(handler1).toHaveBeenCalledWith('ch-1', ch, 0);
      expect(handler2).toHaveBeenCalledWith('ch-1', ch, 0);
    });
  });
});
