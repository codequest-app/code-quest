import { type ChildProcess, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createParser } from './parsers/index.ts';
import type {
  ChatProvider,
  ChatSession,
  ChatSessionOptions,
  ChatStats,
  ChatStreamEvent,
  ProcessFactory,
  StreamParser,
} from './types.ts';

export type SessionState = 'idle' | 'processing';

export class ChatSessionImpl implements ChatSession {
  readonly id: string;
  readonly provider: ChatProvider;

  private readonly command: string;
  private readonly baseArgs: string[];
  private readonly cwd: string;
  private readonly envOverride?: Record<string, string | undefined>;
  private readonly processFactory: ProcessFactory;

  private process: ChildProcess | null = null;
  private parser: StreamParser;
  private _state: SessionState = 'idle';
  private eventHandlers: Array<(event: ChatStreamEvent) => void> = [];
  private completeHandlers: Array<(stats: ChatStats) => void> = [];
  private errorHandlers: Array<(error: string) => void> = [];
  private exitHandlers: Array<() => void> = [];
  private stderrBuffer = '';
  private gotResult = false;
  private allowedTools: Set<string> = new Set();

  get state(): SessionState {
    return this._state;
  }

  get cliSessionId(): string | null {
    return this.parser.getCliSessionId();
  }

  constructor(options: ChatSessionOptions) {
    this.id = randomUUID();
    this.provider = options.provider;
    this.command = options.command;
    this.baseArgs = options.baseArgs;
    this.cwd = options.cwd ?? process.cwd();
    this.envOverride = options.env;
    this.parser = options.parserFactory
      ? options.parserFactory(options.provider)
      : createParser(options.provider);
    this.processFactory = options.processFactory ?? spawn;
  }

  sendMessage(message: string): void {
    // Build args: baseArgs + resume (if continuing) + allowedTools + message
    const args = [...this.baseArgs];
    const sessionId = this.cliSessionId;
    if (sessionId) {
      args.push('--resume', sessionId);
    }
    if (this.allowedTools.size > 0) {
      args.push('--allowedTools', [...this.allowedTools].join(','));
    }
    args.push(message);

    this.spawnProcess(args);
  }

  addAllowedTool(tool: string): void {
    this.allowedTools.add(tool);
  }

  abort(): void {
    if (this.process) {
      this.process.kill('SIGINT');
    }
  }

  kill(): void {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
    this._state = 'idle';
  }

  onEvent(handler: (event: ChatStreamEvent) => void): void {
    this.eventHandlers.push(handler);
  }

  onComplete(handler: (stats: ChatStats) => void): void {
    this.completeHandlers.push(handler);
  }

  onError(handler: (error: string) => void): void {
    this.errorHandlers.push(handler);
  }

  onExit(handler: () => void): void {
    this.exitHandlers.push(handler);
  }

  private spawnProcess(args: string[]): void {
    // Kill previous process if still running
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }

    this.stderrBuffer = '';
    this.gotResult = false;
    this._state = 'processing';

    // Use injected env or inherit from process, stripping vars that prevent nested sessions
    const env = { ...(this.envOverride ?? process.env) };
    delete env.CLAUDECODE;

    try {
      this.process = this.processFactory(this.command, args, {
        cwd: this.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.emitError(message);
      this._state = 'idle';
      return;
    }

    // Close stdin so CLI processes the argument and doesn't wait for piped input.
    this.process.stdin?.end();

    this.process.stdout?.on('data', (chunk: Buffer) => {
      const raw = chunk.toString();
      const events = this.parser.feed(raw);
      for (const event of events) {
        this.emitEvent(event);
        if (event.type === 'result') {
          this.gotResult = true;
          this._state = 'idle';
          this.emitComplete((event.data as { stats: ChatStats }).stats);
        }
      }
    });

    this.process.stderr?.on('data', (chunk: Buffer) => {
      this.stderrBuffer += chunk.toString();
    });

    this.process.on('error', (error) => {
      this.emitError(error.message);
      this._state = 'idle';
      this.process = null;
      this.emitExit();
    });

    this.process.on('close', (code) => {
      if (code !== 0 && !this.gotResult && this.stderrBuffer.trim()) {
        this.emitError(this.stderrBuffer.trim());
      }
      this.process = null;
      this._state = 'idle';
      this.emitExit();
    });
  }

  private emitEvent(event: ChatStreamEvent): void {
    for (const handler of this.eventHandlers) {
      handler(event);
    }
  }

  private emitComplete(stats: ChatStats): void {
    for (const handler of this.completeHandlers) {
      handler(stats);
    }
  }

  private emitError(message: string): void {
    for (const handler of this.errorHandlers) {
      handler(message);
    }
  }

  private emitExit(): void {
    for (const handler of this.exitHandlers) {
      handler();
    }
  }
}
