import { ClaudeAdapter, ProcessRunner } from '@code-quest/summoner';
import { FakeProcessProvider } from '@code-quest/summoner/test';
import { describe, expect, it, vi } from 'vitest';
import { Channel } from '../socket/channel.ts';
import { ChannelEmitter } from '../socket/channel-emitter.ts';

function makeChannel(channelId = 'ch-1'): Channel {
  const runner = new ProcessRunner({
    adapter: new ClaudeAdapter(),
    processProvider: new FakeProcessProvider(),
  });
  return new Channel(runner, channelId, 'claude', '/test/cwd');
}

describe('ChannelEmitter', () => {
  describe('on / dispatch', () => {
    it('dispatches to registered handler by event name', () => {
      const emitter = new ChannelEmitter();
      const handler = vi.fn();
      emitter.on('message:result', handler);

      const ch = makeChannel();
      emitter.dispatch('message:result', ch, { some: 'data' });

      expect(handler).toHaveBeenCalledWith(ch, { some: 'data' }, undefined, undefined);
    });

    it('does not dispatch unregistered event names', () => {
      const emitter = new ChannelEmitter();
      const handler = vi.fn();
      emitter.on('message:result', handler);

      emitter.dispatch('session:init', makeChannel(), {});

      expect(handler).not.toHaveBeenCalled();
    });

    it('supports multiple subscribers for the same event', () => {
      const emitter = new ChannelEmitter();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      emitter.on('message:result', handler1);
      emitter.on('message:result', handler2);

      const ch = makeChannel();
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

      const ch = makeChannel();
      emitter.dispatch('test:event', ch, {});

      // setImmediate runs after pending microtasks/rejections are flushed
      await new Promise((r) => setImmediate(r));
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

      const ch = makeChannel();
      emitter.dispatch('channel:exit', ch, { code: 0 });

      expect(handler1).toHaveBeenCalledWith(ch, { code: 0 }, undefined, undefined);
      expect(handler2).toHaveBeenCalledWith(ch, { code: 0 }, undefined, undefined);
    });
  });

  describe('broadcastAll', () => {
    it('fans out to every tracked socket via per-socket emit', () => {
      const emitter = new ChannelEmitter();
      const sockA = { id: 's-a', emit: vi.fn(), on: vi.fn() };
      const sockB = { id: 's-b', emit: vi.fn(), on: vi.fn() };
      emitter.addSocketToChannel('ch-1', sockA);
      emitter.addSocketToChannel('ch-2', sockB);

      emitter.broadcastAll('system:announcement', { msg: 'hello' });

      expect(sockA.emit).toHaveBeenCalledWith('system:announcement', { msg: 'hello' });
      expect(sockB.emit).toHaveBeenCalledWith('system:announcement', { msg: 'hello' });
    });

    it('does not double-send when a socket joined multiple channels', () => {
      const emitter = new ChannelEmitter();
      const sock = { id: 's-1', emit: vi.fn(), on: vi.fn() };
      emitter.addSocketToChannel('ch-1', sock);
      emitter.addSocketToChannel('ch-2', sock);

      emitter.broadcastAll('e', { x: 1 });

      expect(sock.emit).toHaveBeenCalledTimes(1);
      expect(sock.emit).toHaveBeenCalledWith('e', { x: 1 });
    });

    it('is a no-op when no sockets are tracked', () => {
      const emitter = new ChannelEmitter();
      expect(() => emitter.broadcastAll('e', {})).not.toThrow();
    });
  });

  describe('reattachSocket / expireSocket (reconnect support)', () => {
    function makeSocket(id: string) {
      return { id, emit: vi.fn(), on: vi.fn() };
    }

    it('reattachSocket re-adds socket to all previously joined channels', () => {
      const emitter = new ChannelEmitter();
      const sock1 = makeSocket('s-1');
      emitter.addSocketToChannel('ch-1', sock1);
      emitter.addSocketToChannel('ch-2', sock1);
      emitter.removeSocketFromAll('s-1');

      const sock2 = makeSocket('s-2');
      emitter.reattachSocket(sock2, 's-1');

      sock2.emit.mockClear();
      emitter.emit('ch-1', 'ping', {});
      emitter.emit('ch-2', 'ping', {});

      expect(sock2.emit).toHaveBeenCalledTimes(2);
    });

    it('reattachSocket is a no-op when previousSocketId has no stored channels', () => {
      const emitter = new ChannelEmitter();
      const sock = makeSocket('s-new');
      expect(() => emitter.reattachSocket(sock, 's-unknown')).not.toThrow();
      emitter.emit('ch-1', 'ping', {});
      expect(sock.emit).not.toHaveBeenCalled();
    });

    it('removeSocketFromAll preserves socketChannels entry for potential reconnect', () => {
      const emitter = new ChannelEmitter();
      const sock = makeSocket('s-1');
      emitter.addSocketToChannel('ch-1', sock);
      emitter.removeSocketFromAll('s-1');

      const sock2 = makeSocket('s-2');
      emitter.reattachSocket(sock2, 's-1');

      sock2.emit.mockClear();
      emitter.emit('ch-1', 'ping', {});
      expect(sock2.emit).toHaveBeenCalledTimes(1);
    });

    it('expireSocket cleans up socketChannels so reattach no longer works', () => {
      const emitter = new ChannelEmitter();
      const sock = makeSocket('s-1');
      emitter.addSocketToChannel('ch-1', sock);
      emitter.removeSocketFromAll('s-1');
      emitter.expireSocket('s-1');

      const sock2 = makeSocket('s-2');
      emitter.reattachSocket(sock2, 's-1');

      sock2.emit.mockClear();
      emitter.emit('ch-1', 'ping', {});
      expect(sock2.emit).not.toHaveBeenCalled();
    });
  });
});
