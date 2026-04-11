import { describe, expect, it, vi } from 'vitest';
import type { Channel } from '../socket/channel.ts';
import { ChannelEmitter } from '../socket/channel-emitter.ts';

function fakeChannel(id = 'ch-1'): Channel {
  return { id } as unknown as Channel;
}

describe('ChannelEmitter', () => {
  describe('on / dispatch', () => {
    it('dispatches to registered handler by event name', () => {
      const emitter = new ChannelEmitter();
      const handler = vi.fn();
      emitter.on('message:result', handler);

      const ch = fakeChannel();
      emitter.dispatch('message:result', ch, { some: 'data' });

      expect(handler).toHaveBeenCalledWith(ch, { some: 'data' }, undefined, undefined);
    });

    it('does not dispatch unregistered event names', () => {
      const emitter = new ChannelEmitter();
      const handler = vi.fn();
      emitter.on('message:result', handler);

      emitter.dispatch('session:init', fakeChannel(), {});

      expect(handler).not.toHaveBeenCalled();
    });

    it('supports multiple subscribers for the same event', () => {
      const emitter = new ChannelEmitter();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      emitter.on('message:result', handler1);
      emitter.on('message:result', handler2);

      const ch = fakeChannel();
      emitter.dispatch('message:result', ch, { some: 'data' });

      expect(handler1).toHaveBeenCalledWith(ch, { some: 'data' }, undefined, undefined);
      expect(handler2).toHaveBeenCalledWith(ch, { some: 'data' }, undefined, undefined);
    });
  });

  describe('async handler error safety', () => {
    it('catches errors from async handlers without unhandled rejection', async () => {
      const emitter = new ChannelEmitter();
      const error = new Error('async boom');
      emitter.on('test:event', async () => {
        throw error;
      });

      const ch = fakeChannel();
      emitter.dispatch('test:event', ch, {});

      // Give the microtask queue a tick so the promise rejection is handled
      await new Promise((r) => setTimeout(r, 0));
      // If we get here without unhandled rejection, the test passes
    });
  });

  describe('channel:exit dispatch', () => {
    it('dispatches to all exit handlers', () => {
      const emitter = new ChannelEmitter();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      emitter.on('channel:exit', handler1);
      emitter.on('channel:exit', handler2);

      const ch = fakeChannel();
      emitter.dispatch('channel:exit', ch, { code: 0 });

      expect(handler1).toHaveBeenCalledWith(ch, { code: 0 }, undefined, undefined);
      expect(handler2).toHaveBeenCalledWith(ch, { code: 0 }, undefined, undefined);
    });
  });
});
