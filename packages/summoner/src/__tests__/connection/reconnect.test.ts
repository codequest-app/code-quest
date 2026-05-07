import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createConnectionLoop, RpcChannel } from '@code-quest/shared';
import { toRpcSocket, WsTransport, wsAdapter } from '@code-quest/shared/node';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocketServer } from 'ws';
import { Agent } from '../../connection/agent.ts';
import { FakeFilesystemService } from '../../test/fake-filesystem-service.ts';
import { FakeGitService } from '../../test/fake-git-service.ts';
import { FakeProcessProvider } from '../../test/fake-process-provider.ts';

describe('Connection reconnect loop', () => {
  let httpServer: HttpServer;
  let wss: WebSocketServer;
  let transport: WsTransport;

  beforeEach(async () => {
    httpServer = createServer();
    wss = new WebSocketServer({ server: httpServer });
    await new Promise<void>((r) => httpServer.listen(0, r));
    transport = new WsTransport(wsAdapter());
  });

  afterEach(async () => {
    for (const ws of wss.clients) ws.terminate();
    wss.close();
    httpServer.closeAllConnections();
    await new Promise<void>((r) => httpServer.close(() => r()));
  });

  function url(): string {
    const { port } = httpServer.address() as AddressInfo;
    return `ws://127.0.0.1:${port}`;
  }

  it('reconnects and creates a new Agent after disconnect', async () => {
    let connectionCount = 0;
    const serverRpcs: RpcChannel[] = [];

    wss.on('connection', (ws) => {
      connectionCount++;
      serverRpcs.push(new RpcChannel(toRpcSocket(ws)));
    });

    const processProvider = new FakeProcessProvider();
    const filesystem = new FakeFilesystemService();
    const git = new FakeGitService();
    const events: string[] = [];

    const { close } = createConnectionLoop(transport, url(), {
      reconnect: { initialDelayMs: 50 },
      createAgent: (rpc) => new Agent(rpc, processProvider, filesystem, git),
      onConnect: () => events.push('connect'),
      onDisconnect: () => events.push('disconnect'),
    });

    await vi.waitFor(() => expect(connectionCount).toBe(1));
    expect(events).toContain('connect');

    // Kill connection
    for (const ws of wss.clients) ws.terminate();

    // Wait for reconnect
    await vi.waitFor(() => expect(connectionCount).toBe(2), { timeout: 2000 });
    expect(events.filter((e) => e === 'disconnect')).toHaveLength(1);
    expect(events.filter((e) => e === 'connect')).toHaveLength(2);

    // New connection works
    filesystem.setRoots(['/']);
    filesystem.addFile('/tmp/test.txt', 'content');
    const result = await serverRpcs[1]!.request('fs/exists', { path: '/tmp/test.txt' });
    expect(result).toEqual({ exists: true });

    close();
  });

  it('close() stops the reconnect loop', async () => {
    let connectionCount = 0;
    wss.on('connection', () => {
      connectionCount++;
    });

    const { close } = createConnectionLoop(transport, url(), {
      reconnect: { initialDelayMs: 50 },
      createAgent: (rpc) =>
        new Agent(
          rpc,
          new FakeProcessProvider(),
          new FakeFilesystemService(),
          new FakeGitService(),
        ),
    });

    await vi.waitFor(() => expect(connectionCount).toBe(1));
    close();

    await new Promise<void>((r) => setTimeout(r, 200));
    expect(connectionCount).toBe(1);
  });

  it('uses exponential backoff on reconnect', async () => {
    let connectionCount = 0;
    wss.on('connection', (ws) => {
      connectionCount++;
      ws.terminate();
    });

    const start = Date.now();
    const { close } = createConnectionLoop(transport, url(), {
      reconnect: { initialDelayMs: 100, maxDelayMs: 1000 },
      createAgent: () => {},
    });

    // With backoff 100+200+400 = 700ms minimum for 4 connections
    await vi.waitFor(() => expect(connectionCount).toBeGreaterThanOrEqual(4), { timeout: 5000 });
    const elapsed = Date.now() - start;
    close();

    // Should take at least 600ms (100+200+400 minus timing slack)
    expect(elapsed).toBeGreaterThanOrEqual(500);
  });
});
