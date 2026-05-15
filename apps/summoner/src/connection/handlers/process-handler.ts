import type {
  AgentTransport,
  ProcessExitParams,
  ProcessHandle,
  ProcessProvider,
  ProcessStderrParams,
  ProcessStdoutParams,
} from '@code-quest/schemas';
import {
  processKillParamsSchema,
  processSpawnParamsSchema,
  processStdinParamsSchema,
  REMOTE_METHODS,
} from '@code-quest/schemas';
import { logger } from '../../logger.ts';
import type { AgentHandler } from '../agent-handler.ts';

export class ProcessHandler implements AgentHandler {
  private readonly processProvider: ProcessProvider;
  private readonly spawned = new Map<string, ProcessHandle>();
  private rpc: AgentTransport | null = null;

  constructor(processProvider: ProcessProvider) {
    this.processProvider = processProvider;
  }

  attach(rpc: AgentTransport): void {
    this.rpc = rpc;
    rpc.onRequest(REMOTE_METHODS.process.spawn, this.handleSpawn.bind(this));
    rpc.onRequest(REMOTE_METHODS.process.stdin, this.handleStdin.bind(this));
    rpc.onRequest(REMOTE_METHODS.process.kill, this.handleKill.bind(this));
  }

  dispose(): void {
    for (const handle of this.spawned.values()) {
      handle.abort();
    }
    this.spawned.clear();
  }

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

  private async streamProcess(sessionId: string, handle: ProcessHandle): Promise<void> {
    try {
      if (handle.stderr) {
        this.streamStderr(sessionId, handle.stderr).catch((err) =>
          logger.warn({ err, sessionId }, 'streamStderr error'),
        );
      }
      for await (const line of handle.lines) {
        this.rpc?.emit(REMOTE_METHODS.process.stdout, {
          sessionId,
          line,
        } satisfies ProcessStdoutParams);
      }
    } finally {
      this.spawned.delete(sessionId);
      const code = typeof handle.signal.reason === 'number' ? handle.signal.reason : null;
      logger.info({ sessionId, code }, 'Process exited');
      this.rpc?.emit(REMOTE_METHODS.process.exit, {
        sessionId,
        code,
      } satisfies ProcessExitParams);
    }
  }

  private async streamStderr(sessionId: string, stderr: AsyncIterable<string>): Promise<void> {
    for await (const line of stderr) {
      this.rpc?.emit(REMOTE_METHODS.process.stderr, {
        sessionId,
        line,
      } satisfies ProcessStderrParams);
    }
  }
}
