import { EventEmitter } from 'node:events';
import type {
  ClientMessage,
  ParseResult,
  ProcessHandle,
  ProcessProvider,
  ProviderAdapter,
} from './types.ts';

/** Synthesize a raw_event fallback for unknown/error parse results so the
 *  adapter only ever sees typed messages. Returns null for skip. */
function toProtocolMessage(result: ParseResult): Record<string, unknown> | null {
  switch (result.status) {
    case 'skip':
      return null;
    case 'ok':
      return result.message as Record<string, unknown>;
    case 'unknown':
      return { type: 'raw_event', rawType: result.type, data: result.data };
    case 'error': {
      let data: unknown;
      try {
        data = JSON.parse(result.raw);
      } catch (err) {
        console.debug('Failed to parse JSON', err);
        data = { raw: result.raw };
      }
      return { type: 'raw_event', rawType: 'parse_error', data };
    }
  }
}

interface ProcessRunnerOptions {
  adapter: ProviderAdapter;
  processProvider?: ProcessProvider;
  args?: unknown;
  parentEnv?: NodeJS.ProcessEnv;
  spawnOptions?: Record<string, unknown>;
}

export class ProcessRunner extends EventEmitter {
  private readonly adapter: ProviderAdapter;
  private readonly processProvider?: ProcessProvider;
  readonly launchArgs: string[];
  private readonly parentEnv: NodeJS.ProcessEnv;
  private readonly spawnOptions: Record<string, unknown>;
  private handle: ProcessHandle | null = null;

  constructor(options: ProcessRunnerOptions) {
    super();
    this.adapter = options.adapter;
    this.processProvider = options.processProvider;
    this.launchArgs = this.adapter.buildArgs(options.args);
    this.parentEnv = options.parentEnv ?? process.env;
    this.spawnOptions = options.spawnOptions ?? {};
  }

  spawn(): void {
    if (this.handle) return;

    const env = { ...this.parentEnv };
    delete env.CLAUDECODE;
    delete env.CLAUDE_CODE_ENTRYPOINT;
    env.CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING = 'true';

    const handle = this.processProvider?.spawn(this.adapter.command, this.launchArgs, {
      env,
      ...this.spawnOptions,
    });
    if (!handle) return;
    this.handle = handle;

    (async () => {
      try {
        for await (const line of handle.lines) {
          this.emit('stdout', line);
          this._processLine(line);
        }
      } catch (error) {
        console.debug('Async iteration ended with error', error);
      }
      this.handle = null;
      this.emit('exit', null);
    })();
  }

  private _processLine(line: string): void {
    const result = this.adapter.parseLine(line);
    const protocolMessage = toProtocolMessage(result);
    if (!protocolMessage) return;

    const { messages, controlResponses } = this.adapter.transform(protocolMessage);
    for (const cr of controlResponses) {
      this.emit('control_response', cr);
    }
    for (const message of messages) {
      this.emit('client_message', this.augmentForPersistence(message));
    }
  }

  /** session:init is the one moment server needs to record how this
   *  process was actually spawned. Piggyback the resolved launchArgs
   *  on that event's payload so server can write it to DB without
   *  reaching back into runner state. */
  private augmentForPersistence(message: ClientMessage): ClientMessage {
    if (message.name !== 'session:init') return message;
    return {
      ...message,
      payload: { ...(message.payload as Record<string, unknown>), args: this.launchArgs },
    };
  }

  write(raw: string): void {
    this._write(raw);
  }

  sendMessage(text: string): void {
    this._write(this.adapter.formatMessage(text));
  }

  formatRequest(
    event: string,
    payload: Record<string, unknown>,
  ): { subtype: string; input: Record<string, unknown> } {
    return this.adapter.formatRequest(event, payload);
  }

  mapResponse(event: string, response: Record<string, unknown>): Record<string, unknown> {
    return this.adapter.mapResponse(event, response);
  }

  sendControlRequest(subtype: string, input?: Record<string, unknown>, requestId?: string): void {
    this._write(this.adapter.formatControlRequest(subtype, input, requestId));
  }

  respondToControlRequest(requestId: string, response: Record<string, unknown>): void {
    this._write(this.adapter.formatControlResponse(requestId, response));
  }

  private _write(raw: string): void {
    this.emit('stdin', raw);
    if (this.handle) {
      this.handle.send(raw);
    }
  }

  kill(): void {
    this.abort();
  }

  abort(): void {
    this.handle?.abort();
  }
}
