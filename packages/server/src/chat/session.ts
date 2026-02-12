import { spawn, type ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';
import { createParser } from './parsers';
import type {
  ChatSession,
  ChatSessionOptions,
  ChatStreamEvent,
  ChatStats,
  ChatProvider,
  StreamParser,
  ProcessFactory,
} from './types';

export type SessionState = 'idle' | 'processing' | 'awaiting_input';

export class ChatSessionImpl implements ChatSession {
  readonly id: string;
  readonly provider: ChatProvider;

  private readonly command: string;
  private readonly baseArgs: string[];
  private readonly cwd: string;
  private readonly parser: StreamParser;
  private readonly processFactory: ProcessFactory;

  private process: ChildProcess | null = null;
  private _state: SessionState = 'idle';
  private eventHandlers: Array<(event: ChatStreamEvent) => void> = [];
  private completeHandlers: Array<(stats: ChatStats) => void> = [];
  private errorHandlers: Array<(error: string) => void> = [];
  private exitHandlers: Array<() => void> = [];
  private stderrBuffer = '';
  private gotResult = false;

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
    this.parser = createParser(options.provider);
    this.processFactory = options.processFactory ?? spawn;
  }

  sendMessage(message: string): void {
    if (!this.process) {
      this.spawnPersistentProcess();
    }

    if (this.process && this.process.stdin?.writable) {
      this._state = 'processing';
      this.gotResult = false;
      this.process.stdin.write(message + '\n');
    }
  }

  respond(data: string): void {
    if (this.process && this.process.stdin?.writable) {
      this._state = 'processing';
      this.process.stdin.write(data + '\n');
    }
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

  private spawnPersistentProcess(): void {
    this.stderrBuffer = '';
    this.gotResult = false;

    try {
      this.process = this.processFactory(this.command, [...this.baseArgs], {
        cwd: this.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.emitError(message);
      return;
    }

    this.process.stdout?.on('data', (chunk: Buffer) => {
      const events = this.parser.feed(chunk.toString());
      for (const event of events) {
        this.emitEvent(event);
        if (event.type === 'result') {
          this.gotResult = true;
          this._state = 'idle';
          this.emitComplete((event.data as { stats: ChatStats }).stats);
        } else if (event.type === 'permission_request') {
          this._state = 'awaiting_input';
        }
      }
    });

    this.process.stderr?.on('data', (chunk: Buffer) => {
      this.stderrBuffer += chunk.toString();
    });

    this.process.on('error', (error) => {
      this.emitError(error.message);
      this._state = 'idle';
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
