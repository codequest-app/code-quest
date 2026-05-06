import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WebSocket } from 'ws';
import { createUpgradeHandler, type UpgradeOptions } from '../remote/upgrade-handler.ts';

function makeEnv(overrides?: Partial<UpgradeOptions>) {
  const onConnect = vi.fn();
  const onDisconnect = vi.fn();
  const httpServer = createServer();
  const handler = createUpgradeHandler({
    token: 'test-token',
    onConnect,
    onDisconnect,
    ...overrides,
  });
  handler.attach(httpServer);

  function url(): string {
    const { port } = httpServer.address() as AddressInfo;
    return `ws://127.0.0.1:${port}/summoner`;
  }

  function connect(token = 'test-token'): Promise<WebSocket> {
    const ws = new WebSocket(url(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    return new Promise((resolve, reject) => {
      ws.once('open', () => resolve(ws));
      ws.once('error', reject);
    });
  }

  async function listen() {
    await new Promise<void>((r) => httpServer.listen(0, r));
  }

  async function close() {
    httpServer.closeAllConnections();
    await new Promise<void>((r) => httpServer.close(() => r()));
  }

  return { httpServer, onConnect, onDisconnect, connect, listen, close };
}

describe('createUpgradeHandler', () => {
  let env: ReturnType<typeof makeEnv>;

  afterEach(async () => {
    await env.close();
  });

  it('accepts a daemon with a valid token and calls onConnect', async () => {
    env = makeEnv();
    await env.listen();
    const ws = await env.connect();
    await new Promise<void>((r) => setTimeout(r, 10));
    expect(env.onConnect).toHaveBeenCalledTimes(1);
    ws.close();
  });

  it('rejects a daemon with an invalid token', async () => {
    env = makeEnv();
    await env.listen();
    await expect(env.connect('wrong-token')).rejects.toThrow();
  });

  it('calls onDisconnect when daemon closes', async () => {
    env = makeEnv();
    await env.listen();
    const ws = await env.connect();
    await new Promise<void>((r) => setTimeout(r, 10));
    ws.close();
    await new Promise<void>((r) => setTimeout(r, 50));
    expect(env.onDisconnect).toHaveBeenCalledTimes(1);
  });

  it('rejects a second daemon connection while one is active', async () => {
    env = makeEnv();
    await env.listen();
    const ws1 = await env.connect();
    await new Promise<void>((r) => setTimeout(r, 10));
    await expect(env.connect()).rejects.toThrow();
    ws1.close();
  });

  it('allows a new daemon after the previous one disconnects', async () => {
    env = makeEnv();
    await env.listen();
    const ws1 = await env.connect();
    await new Promise<void>((r) => setTimeout(r, 10));
    ws1.close();
    await new Promise<void>((r) => setTimeout(r, 50));

    const ws2 = await env.connect();
    await new Promise<void>((r) => setTimeout(r, 10));
    expect(env.onConnect).toHaveBeenCalledTimes(2);
    ws2.close();
  });
});
