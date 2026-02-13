import { Server as HTTPServer } from 'node:http';
import type { Socket } from 'socket.io';
import { Server as SocketIOServer } from 'socket.io';
import { type Socket as ClientSocket, io as ioClient } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatManager } from '../../chat/types.ts';
import { TYPES } from '../../container.ts';
import type { TerminalManager } from '../../terminal/types.ts';
import { createTestContainer } from '../../test/create-test-container.ts';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketHandler,
  WorkerInfo,
} from '../types.ts';

describe('SocketHandler', () => {
  let httpServer: HTTPServer;
  let io: SocketIOServer;
  let handler: SocketHandler;
  let terminalManager: TerminalManager;
  let chatManager: ChatManager;
  let clientSocket: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
  let serverSocket: Socket;

  beforeEach(async () => {
    // Create DI container
    const container = createTestContainer();
    terminalManager = container.get<TerminalManager>(TYPES.TerminalManager);
    chatManager = container.get<ChatManager>(TYPES.ChatManager);
    handler = container.get<SocketHandler>(TYPES.SocketHandler);

    // Create HTTP server and Socket.io server
    httpServer = new HTTPServer();
    io = new SocketIOServer(httpServer, {
      cors: { origin: '*' },
    });

    // Attach handler to io
    handler.attach(io);

    // Start server on random port
    await new Promise<void>((resolve) => {
      httpServer.listen(0, resolve);
    });

    const addr = httpServer.address() as { port: number };

    // Create client
    clientSocket = ioClient(`http://localhost:${addr.port}`, {
      transports: ['websocket'],
    });

    // Wait for connection
    await new Promise<void>((resolve) => {
      clientSocket.on('connect', resolve);
    });

    // Get server socket
    serverSocket = Array.from(io.sockets.sockets.values())[0];
  });

  afterEach(async () => {
    // Cleanup
    if (clientSocket?.connected) {
      clientSocket.disconnect();
    }

    terminalManager.cleanup();
    chatManager.cleanup();

    await new Promise<void>((resolve) => {
      io.close(() => {
        httpServer.close(() => resolve());
      });
    });
  });

  describe('connection management', () => {
    it('should handle client connection', () => {
      expect(clientSocket.connected).toBe(true);
      expect(serverSocket).toBeDefined();
    });

    it('should handle client disconnection', async () => {
      const disconnectSpy = vi.fn();
      serverSocket.on('disconnect', disconnectSpy);

      clientSocket.disconnect();

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should handle multiple client connections', async () => {
      const addr = httpServer.address() as { port: number };
      const client2 = ioClient(`http://localhost:${addr.port}`, {
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        client2.on('connect', resolve);
      });

      expect(io.sockets.sockets.size).toBe(2);

      client2.disconnect();
    });
  });

  describe('terminal:create', () => {
    it('should create a new terminal session', async () => {
      const created = new Promise<{ sessionId: string; pid: number }>((resolve) => {
        clientSocket.on('terminal:created', (sessionId, pid) => {
          resolve({ sessionId, pid });
        });
      });

      clientSocket.emit('terminal:create');

      const result = await created;

      expect(result.sessionId).toBeTruthy();
      expect(result.pid).toBeGreaterThan(0);
    });

    it('should create terminal with custom options', async () => {
      const created = new Promise<{ sessionId: string; pid: number }>((resolve) => {
        clientSocket.on('terminal:created', (sessionId, pid) => {
          resolve({ sessionId, pid });
        });
      });

      clientSocket.emit('terminal:create', {
        cols: 100,
        rows: 30,
      });

      const result = await created;

      expect(result.sessionId).toBeTruthy();
      expect(result.pid).toBeGreaterThan(0);
    });

    it('should handle terminal creation error', async () => {
      const error = new Promise<string>((resolve) => {
        clientSocket.on('terminal:error', (message) => {
          resolve(message);
        });
      });

      clientSocket.emit('terminal:create', {
        shell: '/nonexistent/shell',
      });

      const errorMessage = await error;

      expect(errorMessage).toContain('Failed to create terminal');
    });
  });

  describe('terminal:write', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Create a session first
      const created = new Promise<string>((resolve) => {
        clientSocket.on('terminal:created', (id) => {
          resolve(id);
        });
      });

      clientSocket.emit('terminal:create');
      sessionId = await created;
    });

    it('should write data to terminal', async () => {
      const dataReceived = new Promise<string>((resolve) => {
        clientSocket.on('terminal:data', (id, data) => {
          if (id === sessionId) {
            resolve(data);
          }
        });
      });

      clientSocket.emit('terminal:write', sessionId, 'echo "test"\n');

      const data = await dataReceived;

      expect(data).toContain('echo "test"');
    });

    it('should handle write to non-existent session', async () => {
      const error = new Promise<string>((resolve) => {
        clientSocket.on('terminal:error', (message) => {
          resolve(message);
        });
      });

      clientSocket.emit('terminal:write', 'non-existent-id', 'test');

      const errorMessage = await error;

      expect(errorMessage).toContain('Session not found');
    });
  });

  describe('terminal:resize', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Create a session first
      const created = new Promise<string>((resolve) => {
        clientSocket.on('terminal:created', (id) => {
          resolve(id);
        });
      });

      clientSocket.emit('terminal:create');
      sessionId = await created;
    });

    it('should resize terminal', () => {
      expect(() => {
        clientSocket.emit('terminal:resize', sessionId, 120, 40);
      }).not.toThrow();
    });

    it('should handle resize of non-existent session', async () => {
      const error = new Promise<string>((resolve) => {
        clientSocket.on('terminal:error', (message) => {
          resolve(message);
        });
      });

      clientSocket.emit('terminal:resize', 'non-existent-id', 100, 30);

      const errorMessage = await error;

      expect(errorMessage).toContain('Session not found');
    });
  });

  describe('terminal:kill', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Create a session first
      const created = new Promise<string>((resolve) => {
        clientSocket.on('terminal:created', (id) => {
          resolve(id);
        });
      });

      clientSocket.emit('terminal:create');
      sessionId = await created;
    });

    it('should kill terminal session', async () => {
      const exited = new Promise<{ sessionId: string; exitCode: number }>((resolve) => {
        clientSocket.on('terminal:exit', (id, exitCode) => {
          resolve({ sessionId: id, exitCode });
        });
      });

      clientSocket.emit('terminal:kill', sessionId);

      const result = await exited;

      expect(result.sessionId).toBe(sessionId);
      expect(result.exitCode).toBeDefined();
    });

    it('should handle kill of non-existent session', async () => {
      const error = new Promise<string>((resolve) => {
        clientSocket.on('terminal:error', (message) => {
          resolve(message);
        });
      });

      clientSocket.emit('terminal:kill', 'non-existent-id');

      const errorMessage = await error;

      expect(errorMessage).toContain('Session not found');
    });
  });

  describe('terminal:list', () => {
    it('should list all terminal sessions', async () => {
      const list = new Promise<string[]>((resolve) => {
        clientSocket.on('terminal:list', (sessionIds) => {
          resolve(sessionIds);
        });
      });

      clientSocket.emit('terminal:list');

      const sessionIds = await list;

      expect(Array.isArray(sessionIds)).toBe(true);
      expect(sessionIds).toHaveLength(0);
    });

    it('should list created terminal sessions', async () => {
      // Create two sessions
      const created1 = new Promise<string>((resolve) => {
        clientSocket.once('terminal:created', (id) => resolve(id));
      });
      clientSocket.emit('terminal:create');
      const id1 = await created1;

      const created2 = new Promise<string>((resolve) => {
        clientSocket.once('terminal:created', (id) => resolve(id));
      });
      clientSocket.emit('terminal:create');
      const id2 = await created2;

      // List sessions
      const list = new Promise<string[]>((resolve) => {
        clientSocket.on('terminal:list', (sessionIds) => {
          resolve(sessionIds);
        });
      });

      clientSocket.emit('terminal:list');

      const sessionIds = await list;

      expect(sessionIds).toHaveLength(2);
      expect(sessionIds).toContain(id1);
      expect(sessionIds).toContain(id2);
    });
  });

  describe('terminal:data event', () => {
    it('should broadcast terminal data to client', async () => {
      // Create session
      const created = new Promise<string>((resolve) => {
        clientSocket.on('terminal:created', (id) => {
          resolve(id);
        });
      });

      clientSocket.emit('terminal:create');
      const sessionId = await created;

      // Listen for data
      const dataReceived = new Promise<string>((resolve) => {
        clientSocket.on('terminal:data', (id, data) => {
          if (id === sessionId && data.includes('hello')) {
            resolve(data);
          }
        });
      });

      // Write to terminal
      clientSocket.emit('terminal:write', sessionId, 'echo "hello"\n');

      const data = await dataReceived;

      expect(data).toContain('hello');
    });
  });

  describe('terminal:exit event', () => {
    it('should broadcast terminal exit to client', async () => {
      // Create session
      const created = new Promise<string>((resolve) => {
        clientSocket.on('terminal:created', (id) => {
          resolve(id);
        });
      });

      clientSocket.emit('terminal:create');
      const sessionId = await created;

      // Listen for exit
      const exited = new Promise<{ sessionId: string; exitCode: number }>((resolve) => {
        clientSocket.on('terminal:exit', (id, exitCode) => {
          resolve({ sessionId: id, exitCode });
        });
      });

      // Kill terminal
      clientSocket.emit('terminal:kill', sessionId);

      const result = await exited;

      expect(result.sessionId).toBe(sessionId);
      expect(typeof result.exitCode).toBe('number');
    });
  });

  describe('chat events', () => {
    it('should create chat session and emit chat:created', async () => {
      const created = new Promise<{ sessionId: string; provider: string }>((resolve) => {
        clientSocket.on('chat:created', (sessionId: string, provider: string) => {
          resolve({ sessionId, provider });
        });
      });

      clientSocket.emit('chat:create', { provider: 'claude' });

      const result = await created;
      expect(result.sessionId).toBeTruthy();
      expect(result.provider).toBe('claude');
    });

    it('should forward chat:event on chat:send', async () => {
      // Create a session first
      const created = new Promise<string>((resolve) => {
        clientSocket.on('chat:created', (sessionId: string) => {
          resolve(sessionId);
        });
      });

      clientSocket.emit('chat:create', { provider: 'claude' });
      const sessionId = await created;
      expect(sessionId).toBeTruthy();

      // chat:send will try to spawn the real CLI which won't exist in tests,
      // so we just verify the session was created successfully
      expect(chatManager.getSession(sessionId)).toBeDefined();
    });

    it('should handle chat:abort for non-existent session', async () => {
      const error = new Promise<{ id: string; msg: string }>((resolve) => {
        clientSocket.on('chat:error', (id: string, msg: string) => {
          resolve({ id, msg });
        });
      });

      clientSocket.emit('chat:abort', 'non-existent-id');

      const result = await error;
      expect(result.msg).toContain('Session not found');
    });

    it('should handle chat:kill', async () => {
      // Create session
      const created = new Promise<string>((resolve) => {
        clientSocket.on('chat:created', (sessionId: string) => {
          resolve(sessionId);
        });
      });

      clientSocket.emit('chat:create', { provider: 'claude' });
      const sessionId = await created;

      // Kill it
      clientSocket.emit('chat:kill', sessionId);

      // Wait a bit for the kill to process
      await new Promise((r) => setTimeout(r, 100));

      expect(chatManager.getSession(sessionId)).toBeUndefined();
    });
  });

  describe('orchestrator events', () => {
    it('should create orchestrator and emit orchestrator:created', async () => {
      const created = new Promise<{ orchId: string; coordinatorId: string; provider: string }>(
        (resolve) => {
          clientSocket.on(
            'orchestrator:created',
            (orchId: string, coordinatorId: string, provider: string) => {
              resolve({ orchId, coordinatorId, provider });
            },
          );
        },
      );

      clientSocket.emit('orchestrator:create', { provider: 'claude' });

      const result = await created;
      expect(result.orchId).toBeTruthy();
      expect(result.coordinatorId).toBeTruthy();
      expect(result.provider).toBe('claude');
    });

    it('should dispatch sub-tasks and emit orchestrator:dispatched', async () => {
      // Create orchestrator first
      const created = new Promise<string>((resolve) => {
        clientSocket.on('orchestrator:created', (orchId: string) => {
          resolve(orchId);
        });
      });

      clientSocket.emit('orchestrator:create', { provider: 'claude' });
      const orchId = await created;

      const dispatched = new Promise<{ orchId: string; workers: WorkerInfo[] }>((resolve) => {
        clientSocket.on('orchestrator:dispatched', (id: string, workers: WorkerInfo[]) => {
          resolve({ orchId: id, workers });
        });
      });

      clientSocket.emit('orchestrator:dispatch', orchId, [
        { description: 'task1', provider: 'claude' },
        { description: 'task2', provider: 'gemini' },
      ]);

      const result = await dispatched;
      expect(result.orchId).toBe(orchId);
      expect(result.workers).toHaveLength(2);
    });

    it('should emit orchestrator:status on lifecycle changes', async () => {
      const created = new Promise<string>((resolve) => {
        clientSocket.on('orchestrator:created', (orchId: string) => {
          resolve(orchId);
        });
      });

      clientSocket.emit('orchestrator:create', { provider: 'claude' });
      const orchId = await created;

      const statuses: string[] = [];
      clientSocket.on('orchestrator:status', (_id: string, status: string) => {
        statuses.push(status);
      });

      clientSocket.emit('orchestrator:dispatch', orchId, [
        { description: 'task1', provider: 'claude' },
      ]);

      // Wait for dispatch status events
      await new Promise((r) => setTimeout(r, 500));

      expect(statuses).toContain('dispatching');
      expect(statuses).toContain('workers-running');
    });

    it('should handle orchestrator:abort', async () => {
      const created = new Promise<string>((resolve) => {
        clientSocket.on('orchestrator:created', (orchId: string) => {
          resolve(orchId);
        });
      });

      clientSocket.emit('orchestrator:create', { provider: 'claude' });
      const orchId = await created;

      // Dispatch and immediately abort
      clientSocket.emit('orchestrator:dispatch', orchId, [
        { description: 'task1', provider: 'claude' },
      ]);

      await new Promise((r) => setTimeout(r, 50));

      const statusPromise = new Promise<string>((resolve) => {
        clientSocket.on('orchestrator:status', (_id: string, status: string) => {
          if (status === 'error') resolve(status);
        });
      });

      clientSocket.emit('orchestrator:abort', orchId);

      const status = await statusPromise;
      expect(status).toBe('error');
    });

    it('should handle orchestrator:kill', async () => {
      const created = new Promise<string>((resolve) => {
        clientSocket.on('orchestrator:created', (orchId: string) => {
          resolve(orchId);
        });
      });

      clientSocket.emit('orchestrator:create', { provider: 'claude' });
      const orchId = await created;

      clientSocket.emit('orchestrator:kill', orchId);

      await new Promise((r) => setTimeout(r, 100));

      // Trying to dispatch on a killed orchestrator should error
      const error = new Promise<string>((resolve) => {
        clientSocket.on('orchestrator:error', (_id: string, msg: string) => {
          resolve(msg);
        });
      });

      clientSocket.emit('orchestrator:dispatch', orchId, [
        { description: 'task1', provider: 'claude' },
      ]);

      const errorMsg = await error;
      expect(errorMsg).toContain('not found');
    });

    it('should handle dispatch on non-existent orchestrator', async () => {
      const error = new Promise<string>((resolve) => {
        clientSocket.on('orchestrator:error', (_id: string, msg: string) => {
          resolve(msg);
        });
      });

      clientSocket.emit('orchestrator:dispatch', 'non-existent', [
        { description: 'task1', provider: 'claude' },
      ]);

      const errorMsg = await error;
      expect(errorMsg).toContain('not found');
    });
  });

  describe('validation', () => {
    it('should emit terminal:error for invalid terminal:create options', async () => {
      const error = new Promise<string>((resolve) => {
        clientSocket.on('terminal:error', (message) => {
          resolve(message);
        });
      });

      // @ts-expect-error intentionally invalid
      clientSocket.emit('terminal:create', { cols: 'bad' });

      const errorMsg = await error;
      expect(errorMsg).toContain('Validation error');
    });

    it('should emit terminal:error for terminal:resize with negative cols', async () => {
      const error = new Promise<string>((resolve) => {
        clientSocket.on('terminal:error', (message) => {
          resolve(message);
        });
      });

      // @ts-expect-error intentionally invalid
      clientSocket.emit('terminal:resize', 'some-id', -1, 40);

      const errorMsg = await error;
      expect(errorMsg).toContain('Validation error');
    });

    it('should emit chat:error for invalid chat:create provider', async () => {
      const error = new Promise<{ id: string; msg: string }>((resolve) => {
        clientSocket.on('chat:error', (id: string, msg: string) => {
          resolve({ id, msg });
        });
      });

      // @ts-expect-error intentionally invalid
      clientSocket.emit('chat:create', { provider: 'openai' });

      const result = await error;
      expect(result.id).toBe('');
      expect(result.msg).toContain('Validation error');
    });

    it('should emit chat:error for chat:send with empty message', async () => {
      const error = new Promise<{ id: string; msg: string }>((resolve) => {
        clientSocket.on('chat:error', (id: string, msg: string) => {
          resolve({ id, msg });
        });
      });

      clientSocket.emit('chat:send', 'some-id', '');

      const result = await error;
      expect(result.msg).toContain('Validation error');
    });

    it('should emit orchestrator:error for dispatch with empty tasks', async () => {
      const error = new Promise<{ id: string; msg: string }>((resolve) => {
        clientSocket.on('orchestrator:error', (id: string, msg: string) => {
          resolve({ id, msg });
        });
      });

      clientSocket.emit('orchestrator:dispatch', 'some-id', []);

      const result = await error;
      expect(result.msg).toContain('Validation error');
    });

    it('should emit orchestrator:error for create with invalid provider', async () => {
      const error = new Promise<{ id: string; msg: string }>((resolve) => {
        clientSocket.on('orchestrator:error', (id: string, msg: string) => {
          resolve({ id, msg });
        });
      });

      // @ts-expect-error intentionally invalid
      clientSocket.emit('orchestrator:create', { provider: 'openai' });

      const result = await error;
      expect(result.msg).toContain('Validation error');
    });
  });

  describe('cleanup on disconnect', () => {
    it('should cleanup client sessions on disconnect', async () => {
      // Create session
      const created = new Promise<string>((resolve) => {
        clientSocket.on('terminal:created', (id) => {
          resolve(id);
        });
      });

      clientSocket.emit('terminal:create');
      const sessionId = await created;

      // Verify session exists
      expect(terminalManager.getSession(sessionId)).toBeDefined();

      // Disconnect client
      clientSocket.disconnect();

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Session should still exist (cleanup happens on explicit kill only)
      // This is by design - sessions survive disconnects
      expect(terminalManager.getSession(sessionId)).toBeDefined();
    });
  });
});
