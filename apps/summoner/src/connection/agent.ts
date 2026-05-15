import type { OpenspecService } from '@code-quest/openspec';
import type {
  AgentTransport,
  FilesystemService,
  GitService,
  ProcessExitParams,
  ProcessHandle,
  ProcessProvider,
  ProcessStderrParams,
  ProcessStdoutParams,
  WatchService,
} from '@code-quest/schemas';
import {
  processKillParamsSchema,
  processSpawnParamsSchema,
  processStdinParamsSchema,
  REMOTE_METHODS,
} from '@code-quest/schemas';
import { LocalWatchService } from '@code-quest/watch';
import { logger } from '../logger.ts';
import { registerFsHandlers } from './fs-handlers.ts';
import { registerGitHandlers } from './git-handlers.ts';
import { registerWatchHandlers } from './watch-handlers.ts';

export class Agent {
  private readonly spawned = new Map<string, ProcessHandle>();
  private readonly processProvider: ProcessProvider;
  private readonly filesystem: FilesystemService;
  private readonly git: GitService;
  private readonly watchService: WatchService;
  private readonly openspec: OpenspecService | null;
  private rpc: AgentTransport | null = null;

  constructor(
    processProvider: ProcessProvider,
    filesystem: FilesystemService,
    git: GitService,
    watchService?: WatchService,
    openspec?: OpenspecService,
  ) {
    this.processProvider = processProvider;
    this.filesystem = filesystem;
    this.git = git;
    this.watchService = watchService ?? new LocalWatchService();
    this.openspec = openspec ?? null;
  }

  attach(rpc: AgentTransport): void {
    this.rpc = rpc;
    this.registerProcessHandlers(rpc);
    registerFsHandlers(rpc, this.filesystem);
    registerGitHandlers(rpc, this.git);
    if (this.openspec) {
      registerWatchHandlers(rpc, this.watchService, this.filesystem, this.git, this.openspec);
    }
  }

  // rpc is set in attach() before connect() is called, so it is always non-null
  // when streamProcess / streamStderr run. The optional chain is a biome-required
  // style but the undefined path is unreachable in practice.
  private emitViaRpc(event: string, data: unknown): void {
    this.rpc?.emit(event, data);
  }

  private registerProcessHandlers(rpc: AgentTransport): void {
    rpc.onRequest(REMOTE_METHODS.process.spawn, this.handleSpawn.bind(this));
    rpc.onRequest(REMOTE_METHODS.process.stdin, this.handleStdin.bind(this));
    rpc.onRequest(REMOTE_METHODS.process.kill, this.handleKill.bind(this));
  }

  // ── named request handlers (bound to `this` in registerProcessHandlers) ──

  private async handleSpawn(params: unknown): Promise<{ ok: true }> {
    const p = processSpawnParamsSchema.parse(params);
    if (this.spawned.has(p.sessionId)) {
      throw new Error(`sessionId already active: ${p.sessionId}`);
    }
    const handle = this.processProvider.spawn(p.command, p.args, {
      cwd: p.cwd,
      env: p.env,
    });
    this.spawned.set(p.sessionId, handle);
    logger.info({ sessionId: p.sessionId }, 'Process spawned');
    this.streamProcess(p.sessionId, handle).catch((err) =>
      logger.error({ err, sessionId: p.sessionId }, 'streamProcess error'),
    );
    return { ok: true };
  }

  private async handleStdin(params: unknown): Promise<{ ok: true }> {
    const p = processStdinParamsSchema.parse(params);
    this.spawned.get(p.sessionId)?.send(p.data);
    return { ok: true };
  }

  private async handleKill(params: unknown): Promise<{ ok: true }> {
    const p = processKillParamsSchema.parse(params);
    this.spawned.get(p.sessionId)?.abort();
    this.spawned.delete(p.sessionId);
    logger.info({ sessionId: p.sessionId }, 'Process killed');
    return { ok: true };
  }

  dispose(): void {
    for (const handle of this.spawned.values()) {
      handle.abort();
    }
    this.spawned.clear();
    logger.info('Agent disposed');
  }

  private async streamProcess(sessionId: string, handle: ProcessHandle): Promise<void> {
    try {
      if (handle.stderr) {
        this.streamStderr(sessionId, handle.stderr).catch((err) =>
          logger.warn({ err, sessionId }, 'streamStderr error'),
        );
      }
      for await (const line of handle.lines) {
        this.emitViaRpc(REMOTE_METHODS.process.stdout, {
          sessionId,
          line,
        } satisfies ProcessStdoutParams);
      }
    } finally {
      this.spawned.delete(sessionId);
      const code = typeof handle.signal.reason === 'number' ? handle.signal.reason : null;
      logger.info({ sessionId, code }, 'Process exited');
      this.emitViaRpc(REMOTE_METHODS.process.exit, {
        sessionId,
        code,
      } satisfies ProcessExitParams);
    }
  }

  private async streamStderr(sessionId: string, stderr: AsyncIterable<string>): Promise<void> {
    for await (const line of stderr) {
      this.emitViaRpc(REMOTE_METHODS.process.stderr, {
        sessionId,
        line,
      } satisfies ProcessStderrParams);
    }
  }
}
