import type { ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline';
import type { ChatProvider, ChatStats, ChatStreamEvent } from '@code-quest/shared';
import type {
  ChatSession,
  ChatSessionDeps,
  ChatSessionMode,
  ChatSessionState,
  ControlRequest,
  ControlResponse,
  ProcessFactory,
  StreamParser,
} from './types.ts';

export class ChatSessionImpl implements ChatSession {
  readonly id: string;
  readonly provider: ChatProvider;
  readonly mode: ChatSessionMode;

  private readonly command: string;
  private readonly baseArgs: string[];
  private readonly cwd: string;
  private readonly envOverride?: Record<string, string | undefined>;
  private readonly processFactory: ProcessFactory;

  private process: ChildProcess | null = null;
  private parser: StreamParser;
  private _state: ChatSessionState = 'idle';
  private eventHandlers: Array<(event: ChatStreamEvent) => void> = [];
  private completeHandlers: Array<(stats: ChatStats) => void> = [];
  private errorHandlers: Array<(error: string) => void> = [];
  private exitHandlers: Array<() => void> = [];
  private controlResponseHandlers: Array<(response: ControlResponse) => void> = [];
  private controlRequestHandlers: Array<(request: ControlRequest) => void> = [];
  private pendingControlRequests = new Map<
    string,
    { resolve: (response: ControlResponse) => void; reject: (error: Error) => void }
  >();
  private stderrBuffer = '';
  private gotResult = false;
  private allowedTools: Set<string> = new Set();
  private controlRequestCounter = 0;

  get state(): ChatSessionState {
    return this._state;
  }

  get cliSessionId(): string | null {
    return this.parser.getCliSessionId();
  }

  constructor(options: ChatSessionDeps) {
    this.id = randomUUID();
    this.provider = options.provider;
    this.mode = options.mode ?? 'print';
    this.command = options.command;
    this.baseArgs = options.baseArgs;
    this.cwd = options.cwd ?? process.cwd();
    this.envOverride = options.env;
    this.parser = options.parserFactory(options.provider);
    this.processFactory = options.processFactory;
  }

  sendMessage(message: string): void {
    this.ensureProcess();
    if (!this.process) return; // spawn failed

    this.gotResult = false;
    this._state = 'processing';
    this.process.stdin?.write(this.formatStdinMessage(message));
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

  onControlResponse(handler: (response: ControlResponse) => void): void {
    this.controlResponseHandlers.push(handler);
  }

  initialize(): void {
    this.sendControlRequest('initialize');
  }

  setModel(model: string): void {
    this.sendControlRequest('set_model', { model });
  }

  setPermissionMode(mode: string): void {
    this.sendControlRequest('set_permission_mode', { permission_mode: mode });
  }

  setMaxThinkingTokens(tokens: number): void {
    this.sendControlRequest('set_max_thinking_tokens', { max_thinking_tokens: tokens });
  }

  interrupt(): void {
    this.sendControlRequest('interrupt');
  }

  sendControlRequestAsync(
    subtype: string,
    params: Record<string, unknown> = {},
    timeoutMs = 10000,
  ): Promise<ControlResponse> {
    const requestId = this.sendControlRequest(subtype, params);
    return new Promise<ControlResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingControlRequests.delete(requestId);
        reject(
          new Error(`Control request "${subtype}" (${requestId}) timed out after ${timeoutMs}ms`),
        );
      }, timeoutMs);

      this.pendingControlRequests.set(requestId, {
        resolve: (response) => {
          clearTimeout(timer);
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
    });
  }

  respondToControlRequest(requestId: string, response: Record<string, unknown>): void {
    this.ensureProcess();
    if (!this.process) return;

    const message = JSON.stringify({
      type: 'control_response',
      request_id: requestId,
      response,
    });
    this.process.stdin?.write(`${message}\n`);
  }

  onControlRequest(handler: (request: ControlRequest) => void): void {
    this.controlRequestHandlers.push(handler);
  }

  private sendControlRequest(subtype: string, params?: Record<string, unknown>): string {
    this.ensureProcess();

    this.controlRequestCounter++;
    const requestId = `${subtype}-${String(this.controlRequestCounter).padStart(3, '0')}`;

    if (!this.process) return requestId;

    const request: Record<string, unknown> = { subtype, ...params };
    const message = JSON.stringify({
      type: 'control_request',
      request_id: requestId,
      request,
    });

    this.process.stdin?.write(`${message}\n`);
    return requestId;
  }

  private ensureProcess(): void {
    if (this.process) return;

    const args = [...this.baseArgs];
    const cliSessionId = this.parser.getCliSessionId();
    if (cliSessionId) {
      args.push('--resume', cliSessionId);
    }
    if (this.allowedTools.size > 0) {
      args.push('--allowedTools', [...this.allowedTools].join(','));
    }

    this.stderrBuffer = '';

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

    if (this.process.stdout) {
      const rl = createInterface({ input: this.process.stdout });
      rl.on('line', (line: string) => {
        const events = this.parser.parseLine(line);
        for (const event of events) {
          this.emitEvent(event);
          if (event.type === 'result') {
            this.gotResult = true;
            this._state = 'idle';
            this.emitComplete((event.data as { stats: ChatStats }).stats);
          }
          if (event.type === 'control_response') {
            const response = event.data as ControlResponse;
            this.emitControlResponse(response);
            this.resolvePendingRequest(response);
          }
          if (event.type === 'control_request') {
            this.emitControlRequest(event.data as ControlRequest);
          }
        }
      });
    }

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

  private formatStdinMessage(message: string): string {
    return `${JSON.stringify({
      type: 'user',
      message: {
        role: 'user',
        content: [{ type: 'text', text: message }],
      },
    })}\n`;
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

  private emitControlResponse(response: ControlResponse): void {
    for (const handler of this.controlResponseHandlers) {
      handler(response);
    }
  }

  private emitControlRequest(request: ControlRequest): void {
    for (const handler of this.controlRequestHandlers) {
      handler(request);
    }
  }

  private resolvePendingRequest(response: ControlResponse): void {
    const pending = this.pendingControlRequests.get(response.requestId);
    if (pending) {
      this.pendingControlRequests.delete(response.requestId);
      pending.resolve(response);
    }
  }
}
