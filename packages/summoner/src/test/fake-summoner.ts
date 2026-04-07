/* biome-ignore-all lint/suspicious/noExplicitAny: test harness uses type assertions */

import { FakeClaude } from './fake-claude.ts';
import type { FakeFilesystemService } from './fake-filesystem-service.ts';
import type { FakeProcessProvider } from './fake-process-provider.ts';
import type { FakeSocket } from './fake-socket.ts';

/**
 * FakeSummoner — one window/connection.
 *
 * Holds its own socket, lazy-creates Claude on first call to claude().
 * No container dependency — summoner layer doesn't know about DI.
 */
export class FakeSummoner {
  private readonly _socket: FakeSocket;
  private readonly _provider: FakeProcessProvider;
  private readonly _filesystem: FakeFilesystemService;
  private readonly _recordedEvents: Array<{ event: string; payload: any }> = [];
  private _claude?: FakeClaude;

  constructor(server: ServerConnector) {
    const { socket, provider, filesystem } = server.connect();
    this._socket = socket;
    this._provider = provider;
    this._filesystem = filesystem;

    // Auto-record all server → client events
    const { serverSocket } = socket;
    const origEmit = serverSocket.emit.bind(serverSocket);
    serverSocket.emit = (event: string, ...args: unknown[]) => {
      this._recordedEvents.push({ event, payload: args[0] });
      return origEmit(event, ...args);
    };
  }

  /** Get the FakeFilesystemService. */
  filesystem(): FakeFilesystemService {
    return this._filesystem;
  }

  /** Lazy Claude — created on first call. */
  claude(): FakeClaude {
    if (!this._claude) {
      this._claude = new FakeClaude({
        socket: this._socket,
        provider: this._provider,
      });
    }
    return this._claude;
  }

  /** Send socket event to server. */
  async send<T = void>(event: string, payload?: unknown): Promise<T> {
    return this.claude().send<T>(event, payload);
  }

  /** Query recorded server-pushed events. */
  events(): Array<{ event: string; payload: any }>;
  events(eventName: string): any[];
  events(eventName?: string): any {
    if (!eventName) return this._recordedEvents;
    return this._recordedEvents.filter((e) => e.event === eventName).map((e) => e.payload);
  }

  /** Subscribe to server events with callback (for timing-sensitive checks). */
  on(event: string, fn: (...args: any[]) => void): void {
    this._socket.on(event, fn);
  }

  disconnect(): void {
    this._socket.disconnect();
  }

  get connected(): boolean {
    return this._socket.connected;
  }

  /** Access socket for React SocketProvider injection. */
  get socket(): FakeSocket {
    return this._socket;
  }
}

/** Interface for server-like objects that can create window connections. */
export interface ServerConnector {
  connect(): {
    socket: FakeSocket;
    provider: FakeProcessProvider;
    filesystem: FakeFilesystemService;
  };
}

/** Create a FakeSummoner from a server connector. */
export function createFakeSummoner(server: ServerConnector): FakeSummoner {
  return new FakeSummoner(server);
}
