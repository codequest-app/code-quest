import { describe, expect, it } from 'vitest';
import { ProcessRunner } from '../process-runner.ts';
import { ClaudeAdapter } from '../protocol/claude-adapter.ts';
import { FakeProcessProvider, segments as s } from '../test/index.ts';
import type { SocketEvent } from '../types.ts';

function createRunner() {
  const provider = new FakeProcessProvider();
  const runner = new ProcessRunner({
    adapter: new ClaudeAdapter(),
    processProvider: provider,
  });
  return { runner, provider };
}

describe('ProcessRunner', () => {
  describe('spawn and event emission', () => {
    it('emits parsed events from CLI stdout', async () => {
      const { runner, provider } = createRunner();
      const events: SocketEvent[] = [];
      runner.on('socket_event', (e: SocketEvent) => events.push(e));

      runner.spawn();
      const handle = provider.latest;

      // Emit init + result lines
      handle.emit(s.init('test-sess'));
      handle.emit(s.result());
      await new Promise<void>((r) => queueMicrotask(() => queueMicrotask(r)));

      const types = events.map((e) => e.name);
      expect(types).toContain('session:init');
      expect(types).toContain('message:result');
    });

    it('emits stdout raw lines', async () => {
      const { runner, provider } = createRunner();
      const lines: string[] = [];
      runner.on('stdout', (line: string) => lines.push(line));

      runner.spawn();
      const handle = provider.latest;

      handle.emit(s.init('test-sess'));
      handle.emit(s.result());
      await new Promise<void>((r) => queueMicrotask(() => queueMicrotask(r)));

      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines) {
        expect(() => JSON.parse(line)).not.toThrow();
      }
    });

    it('emits exit when process closes', async () => {
      const { runner, provider } = createRunner();
      const exitPromise = new Promise<number | null>((resolve) => {
        runner.on('exit', (code: number | null) => resolve(code));
      });

      runner.spawn();
      provider.latest.abort();

      const code = await exitPromise;
      expect(code).toBeNull();
    });

    it('emits socket_event (SocketEvent) for each converted event', async () => {
      const { runner, provider } = createRunner();
      const socketEvents: SocketEvent[] = [];
      runner.on('socket_event', (e: SocketEvent) => socketEvents.push(e));

      runner.spawn();
      provider.latest.emit(s.init('test-sess'));
      provider.latest.emit(s.assistant('hi'));
      provider.latest.emit(s.result());
      await new Promise<void>((r) => queueMicrotask(() => queueMicrotask(r)));

      const types = socketEvents.map((e) => e.name);
      expect(types).toContain('session:init');
      expect(types).toContain('message:result');
    });

    it('emits control_response for control_response events', async () => {
      const { runner, provider } = createRunner();
      const controlResponses: unknown[] = [];
      runner.on('control_response', (e: unknown) => controlResponses.push(e));

      runner.spawn();
      // Emit a control_response line
      provider.latest.emit(
        JSON.stringify({
          type: 'control_response',
          response: { subtype: 'success', request_id: 'req-1' },
        }),
      );
      await new Promise<void>((r) => queueMicrotask(() => queueMicrotask(r)));

      expect(controlResponses.length).toBeGreaterThan(0);
    });
  });

  describe('write', () => {
    it('writes raw string to stdin', async () => {
      const { runner, provider } = createRunner();
      runner.spawn();

      const adapter = new ClaudeAdapter();
      const raw = adapter.formatMessage('test');
      runner.write(raw);

      const received = provider.latest.received();
      expect(received.some((r) => JSON.stringify(r).includes('test'))).toBe(true);
    });
  });

  describe('no duplicate events', () => {
    it('emits stdin event exactly once per write', () => {
      const { runner } = createRunner();
      runner.spawn();

      const stdinEvents: string[] = [];
      runner.on('stdin', (raw: string) => stdinEvents.push(raw));

      runner.sendMessage('hello');

      expect(stdinEvents.length).toBe(1);
    });

    it('emits stdout event exactly once per line', async () => {
      const { runner, provider } = createRunner();
      runner.spawn();

      const stdoutEvents: string[] = [];
      runner.on('stdout', (line: string) => stdoutEvents.push(line));

      provider.latest.emit(s.init('sess-1'));
      await new Promise<void>((r) => queueMicrotask(() => queueMicrotask(r)));

      expect(stdoutEvents.length).toBe(1);
    });
  });

  describe('kill and abort', () => {
    it('kill aborts the process handle', () => {
      const { runner, provider } = createRunner();
      runner.spawn();

      runner.kill();
      expect(provider.latest.signal.aborted).toBe(true);
    });

    it('abort aborts the process handle', () => {
      const { runner, provider } = createRunner();
      runner.spawn();

      runner.abort();
      expect(provider.latest.signal.aborted).toBe(true);
    });
  });

  describe('no session logic', () => {
    it('does NOT track session_id from system/init', async () => {
      const { runner, provider } = createRunner();
      runner.spawn();
      provider.latest.emit(s.init('test-sess'));
      provider.latest.emit(s.result());
      await new Promise<void>((r) => queueMicrotask(() => queueMicrotask(r)));

      expect('_cliSessionId' in runner).toBe(false);
      expect('cliSessionId' in runner).toBe(false);
    });

    it('does NOT resolve control responses', async () => {
      const { runner, provider } = createRunner();
      runner.spawn();
      provider.latest.emit(s.init('test-sess'));
      provider.latest.emit(s.result());
      await new Promise<void>((r) => queueMicrotask(() => queueMicrotask(r)));

      expect('pendingRequests' in runner).toBe(false);
    });
  });
});
