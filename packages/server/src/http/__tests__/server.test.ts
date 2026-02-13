import type { Express } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TYPES } from '../../container.ts';
import type { TerminalManager } from '../../terminal/types.ts';
import { createTestContainer } from '../../test/create-test-container.ts';
import { HttpServerImpl } from '../server.ts';

describe('HttpServer', () => {
  let server: HttpServerImpl;
  let terminalManager: TerminalManager;
  let app: Express;

  beforeEach(async () => {
    const container = createTestContainer();
    terminalManager = container.get<TerminalManager>(TYPES.TerminalManager);
    server = new HttpServerImpl({
      port: 0, // Use random port
      terminalManager,
      cors: true,
    });

    await server.start();
    app = server.getApp();
  });

  afterEach(async () => {
    terminalManager.cleanup();
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

    it('should not throw when stopping already stopped server', async () => {
      await server.stop();

      await expect(server.stop()).resolves.not.toThrow();
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'ok',
        uptime: expect.any(Number),
        timestamp: expect.any(String),
      });
    });

    it('should have valid timestamp format', async () => {
      const response = await request(app).get('/api/health');

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });
  });

  describe('GET /terminals', () => {
    it('should return empty list when no terminals', async () => {
      const response = await request(app).get('/api/terminals');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ sessions: [] });
    });

    it('should return list of terminals', async () => {
      // Create some terminals
      const session1 = terminalManager.createSession();
      const session2 = terminalManager.createSession();

      const response = await request(app).get('/api/terminals');

      expect(response.status).toBe(200);
      expect(response.body.sessions).toHaveLength(2);
      expect(response.body.sessions).toContainEqual({
        id: session1.id,
        pid: session1.pid,
        isAlive: true,
      });
      expect(response.body.sessions).toContainEqual({
        id: session2.id,
        pid: session2.pid,
        isAlive: true,
      });
    });
  });

  describe('POST /terminals', () => {
    it('should create a new terminal with default options', async () => {
      const response = await request(app).post('/api/terminals').send({});

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        pid: expect.any(Number),
      });

      // Verify terminal was created
      const session = terminalManager.getSession(response.body.id);
      expect(session).toBeDefined();
      expect(session?.isAlive).toBe(true);
    });

    it('should create terminal with custom options', async () => {
      const response = await request(app).post('/api/terminals').send({
        cols: 100,
        rows: 30,
        cwd: process.cwd(),
      });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        pid: expect.any(Number),
      });
    });

    it('should handle invalid shell gracefully', async () => {
      const response = await request(app).post('/api/terminals').send({
        shell: '/nonexistent/shell',
      });

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        error: 'InternalServerError',
        message: expect.stringContaining('Failed to create terminal'),
      });
    });

    it('should reject cols as string', async () => {
      const response = await request(app).post('/api/terminals').send({
        cols: 'invalid',
      });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'BadRequest',
        message: expect.any(String),
      });
    });

    it('should reject negative rows', async () => {
      const response = await request(app).post('/api/terminals').send({
        rows: -1,
      });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'BadRequest',
      });
    });

    it('should reject args with non-string elements', async () => {
      const response = await request(app)
        .post('/api/terminals')
        .send({
          args: [123],
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'BadRequest',
      });
    });

    it('should reject unknown fields', async () => {
      const response = await request(app).post('/api/terminals').send({
        unknown: 'field',
      });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'BadRequest',
      });
    });
  });

  describe('GET /terminals/:id', () => {
    it('should return terminal info', async () => {
      const session = terminalManager.createSession();

      const response = await request(app).get(`/api/terminals/${session.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: session.id,
        pid: session.pid,
        isAlive: true,
      });
    });

    it('should return 404 for non-existent terminal', async () => {
      const response = await request(app).get('/api/terminals/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        error: 'NotFound',
        message: expect.stringContaining('Terminal not found'),
      });
    });
  });

  describe('DELETE /terminals/:id', () => {
    it('should delete terminal', async () => {
      const session = terminalManager.createSession();

      const response = await request(app).delete(`/api/terminals/${session.id}`);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});

      // Verify terminal was deleted
      const deletedSession = terminalManager.getSession(session.id);
      expect(deletedSession).toBeUndefined();
    });

    it('should return 404 for non-existent terminal', async () => {
      const response = await request(app).delete('/api/terminals/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        error: 'NotFound',
        message: expect.stringContaining('Terminal not found'),
      });
    });

    it('should kill terminal process when deleting', async () => {
      const session = terminalManager.createSession();
      expect(session.isAlive).toBe(true);

      await request(app).delete(`/api/terminals/${session.id}`);

      // Wait a bit for async kill
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(session.isAlive).toBe(false);
    });
  });

  describe('CORS', () => {
    it('should have CORS headers', async () => {
      const response = await request(app).get('/api/health').set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('should handle OPTIONS preflight', async () => {
      const response = await request(app)
        .options('/api/terminals')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBe(204);
    });
  });

  describe('error handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/unknown');

      expect(response.status).toBe(404);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/terminals')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });
  });

  describe('integration', () => {
    it('should support full terminal lifecycle via HTTP', async () => {
      // 1. Create terminal
      const createResponse = await request(app).post('/api/terminals').send({});
      expect(createResponse.status).toBe(201);
      const terminalId = createResponse.body.id;

      // 2. List terminals
      const listResponse = await request(app).get('/api/terminals');
      expect(listResponse.status).toBe(200);
      expect(listResponse.body.sessions).toHaveLength(1);

      // 3. Get terminal info
      const infoResponse = await request(app).get(`/api/terminals/${terminalId}`);
      expect(infoResponse.status).toBe(200);
      expect(infoResponse.body.id).toBe(terminalId);

      // 4. Delete terminal
      const deleteResponse = await request(app).delete(`/api/terminals/${terminalId}`);
      expect(deleteResponse.status).toBe(204);

      // 5. Verify terminal is gone
      const notFoundResponse = await request(app).get(`/api/terminals/${terminalId}`);
      expect(notFoundResponse.status).toBe(404);
    });

    it('should handle concurrent terminal creation', async () => {
      const requests = Array.from({ length: 5 }, () =>
        request(app).post('/api/terminals').send({}),
      );

      const responses = await Promise.all(requests);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(201);
      });

      // All should have unique IDs
      const ids = responses.map((r) => r.body.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);

      // All should be listed
      const listResponse = await request(app).get('/api/terminals');
      expect(listResponse.body.sessions).toHaveLength(5);
    });
  });
});
