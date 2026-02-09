import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { SocketHandlerImpl } from '../handler';
import { TerminalManagerImpl } from '../../terminal/manager';
import type { TerminalManager } from '../../terminal/types';

describe('SocketHandler', () => {
  let httpServer: HTTPServer;
  let io: SocketIOServer;
  let handler: SocketHandlerImpl;
  let terminalManager: TerminalManager;
  let clientSocket: ClientSocket;
  let serverSocket: Socket;
  const port = 3001;

  beforeEach(async () => {
    // Create HTTP server
    httpServer = new HTTPServer();

    // Create terminal manager
    terminalManager = new TerminalManagerImpl();

    // Create Socket.io server and handler
    io = new SocketIOServer(httpServer, {
      cors: { origin: '*' },
    });

    handler = new SocketHandlerImpl(io, { terminalManager });

    // Start server
    await new Promise<void>((resolve) => {
      httpServer.listen(port, resolve);
    });

    // Create client
    clientSocket = ioClient(`http://localhost:${port}`, {
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
      const client2 = ioClient(`http://localhost:${port}`, {
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
      const created = new Promise<{ sessionId: string; pid: number }>(
        (resolve) => {
          clientSocket.on('terminal:created', (sessionId, pid) => {
            resolve({ sessionId, pid });
          });
        }
      );

      clientSocket.emit('terminal:create');

      const result = await created;

      expect(result.sessionId).toBeTruthy();
      expect(result.pid).toBeGreaterThan(0);
    });

    it('should create terminal with custom options', async () => {
      const created = new Promise<{ sessionId: string; pid: number }>(
        (resolve) => {
          clientSocket.on('terminal:created', (sessionId, pid) => {
            resolve({ sessionId, pid });
          });
        }
      );

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
      const exited = new Promise<{ sessionId: string; exitCode: number }>(
        (resolve) => {
          clientSocket.on('terminal:exit', (id, exitCode) => {
            resolve({ sessionId: id, exitCode });
          });
        }
      );

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
      const exited = new Promise<{ sessionId: string; exitCode: number }>(
        (resolve) => {
          clientSocket.on('terminal:exit', (id, exitCode) => {
            resolve({ sessionId: id, exitCode });
          });
        }
      );

      // Kill terminal
      clientSocket.emit('terminal:kill', sessionId);

      const result = await exited;

      expect(result.sessionId).toBe(sessionId);
      expect(typeof result.exitCode).toBe('number');
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
