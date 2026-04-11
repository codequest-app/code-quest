/* biome-ignore-all lint/suspicious/noExplicitAny: test harness uses type assertions */

import type { FilesystemService, GitService } from '@code-quest/summoner';
import {
  createFakeSocket,
  type FakeFilesystemService,
  type FakeGitService,
  FakeProcessProvider,
  type FakeSocket,
  type FakeSummoner,
  createFakeSummoner as summonerCreateFakeSummoner,
} from '@code-quest/summoner/test';
import type { Container } from 'inversify';
import type { SocketServer } from '../socket/server.ts';
import { TYPES } from '../types.ts';
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
  private readonly _allServerSockets: FakeSocket['serverSocket'][] = [];

  constructor(container: Container) {
    this._container = container;

    const socketServer = container.get<SocketServer>(TYPES.SocketServer);

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
    } as any);
  }

  /** Create a new window connection — returns socket, provider, filesystem, git. */
  connect(): {
    socket: FakeSocket;
    provider: FakeProcessProvider;
    filesystem: FakeFilesystemService;
    git: FakeGitService;
  } {
    const socket = createFakeSocket();
    this._allServerSockets.push(socket.serverSocket);
    this._connectionHandler?.(socket.serverSocket);
    const provider = new FakeProcessProvider();
    if (!this._container.isBound(TYPES.ProcessProvider)) {
      this._container.bind(TYPES.ProcessProvider).toConstantValue(provider);
    }
    const filesystem = this._container.get<FilesystemService>(
      TYPES.FilesystemService,
    ) as FakeFilesystemService;
    const git = this._container.get<GitService>(TYPES.GitService) as FakeGitService;
    return { socket, provider, filesystem, git };
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
