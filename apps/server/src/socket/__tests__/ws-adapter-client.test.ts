import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { wsAdapter } from '@code-quest/transport';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WebSocketServer } from 'ws';

describe('wsAdapter createSocket', () => {
  let httpServer: HttpServer;
  let wss: WebSocketServer;

  beforeEach(async () => {
    httpServer = createServer();
    wss = new WebSocketServer({ server: httpServer });
    await new Promise<void>((r) => httpServer.listen(0, r));
  });

  afterEach(async () => {
    wss.close();
    await new Promise<void>((r) => httpServer.close(() => r()));
  });

  function url(): string {
    const { port } = httpServer.address() as AddressInfo;
    return `ws://127.0.0.1:${port}`;
  }

  it('creates a connected RpcSocket that can send and receive', async () => {
    const received: string[] = [];
    wss.on('connection', (ws) => {
      ws.on('message', (data) => received.push(data.toString()));
    });

    const adapter = wsAdapter();
    const socket = await adapter.createSocket(url());

    // Register listener first, then ask server to send
    const serverMsg = new Promise<string>((resolve) => {
      socket.onMessage((data) => resolve(data));
    });

    // Tell server to send after client listener is ready
    for (const ws of wss.clients) ws.send('hello from server');

    expect(await serverMsg).toBe('hello from server');

    socket.send('hello from client');
    await new Promise<void>((r) => setTimeout(r, 20));
    expect(received).toContain('hello from client');

    socket.close();
  });

  it('passes headers to the server', async () => {
    const adapter = wsAdapter();
    let receivedAuth: string | undefined;

    wss.on('connection', (_ws, req) => {
      receivedAuth = req.headers.authorization;
    });

    const socket = await adapter.createSocket(url(), {
      headers: { Authorization: 'Bearer test-token' },
    });

    await new Promise<void>((r) => setTimeout(r, 20));
    expect(receivedAuth).toBe('Bearer test-token');

    socket.close();
  });

  it('onClose fires when server closes the connection', async () => {
    const adapter = wsAdapter();
    const socket = await adapter.createSocket(url());

    let closed = false;
    socket.onClose(() => {
      closed = true;
    });

    for (const ws of wss.clients) ws.close();
    await new Promise<void>((r) => setTimeout(r, 50));
    expect(closed).toBe(true);
  });
});
