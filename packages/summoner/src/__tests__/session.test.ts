import { describe, expect, it } from 'vitest';
import { InteractiveSession } from '../session.ts';
import type { ChatStreamEvent, RawEntry } from '../types.ts';
import { createMockProcessFactory } from './mock-process.ts';

describe('InteractiveSession', () => {
  describe('lifecycle', () => {
    it('should start in idle state', () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });
      expect(session.state).toBe('idle');
    });

    it('should have an id', () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });
      expect(session.id).toBeTruthy();
    });
  });

  describe('sendMessage', () => {
    it('should lazily spawn process on first sendMessage', () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      expect(mock.processes).toHaveLength(0);
      session.sendMessage('hello');
      expect(mock.processes).toHaveLength(1);
    });

    it('should transition to processing state', () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      session.sendMessage('hello');
      expect(session.state).toBe('processing');
    });

    it('should write JSON to stdin', async () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      session.sendMessage('hello');

      const chunks: Buffer[] = [];
      mock.latest.stdin.on('data', (chunk: Buffer) => chunks.push(chunk));
      await new Promise((r) => setTimeout(r, 10));

      const written = Buffer.concat(chunks).toString();
      const lines = written.trim().split('\n');
      const parsed = JSON.parse(lines[lines.length - 1]);
      expect(parsed).toMatchObject({
        type: 'user',
        message: {
          role: 'user',
          content: [{ type: 'text', text: 'hello' }],
        },
      });
    });

    it('should increment turnId on each sendMessage', async () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      const rawEntries: RawEntry[] = [];
      session.on('raw', (entry) => rawEntries.push(entry));

      session.sendMessage('first');

      mock.latest.emitLine({
        type: 'result',
        subtype: 'success',
        duration_ms: 100,
        total_cost_usd: 0.01,
        session_id: 'test',
      });

      await new Promise((r) => setTimeout(r, 50));

      session.sendMessage('second');

      const inEntries = rawEntries.filter((e) => e.direction === 'in');
      expect(inEntries[0].turnId).toBe(1);
      expect(inEntries[1].turnId).toBe(2);
    });
  });

  describe('events', () => {
    it('should emit parsed ChatStreamEvents', async () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      const events: ChatStreamEvent[] = [];
      session.on('event', (e) => events.push(e));

      session.sendMessage('hello');

      mock.latest.emitLine({
        type: 'system',
        subtype: 'init',
        session_id: 'sess-123',
        model: 'claude-opus-4-6',
      });

      mock.latest.emitLine({
        type: 'assistant',
        message: { content: [{ type: 'text', text: 'Hi!' }] },
      });

      await new Promise((r) => setTimeout(r, 50));

      expect(events).toContainEqual(
        expect.objectContaining({ type: 'init', sessionId: 'sess-123' }),
      );
      expect(events).toContainEqual(expect.objectContaining({ type: 'text', content: 'Hi!' }));
    });

    it('should emit raw entries for stdout lines', async () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      const rawEntries: RawEntry[] = [];
      session.on('raw', (entry) => rawEntries.push(entry));

      session.sendMessage('hello');

      mock.latest.emitLine({
        type: 'assistant',
        message: { content: [{ type: 'text', text: 'Hi!' }] },
      });

      await new Promise((r) => setTimeout(r, 50));

      const outEntries = rawEntries.filter((e) => e.direction === 'out');
      expect(outEntries.length).toBeGreaterThan(0);
      expect(outEntries[0].raw).toContain('assistant');
      expect(outEntries[0].turnId).toBe(1);
    });

    it('should transition back to idle on result event', async () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      session.sendMessage('hello');
      expect(session.state).toBe('processing');

      mock.latest.emitLine({
        type: 'result',
        subtype: 'success',
        duration_ms: 100,
        total_cost_usd: 0.01,
        session_id: 'test',
      });

      await new Promise((r) => setTimeout(r, 50));
      expect(session.state).toBe('idle');
    });
  });

  describe('abort and kill', () => {
    it('should send SIGINT on abort', () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      session.sendMessage('hello');
      session.abort();

      expect(mock.latest.killed).toBe(true);
    });

    it('should send SIGTERM on kill', () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      session.sendMessage('hello');
      session.kill();

      expect(mock.latest.killed).toBe(true);
    });
  });

  describe('cliSessionId', () => {
    it('should be null before init event', () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });
      expect(session.cliSessionId).toBeNull();
    });

    it('should be set after init event', async () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      session.sendMessage('hello');
      mock.latest.emitLine({
        type: 'system',
        subtype: 'init',
        session_id: 'cli-sess-456',
      });

      await new Promise((r) => setTimeout(r, 50));
      expect(session.cliSessionId).toBe('cli-sess-456');
    });
  });

  describe('control protocol', () => {
    it('should resolve initialize with control_response', async () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      const promise = session.initialize();

      await new Promise((r) => setTimeout(r, 10));

      mock.latest.emitLine({
        type: 'control_response',
        response: {
          subtype: 'success',
          request_id: 'initialize-001',
          response: { session_id: 'test' },
        },
      });

      const result = await promise;
      expect(result.success).toBe(true);
    });

    it('should emit control_request from CLI', async () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      session.sendMessage('hello');

      const events: ChatStreamEvent[] = [];
      session.on('event', (e) => events.push(e));

      mock.latest.emitLine({
        type: 'control_request',
        request_id: 'req-1',
        request: {
          subtype: 'can_use_tool',
          tool_name: 'Bash',
          tool_use_id: 'toolu_1',
        },
      });

      await new Promise((r) => setTimeout(r, 50));

      const controlReq = events.find((e) => e.type === 'control_request');
      expect(controlReq).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should emit error on stderr', async () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      const errors: string[] = [];
      session.on('error', (msg) => errors.push(msg));

      session.sendMessage('hello');
      mock.latest.stderr.write('Something went wrong\n');

      await new Promise((r) => setTimeout(r, 50));
      expect(errors).toContainEqual(expect.stringContaining('Something went wrong'));
    });

    it('should emit error event on non-zero exit code', async () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      const errors: string[] = [];
      session.on('error', (msg) => errors.push(msg));

      session.sendMessage('hello');
      mock.latest.emitClose(1);

      await new Promise((r) => setTimeout(r, 50));
      expect(errors).toContainEqual(expect.stringContaining('exit code 1'));
    });

    it('should reject pending control requests on process close', async () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({
        processFactory: mock.factory,
        controlTimeout: 5000,
      });

      // Must register error listener to prevent unhandled error throw
      session.on('error', () => {});

      const promise = session.initialize();
      await new Promise((r) => setTimeout(r, 10));

      mock.latest.emitClose(1);

      await expect(promise).rejects.toThrow();
    });
  });

  describe('resume', () => {
    it('should pass --resume with session id after process close', async () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      session.sendMessage('first');

      // Simulate init to set cliSessionId
      mock.latest.emitLine({
        type: 'system',
        subtype: 'init',
        session_id: 'cli-sess-789',
      });
      await new Promise((r) => setTimeout(r, 30));

      // Process closes
      mock.latest.emitClose(0);
      await new Promise((r) => setTimeout(r, 30));

      // Send another message — should respawn with --resume
      session.sendMessage('second');

      expect(mock.spawnCalls).toHaveLength(2);
      expect(mock.spawnCalls[1].args).toContain('--resume');
      expect(mock.spawnCalls[1].args).toContain('cli-sess-789');
    });

    it('should not pass --resume on first spawn', () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      session.sendMessage('hello');

      expect(mock.spawnCalls).toHaveLength(1);
      expect(mock.spawnCalls[0].args).not.toContain('--resume');
    });

    it('should pass --resume if resumeSessionId is provided in options', () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({
        processFactory: mock.factory,
        resumeSessionId: 'existing-sess-123',
      });

      session.sendMessage('hello');

      expect(mock.spawnCalls[0].args).toContain('--resume');
      expect(mock.spawnCalls[0].args).toContain('existing-sess-123');
    });
  });

  describe('env filtering', () => {
    it('should filter CLAUDECODE and CLAUDE_CODE_ENTRYPOINT from env', () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      session.sendMessage('hello');

      const env = mock.spawnCalls[0].options.env as Record<string, string | undefined>;
      expect(env).toBeDefined();
      expect(env.CLAUDECODE).toBeUndefined();
      expect(env.CLAUDE_CODE_ENTRYPOINT).toBeUndefined();
    });

    it('should preserve other env variables', () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      session.sendMessage('hello');

      const env = mock.spawnCalls[0].options.env as Record<string, string | undefined>;
      expect(env).toBeDefined();
      // PATH should still be there
      expect(env.PATH ?? env.Path).toBeTruthy();
    });
  });

  describe('control timeout', () => {
    it('should reject control request after timeout', async () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({
        processFactory: mock.factory,
        controlTimeout: 50, // 50ms timeout for test
      });

      const promise = session.initialize();

      // Don't emit any response — let it timeout
      await expect(promise).rejects.toThrow('timed out');
    });

    it('should clear timer when control response received', async () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({
        processFactory: mock.factory,
        controlTimeout: 200,
      });

      const promise = session.initialize();
      await new Promise((r) => setTimeout(r, 10));

      mock.latest.emitLine({
        type: 'control_response',
        response: {
          subtype: 'success',
          request_id: 'initialize-001',
          response: { session_id: 'test' },
        },
      });

      const result = await promise;
      expect(result.success).toBe(true);

      // Wait past original timeout — should not throw
      await new Promise((r) => setTimeout(r, 250));
    });

    it('should resolve with error for control_response with error subtype', async () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      const promise = session.setModel('nonexistent');
      await new Promise((r) => setTimeout(r, 10));

      mock.latest.emitLine({
        type: 'control_response',
        response: {
          subtype: 'error',
          request_id: 'set_model-001',
          error: 'Model not found',
        },
      });

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toBe('Model not found');
    });
  });

  describe('multi-turn stdin format', () => {
    it('should send correct JSON for each message in multi-turn', async () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      const chunks: Buffer[] = [];
      session.sendMessage('first');
      mock.latest.stdin.on('data', (chunk: Buffer) => chunks.push(chunk));

      mock.latest.emitLine({
        type: 'result',
        subtype: 'success',
        duration_ms: 100,
        total_cost_usd: 0.01,
        session_id: 'test',
      });

      await new Promise((r) => setTimeout(r, 50));

      session.sendMessage('second');

      await new Promise((r) => setTimeout(r, 10));

      const written = Buffer.concat(chunks).toString();
      const lines = written.trim().split('\n');

      // Should have at least the second message
      const lastLine = JSON.parse(lines[lines.length - 1]);
      expect(lastLine).toMatchObject({
        type: 'user',
        message: {
          role: 'user',
          content: [{ type: 'text', text: 'second' }],
        },
      });
    });

    it('should reuse same process for multi-turn within same lifecycle', async () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      session.sendMessage('first');

      mock.latest.emitLine({
        type: 'result',
        subtype: 'success',
        duration_ms: 100,
        total_cost_usd: 0.01,
        session_id: 'test',
      });

      await new Promise((r) => setTimeout(r, 50));

      session.sendMessage('second');

      // Should reuse same process, not spawn a new one
      expect(mock.processes).toHaveLength(1);
    });
  });

  describe('abort signal', () => {
    it('should send SIGINT specifically on abort', () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      session.sendMessage('hello');
      session.abort();

      expect(mock.latest.lastSignal).toBe('SIGINT');
    });

    it('should send SIGTERM specifically on kill', () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      session.sendMessage('hello');
      session.kill();

      expect(mock.latest.lastSignal).toBe('SIGTERM');
    });
  });

  describe('exit event', () => {
    it('should emit exit when process closes', async () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      let exited = false;
      session.on('exit', () => {
        exited = true;
      });

      session.sendMessage('hello');
      mock.latest.emitClose(0);

      await new Promise((r) => setTimeout(r, 50));
      expect(exited).toBe(true);
    });

    it('should transition to idle on process close', async () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      session.sendMessage('hello');
      expect(session.state).toBe('processing');

      mock.latest.emitClose(0);
      await new Promise((r) => setTimeout(r, 50));
      expect(session.state).toBe('idle');
    });
  });

  describe('respondToControlRequest', () => {
    it('should write control_response JSON to stdin', async () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      session.sendMessage('hello');

      const chunks: Buffer[] = [];
      mock.latest.stdin.on('data', (chunk: Buffer) => chunks.push(chunk));

      session.respondToControlRequest('req-42', { allowed: true });

      await new Promise((r) => setTimeout(r, 10));

      const written = Buffer.concat(chunks).toString();
      const lines = written.trim().split('\n');
      const lastLine = JSON.parse(lines[lines.length - 1]);

      expect(lastLine).toMatchObject({
        type: 'control_response',
        response: {
          subtype: 'success',
          request_id: 'req-42',
          response: { allowed: true },
        },
      });
    });

    it('should do nothing if process is not spawned', () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      // Should not throw
      session.respondToControlRequest('req-1', { allowed: true });
      expect(mock.processes).toHaveLength(0);
    });
  });

  describe('raw event double-parse prevention', () => {
    it('should not double-parse stdout lines', async () => {
      const mock = createMockProcessFactory();
      const session = new InteractiveSession({ processFactory: mock.factory });

      const events: ChatStreamEvent[] = [];
      session.on('event', (e) => events.push(e));

      session.sendMessage('hello');

      mock.latest.emitLine({
        type: 'assistant',
        message: { content: [{ type: 'text', text: 'Hi!' }] },
      });

      await new Promise((r) => setTimeout(r, 50));

      // Should only have 1 text event, not 2 (from handleLine + emitRaw)
      const textEvents = events.filter((e) => e.type === 'text');
      expect(textEvents).toHaveLength(1);
    });
  });
});
