import { EventEmitter } from 'node:events';
import { logger } from './logger.ts';
import type {
  ClientMessage,
  ParseResult,
  ProcessHandle,
  ProcessProvider,
  ProviderAdapter,
} from './types.ts';
import { isRecord } from './utils.ts';

const INHERITED_ENV_KEYS_TO_REMOVE = ['CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT'] as const;
const SDK_FILE_CHECKPOINTING_KEY = 'CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING';

/** Synthesize a raw_event fallback for unknown/error parse results so the
 *  adapter only ever sees typed messages. Returns null for skip. The `E as`
 *  casts assume the adapter's E union includes a raw_event variant (e.g.
 *  ClaudeAdapter's ProtocolMessage). Providers without that fallback cannot
 *  use this helper. */
function toProtocolMessage<E>(result: ParseResult<E>): E | null {
  switch (result.status) {
    case 'skip':
      return null;
    case 'ok':
      return result.message;
    case 'unknown':
      return { type: 'raw_event', rawType: result.type, data: result.data } as E;
    case 'error': {
      let data: unknown;
      try {
        data = JSON.parse(result.raw);
      } catch (err) {
        logger.debug({ err }, 'Failed to parse JSON');
        data = { raw: result.raw };
      }
      return { type: 'raw_event', rawType: 'parse_error', data } as E;
    }
  }
}

interface ProcessRunnerOptions<E = unknown, L = unknown> {
  adapter: ProviderAdapter<E, L>;
  processProvider?: ProcessProvider;
  args?: L;
  parentEnv?: NodeJS.ProcessEnv;
  spawnOptions?: Record<string, unknown>;
}

export class ProcessRunner<E = unknown, L = unknown> extends EventEmitter {
  private readonly adapter: ProviderAdapter<E, L>;
  private readonly processProvider?: ProcessProvider;
  readonly launchArgs: string[];
  private readonly parentEnv: NodeJS.ProcessEnv;
  private readonly spawnOptions: Record<string, unknown>;
  private handle: ProcessHandle | null = null;

  constructor(options: ProcessRunnerOptions<E, L>) {
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
    for (const key of INHERITED_ENV_KEYS_TO_REMOVE) delete env[key];
    env[SDK_FILE_CHECKPOINTING_KEY] = 'true';

    const handle = this.processProvider?.spawn(this.adapter.command, this.launchArgs, {
      env,
      ...this.spawnOptions,
    });
    if (!handle) return;
    this.handle = handle;

    this._consumeLines(handle);
  }

  private async _consumeLines(handle: ProcessHandle): Promise<void> {
    try {
      for await (const line of handle.lines) {
        this.emit('stdout', line);
        this._processLine(line);
      }
    } catch (error) {
      logger.debug({ err: error }, 'Async iteration ended with error');
    }
    this.handle = null;
    this.emit('exit', null);
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
    const base = isRecord(message.payload) ? message.payload : {};
    return { ...message, payload: { ...base, args: this.launchArgs } };
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
    this.handle?.abort();
  }
}
