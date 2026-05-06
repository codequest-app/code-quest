import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WebSocket, WebSocketServer } from 'ws';
import { Connection } from '../remote/connection.ts';

/**
 * Setup: httpServer + wss on server side.
 * `daemon` = the WebSocket client that connects in (simulates the remote daemon).
 * `conn`   = Connection wrapping the server-side socket.
 *
 * Real topology: daemon connects → server accepts → Connection(serverSocket).
 * So daemon.send() → conn receives; conn.request() → daemon receives.
 */
function makeSetup() {
  let httpServer: HttpServer;
  let wss: WebSocketServer;
  let conn: Connection | undefined;
  let latestServerWs: import('ws').WebSocket;

  async function setup() {
    conn = undefined;
    httpServer = createServer();
    wss = new WebSocketServer({ noServer: true });

    httpServer.on('upgrade', (req, socket, head) => {
      wss.handleUpgrade(req, socket, head, (ws) => {
        latestServerWs = ws;
        if (!conn) conn = new Connection(ws);
      });
    });

    await new Promise<void>((r) => httpServer.listen(0, r));

    const { port } = httpServer.address() as AddressInfo;
    const daemon = new WebSocket(`ws://127.0.0.1:${port}`);
    await new Promise<void>((r) => daemon.once('open', r));

    await new Promise<void>((r) => setTimeout(r, 10));

    return {
      get conn() {
        return conn!;
      },
      get latestServerWs() {
        return latestServerWs;
      },
      httpServer,
      daemon,
    };
  }

  async function teardown() {
    httpServer.closeAllConnections();
    await new Promise<void>((r) => wss.close(() => r()));
    await new Promise<void>((r) => httpServer.close(() => r()));
  }

  return { setup, teardown };
}

describe('Connection', () => {
  const { setup, teardown } = makeSetup();
  let ctx: Awaited<ReturnType<ReturnType<typeof makeSetup>['setup']>>;

  beforeEach(async () => {
    ctx = await setup();
  });

  afterEach(async () => {
    ctx.daemon.close();
    await teardown();
  });

  it('resolves request when daemon sends a success response', async () => {
    // daemon listens for the request and replies
    ctx.daemon.once('message', (raw) => {
      const req = JSON.parse(raw.toString()) as { id: number };
      ctx.daemon.send(JSON.stringify({ id: req.id, result: { value: 42 } }));
    });

    const result = await ctx.conn.request<{ value: number }>('test/ping', {});
    expect(result).toEqual({ value: 42 });
  });

  it('rejects request when daemon sends an error response', async () => {
    ctx.daemon.once('message', (raw) => {
      const req = JSON.parse(raw.toString()) as { id: number };
      ctx.daemon.send(JSON.stringify({ id: req.id, error: { code: -32000, message: 'oops' } }));
    });

    await expect(ctx.conn.request('test/fail', {})).rejects.toThrow('oops');
  });

  it('delivers notifications to onNotification listeners', async () => {
    const received: unknown[] = [];
    ctx.conn.onNotification((n) => received.push(n));

    ctx.daemon.send(
      JSON.stringify({ method: 'process/stdout', params: { sessionId: 's1', line: 'hello' } }),
    );
    await new Promise<void>((r) => setTimeout(r, 10));

    expect(received).toHaveLength(1);
    expect((received[0] as { method: string }).method).toBe('process/stdout');
  });

  it('ignores malformed notification without params', async () => {
    const received: unknown[] = [];
    ctx.conn.onNotification((n) => received.push(n));

    // Notification with method but no params
    ctx.daemon.send(JSON.stringify({ method: 'process/stdout' }));
    await new Promise<void>((r) => setTimeout(r, 10));

    expect(received).toHaveLength(0);
  });

  it('rejects all pending requests when daemon disconnects', async () => {
    const promise = ctx.conn.request('test/slow', {});
    ctx.daemon.close();

    await expect(promise).rejects.toThrow('Remote daemon disconnected');
  });

  it('calls onDisconnect listeners when daemon closes', async () => {
    let called = false;
    ctx.conn.onDisconnect(() => {
      called = true;
    });

    ctx.daemon.close();
    await new Promise<void>((r) => setTimeout(r, 20));

    expect(called).toBe(true);
  });

  it('onDisconnect returns unsubscribe function', async () => {
    let called = 0;
    const unsubscribe = ctx.conn.onDisconnect(() => {
      called++;
    });

    unsubscribe();
    ctx.daemon.close();
    await new Promise<void>((r) => setTimeout(r, 20));

    expect(called).toBe(0);
  });

  it('rejects immediately when ws is not open', async () => {
    ctx.daemon.close();
    await new Promise<void>((r) => setTimeout(r, 20));

    await expect(ctx.conn.request('test/closed', {})).rejects.toThrow('No remote daemon connected');
  });

  it('replaceSocket restores functionality after disconnect', async () => {
    // Close original daemon
    ctx.daemon.close();
    await new Promise<void>((r) => setTimeout(r, 20));
    expect(ctx.conn.isOpen).toBe(false);

    // Connect a new daemon
    const { port } = ctx.httpServer.address() as import('net').AddressInfo;
    const newDaemon = new WebSocket(`ws://127.0.0.1:${port}`);
    await new Promise<void>((r) => newDaemon.once('open', r));
    await new Promise<void>((r) => setTimeout(r, 10));

    // Get the server-side socket for the new daemon
    const newServerWs = ctx.latestServerWs;

    // Replace socket
    ctx.conn.replaceSocket(newServerWs);
    expect(ctx.conn.isOpen).toBe(true);

    // Verify request/response works
    newDaemon.once('message', (raw) => {
      const req = JSON.parse(raw.toString()) as { id: number };
      newDaemon.send(JSON.stringify({ id: req.id, result: { ok: true } }));
    });

    const result = await ctx.conn.request('test/ping', {});
    expect(result).toEqual({ ok: true });

    newDaemon.close();
  });

  it('replaceSocket removes listeners from old socket', async () => {
    const oldDaemon = ctx.daemon;
    let disconnectCount = 0;
    ctx.conn.onDisconnect(() => {
      disconnectCount++;
    });

    // Connect a new daemon and replace
    const { port } = ctx.httpServer.address() as import('net').AddressInfo;
    const newDaemon = new WebSocket(`ws://127.0.0.1:${port}`);
    await new Promise<void>((r) => newDaemon.once('open', r));
    await new Promise<void>((r) => setTimeout(r, 10));
    ctx.conn.replaceSocket(ctx.latestServerWs);

    // Close the OLD daemon — should NOT trigger disconnect on the new connection
    oldDaemon.close();
    await new Promise<void>((r) => setTimeout(r, 30));

    expect(disconnectCount).toBe(0);
    expect(ctx.conn.isOpen).toBe(true);

    newDaemon.close();
  });
});
