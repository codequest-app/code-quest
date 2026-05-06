import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WebSocket, WebSocketServer } from 'ws';
import { Agent } from '../../daemon/agent.ts';
import { FakeFilesystemService } from '../../test/fake-filesystem-service.ts';
import { FakeGitService } from '../../test/fake-git-service.ts';
import { FakeProcessProvider } from '../../test/fake-process-provider.ts';

/**
 * Topology:
 *   client (test)  ←→  serverSocket → Agent
 *
 * `client.send(request)` → agent dispatches → `client.once('message', response)`
 */
function makeSetup() {
  let httpServer: HttpServer;
  let wss: WebSocketServer;

  async function setup() {
    const processProvider = new FakeProcessProvider();
    const filesystem = new FakeFilesystemService();
    const git = new FakeGitService();

    httpServer = createServer();
    wss = new WebSocketServer({ noServer: true });

    let agent: Agent | undefined;
    httpServer.on('upgrade', (req, socket, head) => {
      wss.handleUpgrade(req, socket, head, (ws) => {
        agent = new Agent(ws, processProvider, filesystem, git);
      });
    });

    await new Promise<void>((r) => httpServer.listen(0, r));

    const { port } = httpServer.address() as AddressInfo;
    const client = new WebSocket(`ws://127.0.0.1:${port}`);
    await new Promise<void>((r) => client.once('open', r));

    function rpc<R>(method: string, params: unknown): Promise<R> {
      return new Promise((resolve, reject) => {
        const id = Math.random();
        client.once('message', (raw) => {
          const res = JSON.parse(raw.toString()) as {
            id: number;
            result?: R;
            error?: { message: string };
          };
          if (res.error) reject(new Error(res.error.message));
          else resolve(res.result as R);
        });
        client.send(JSON.stringify({ id, method, params }));
      });
    }

    return {
      processProvider,
      filesystem,
      git,
      client,
      rpc,
      get agent() {
        return agent!;
      },
    };
  }

  async function teardown() {
    await new Promise<void>((r) => wss.close(() => r()));
    await new Promise<void>((r) => httpServer.close(() => r()));
  }

  return { setup, teardown };
}

