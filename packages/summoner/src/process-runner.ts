import { EventEmitter } from 'node:events';
import type { LaunchOptions } from './protocol/provider-adapter.ts';
import type { ProcessHandle, ProcessProvider, ProviderAdapter } from './types.ts';

interface ProcessRunnerOptions {
  adapter: ProviderAdapter;
  processProvider?: ProcessProvider;
  args?: LaunchOptions;
  parentEnv?: NodeJS.ProcessEnv;
}

export class ProcessRunner extends EventEmitter {
  private readonly adapter: ProviderAdapter;
  private readonly processProvider?: ProcessProvider;
  private readonly launchArgs: string[];
  private readonly parentEnv: NodeJS.ProcessEnv;
  private handle: ProcessHandle | null = null;

  constructor(options: ProcessRunnerOptions) {
    super();
    this.adapter = options.adapter;
    this.processProvider = options.processProvider;
    this.launchArgs = this.adapter.buildArgs(options.args);
    this.parentEnv = options.parentEnv ?? process.env;
  }

  spawn(): void {
    if (this.handle) return;

    const env = { ...this.parentEnv };
    delete env.CLAUDECODE;
    delete env.CLAUDE_CODE_ENTRYPOINT;

    const handle = this.processProvider?.spawn(this.adapter.command, this.launchArgs, {
      env,
    });
    if (!handle) return;
    this.handle = handle;

    (async () => {
      try {
        for await (const line of handle.lines) {
          this.emit('stdout', line);
          this._processLine(line);
        }
      } catch {
        // iteration ended (abort or process exit)
      }
      this.handle = null;
      this.emit('exit', null);
    })();
  }

  private _processLine(line: string): void {
    const result = this.adapter.parseLine(line);
    let protocolEvent: Record<string, unknown> | null = null;

    switch (result.status) {
      case 'skip':
        return;
      case 'ok':
        protocolEvent = result.event as Record<string, unknown>;
        break;
      case 'unknown':
        protocolEvent = {
          type: 'raw_event' as const,
          rawType: result.type,
          data: result.data,
        };
        break;
      case 'error':
        protocolEvent = {
          type: 'raw_event' as const,
          rawType: 'parse_error',
          data: JSON.parse(result.raw),
        };
        break;
    }

    if (!protocolEvent) return;

    const { events, controlResponses, serverActions } = this.adapter.transform(protocolEvent);
    for (const cr of controlResponses) {
      this.emit('control_response', cr);
    }
    for (const se of events) {
      this.emit('socket_event', se);
    }
    for (const sa of serverActions) {
      this.emit('server_action', sa);
    }
  }

  write(raw: string): void {
    this._write(raw);
  }

  sendMessage(text: string): void {
    this._write(this.adapter.formatMessage(text));
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

  abort(): void {
    this.handle?.abort();
  }
}
