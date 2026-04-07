/* biome-ignore-all lint/suspicious/noExplicitAny: test harness uses type assertions */

import {
  createFakeSocket,
  type FakeFilesystemService,
  FakeProcessProvider,
  type FakeSocket,
  type FakeSummoner,
  createFakeSummoner as summonerCreateFakeSummoner,
} from '@code-quest/summoner/test';
import type { Container } from 'inversify';
import { createTestContainer } from './create-test-container.ts';

/**
 * FakeServer — shared server infrastructure.
 *
 * Holds the DI container, socket server registration, and manages connections.
 * Each connect() creates a new socket/provider pair (one window).
 */
export class FakeServer {
  private readonly _container: Container;
  private _connectionHandler: ((serverSocket: unknown) => void) | null = null;
  private readonly _allServerSockets: Array<{ emit: (event: string, ...args: unknown[]) => void }> =
    [];

  constructor(container: Container) {
    this._container = container;

    const socketServer = container.get(Symbol.for('SocketServer')) as {
      register: (io: unknown) => void;
    };

    socketServer.register({
      on: (event: string, cb: (...args: unknown[]) => void) => {
        if (event === 'connection') {
          this._connectionHandler = cb;
        }
      },
      emit: (event: string, ...args: unknown[]) => {
        for (const ss of this._allServerSockets) {
          ss.emit(event, ...args);
        }
      },
    });
  }

  /** Create a new window connection — returns socket, provider, filesystem. */
  connect(): {
    socket: FakeSocket;
    provider: FakeProcessProvider;
    filesystem: FakeFilesystemService;
  } {
    const socket = createFakeSocket();
    this._allServerSockets.push(socket.serverSocket);
    this._connectionHandler?.(socket.serverSocket);
    const provider = new FakeProcessProvider();
    if (!this._container.isBound(Symbol.for('ProcessProvider'))) {
      this._container.bind(Symbol.for('ProcessProvider')).toConstantValue(provider);
    }
    const filesystem = this._container.get(
      Symbol.for('FilesystemService'),
    ) as FakeFilesystemService;
    return { socket, provider, filesystem };
  }
}

/** Create a FakeServer. Pass a container for tests that need direct container access. */
export function createFakeServer(container?: Container): FakeServer {
  return new FakeServer(container ?? createTestContainer());
}

/** Create a FakeSummoner (one window). Optionally connect to a shared FakeServer. */
export function createFakeSummoner(server?: FakeServer): FakeSummoner {
  return summonerCreateFakeSummoner(server ?? new FakeServer(createTestContainer()));
}
