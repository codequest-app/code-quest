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
} from './types';

export class ChatSessionImpl implements ChatSession {
  readonly id: string;
  readonly provider: ChatProvider;

  private readonly command: string;
  private readonly baseArgs: string[];
  private readonly cwd: string;
  private readonly parser: StreamParser;

  private process: ChildProcess | null = null;
  private eventHandlers: Array<(event: ChatStreamEvent) => void> = [];
  private completeHandlers: Array<(stats: ChatStats) => void> = [];
  private errorHandlers: Array<(error: string) => void> = [];
  private exitHandlers: Array<() => void> = [];
  private stderrBuffer = '';
  private gotResult = false;

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
  }

  sendMessage(message: string): void {
    const args = [...this.baseArgs];

    // If we have a CLI session ID from a previous message, use --resume
    const sessionId = this.parser.getCliSessionId();
    if (sessionId) {
      args.push('--resume', sessionId);
    }

    // Pass message in provider-specific format
    if (message) {
      if (this.provider === 'gemini') {
        // Gemini: -p "message" (prompt is a flag value)
        args.push('-p', message);
      } else {
        // Claude: message as positional last argument
        args.push(message);
      }
    }

    this.spawnProcess(args);
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
    this.stderrBuffer = '';
    this.gotResult = false;

    try {
      this.process = spawn(this.command, args, {
        cwd: this.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      // Close stdin immediately — CLI tools like Claude hang if stdin is an open pipe
      // because they wait for EOF before processing the -p flag message.
      this.process.stdin?.end();
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
          this.emitComplete((event.data as { stats: ChatStats }).stats);
        }
      }
    });

    // Buffer stderr instead of treating it as immediate error.
    // CLI tools (gemini, claude) write informational messages to stderr
    // that are not actual errors (e.g. "Loaded cached credentials.").
    this.process.stderr?.on('data', (chunk: Buffer) => {
      this.stderrBuffer += chunk.toString();
    });

    this.process.on('error', (error) => {
      this.emitError(error.message);
      this.emitExit();
    });

    this.process.on('close', (code) => {
      // Only emit error if process exited with non-zero code AND we didn't get a result
      if (code !== 0 && !this.gotResult && this.stderrBuffer.trim()) {
        this.emitError(this.stderrBuffer.trim());
      }
      this.process = null;
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
