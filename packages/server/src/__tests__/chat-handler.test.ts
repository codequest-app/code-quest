import { EventEmitter } from 'node:events';
import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { ClientToServerEvents, ServerToClientEvents } from '@code-quest/shared';
import type { ChatSession } from '@code-quest/summoner';
import { Server } from 'socket.io';
import { type Socket as ClientSocket, io as ioc } from 'socket.io-client';
import type { RawEventStore } from '../services/raw-event-store.ts';
import type { SessionManager } from '../services/session-manager.ts';
import { ChatHandler } from '../socket/chat-handler.ts';

function createMockSession(id = 'test-session'): ChatSession & EventEmitter {
  const session = new EventEmitter() as ChatSession & EventEmitter;
  Object.assign(session, {
    id,
    state: 'idle' as const,
    sendMessage: vi.fn(),
    abort: vi.fn(),
    kill: vi.fn(),
  });
  return session;
}

describe('ChatHandler', () => {
  let httpServer: HttpServer;
  let io: Server<ClientToServerEvents, ServerToClientEvents>;
  let clientSocket: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
  let mockSessionManager: SessionManager;
  let mockRawEventStore: RawEventStore;
  let mockSession: ChatSession & EventEmitter;

  beforeEach(async () => {
    mockSession = createMockSession();

    mockSessionManager = {
      create: vi.fn().mockReturnValue(mockSession),
      get: vi.fn().mockReturnValue(mockSession),
      kill: vi.fn(),
      getAll: vi.fn().mockReturnValue([]),
    };

    mockRawEventStore = {
      append: vi.fn().mockResolvedValue(undefined),
      getBySession: vi.fn().mockResolvedValue([]),
    };

    httpServer = createServer();
    io = new Server(httpServer);

    const handler = new ChatHandler(mockSessionManager, mockRawEventStore);
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

    expect(result.sessionId).toBe('test-session');
    expect(mockSessionManager.create).toHaveBeenCalled();
  });

  it('sends message to session', async () => {
    // Create session first
    await new Promise<void>((resolve) => {
      clientSocket.on('chat:created', () => resolve());
      clientSocket.emit('chat:create', {}, () => {});
    });

    clientSocket.emit('chat:send', { sessionId: 'test-session', message: 'hello' });

    // Give it a tick
    await new Promise((r) => setTimeout(r, 50));
    expect(mockSession.sendMessage).toHaveBeenCalledWith('hello');
  });

  it('forwards session events to client', async () => {
    await new Promise<void>((resolve) => {
      clientSocket.on('chat:created', () => resolve());
      clientSocket.emit('chat:create', {}, () => {});
    });

    const eventPromise = new Promise<{ sessionId: string; event: unknown }>((resolve) => {
      clientSocket.on('chat:event', resolve);
    });

    mockSession.emit('event', { type: 'text', content: 'hi' });
    const received = await eventPromise;

    expect(received.sessionId).toBe('test-session');
    expect(received.event).toEqual({ type: 'text', content: 'hi' });
  });

  it('persists raw events', async () => {
    await new Promise<void>((resolve) => {
      clientSocket.on('chat:created', () => resolve());
      clientSocket.emit('chat:create', {}, () => {});
    });

    const rawEntry = {
      timestamp: Date.now(),
      sessionId: 'test-session',
      turnId: 1,
      direction: 'out' as const,
      raw: 'test',
    };
    mockSession.emit('raw', rawEntry);

    await new Promise((r) => setTimeout(r, 50));
    expect(mockRawEventStore.append).toHaveBeenCalledWith(rawEntry);
  });

  it('emits chat:exit on session exit', async () => {
    await new Promise<void>((resolve) => {
      clientSocket.on('chat:created', () => resolve());
      clientSocket.emit('chat:create', {}, () => {});
    });

    const exitPromise = new Promise<{ sessionId: string }>((resolve) => {
      clientSocket.on('chat:exit', resolve);
    });

    mockSession.emit('exit');
    const result = await exitPromise;
    expect(result.sessionId).toBe('test-session');
  });

  it('emits chat:error for unknown session on send', async () => {
    (mockSessionManager.get as ReturnType<typeof vi.fn>).mockReturnValue(undefined);

    const errorPromise = new Promise<{ message: string }>((resolve) => {
      clientSocket.on('chat:error', resolve);
    });

    clientSocket.emit('chat:send', { sessionId: 'unknown', message: 'hi' });
    const result = await errorPromise;
    expect(result.message).toBe('Session not found');
  });

  it('aborts a session', async () => {
    clientSocket.emit('chat:abort', { sessionId: 'test-session' });
    await new Promise((r) => setTimeout(r, 50));
    expect(mockSession.abort).toHaveBeenCalled();
  });

  it('kills a session', async () => {
    clientSocket.emit('chat:kill', { sessionId: 'test-session' });
    await new Promise((r) => setTimeout(r, 50));
    expect(mockSessionManager.kill).toHaveBeenCalledWith('test-session');
  });
});
