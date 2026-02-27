import type { SpawnOptions } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { dirname, resolve } from 'node:path';
import { PassThrough } from 'node:stream';
import { fileURLToPath } from 'node:url';
import type { ClientToServerEvents, ServerToClientEvents } from '@code-quest/shared';
import type { ProcessFactory } from '@code-quest/summoner';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { Server } from 'socket.io';
import { type Socket as ClientSocket, io as ioc } from 'socket.io-client';
import { rawEntries, sessions } from '../db/schema-sqlite.ts';
import { createDatabase } from '../db/sqlite-client.ts';
import { DrizzleRawStore } from '../services/drizzle-raw-store.ts';
import { DrizzleSessionStore } from '../services/drizzle-session-store.ts';
import { DefaultSessionManager } from '../services/session-manager.ts';
import { ChatHandler } from '../socket/chat-handler.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, '../../drizzle/sqlite');

class MockProcess extends EventEmitter {
  readonly stdin = new PassThrough();
  readonly stdout = new PassThrough();
  readonly stderr = new PassThrough();
  pid = 12345;
  killed = false;

  kill(signal?: string): boolean {
    this.killed = true;
    this.emit('close', null, signal ?? null);
    return true;
  }

  emitClose(code = 0): void {
    this.stdout.end();
    this.stderr.end();
    this.emit('close', code, null);
  }
}

function createMockProcessFactory() {
  const processes: MockProcess[] = [];
  const factory = ((_command: string, _args: string[], _options: SpawnOptions) => {
    const proc = new MockProcess();
    processes.push(proc);
    return proc;
  }) as unknown as ProcessFactory;
  return { factory, processes };
}

