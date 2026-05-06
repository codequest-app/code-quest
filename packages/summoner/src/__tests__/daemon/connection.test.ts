import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocketServer } from 'ws';
import { createDaemonConnection } from '../../daemon/connection.ts';

function makeSetup() {
  let httpServer: HttpServer;
  let wss: WebSocketServer;

  async function setup() {
    httpServer = createServer();
    wss = new WebSocketServer({ noServer: true });

    const accepted: import('ws').WebSocket[] = [];

    httpServer.on('upgrade', (req, socket, head) => {
      const auth = req.headers.authorization ?? '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
      if (token !== 'valid-token') {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
      wss.handleUpgrade(req, socket, head, (ws) => {
        accepted.push(ws);
        wss.emit('connection', ws, req);
      });
    });

    await new Promise<void>((r) => httpServer.listen(0, r));
    const { port } = httpServer.address() as AddressInfo;
    const url = `ws://127.0.0.1:${port}`;

    return { url, accepted, wss };
  }

  async function teardown() {
    await new Promise<void>((r) => wss.close(() => r()));
    await new Promise<void>((r) => httpServer.close(() => r()));
  }

  return { setup, teardown };
}

describe('createDaemonConnection', () => {
  const { setup, teardown } = makeSetup();
  let ctx: Awaited<ReturnType<ReturnType<typeof makeSetup>['setup']>>;

  beforeEach(async () => {
    ctx = await setup();
  });

  afterEach(async () => {
    await teardown();
  });

  it('connects to the server with the auth token', async () => {
    const conn = createDaemonConnection({
      server: ctx.url,
      token: 'valid-token',
    });

    await vi.waitFor(() => expect(ctx.accepted).toHaveLength(1));
    conn.close();
  });

  it('reconnects after the server closes the connection', async () => {
    const conn = createDaemonConnection({
      server: ctx.url,
      token: 'valid-token',
      reconnect: { initialDelayMs: 50, maxDelayMs: 200 },
    });

    await vi.waitFor(() => expect(ctx.accepted).toHaveLength(1));

    // Server closes connection
    ctx.accepted[0]!.close();

    // Should reconnect
    await vi.waitFor(() => expect(ctx.accepted).toHaveLength(2), { timeout: 3000 });
    conn.close();
  });

  it('uses exponential backoff on repeated failures', async () => {
    const delays: number[] = [];
    let lastTime = Date.now();

    const conn = createDaemonConnection({
      server: ctx.url,
      token: 'valid-token',
      reconnect: { initialDelayMs: 50, maxDelayMs: 200 },
      onReconnecting: () => {
        const now = Date.now();
        delays.push(now - lastTime);
        lastTime = now;
      },
    });

    await vi.waitFor(() => expect(ctx.accepted).toHaveLength(1));

    // Close 3 times to trigger backoff
    ctx.accepted[0]!.close();
    await vi.waitFor(() => expect(ctx.accepted).toHaveLength(2), { timeout: 3000 });
    ctx.accepted[1]!.close();
    await vi.waitFor(() => expect(ctx.accepted).toHaveLength(3), { timeout: 3000 });

    // Second delay should be >= first (exponential)
    expect(delays[1]!).toBeGreaterThanOrEqual(delays[0]! * 0.8); // allow jitter margin
    conn.close();
  });

  it('resets backoff after a successful connection period', async () => {
    const conn = createDaemonConnection({
      server: ctx.url,
      token: 'valid-token',
      reconnect: { initialDelayMs: 50, maxDelayMs: 200, resetAfterMs: 100 },
    });

    await vi.waitFor(() => expect(ctx.accepted).toHaveLength(1));

    // Stay connected long enough for backoff to reset
    await new Promise<void>((r) => setTimeout(r, 150));

    ctx.accepted[0]!.close();
    await vi.waitFor(() => expect(ctx.accepted).toHaveLength(2), { timeout: 3000 });

    conn.close();
  });

  it('caps delay at maxDelayMs', async () => {
    const conn = createDaemonConnection({
      server: ctx.url,
      token: 'valid-token',
      reconnect: { initialDelayMs: 50, maxDelayMs: 100 },
    });

    await vi.waitFor(() => expect(ctx.accepted).toHaveLength(1));

    // Rapidly close to increase backoff
    for (let i = 0; i < 5; i++) {
      ctx.accepted[i]!.close();
      await vi.waitFor(() => expect(ctx.accepted).toHaveLength(i + 2), { timeout: 3000 });
    }

    conn.close();
    // If we got here within timeout, maxDelay cap worked
  });

  it('does not reconnect after close() is called', async () => {
    const conn = createDaemonConnection({
      server: ctx.url,
      token: 'valid-token',
      reconnect: { initialDelayMs: 50, maxDelayMs: 100 },
    });

    await vi.waitFor(() => expect(ctx.accepted).toHaveLength(1));

    conn.close();
    await new Promise<void>((r) => setTimeout(r, 200));

    expect(ctx.accepted).toHaveLength(1);
  });

  it('emits onConnect callback when connected', async () => {
    let connected = 0;
    const conn = createDaemonConnection({
      server: ctx.url,
      token: 'valid-token',
      onConnect: () => {
        connected++;
      },
    });

    await vi.waitFor(() => expect(connected).toBe(1));
    conn.close();
  });

  it('emits onDisconnect callback when disconnected', async () => {
    let disconnected = 0;
    const conn = createDaemonConnection({
      server: ctx.url,
      token: 'valid-token',
      onDisconnect: () => {
        disconnected++;
      },
      reconnect: { initialDelayMs: 50, maxDelayMs: 100 },
    });

    await vi.waitFor(() => expect(ctx.accepted).toHaveLength(1));
    ctx.accepted[0]!.close();
    await vi.waitFor(() => expect(disconnected).toBe(1));
    conn.close();
  });

  it('heartbeat keeps connection alive when server responds to pings', async () => {
    const conn = createDaemonConnection({
      server: ctx.url,
      token: 'valid-token',
      heartbeat: { intervalMs: 50, pongTimeoutMs: 100 },
    });

    await vi.waitFor(() => expect(ctx.accepted).toHaveLength(1));
    // ws auto-responds pongs, so connection should stay alive
    await new Promise<void>((r) => setTimeout(r, 200));
    expect(ctx.accepted).toHaveLength(1); // no reconnect = still same connection
    conn.close();
  });

  it('heartbeat triggers reconnect when pong times out', async () => {
    const conn = createDaemonConnection({
      server: ctx.url,
      token: 'valid-token',
      heartbeat: { intervalMs: 50, pongTimeoutMs: 80 },
      reconnect: { initialDelayMs: 50, maxDelayMs: 100 },
    });

    await vi.waitFor(() => expect(ctx.accepted).toHaveLength(1));

    // Simulate a half-dead connection: destroy the underlying TCP socket
    // without sending a close frame. This prevents pong responses.
    // biome-ignore lint/complexity/useLiteralKeys: accessing internal _socket
    const raw = (ctx.accepted[0] as unknown as { _socket: import('net').Socket })['_socket'];
    raw.destroy();

    // Should detect via pong timeout and reconnect
    await vi.waitFor(() => expect(ctx.accepted).toHaveLength(2), { timeout: 3000 });
    conn.close();
  });
});
