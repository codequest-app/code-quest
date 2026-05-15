import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { TransportHandle } from '@code-quest/schemas';
import { auth, heartbeat, NullAuthenticator, WsTransport, wsAdapter } from '@code-quest/transport';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocket } from 'ws';

describe('WsTransport heartbeat', () => {
  let httpServer: HttpServer;
  let handle: TransportHandle | undefined;
  const clients: WebSocket[] = [];

  function url(): string {
    const { port } = httpServer.address() as AddressInfo;
    return `ws://127.0.0.1:${port}/ws`;
  }

  beforeEach(async () => {
    httpServer = createServer();
    await new Promise<void>((r) => httpServer.listen(0, r));
  });

  afterEach(async () => {
    vi.useRealTimers();
    for (const c of clients) {
      if (c.readyState === c.OPEN || c.readyState === c.CONNECTING) c.close();
    }
    clients.length = 0;
    if (handle) {
      await handle.close();
      handle = undefined;
    }
    httpServer.closeAllConnections();
    await new Promise<void>((r) => httpServer.close(() => r()));
  });

  it('server pings each client at the configured interval (default 25s)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const server = new WsTransport(wsAdapter());
    server.route(
      '/ws',
      [auth(new NullAuthenticator()), heartbeat({ pingIntervalMs: 25_000 })],
      () => {},
    );
    handle = server.attach(httpServer);

    const ws = new WebSocket(url());
    clients.push(ws);
    await new Promise<void>((r) => ws.once('open', () => r()));

    const pingP = new Promise<void>((resolve) => ws.on('ping', () => resolve()));
    vi.advanceTimersByTime(25_001);
    await pingP;
  });

  it('client envelope ping receives pong', async () => {
    const server = new WsTransport(wsAdapter());
    server.route('/ws', [auth(new NullAuthenticator())], () => {});
    handle = server.attach(httpServer);

    const ws = new WebSocket(url());
    clients.push(ws);
    await new Promise<void>((r) => ws.once('open', () => r()));

    const recv = new Promise<{ kind: string }>((resolve) => {
      ws.once('message', (raw) => resolve(JSON.parse(raw.toString())));
    });
    ws.send(JSON.stringify({ kind: 'ping' }));
    expect(await recv).toEqual({ kind: 'pong' });
  });

  it('idle timeout closes the connection with code 4000', async () => {
    const server = new WsTransport(wsAdapter());
    server.route(
      '/ws',
      [auth(new NullAuthenticator()), heartbeat({ pingIntervalMs: 60_000, idleTimeoutMs: 80 })],
      () => {},
    );
    handle = server.attach(httpServer);

    const ws = new WebSocket(url());
    clients.push(ws);
    await new Promise<void>((r) => ws.once('open', () => r()));

    const code = await new Promise<number>((resolve) => {
      ws.once('close', (c) => resolve(c));
    });
    expect(code).toBe(4000);
  });
});
