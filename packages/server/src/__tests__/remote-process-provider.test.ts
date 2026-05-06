import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Agent } from '@code-quest/summoner/daemon';
import {
  FakeFilesystemService,
  FakeGitService,
  FakeProcessProvider,
} from '@code-quest/summoner/test';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WebSocket, WebSocketServer } from 'ws';
import { Connection } from '../remote/connection.ts';
import { RemoteProcessProvider } from '../remote/process-provider.ts';

/**
 * Full integration: Agent on server side, RemoteProcessProvider on client side.
 * Tests that the two ends communicate correctly over a real WebSocket.
 */
function makeSetup() {
  let httpServer: HttpServer;
  let wss: WebSocketServer;

  async function setup() {
    const agentProcessProvider = new FakeProcessProvider();

    httpServer = createServer();
    wss = new WebSocketServer({ noServer: true });

    httpServer.on('upgrade', (req, socket, head) => {
      wss.handleUpgrade(req, socket, head, (ws) => {
        new Agent(ws, agentProcessProvider, new FakeFilesystemService(), new FakeGitService());
      });
    });

    await new Promise<void>((r) => httpServer.listen(0, r));

    const { port } = httpServer.address() as AddressInfo;
    const daemonWs = new WebSocket(`ws://127.0.0.1:${port}`);
    await new Promise<void>((r) => daemonWs.once('open', r));

    const conn = new Connection(daemonWs);
    const remoteProvider = new RemoteProcessProvider(conn);

    return { agentProcessProvider, conn, remoteProvider, daemonWs };
  }

  async function teardown() {
    await new Promise<void>((r) => wss.close(() => r()));
    await new Promise<void>((r) => httpServer.close(() => r()));
  }

  return { setup, teardown };
}

describe('RemoteProcessProvider', () => {
  const { setup, teardown } = makeSetup();
  let ctx: Awaited<ReturnType<ReturnType<typeof makeSetup>['setup']>>;

  beforeEach(async () => {
    ctx = await setup();
  });

  afterEach(async () => {
    ctx.daemonWs.close();
    await teardown();
  });

  it('streams stdout lines from the remote process', async () => {
    const handle = ctx.remoteProvider.spawn('echo', ['hello']);

    // wait for agent to receive spawn
    await new Promise<void>((r) => setTimeout(r, 20));

    ctx.agentProcessProvider.latest.emit('line-a');
    ctx.agentProcessProvider.latest.emit('line-b');
    ctx.agentProcessProvider.latest.abort();

    const lines: string[] = [];
    for await (const line of handle.lines) {
      lines.push(line);
    }

    expect(lines).toEqual(['line-a', 'line-b']);
  });

  it('sends stdin to the remote process', async () => {
    const handle = ctx.remoteProvider.spawn('cat', []);
    await new Promise<void>((r) => setTimeout(r, 20));

    const data = JSON.stringify({ type: 'user', message: 'hi' });
    handle.send(data);
    await new Promise<void>((r) => setTimeout(r, 20));

    const received = ctx.agentProcessProvider.latest.received('user');
    expect(received[0]).toMatchObject({ type: 'user', message: 'hi' });
  });

  it('abort() stops the line stream', async () => {
    const handle = ctx.remoteProvider.spawn('sleep', ['10']);
    await new Promise<void>((r) => setTimeout(r, 20));

    const collected: string[] = [];
    const iterDone = (async () => {
      for await (const line of handle.lines) {
        collected.push(line);
      }
    })();

    handle.abort();
    await iterDone;
    await new Promise<void>((r) => setTimeout(r, 20));

    expect(handle.signal.aborted).toBe(true);
    expect(ctx.agentProcessProvider.latest.signal.aborted).toBe(true);
  });

  it('runOnce collects lines and returns exit code from process/exit notification', async () => {
    const promise = ctx.remoteProvider.runOnce('echo', ['hello']);

    await new Promise<void>((r) => setTimeout(r, 20));
    ctx.agentProcessProvider.latest.emit('line-a');
    ctx.agentProcessProvider.latest.emit('line-b');
    ctx.agentProcessProvider.latest.abort();

    const result = await promise;
    expect(result.stdout).toBe('line-a\nline-b');
    expect(result.exitCode).toBeNull();
  });

  it('runOnce collects stderr from process/stderr notifications', async () => {
    const promise = ctx.remoteProvider.runOnce('warn', []);

    await new Promise<void>((r) => setTimeout(r, 20));
    ctx.agentProcessProvider.latest.emit('out-line');
    ctx.agentProcessProvider.latest.emitStderr('err-line');
    ctx.agentProcessProvider.latest.abort();

    const result = await promise;
    expect(result.stdout).toBe('out-line');
    expect(result.stderr).toBe('err-line');
  });

  it('lines iterator terminates when aborted before iteration begins', async () => {
    const handle = ctx.remoteProvider.spawn('sleep', ['999']);
    // Abort immediately, before calling for-await
    handle.abort();
    await new Promise<void>((r) => setTimeout(r, 20));

    const lines: string[] = [];
    for await (const line of handle.lines) {
      lines.push(line);
    }
    expect(lines).toEqual([]);
  });

  it('throws when connection is closed', () => {
    ctx.conn.close();
    expect(() => ctx.remoteProvider.spawn('echo', [])).toThrow('No remote daemon connected');
  });
});
