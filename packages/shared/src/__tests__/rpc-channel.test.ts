import { describe, expect, it } from 'vitest';
import type { RpcSocket } from '../transport/rpc-channel.ts';
import { RpcChannel } from '../transport/rpc-channel.ts';

function createPair(): {
  client: RpcChannel;
  server: RpcChannel;
  clientSocket: RpcSocket;
  serverSocket: RpcSocket;
} {
  let clientHandler: ((data: string) => void) | null = null;
  let serverHandler: ((data: string) => void) | null = null;
  let _clientCloseHandler: (() => void) | null = null;
  let _serverCloseHandler: (() => void) | null = null;

  const clientSocket: RpcSocket = {
    send: (data) => serverHandler?.(data),
    onMessage: (fn) => {
      clientHandler = fn;
    },
    onClose: (fn) => {
      _clientCloseHandler = fn;
    },
  };

  const serverSocket: RpcSocket = {
    send: (data) => clientHandler?.(data),
    onMessage: (fn) => {
      serverHandler = fn;
    },
    onClose: (fn) => {
      _serverCloseHandler = fn;
    },
  };

  const client = new RpcChannel(clientSocket);
  const server = new RpcChannel(serverSocket);

  return { client, server, clientSocket, serverSocket };
}

describe('RpcChannel', () => {
  describe('request/response', () => {
    it('sends request and resolves with response', async () => {
      const { client, server } = createPair();

      server.onRequest('echo', async (data) => data);

      const result = await client.request('echo', { msg: 'hi' });
      expect(result).toEqual({ msg: 'hi' });
    });

    it('rejects when handler throws', async () => {
      const { client, server } = createPair();

      server.onRequest('fail', async () => {
        throw new Error('boom');
      });

      await expect(client.request('fail', {})).rejects.toThrow('boom');
    });

    it('rejects with unknown method when no handler registered', async () => {
      const { client } = createPair();

      await expect(client.request('nope', {})).rejects.toThrow('Unknown method: nope');
    });

    it('rejects on timeout', async () => {
      const fastClient = new RpcChannel(
        { send: () => {}, onMessage: () => {}, onClose: () => {} },
        { requestTimeoutMs: 50 },
      );

      await expect(fastClient.request('slow', {})).rejects.toThrow('RPC timeout');
    });
  });

  describe('events', () => {
    it('emit sends event and on receives it', async () => {
      const { client, server } = createPair();

      const received: unknown[] = [];
      server.on('hello', (data) => received.push(data));

      client.emit('hello', { text: 'world' });
      expect(received).toEqual([{ text: 'world' }]);
    });

    it('on returns unsubscribe function', () => {
      const { client, server } = createPair();

      const received: unknown[] = [];
      const unsub = server.on('hello', (data) => received.push(data));

      client.emit('hello', 'a');
      unsub();
      client.emit('hello', 'b');

      expect(received).toEqual(['a']);
    });
  });

  describe('close', () => {
    it('rejects all pending requests on close', async () => {
      const sent: string[] = [];
      const channel = new RpcChannel(
        { send: (d) => sent.push(d), onMessage: () => {}, onClose: () => {} },
        { requestTimeoutMs: 5000 },
      );

      const p = channel.request('slow', {});
      channel.close();

      await expect(p).rejects.toThrow('RpcChannel closed');
    });

    it('fires disconnect event on close', () => {
      const { client } = createPair();

      let disconnected = false;
      client.on('disconnect', () => {
        disconnected = true;
      });
      client.close();

      expect(disconnected).toBe(true);
    });
  });

  describe('bidirectional', () => {
    it('both sides can send requests to each other', async () => {
      const { client, server } = createPair();

      client.onRequest('clientMethod', async (data) => ({ from: 'client', ...(data as object) }));
      server.onRequest('serverMethod', async (data) => ({ from: 'server', ...(data as object) }));

      const r1 = await client.request('serverMethod', { q: 1 });
      expect(r1).toEqual({ from: 'server', q: 1 });

      const r2 = await server.request('clientMethod', { q: 2 });
      expect(r2).toEqual({ from: 'client', q: 2 });
    });
  });
});
