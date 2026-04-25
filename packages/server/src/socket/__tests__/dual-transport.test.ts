import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocket } from 'ws';
import { NullAuthenticator } from '../authenticator.ts';
import { ChannelEmitter } from '../channel-emitter.ts';
import { SocketIoTransport } from '../socket-io-transport.ts';
import type { TransportHandle } from '../transport.ts';
import type { TypedSocket } from '../types.ts';
import { WsTransport } from '../ws-transport.ts';

vi.unmock('socket.io-client');
const { io: ioClient } =
  await vi.importActual<typeof import('socket.io-client')>('socket.io-client');

/**
 * Verifies the multi-transport coexistence story: a single ChannelEmitter
 * receives connections from BOTH SocketIoTransport and WsTransport when both
 * are attached to the same http.Server. Handlers do not know (and cannot tell)
 * which transport carries any given socket.
 */
describe('Dual transport coexistence', () => {
  let httpServer: HttpServer;
  const handles: TransportHandle[] = [];
  const wsClients: WebSocket[] = [];
  const ioClients: ReturnType<typeof ioClient>[] = [];

  function port(): number {
    return (httpServer.address() as AddressInfo).port;
  }

  beforeEach(async () => {
    // Default request handler: anything not claimed by a transport upgrade
    // returns 404. Mirrors how express would behave behind these transports.
    httpServer = createServer((_req, res) => {
      res.statusCode = 404;
      res.end();
    });
    await new Promise<void>((r) => httpServer.listen(0, r));
  });

  afterEach(async () => {
    for (const c of wsClients) {
      if (c.readyState === c.OPEN || c.readyState === c.CONNECTING) c.close();
    }
    wsClients.length = 0;
    for (const c of ioClients) c.disconnect();
    ioClients.length = 0;
    for (const h of handles) await h.close();
    handles.length = 0;
    httpServer.closeAllConnections();
    await new Promise<void>((r) => httpServer.close(() => r()));
  });

  it('a single ChannelEmitter receives connections from both transports', async () => {
    const emitter = new ChannelEmitter();
    const accepted: TypedSocket[] = [];

    const sioTransport = new SocketIoTransport({ authenticator: new NullAuthenticator() });
    const wsTransport = new WsTransport({ authenticator: new NullAuthenticator(), path: '/ws' });

    const sioHandle = sioTransport.attach(httpServer);
    const wsHandle = wsTransport.attach(httpServer);
    handles.push(sioHandle, wsHandle);

    sioHandle.onConnection((s) => {
      emitter.handleConnection(s, () => undefined);
      accepted.push(s);
    });
    wsHandle.onConnection((s) => {
      emitter.handleConnection(s, () => undefined);
      accepted.push(s);
    });

    const sioClient = ioClient(`http://127.0.0.1:${port()}`, { transports: ['websocket'] });
    ioClients.push(sioClient);
    await new Promise<void>((r) => sioClient.on('connect', () => r()));

    const wsClient = new WebSocket(`ws://127.0.0.1:${port()}/ws`);
    wsClients.push(wsClient);
    await new Promise<void>((r) => wsClient.once('open', () => r()));
    await new Promise<void>((r) => setTimeout(r, 30));

    expect(accepted).toHaveLength(2);
    // Broadcasting from emitter reaches both clients regardless of transport.
    const sioRecv = new Promise<void>((resolve) => {
      sioClient.on('system:msg', () => resolve());
    });
    const wsRecv = new Promise<void>((resolve) => {
      wsClient.on('message', (raw) => {
        const env = JSON.parse(raw.toString()) as { event?: string };
        if (env.event === 'system:msg') resolve();
      });
    });

    emitter.broadcastAll('system:msg', { hello: true });
    await Promise.all([sioRecv, wsRecv]);
  });

  it('ws-only mode: /socket.io path receives no transport response', async () => {
    // Only attach WsTransport on /ws; nothing claims /socket.io on the http server.
    const wsTransport = new WsTransport({ authenticator: new NullAuthenticator(), path: '/ws' });
    handles.push(wsTransport.attach(httpServer));

    // Directly probe the path: socket.io's transport polling endpoint is a
    // GET /socket.io/?EIO=4&transport=polling. Without any transport mounted,
    // Node's default http.Server returns 404.
    const status = await new Promise<number>((resolve, reject) => {
      const req = require('node:http').request(
        {
          host: '127.0.0.1',
          port: port(),
          path: '/socket.io/?EIO=4&transport=polling',
          method: 'GET',
          timeout: 1000,
        },
        (res: { statusCode?: number; resume: () => void }) => {
          res.resume();
          resolve(res.statusCode ?? 0);
        },
      );
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy(new Error('probe timeout'));
      });
      req.end();
    });

    expect(status).toBe(404);
  });
});
