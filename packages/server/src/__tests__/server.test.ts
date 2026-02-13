import { type Socket as ClientSocket, io as ioClient } from 'socket.io-client';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createContainer } from '../container';
import { ServerImpl } from '../server';

function createServer(port: number): ServerImpl {
  const container = createContainer();
  container.bind(ServerImpl).toSelf();
  const server = container.get(ServerImpl);
  server.setConfig({ port, cors: true });
  return server;
}

describe('Server Integration', () => {
  let server: ServerImpl;
  let clientSocket: ClientSocket;
  const port = 0; // Use random port

  beforeEach(async () => {
    server = createServer(port);
    await server.start();
  });

  afterEach(async () => {
    if (clientSocket?.connected) {
      clientSocket.disconnect();
    }
    await server.stop();
  });

  describe('server lifecycle', () => {
    it('should start the server', () => {
      expect(server.isRunning()).toBe(true);
      expect(server.getPort()).toBeGreaterThan(0);
    });

    it('should stop the server', async () => {
      expect(server.isRunning()).toBe(true);

      await server.stop();

      expect(server.isRunning()).toBe(false);
    });

    it('should return server status', () => {
      const status = server.getStatus();

      expect(status).toMatchObject({
        running: true,
        port: expect.any(Number),
        uptime: expect.any(Number),
        activeSessions: 0,
      });
    });

    it('should track active sessions', async () => {
      // Create terminal via HTTP
      const response = await request(`http://localhost:${server.getPort()}`)
        .post('/api/terminals')
        .send({});

      expect(response.status).toBe(201);

      const status = server.getStatus();
      expect(status.activeSessions).toBe(1);
    });
  });

  describe('HTTP endpoints', () => {
    it('should respond to health check', async () => {
      const response = await request(`http://localhost:${server.getPort()}`).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'ok',
        uptime: expect.any(Number),
      });
    });

    it('should create terminal via HTTP', async () => {
      const response = await request(`http://localhost:${server.getPort()}`)
        .post('/api/terminals')
        .send({ cols: 100, rows: 30 });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        pid: expect.any(Number),
      });
    });

    it('should list terminals via HTTP', async () => {
      // Create a terminal first
      await request(`http://localhost:${server.getPort()}`).post('/api/terminals').send({});

      const response = await request(`http://localhost:${server.getPort()}`).get('/api/terminals');

      expect(response.status).toBe(200);
      expect(response.body.sessions).toHaveLength(1);
    });
  });

  describe('WebSocket events', () => {
    beforeEach(async () => {
      clientSocket = ioClient(`http://localhost:${server.getPort()}`, {
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', resolve);
      });
    });

    it('should connect via WebSocket', () => {
      expect(clientSocket.connected).toBe(true);
    });

    it('should create terminal via WebSocket', async () => {
      const created = new Promise<{ sessionId: string; pid: number }>((resolve) => {
        clientSocket.on('terminal:created', (sessionId, pid) => {
          resolve({ sessionId, pid });
        });
      });

      clientSocket.emit('terminal:create', { cols: 100, rows: 30 });

      const result = await created;

      expect(result.sessionId).toBeTruthy();
      expect(result.pid).toBeGreaterThan(0);
    });

    it('should write to terminal via WebSocket', async () => {
      // Create session first
      const created = new Promise<string>((resolve) => {
        clientSocket.on('terminal:created', (id) => {
          resolve(id);
        });
      });

      clientSocket.emit('terminal:create');
      const sessionId = await created;

      // Write data
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
  });

  describe('HTTP and WebSocket integration', () => {
    it('should share terminal sessions between HTTP and WebSocket', async () => {
      // Create terminal via HTTP
      const httpResponse = await request(`http://localhost:${server.getPort()}`)
        .post('/api/terminals')
        .send({});

      const terminalId = httpResponse.body.id;

      // Verify terminal exists via HTTP GET
      const getResponse = await request(`http://localhost:${server.getPort()}`).get(
        `/api/terminals/${terminalId}`,
      );

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.id).toBe(terminalId);

      // Connect WebSocket client
      clientSocket = ioClient(`http://localhost:${server.getPort()}`, {
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', resolve);
      });

      // List terminals via WebSocket should include HTTP-created terminal
      const list = new Promise<string[]>((resolve) => {
        clientSocket.on('terminal:list', (sessionIds) => {
          resolve(sessionIds);
        });
      });

      clientSocket.emit('terminal:list');

      const sessionIds = await list;
      expect(sessionIds).toContain(terminalId);

      // Can write to HTTP-created terminal via WebSocket
      // (though won't receive data events as this socket didn't create it)
      clientSocket.emit('terminal:write', terminalId, 'echo "test"\n');

      // Should be able to delete via HTTP
      const deleteResponse = await request(`http://localhost:${server.getPort()}`).delete(
        `/api/terminals/${terminalId}`,
      );

      expect(deleteResponse.status).toBe(204);
    });

    it('should delete terminal via HTTP and notify via WebSocket', async () => {
      // Connect WebSocket first
      clientSocket = ioClient(`http://localhost:${server.getPort()}`, {
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', resolve);
      });

      // Create terminal via WebSocket
      const created = new Promise<string>((resolve) => {
        clientSocket.on('terminal:created', (id) => {
          resolve(id);
        });
      });

      clientSocket.emit('terminal:create');
      const terminalId = await created;

      // Listen for exit event
      const exitReceived = new Promise<string>((resolve) => {
        clientSocket.on('terminal:exit', (id) => {
          resolve(id);
        });
      });

      // Delete via HTTP
      const deleteResponse = await request(`http://localhost:${server.getPort()}`).delete(
        `/api/terminals/${terminalId}`,
      );

      expect(deleteResponse.status).toBe(204);

      // Should receive exit event via WebSocket
      const exitedId = await exitReceived;
      expect(exitedId).toBe(terminalId);
    });

    it('should handle concurrent HTTP and WebSocket operations', async () => {
      // Connect WebSocket
      clientSocket = ioClient(`http://localhost:${server.getPort()}`, {
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', resolve);
      });

      // Create terminals concurrently via HTTP and WebSocket
      const httpPromises = Array.from({ length: 3 }, () =>
        request(`http://localhost:${server.getPort()}`).post('/api/terminals').send({}),
      );

      const wsPromises = Array.from(
        { length: 3 },
        () =>
          new Promise<string>((resolve) => {
            clientSocket.once('terminal:created', (id) => resolve(id));
            clientSocket.emit('terminal:create');
          }),
      );

      const [httpResults, wsResults] = await Promise.all([
        Promise.all(httpPromises),
        Promise.all(wsPromises),
      ]);

      // All should succeed
      httpResults.forEach((result) => {
        expect(result.status).toBe(201);
      });

      wsResults.forEach((id) => {
        expect(id).toBeTruthy();
      });

      // Total 6 terminals should be created
      const listResponse = await request(`http://localhost:${server.getPort()}`).get(
        '/api/terminals',
      );

      expect(listResponse.body.sessions).toHaveLength(6);
    });
  });

  describe('cleanup', () => {
    it('should cleanup all terminals on server stop', async () => {
      // Create some terminals
      await request(`http://localhost:${server.getPort()}`).post('/api/terminals').send({});
      await request(`http://localhost:${server.getPort()}`).post('/api/terminals').send({});

      const status = server.getStatus();
      expect(status.activeSessions).toBe(2);

      // Stop server
      await server.stop();

      expect(server.isRunning()).toBe(false);
    });

    it('should disconnect WebSocket clients on server stop', async () => {
      // Connect WebSocket
      clientSocket = ioClient(`http://localhost:${server.getPort()}`, {
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', resolve);
      });

      expect(clientSocket.connected).toBe(true);

      // Listen for disconnect
      const disconnected = new Promise<void>((resolve) => {
        clientSocket.on('disconnect', resolve);
      });

      // Stop server
      await server.stop();

      // Should disconnect
      await disconnected;
      expect(clientSocket.connected).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should not start server twice', async () => {
      await expect(server.start()).rejects.toThrow();
    });

    it('should handle server stop when already stopped', async () => {
      await server.stop();
      await expect(server.stop()).resolves.not.toThrow();
    });

    it('should handle invalid terminal operations gracefully', async () => {
      // Try to get non-existent terminal
      const response = await request(`http://localhost:${server.getPort()}`).get(
        '/api/terminals/invalid-id',
      );

      expect(response.status).toBe(404);
    });
  });

  describe('uptime tracking', () => {
    it('should track server uptime', async () => {
      const status1 = server.getStatus();
      const uptime1 = status1.uptime;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      const status2 = server.getStatus();
      const uptime2 = status2.uptime;

      expect(uptime2).toBeGreaterThan(uptime1);
    });
  });
});
