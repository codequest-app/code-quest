import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { TransportHandle, TypedSocket } from '@code-quest/shared';
import { auth, NullAuthenticator, WsTransport, wsAdapter } from '@code-quest/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocket } from 'ws';
import { SocketIoTransport } from '../../transport/socket-io-transport.ts';
import { ChannelEmitter } from '../channel-emitter.ts';

vi.unmock('socket.io-client');
const { io: ioClient } =
  await vi.importActual<typeof import('socket.io-client')>('socket.io-client');

/**
 * Verifies the multi-transport coexistence story: a single ChannelEmitter
 * receives connections from BOTH SocketIoTransport and WsTransport when both
 * are attached to the same http.Server.
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
    const wsTransport = new WsTransport(wsAdapter());
    wsTransport.route('/ws', [auth(new NullAuthenticator())], () => {});

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
    await vi.waitFor(() => expect(accepted).toHaveLength(2));
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
    const wsTransport = new WsTransport(wsAdapter());
    wsTransport.route('/ws', [auth(new NullAuthenticator())], () => {});
    handles.push(wsTransport.attach(httpServer));

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
