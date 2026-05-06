import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocket, WebSocketServer } from 'ws';
import { Connection } from '../remote/connection.ts';

function makeSetup() {
  let httpServer: HttpServer;
  let wss: WebSocketServer;

  async function setup() {
    httpServer = createServer();
    wss = new WebSocketServer({ noServer: true });

    let conn: Connection | undefined;

    httpServer.on('upgrade', (req, socket, head) => {
      wss.handleUpgrade(req, socket, head, (ws) => {
        conn = new Connection(ws, 100);
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
      daemon,
    };
  }

  async function teardown() {
    await new Promise<void>((r) => wss.close(() => r()));
    await new Promise<void>((r) => httpServer.close(() => r()));
  }

  return { setup, teardown };
}

describe('Connection heartbeat', () => {
  const { setup, teardown } = makeSetup();
  let ctx: Awaited<ReturnType<ReturnType<typeof makeSetup>['setup']>>;

  beforeEach(async () => {
    ctx = await setup();
  });

  afterEach(async () => {
    ctx.daemon.close();
    await teardown();
  });

  it('stays alive when daemon responds to pings', async () => {
    // ws module auto-responds to pings with pongs by default
    // So just verify the connection stays open after a heartbeat interval
    ctx.conn.startHeartbeat(50);

    await new Promise<void>((r) => setTimeout(r, 150));
    expect(ctx.conn.isOpen).toBe(true);
    ctx.conn.stopHeartbeat();
  });

  it('terminates connection when pong is not received', async () => {
    // Disable auto-pong by intercepting pings
    ctx.daemon.on('ping', () => {
      // Don't respond — suppress the default auto-pong
    });
    // Remove default pong handler
    ctx.daemon.pong = (() => {}) as never;

    let disconnected = false;
    ctx.conn.onDisconnect(() => {
      disconnected = true;
    });

    ctx.conn.startHeartbeat(50);

    await vi.waitFor(() => expect(disconnected).toBe(true), { timeout: 1000 });
    expect(ctx.conn.isOpen).toBe(false);
  });

  it('does not stack pong listeners when startHeartbeat is called multiple times', async () => {
    ctx.conn.startHeartbeat(50);
    ctx.conn.startHeartbeat(50);
    ctx.conn.startHeartbeat(50);

    // ws EventEmitter — count 'pong' listeners on the underlying socket
    const pongListeners = (ctx.conn as unknown as { ws: import('ws').WebSocket }).ws.listenerCount(
      'pong',
    );
    expect(pongListeners).toBe(1);
    ctx.conn.stopHeartbeat();
  });
});
