import type { SocketEvent } from '@code-quest/shared';
import type { ServerAction } from '@code-quest/summoner';
import { describe, expect, it, vi } from 'vitest';
import type { Channel } from '../socket/channel.ts';
import { ChannelEventRouter } from '../socket/channel-event-router.ts';

function fakeChannel(id = 'ch-1'): Channel {
  return { id } as unknown as Channel;
}

function fakeEvent(name: string): SocketEvent {
  return { name, payload: {} };
}

describe('ChannelEventRouter', () => {
  describe('onEvent / dispatchEvent', () => {
    it('dispatches to registered handler by event name', () => {
      const router = new ChannelEventRouter();
      const handler = vi.fn();
      router.onEvent('message:result', handler);

      const ch = fakeChannel();
      const se = fakeEvent('message:result');
      router.dispatchEvent('ch-1', ch, se);

      expect(handler).toHaveBeenCalledWith('ch-1', ch, se);
    });

    it('does not dispatch unregistered event names', () => {
      const router = new ChannelEventRouter();
      const handler = vi.fn();
      router.onEvent('message:result', handler);

      router.dispatchEvent('ch-1', fakeChannel(), fakeEvent('session:init'));

      expect(handler).not.toHaveBeenCalled();
    });

    it('supports multiple subscribers for the same event', () => {
      const router = new ChannelEventRouter();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      router.onEvent('message:result', handler1);
      router.onEvent('message:result', handler2);

      const ch = fakeChannel();
      const se = fakeEvent('message:result');
      router.dispatchEvent('ch-1', ch, se);

      expect(handler1).toHaveBeenCalledWith('ch-1', ch, se);
      expect(handler2).toHaveBeenCalledWith('ch-1', ch, se);
    });
  });

  describe('onAction / dispatchAction', () => {
    it('dispatches to first handler that returns true', () => {
      const router = new ChannelEventRouter();
      const handler1 = vi.fn().mockReturnValue(false);
      const handler2 = vi.fn().mockReturnValue(true);
      const handler3 = vi.fn().mockReturnValue(false);
      router.onAction(handler1);
      router.onAction(handler2);
      router.onAction(handler3);

      const ch = fakeChannel();
      const action = { action: 'test' } as unknown as ServerAction;
      router.dispatchAction('ch-1', ch, action);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(handler3).not.toHaveBeenCalled();
    });
  });

  describe('onExit / dispatchExit', () => {
    it('dispatches to all exit handlers', () => {
      const router = new ChannelEventRouter();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      router.onExit(handler1);
      router.onExit(handler2);

      const ch = fakeChannel();
      router.dispatchExit('ch-1', ch, 0);

      expect(handler1).toHaveBeenCalledWith('ch-1', ch, 0);
      expect(handler2).toHaveBeenCalledWith('ch-1', ch, 0);
    });
  });
});
