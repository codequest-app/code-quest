/* biome-ignore-all lint/suspicious/noExplicitAny: test harness uses type assertions */

import { FakeClaude } from './fake-claude.ts';
import type { FakeFilesystemService } from './fake-filesystem-service.ts';
import type { FakeGitService } from './fake-git-service.ts';
import type { FakeOpenspecService } from './fake-openspec-service.ts';
import type { FakePluginCliService } from './fake-plugin-cli-service.ts';
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
  private readonly _git?: FakeGitService;
  private readonly _openspec?: FakeOpenspecService;
  private readonly _pluginCli?: FakePluginCliService;
  private readonly _recordedEvents: Array<{ event: string; payload: any }> = [];
  private readonly _sentEvents: Array<{ event: string; payload: any }> = [];
  private _claude?: FakeClaude;

  constructor(server: ServerConnector) {
    const conn = server.connect();
    this._socket = conn.socket;
    this._provider = conn.provider;
    this._filesystem = conn.filesystem;
    if ('git' in conn) this._git = conn.git;
    if ('openspec' in conn) this._openspec = conn.openspec;
    if ('pluginCli' in conn) this._pluginCli = conn.pluginCli;

    // Auto-record all server → client events
    const { serverSocket } = this._socket;
    const origServerEmit = serverSocket.emit.bind(serverSocket);
    serverSocket.emit = (event: string, ...args: unknown[]) => {
      this._recordedEvents.push({ event, payload: args[0] });
      return origServerEmit(event, ...args);
    };

    // Auto-record all client → server emits (mirror of `events()` for assertions
    // about RPC calls the React layer issued).
    const origClientEmit = this._socket.emit.bind(this._socket);
    this._socket.emit = (event: string, ...args: unknown[]) => {
      this._sentEvents.push({ event, payload: args[0] });
      return origClientEmit(event, ...args);
    };
  }

  /** Get the FakeFilesystemService. */
  filesystem(): FakeFilesystemService {
    return this._filesystem;
  }

  /** Get the FakeGitService (only available when connected to a server with GitService). */
  git(): FakeGitService | undefined {
    return this._git;
  }

  /** Get the FakeOpenspecService. */
  openspec(): FakeOpenspecService | undefined {
    return this._openspec;
  }

  /** Get the FakePluginCliService (only when wired by server FakeServer). */
  pluginCli(): FakePluginCliService | undefined {
    return this._pluginCli;
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

  /** Query client → server emits (mirror of `events()`). Use to assert which
   *  RPC calls the React layer made — preferred over monkey-patching
   *  `socket.emit` in individual tests. */
  sentEvents(): Array<{ event: string; payload: any }>;
  sentEvents(eventName: string): any[];
  sentEvents(eventName?: string): any {
    if (!eventName) return this._sentEvents;
    return this._sentEvents.filter((e) => e.event === eventName).map((e) => e.payload);
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
    git?: FakeGitService;
    openspec?: FakeOpenspecService;
    pluginCli?: FakePluginCliService;
  };
}

/** Create a FakeSummoner from a server connector. */
export function createFakeSummoner(server: ServerConnector): FakeSummoner {
  return new FakeSummoner(server);
}