describe('Agent', () => {
  const { setup, teardown } = makeSetup();
  let ctx: Awaited<ReturnType<ReturnType<typeof makeSetup>['setup']>>;

  beforeEach(async () => {
    ctx = await setup();
  });

  afterEach(async () => {
    ctx.client.close();
    await teardown();
  });

  describe('process dispatch', () => {
    it('spawns a process and streams stdout lines then exit', async () => {
      const notifications: unknown[] = [];
      ctx.client.on('message', (raw) => {
        const msg = JSON.parse(raw.toString()) as { method?: string };
        if (msg.method) notifications.push(msg);
      });

      const spawnPromise = ctx.rpc<{ ok: true }>('process/spawn', {
        sessionId: 'sess-1',
        command: 'echo',
        args: ['hello'],
        cwd: '/tmp',
      });

      // reply immediately (spawn ack)
      await spawnPromise;

      // push stdout from fake process
      ctx.processProvider.latest.emit('line1');
      ctx.processProvider.latest.emit('line2');
      ctx.processProvider.latest.abort();

      await new Promise<void>((r) => setTimeout(r, 20));

      const stdouts = notifications.filter(
        (n) => (n as { method: string }).method === 'process/stdout',
      );
      const exits = notifications.filter(
        (n) => (n as { method: string }).method === 'process/exit',
      );

      expect(stdouts).toHaveLength(2);
      expect((stdouts[0] as { params: { line: string } }).params.line).toBe('line1');
      expect(exits).toHaveLength(1);
      expect((exits[0] as { params: { code: number | null } }).params.code).toBeNull();
    });

    it('forwards real exit code via process/exit notification', async () => {
      const notifications: unknown[] = [];
      ctx.client.on('message', (raw) => {
        const msg = JSON.parse(raw.toString()) as { method?: string };
        if (msg.method) notifications.push(msg);
      });

      await ctx.rpc('process/spawn', {
        sessionId: 'sess-exit',
        command: 'failing',
        args: [],
      });

      // Simulate non-zero exit by aborting with exit code as reason
      ctx.processProvider.latest.abort(1);
      await new Promise<void>((r) => setTimeout(r, 20));

      const exits = notifications.filter(
        (n) => (n as { method: string }).method === 'process/exit',
      );
      expect(exits).toHaveLength(1);
      expect((exits[0] as { params: { code: number } }).params.code).toBe(1);
    });

    it('streams stderr via process/stderr notification', async () => {
      const notifications: unknown[] = [];
      ctx.client.on('message', (raw) => {
        const msg = JSON.parse(raw.toString()) as { method?: string };
        if (msg.method) notifications.push(msg);
      });

      await ctx.rpc('process/spawn', {
        sessionId: 'sess-stderr',
        command: 'warn',
        args: [],
      });

      ctx.processProvider.latest.emitStderr('warning: something');
      ctx.processProvider.latest.abort();
      await new Promise<void>((r) => setTimeout(r, 20));

      const stderrs = notifications.filter(
        (n) => (n as { method: string }).method === 'process/stderr',
      );
      expect(stderrs).toHaveLength(1);
      expect((stderrs[0] as { params: { line: string } }).params.line).toBe('warning: something');
    });

    it('forwards stdin to the spawned process', async () => {
      await ctx.rpc('process/spawn', { sessionId: 'sess-2', command: 'cat', args: [] });
      const data = JSON.stringify({ type: 'user', message: 'hello' });
      await ctx.rpc('process/stdin', { sessionId: 'sess-2', data });

      const received = ctx.processProvider.latest.received('user');
      expect(received[0]).toMatchObject({ type: 'user', message: 'hello' });
    });

    it('kills the spawned process', async () => {
      await ctx.rpc('process/spawn', { sessionId: 'sess-3', command: 'sleep', args: ['10'] });
      await ctx.rpc('process/kill', { sessionId: 'sess-3' });

      expect(ctx.processProvider.latest.signal.aborted).toBe(true);
    });
  });

  describe('fs dispatch', () => {
    it('browseDirectories returns entries from FilesystemService', async () => {
      ctx.filesystem.setRoots(['/projects']);
      ctx.filesystem.addDirectory('/projects', ['app', 'blog']);

      const result = await ctx.rpc<{ entries: { name: string; path: string }[] }>(
        'fs/browseDirectories',
        { path: '/projects' },
      );

      expect(result.entries).toEqual([
        { name: 'app', path: '/projects/app' },
        { name: 'blog', path: '/projects/blog' },
      ]);
    });

    it('fs/exists returns true for a known file', async () => {
      ctx.filesystem.setRoots(['/']);
      ctx.filesystem.addFile('/tmp/hello.txt', 'hello');

      const result = await ctx.rpc<{ exists: boolean }>('fs/exists', { path: '/tmp/hello.txt' });
      expect(result.exists).toBe(true);
    });
  });

  describe('git dispatch', () => {
    it('git/status returns the current branch', async () => {
      ctx.git.setBranch('feat/test');

      const result = await ctx.rpc<{ branch: string }>('git/status', { cwd: '/repo' });
      expect(result.branch).toBe('feat/test');
    });
  });

  describe('error handling', () => {
    it('returns JSON-RPC error for unknown method', async () => {
      await expect(ctx.rpc('unknown/method', {})).rejects.toThrow('Unknown method: unknown/method');
    });
  });

  describe('dispose', () => {
    it('aborts all spawned processes on dispose', async () => {
      await ctx.rpc('process/spawn', { sessionId: 'a', command: 'sleep', args: ['10'] });
      await ctx.rpc('process/spawn', { sessionId: 'b', command: 'sleep', args: ['10'] });

      ctx.agent.dispose();

      expect(ctx.processProvider.all[0]!.signal.aborted).toBe(true);
      expect(ctx.processProvider.all[1]!.signal.aborted).toBe(true);
    });
  });
});
