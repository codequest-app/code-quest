import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { createInterface } from 'node:readline';
import { ClaudeParser } from './claude-parser.ts';
import type { ChatStreamEvent, ControlResponseEvent, ProcessFactory, RawEntry } from './types.ts';

interface PendingRequest {
  resolve: (value: ControlResponseEvent) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface InteractiveSessionOptions {
  processFactory: ProcessFactory;
  command?: string;
  args?: string[];
  controlTimeout?: number;
  resumeSessionId?: string;
}

export class InteractiveSession extends EventEmitter {
  readonly id: string;
  private _state: 'idle' | 'processing' = 'idle';
  private _cliSessionId: string | null = null;
  private currentPromptId: string | null = null;
  private requestCounter = 0;

  private process: ReturnType<ProcessFactory> | null = null;
  private parser = new ClaudeParser();
  private pendingRequests = new Map<string, PendingRequest>();

  private readonly processFactory: ProcessFactory;
  private readonly command: string;
  private readonly baseArgs: string[];
  private readonly controlTimeout: number;
  private resumeSessionId: string | undefined;

  constructor(options: InteractiveSessionOptions) {
    super();
    this.id = randomUUID();
    this.processFactory = options.processFactory;
    this.command = options.command ?? 'claude';
    this.baseArgs = options.args ?? [
      '--output-format',
      'stream-json',
      '--input-format',
      'stream-json',
      '--verbose',
    ];
    this.controlTimeout = options.controlTimeout ?? 30000;
    this.resumeSessionId = options.resumeSessionId;
  }

  get state() {
    return this._state;
  }

  get cliSessionId() {
    return this._cliSessionId;
  }

  sendMessage(message: string): void {
    this.ensureProcess();
    this.currentPromptId = randomUUID();
    this._state = 'processing';

    const payload = {
      type: 'user',
      message: {
        role: 'user',
        content: [{ type: 'text', text: message }],
      },
    };

    const raw = JSON.stringify(payload);
    this.emitRaw(raw, 'in');
    this.process?.stdin?.write(`${raw}\n`);
  }

  abort(): void {
    if (this.process) {
      this.process.kill('SIGINT');
    }
  }

  kill(): void {
    if (this.process) {
      this.process.kill('SIGTERM');
    }
  }

  async initialize(options?: Record<string, unknown>): Promise<ControlResponseEvent> {
    this.ensureProcess();
    return this.sendControlRequest('initialize', options);
  }

  async setModel(model: string): Promise<ControlResponseEvent> {
    return this.sendControlRequest('set_model', { model });
  }

  async setPermissionMode(mode: string): Promise<ControlResponseEvent> {
    return this.sendControlRequest('set_permission_mode', { mode });
  }

  async interrupt(): Promise<ControlResponseEvent> {
    return this.sendControlRequest('interrupt');
  }

  respondToControlRequest(requestId: string, response: Record<string, unknown>): void {
    if (!this.process) return;

    const payload = {
      type: 'control_response',
      response: {
        subtype: 'success',
        request_id: requestId,
        response,
      },
    };

    this.process.stdin?.write(`${JSON.stringify(payload)}\n`);
  }

  // --- Private ---

  private ensureProcess(): void {
    if (this.process) return;

    const args = [...this.baseArgs];
    if (this.resumeSessionId) {
      args.push('--resume', this.resumeSessionId);
    }

    // Filter env vars that would cause nested Claude Code issues
    const env = { ...process.env };
    delete env.CLAUDECODE;
    delete env.CLAUDE_CODE_ENTRYPOINT;

    this.process = this.processFactory(this.command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
    });

    // Read stdout line by line
    // biome-ignore lint/style/noNonNullAssertion: stdio is 'pipe', guaranteed non-null
    const rl = createInterface({ input: this.process.stdout! });
    rl.on('line', (line) => this.handleLine(line));

    // Read stderr
    // biome-ignore lint/style/noNonNullAssertion: stdio is 'pipe', guaranteed non-null
    const stderrRl = createInterface({ input: this.process.stderr! });
    stderrRl.on('line', (line) => {
      this.emitRaw(line, 'err');
      this.emit('error', line);
    });

    // Handle close
    this.process.on('close', (code, _signal) => {
      if (this._cliSessionId) {
        this.resumeSessionId = this._cliSessionId;
      }

      // Reject all pending control requests
      for (const [_id, pending] of this.pendingRequests) {
        clearTimeout(pending.timer);
        pending.reject(new Error(`Process closed with exit code ${code}`));
      }
      this.pendingRequests.clear();

      if (code !== 0 && code !== null) {
        this.emit('error', `Process exited with exit code ${code}`);
      }

      this.process = null;
      this._state = 'idle';
      this.emit('exit');
    });
  }

  private handleLine(line: string): void {
    const events = this.parser.parseLine(line);
    this.emitRaw(line, 'out');

    for (const event of events) {
      // Track session ID
      if (event.type === 'init') {
        this._cliSessionId = event.sessionId;
      }

      // Transition to idle on result
      if (event.type === 'result') {
        this._state = 'idle';
      }

      // Resolve pending control requests
      if (event.type === 'control_response') {
        this.resolveControlResponseEvent(event);
      }

      this.emit('event', event);
    }
  }

  private emitRaw(raw: string, direction: 'in' | 'out' | 'err'): void {
    const entry: RawEntry = {
      timestamp: Date.now(),
      sessionId: this.id,
      promptId: this.currentPromptId ?? '',
      direction,
      raw,
      seq: 0,
    };

    this.emit('raw', entry);
  }

  private async sendControlRequest(
    subtype: string,
    params?: Record<string, unknown>,
  ): Promise<ControlResponseEvent> {
    this.ensureProcess();
    this.requestCounter++;
    const requestId = `${subtype}-${String(this.requestCounter).padStart(3, '0')}`;

    return new Promise<ControlResponseEvent>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Control request ${requestId} timed out`));
      }, this.controlTimeout);

      this.pendingRequests.set(requestId, { resolve, reject, timer });

      const payload = {
        type: 'control_request',
        request_id: requestId,
        request: { subtype, ...params },
      };

      this.process?.stdin?.write(`${JSON.stringify(payload)}\n`);
    });
  }

  private resolveControlResponseEvent(
    event: Extract<ChatStreamEvent, { type: 'control_response' }>,
  ): void {
    const pending = this.pendingRequests.get(event.requestId);
    if (!pending) return;

    clearTimeout(pending.timer);
    this.pendingRequests.delete(event.requestId);

    pending.resolve({
      requestId: event.requestId,
      success: event.success,
      response: event.response,
      error: event.error,
    });
  }
}
