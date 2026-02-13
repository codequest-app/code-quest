import type { Container } from 'inversify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TYPES } from '../../container.ts';
import { createTestContainer } from '../../test/create-test-container.ts';
import { createMockProcessFactory, MockProcess } from '../../test/mock-process.ts';
import type {
  ChatSession,
  ChatSessionFactory,
  ChatStats,
  ChatStreamEvent,
  ProcessFactory,
} from '../types.ts';

describe('ChatSessionImpl', () => {
  let container: Container;
  let session: ChatSession;
  let mockProcess: MockProcess;
  let mockProcessFactory: ReturnType<typeof createMockProcessFactory>;
  let chatSessionFactory: ChatSessionFactory;

  beforeEach(() => {
    mockProcess = new MockProcess();
    mockProcessFactory = createMockProcessFactory(mockProcess);
    container = createTestContainer({ processFactory: mockProcessFactory });
    chatSessionFactory = container.get<ChatSessionFactory>(TYPES.ChatSessionFactory);
  });

  afterEach(() => {
    session?.kill();
  });

  function createSession(provider: 'claude' | 'gemini' = 'claude', baseArgs: string[] = []) {
    session = chatSessionFactory({ provider, command: 'mock', baseArgs });
    return session;
  }

  function collectEvents(): ChatStreamEvent[] {
    const events: ChatStreamEvent[] = [];
    session.onEvent((e) => events.push(e));
    return events;
  }

  it('should spawn process with message as last arg', () => {
    session = chatSessionFactory({
      provider: 'claude',
      command: 'claude',
      baseArgs: ['-p', '--output-format', 'stream-json'],
    });

    session.sendMessage('hello');

    expect(mockProcessFactory.records).toHaveLength(1);
    expect(mockProcessFactory.records[0].command).toBe('claude');
    expect(mockProcessFactory.records[0].args).toEqual([
      '-p',
      '--output-format',
      'stream-json',
      'hello',
    ]);
  });

  it('should spawn new process for each message', () => {
    let count = 0;
    const factory = createMockProcessFactory(() => {
      count++;
      return new MockProcess();
    });
    container.rebindSync<ProcessFactory>(TYPES.ProcessFactory).toConstantValue(factory);

    session = chatSessionFactory({
      provider: 'claude',
      command: 'mock',
      baseArgs: ['-p'],
    });

    session.sendMessage('first');
    factory.records[0].process.emitStdout('{"type":"system","subtype":"init","session_id":"s1"}');
    factory.records[0].process.emitStdout(
      '{"type":"result","total_cost_usd":0.001,"duration_ms":50}',
    );

    session.sendMessage('second');

    expect(count).toBe(2);
  });

  it('should use --resume with session id for subsequent messages', () => {
    const processes: MockProcess[] = [];
    const factory = createMockProcessFactory(() => {
      const p = new MockProcess();
      processes.push(p);
      return p;
    });
    container.rebindSync<ProcessFactory>(TYPES.ProcessFactory).toConstantValue(factory);

    session = chatSessionFactory({
      provider: 'claude',
      command: 'claude',
      baseArgs: ['-p', '--output-format', 'stream-json'],
    });

    session.sendMessage('first');
    processes[0].emitStdout('{"type":"system","subtype":"init","session_id":"sess-abc"}');
    processes[0].emitStdout('{"type":"result","total_cost_usd":0.001,"duration_ms":50}');

    session.sendMessage('second');

    expect(factory.records[1].args).toEqual([
      '-p',
      '--output-format',
      'stream-json',
      '--resume',
      'sess-abc',
      'second',
    ]);
  });

  it('should parse streaming events from stdout', () => {
    createSession();
    const events = collectEvents();

    session.sendMessage('test');

    mockProcess.emitStdout('{"type":"system","subtype":"init","session_id":"abc"}');
    mockProcess.emitStdout(
      '{"type":"assistant","message":{"content":[{"type":"text","text":"Hello!"}]}}',
    );

    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ type: 'init', data: { sessionId: 'abc' } });
    expect(events[1]).toEqual({ type: 'text', data: { content: 'Hello!' } });
  });

  it('should emit complete on result event', () => {
    createSession();
    let completedStats: ChatStats | null = null;
    session.onComplete((stats) => {
      completedStats = stats;
    });

    session.sendMessage('test');
    mockProcess.emitStdout(
      '{"type":"result","total_cost_usd":0.01,"duration_ms":500,"input_tokens":10,"output_tokens":20}',
    );

    expect(completedStats).toEqual({
      costUsd: 0.01,
      durationMs: 500,
      inputTokens: 10,
      outputTokens: 20,
    });
  });

  it('should transition state: idle -> processing -> idle on result', () => {
    createSession();
    expect(session.state).toBe('idle');

    session.sendMessage('test');
    expect(session.state).toBe('processing');

    mockProcess.emitStdout(
      '{"type":"result","total_cost_usd":0.001,"duration_ms":100,"input_tokens":5,"output_tokens":3}',
    );
    expect(session.state).toBe('idle');
  });

  it('should add allowed tools and include --allowedTools in next spawn', () => {
    const processes: MockProcess[] = [];
    const factory = createMockProcessFactory(() => {
      const p = new MockProcess();
      processes.push(p);
      return p;
    });
    container.rebindSync<ProcessFactory>(TYPES.ProcessFactory).toConstantValue(factory);

    session = chatSessionFactory({
      provider: 'claude',
      command: 'claude',
      baseArgs: ['-p', '--output-format', 'stream-json'],
    });

    session.sendMessage('first');
    processes[0].emitStdout('{"type":"system","subtype":"init","session_id":"sess-abc"}');
    processes[0].emitStdout('{"type":"result","total_cost_usd":0.001,"duration_ms":50}');

    session.addAllowedTool('Read');
    session.addAllowedTool('Write');

    session.sendMessage('second');

    expect(factory.records[1].args).toEqual([
      '-p',
      '--output-format',
      'stream-json',
      '--resume',
      'sess-abc',
      '--allowedTools',
      'Read,Write',
      'second',
    ]);
  });

  it('should handle process crash and emit error + exit', () => {
    createSession();
    let errorMessage = '';
    let exitCalled = false;
    session.onError((msg) => {
      errorMessage = msg;
    });
    session.onExit(() => {
      exitCalled = true;
    });

    session.sendMessage('test');
    mockProcess.emitError(new Error('Process crashed'));

    expect(errorMessage).toBe('Process crashed');
    expect(exitCalled).toBe(true);
    expect(session.state).toBe('idle');
  });

  it('should emit stderr as error on non-zero exit without result', async () => {
    createSession();
    let errorMessage = '';
    session.onError((msg) => {
      errorMessage = msg;
    });

    session.sendMessage('test');
    mockProcess.emitStderr('Something went wrong');
    mockProcess.emitClose(1);

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(errorMessage).toBe('Something went wrong');
  });

  it('should not emit stderr as error if result was received', () => {
    createSession();
    let errorMessage = '';
    session.onError((msg) => {
      errorMessage = msg;
    });

    session.sendMessage('test');
    mockProcess.emitStdout(
      '{"type":"result","total_cost_usd":0.001,"duration_ms":100,"input_tokens":5,"output_tokens":3}',
    );
    mockProcess.emitStderr('Informational warning');
    mockProcess.emitClose(0);

    expect(errorMessage).toBe('');
  });

  it('should abort process with SIGINT', () => {
    createSession();
    session.sendMessage('test');
    session.abort();

    expect(mockProcess.isKilled).toBe(true);
  });

  it('should kill process with SIGTERM', () => {
    createSession();
    session.sendMessage('test');
    session.kill();

    expect(mockProcess.isKilled).toBe(true);
    expect(session.state).toBe('idle');
  });

  it('should support multi-turn conversation via --resume', () => {
    const processes: MockProcess[] = [];
    const factory = createMockProcessFactory(() => {
      const p = new MockProcess();
      processes.push(p);
      return p;
    });
    container.rebindSync<ProcessFactory>(TYPES.ProcessFactory).toConstantValue(factory);

    session = chatSessionFactory({
      provider: 'claude',
      command: 'mock',
      baseArgs: ['-p'],
    });

    const events = collectEvents();

    session.sendMessage('first');
    processes[0].emitStdout('{"type":"system","subtype":"init","session_id":"s1"}');
    processes[0].emitStdout(
      '{"type":"assistant","message":{"content":[{"type":"text","text":"Reply 1"}]}}',
    );
    processes[0].emitStdout(
      '{"type":"result","total_cost_usd":0.001,"duration_ms":50,"input_tokens":5,"output_tokens":3}',
    );

    session.sendMessage('second');
    processes[1].emitStdout(
      '{"type":"assistant","message":{"content":[{"type":"text","text":"Reply 2"}]}}',
    );
    processes[1].emitStdout(
      '{"type":"result","total_cost_usd":0.002,"duration_ms":60,"input_tokens":8,"output_tokens":5}',
    );

    const textEvents = events.filter((e) => e.type === 'text');
    expect(textEvents).toHaveLength(2);
    expect(textEvents[0].data).toEqual({ content: 'Reply 1' });
    expect(textEvents[1].data).toEqual({ content: 'Reply 2' });

    // Verify second spawn used --resume
    expect(factory.records[1].args).toContain('--resume');
    expect(factory.records[1].args).toContain('s1');
  });

  it('should emit error on spawn failure', () => {
    const failFactory = () => {
      throw new Error('spawn ENOENT');
    };
    container.rebindSync<ProcessFactory>(TYPES.ProcessFactory).toConstantValue(failFactory);

    session = chatSessionFactory({
      provider: 'claude',
      command: '/nonexistent',
      baseArgs: [],
    });

    let errorMessage = '';
    session.onError((msg) => {
      errorMessage = msg;
    });

    session.sendMessage('test');
    expect(errorMessage).toBe('spawn ENOENT');
  });

  it('should have a unique id per session', () => {
    createSession();
    const session2 = chatSessionFactory({
      provider: 'claude',
      command: 'mock',
      baseArgs: [],
    });

    expect(session.id).toBeTruthy();
    expect(session2.id).toBeTruthy();
    expect(session.id).not.toBe(session2.id);

    session2.kill();
  });

  it('should parse thinking events', () => {
    createSession();
    const events = collectEvents();

    session.sendMessage('think');
    mockProcess.emitStdout(
      '{"type":"assistant","message":{"content":[{"type":"thinking","thinking":"Let me ponder..."}]}}',
    );

    expect(events[0]).toEqual({ type: 'thinking', data: { content: 'Let me ponder...' } });
  });

  it('should parse tool_use and tool_result events', () => {
    createSession();
    const events = collectEvents();

    session.sendMessage('use tool');
    mockProcess.emitStdout(
      '{"type":"assistant","message":{"content":[{"type":"tool_use","id":"toolu_01","name":"Read","input":{"path":"test.ts"}}]}}',
    );
    mockProcess.emitStdout(
      '{"type":"assistant","message":{"content":[{"type":"tool_result","tool_use_id":"toolu_01","content":"file content"}]}}',
    );

    expect(events[0]).toEqual({
      type: 'tool_use',
      data: { id: 'toolu_01', name: 'Read', input: { path: 'test.ts' } },
    });
    expect(events[1]).toEqual({
      type: 'tool_result',
      data: { name: 'toolu_01', output: 'file content' },
    });
  });

  it('should strip CLAUDECODE from env when spawning', () => {
    const originalEnv = process.env.CLAUDECODE;
    process.env.CLAUDECODE = '1';

    try {
      session = chatSessionFactory({
        provider: 'claude',
        command: 'mock',
        baseArgs: [],
      });

      session.sendMessage('test');

      expect(mockProcessFactory.records).toHaveLength(1);
      const opts = mockProcessFactory.records[0].options;
      expect(opts.env).toBeDefined();
      expect((opts.env as Record<string, string | undefined>).CLAUDECODE).toBeUndefined();
    } finally {
      if (originalEnv !== undefined) {
        process.env.CLAUDECODE = originalEnv;
      } else {
        delete process.env.CLAUDECODE;
      }
    }
  });

  it('should pass cwd and stdio options when spawning', () => {
    session = chatSessionFactory({
      provider: 'claude',
      command: 'mock',
      baseArgs: [],
      cwd: '/tmp/test',
    });

    session.sendMessage('test');

    const opts = mockProcessFactory.records[0].options;
    expect(opts.cwd).toBe('/tmp/test');
    expect(opts.stdio).toEqual(['pipe', 'pipe', 'pipe']);
  });

  it('should use injected env when provided', () => {
    session = chatSessionFactory({
      provider: 'claude',
      command: 'mock',
      baseArgs: [],
      env: { CUSTOM_VAR: 'test-value', PATH: '/usr/bin' },
    });

    session.sendMessage('test');

    const opts = mockProcessFactory.records[0].options;
    expect((opts.env as Record<string, string>).CUSTOM_VAR).toBe('test-value');
  });
});