describe('ChatHandler', () => {
  let httpServer: HttpServer;
  let io: Server<ClientToServerEvents, ServerToClientEvents>;
  let clientSocket: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
  let mock: ReturnType<typeof createMockProcessFactory>;
  let sessionManager: DefaultSessionManager;
  let rawEventStore: DrizzleRawStore;
  let db: ReturnType<typeof createDatabase>;

  beforeEach(async () => {
    mock = createMockProcessFactory();
    db = createDatabase(':memory:');
    migrate(db, { migrationsFolder });

    const sessionStore = new DrizzleSessionStore(db, sessions);
    sessionManager = new DefaultSessionManager(mock.factory, sessionStore);
    rawEventStore = new DrizzleRawStore(db, rawEntries);

    httpServer = createServer();
    io = new Server(httpServer);

    const handler = new ChatHandler(sessionManager, rawEventStore);
    handler.register(io);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => resolve());
    });

    const port = (httpServer.address() as AddressInfo).port;
    clientSocket = ioc(`http://localhost:${port}`, {
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => {
      clientSocket.on('connect', resolve);
    });
  });

  afterEach(async () => {
    clientSocket.disconnect();
    io.close();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  it('creates a session and emits chat:created', async () => {
    const result = await new Promise<{ sessionId: string }>((resolve) => {
      clientSocket.on('chat:created', resolve);
      clientSocket.emit('chat:create', {}, () => {});
    });

    expect(result.sessionId).toBeDefined();
    expect(sessionManager.get(result.sessionId)).toBeDefined();
  });

  it('sends message to session', async () => {
    const { sessionId } = await new Promise<{ sessionId: string }>((resolve) => {
      clientSocket.on('chat:created', resolve);
      clientSocket.emit('chat:create', {}, () => {});
    });

    const session = sessionManager.get(sessionId)!;
    const sendSpy = vi.spyOn(session, 'sendMessage');

    clientSocket.emit('chat:send', { sessionId, message: 'hello' });
    await new Promise((r) => setTimeout(r, 50));

    expect(sendSpy).toHaveBeenCalledWith('hello');
  });

  it('forwards session events to client', async () => {
    const { sessionId } = await new Promise<{ sessionId: string }>((resolve) => {
      clientSocket.on('chat:created', resolve);
      clientSocket.emit('chat:create', {}, () => {});
    });

    const session = sessionManager.get(sessionId)!;
    const eventPromise = new Promise<{ sessionId: string; event: unknown }>((resolve) => {
      clientSocket.on('chat:event', resolve);
    });

    session.emit('event', { type: 'text', content: 'hi' });
    const received = await eventPromise;

    expect(received.sessionId).toBe(sessionId);
    expect(received.event).toEqual({ type: 'text', content: 'hi' });
  });

  it('persists raw events to store', async () => {
    const { sessionId } = await new Promise<{ sessionId: string }>((resolve) => {
      clientSocket.on('chat:created', resolve);
      clientSocket.emit('chat:create', {}, () => {});
    });

    const session = sessionManager.get(sessionId)!;
    session.emit('raw', {
      timestamp: Date.now(),
      sessionId,
      promptId: 'prompt-1',
      direction: 'out' as const,
      raw: 'test',
    });

    await new Promise((r) => setTimeout(r, 50));
    const stored = await rawEventStore.getBySession(sessionId);
    expect(stored).toHaveLength(1);
    expect(stored[0].raw).toBe('test');
  });

  it('emits chat:exit on session exit', async () => {
    const { sessionId } = await new Promise<{ sessionId: string }>((resolve) => {
      clientSocket.on('chat:created', resolve);
      clientSocket.emit('chat:create', {}, () => {});
    });

    const session = sessionManager.get(sessionId)!;
    const exitPromise = new Promise<{ sessionId: string }>((resolve) => {
      clientSocket.on('chat:exit', resolve);
    });

    session.emit('exit');
    const result = await exitPromise;
    expect(result.sessionId).toBe(sessionId);
  });

  it('emits chat:error for unknown session on send', async () => {
    const errorPromise = new Promise<{ message: string }>((resolve) => {
      clientSocket.on('chat:error', resolve);
    });

    clientSocket.emit('chat:send', { sessionId: 'unknown', message: 'hi' });
    const result = await errorPromise;
    expect(result.message).toBe('Session not found');
  });

  it('aborts a session', async () => {
    const { sessionId } = await new Promise<{ sessionId: string }>((resolve) => {
      clientSocket.on('chat:created', resolve);
      clientSocket.emit('chat:create', {}, () => {});
    });

    const session = sessionManager.get(sessionId)!;
    const abortSpy = vi.spyOn(session, 'abort');

    clientSocket.emit('chat:abort', { sessionId });
    await new Promise((r) => setTimeout(r, 50));
    expect(abortSpy).toHaveBeenCalled();
  });

  it('responds to control request', async () => {
    const { sessionId } = await new Promise<{ sessionId: string }>((resolve) => {
      clientSocket.on('chat:created', resolve);
      clientSocket.emit('chat:create', {}, () => {});
    });

    const session = sessionManager.get(sessionId)!;
    const respondSpy = vi.spyOn(session, 'respondToControlRequest');

    clientSocket.emit('chat:control_response', {
      sessionId,
      requestId: 'req-1',
      response: { allowed: true },
    });
    await new Promise((r) => setTimeout(r, 50));

    expect(respondSpy).toHaveBeenCalledWith('req-1', { allowed: true });
  });

  it('emits error for control_response with unknown session', async () => {
    const errorPromise = new Promise<{ message: string }>((resolve) => {
      clientSocket.on('chat:error', resolve);
    });

    clientSocket.emit('chat:control_response', {
      sessionId: 'unknown',
      requestId: 'req-1',
      response: { allowed: true },
    });
    const result = await errorPromise;
    expect(result.message).toBe('Session not found');
  });

  it('kills a session', async () => {
    const { sessionId } = await new Promise<{ sessionId: string }>((resolve) => {
      clientSocket.on('chat:created', resolve);
      clientSocket.emit('chat:create', {}, () => {});
    });

    const killSpy = vi.spyOn(sessionManager, 'kill');

    clientSocket.emit('chat:kill', { sessionId });
    await new Promise((r) => setTimeout(r, 50));
    expect(killSpy).toHaveBeenCalledWith(sessionId);
  });
});
