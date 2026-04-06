import { EventEmitter } from 'node:events';
import type { ProcessHandle, ProcessProvider, ProviderAdapter } from './types.ts';

export interface ProcessRunnerOptions {
  adapter: ProviderAdapter;
  processProvider?: ProcessProvider;
  args?: unknown;
  parentEnv?: NodeJS.ProcessEnv;
  spawnOptions?: Record<string, unknown>;
}

export class ProcessRunner extends EventEmitter {
  private readonly adapter: ProviderAdapter;
  private readonly processProvider?: ProcessProvider;
  private readonly launchArgs: string[];
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
    let protocolMessage: unknown = null;

    switch (result.status) {
      case 'skip':
        return;
      case 'ok':
        protocolMessage = result.message;
        break;
      case 'unknown':
        protocolMessage = {
          type: 'raw_event' as const,
          rawType: result.type,
          data: result.data,
        };
        break;
      case 'error': {
        let data: unknown;
        try {
          data = JSON.parse(result.raw);
        } catch (error) {
          console.debug('Failed to parse JSON', error);
          data = { raw: result.raw };
        }
        protocolMessage = {
          type: 'raw_event' as const,
          rawType: 'parse_error',
          data,
        };
        break;
      }
    }

    if (!protocolMessage) return;

    const { messages, controlResponses } = this.adapter.transform(protocolMessage);
    for (const cr of controlResponses) {
      this.emit('control_response', cr);
    }
    for (const message of messages) {
      this.emit('client_message', message);
    }
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
