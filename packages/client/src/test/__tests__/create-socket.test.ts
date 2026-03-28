import { describe, expect, it, vi } from 'vitest';
import { createSocket } from '../../socket/client';

interface TestSocket {
  on: (...args: unknown[]) => void;
  off: (...args: unknown[]) => void;
  emit: (...args: unknown[]) => void;
  connect: () => void;
  disconnect: () => void;
  connected: boolean;
  serverSocket: {
    emit: (...args: unknown[]) => void;
    on: (...args: unknown[]) => void;
  };
}

function testSocket(): TestSocket {
  return createSocket() as unknown as TestSocket;
}

describe('global fake socket', () => {
  it('has basic socket methods', () => {
    const socket = testSocket();
    expect(socket.on).toBeDefined();
    expect(socket.off).toBeDefined();
    expect(socket.emit).toBeDefined();
    expect(socket.connect).toBeDefined();
    expect(socket.disconnect).toBeDefined();
  });

  it('starts connected (autoConnect) and tracks state after disconnect/reconnect', () => {
    const socket = testSocket();
    expect(socket.connected).toBe(true);
    socket.disconnect();
    expect(socket.connected).toBe(false);
    socket.connect();
    expect(socket.connected).toBe(true);
  });

  describe('dual-emitter (client ↔ server)', () => {
    it('exposes serverSocket property', () => {
      const socket = testSocket();
      expect(socket.serverSocket).toBeDefined();
      expect(socket.serverSocket.emit).toBeDefined();
      expect(socket.serverSocket.on).toBeDefined();
    });

    it('client emit triggers server on handler', () => {
      const socket = testSocket();
      const handler = vi.fn();
      socket.serverSocket.on('chat:send', handler);
      socket.emit('chat:send', { message: 'hi' });
      expect(handler).toHaveBeenCalledWith({ message: 'hi' });
    });

    it('server emit triggers client on handler (async)', async () => {
      const socket = testSocket();
      const handler = vi.fn();
      socket.on('message:assistant', handler);
      socket.serverSocket.emit('message:assistant', { content: 'hello' });
      // server → client is async (queueMicrotask)
      await new Promise<void>((r) => queueMicrotask(r));
      expect(handler).toHaveBeenCalledWith({ content: 'hello' });
    });

    it('client emit with ack callback receives server handler return value', () => {
      const socket = testSocket();
      socket.serverSocket.on(
        'session:launch',
        (_payload: unknown, cb: (res: { channelId: string }) => void) => {
          cb({ channelId: 'ch-1' });
        },
      );
      const ack = vi.fn();
      socket.emit('session:launch', {}, ack);
      expect(ack).toHaveBeenCalledWith({ channelId: 'ch-1' });
    });
  });
});
