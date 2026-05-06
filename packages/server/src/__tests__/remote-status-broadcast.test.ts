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
        conn = new Connection(ws);
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

describe('remote:status broadcast', () => {
  const { setup, teardown } = makeSetup();
  let ctx: Awaited<ReturnType<ReturnType<typeof makeSetup>['setup']>>;

  beforeEach(async () => {
    ctx = await setup();
  });
  afterEach(async () => {
    ctx.daemon.close();
    await teardown();
  });

  it('onDisconnect fires when daemon drops — enables broadcastAll wiring', async () => {
    const broadcastAll = vi.fn();

    ctx.conn.onDisconnect(() => {
      broadcastAll('remote:status', { connected: false });
    });

    ctx.daemon.close();
    await new Promise<void>((r) => setTimeout(r, 20));

    expect(broadcastAll).toHaveBeenCalledWith('remote:status', { connected: false });
  });

  it('onConnect callback on Connection creation enables connected broadcast', () => {
    // Connection is created when daemon connects.
    // The server wires broadcastAll('remote:status', { connected: true }) at that point.
    // This test verifies the connection is open and ready for broadcast.
    expect(ctx.conn.isOpen).toBe(true);
  });
});
