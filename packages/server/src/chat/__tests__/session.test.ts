import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { ChatStreamEvent, ChatStats } from '../types';
import { ChatSessionImpl } from '../session';
import { MockProcess, createMockProcessFactory } from '../../test/mock-process';

describe('ChatSessionImpl', () => {
  let session: ChatSessionImpl;
  let mockProcess: MockProcess;

  beforeEach(() => {
    mockProcess = new MockProcess();
  });

  afterEach(() => {
    session?.kill();
  });

  function createSession(provider: 'claude' | 'gemini' = 'claude') {
    session = new ChatSessionImpl({
      provider,
      command: 'mock',
      baseArgs: [],
      processFactory: createMockProcessFactory(mockProcess),
    });
    return session;
  }

  function collectEvents(): ChatStreamEvent[] {
    const events: ChatStreamEvent[] = [];
    session.onEvent((e) => events.push(e));
    return events;
  }

  it('should send message via stdin on first sendMessage', () => {
    createSession();
    session.sendMessage('hello');

    expect(mockProcess.getStdinData()).toContain('hello\n');
  });

  it('should reuse persistent process on second message', () => {
    let spawnCount = 0;
    const factory = () => {
      spawnCount++;
      return mockProcess as any;
    };

    session = new ChatSessionImpl({
      provider: 'claude',
      command: 'mock',
      baseArgs: [],
      processFactory: factory,
    });

    session.sendMessage('first');
    session.sendMessage('second');

    expect(spawnCount).toBe(1);
    expect(mockProcess.getStdinData()).toContain('first\n');
    expect(mockProcess.getStdinData()).toContain('second\n');
  });

  it('should parse streaming events from stdout', () => {
    createSession();
    const events = collectEvents();

    session.sendMessage('test');

    mockProcess.emitStdout('{"type":"system","subtype":"init","session_id":"abc"}');
    mockProcess.emitStdout('{"type":"assistant","message":{"content":[{"type":"text","text":"Hello!"}]}}');

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
    mockProcess.emitStdout('{"type":"result","total_cost_usd":0.01,"duration_ms":500,"input_tokens":10,"output_tokens":20}');

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

    mockProcess.emitStdout('{"type":"result","total_cost_usd":0.001,"duration_ms":100,"input_tokens":5,"output_tokens":3}');
    expect(session.state).toBe('idle');
  });

  it('should handle permission_request and transition to awaiting_input', () => {
    createSession();
    const events = collectEvents();

    session.sendMessage('test');
    mockProcess.emitStdout('{"type":"permission","tool_name":"Read","description":"Reading file: test.ts"}');

    expect(session.state).toBe('awaiting_input');
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      type: 'permission_request',
      data: { toolName: 'Read', description: 'Reading file: test.ts' },
    });
  });

  it('should send respond data via stdin', () => {
    createSession();

    session.sendMessage('test');
    mockProcess.emitStdout('{"type":"permission","tool_name":"Read","description":"Reading file"}');

    session.respond('allow');

    expect(mockProcess.getStdinData()).toContain('allow\n');
    expect(session.state).toBe('processing');
  });

  it('should handle process crash and emit error + exit', () => {
    createSession();
    let errorMessage = '';
    let exitCalled = false;
    session.onError((msg) => { errorMessage = msg; });
    session.onExit(() => { exitCalled = true; });

    session.sendMessage('test');
    mockProcess.emitError(new Error('Process crashed'));

    expect(errorMessage).toBe('Process crashed');
    expect(exitCalled).toBe(true);
    expect(session.state).toBe('idle');
  });

  it('should emit stderr as error on non-zero exit without result', async () => {
    createSession();
    let errorMessage = '';
    session.onError((msg) => { errorMessage = msg; });

    session.sendMessage('test');
    mockProcess.emitStderr('Something went wrong');
    mockProcess.emitClose(1);

    // Wait for nextTick to settle
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(errorMessage).toBe('Something went wrong');
  });

  it('should not emit stderr as error if result was received', () => {
    createSession();
    let errorMessage = '';
    session.onError((msg) => { errorMessage = msg; });

    session.sendMessage('test');
    mockProcess.emitStdout('{"type":"result","total_cost_usd":0.001,"duration_ms":100,"input_tokens":5,"output_tokens":3}');
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

  it('should support multi-turn conversation via stdin', () => {
    createSession();
    const events = collectEvents();

    session.sendMessage('first');
    mockProcess.emitStdout('{"type":"system","subtype":"init","session_id":"s1"}');
    mockProcess.emitStdout('{"type":"assistant","message":{"content":[{"type":"text","text":"Reply 1"}]}}');
    mockProcess.emitStdout('{"type":"result","total_cost_usd":0.001,"duration_ms":50,"input_tokens":5,"output_tokens":3}');

    session.sendMessage('second');
    mockProcess.emitStdout('{"type":"assistant","message":{"content":[{"type":"text","text":"Reply 2"}]}}');
    mockProcess.emitStdout('{"type":"result","total_cost_usd":0.002,"duration_ms":60,"input_tokens":8,"output_tokens":5}');

    const textEvents = events.filter((e) => e.type === 'text');
    expect(textEvents).toHaveLength(2);
    expect(textEvents[0].data).toEqual({ content: 'Reply 1' });
    expect(textEvents[1].data).toEqual({ content: 'Reply 2' });

    const stdinData = mockProcess.getStdinData();
    expect(stdinData).toContain('first\n');
    expect(stdinData).toContain('second\n');
  });

  it('should emit error on spawn failure', () => {
    const failFactory = () => {
      throw new Error('spawn ENOENT');
    };

    session = new ChatSessionImpl({
      provider: 'claude',
      command: '/nonexistent',
      baseArgs: [],
      processFactory: failFactory,
    });

    let errorMessage = '';
    session.onError((msg) => { errorMessage = msg; });

    session.sendMessage('test');
    expect(errorMessage).toBe('spawn ENOENT');
  });

  it('should have a unique id per session', () => {
    createSession();
    const session2 = new ChatSessionImpl({
      provider: 'claude',
      command: 'mock',
      baseArgs: [],
      processFactory: createMockProcessFactory(new MockProcess()),
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
    mockProcess.emitStdout('{"type":"assistant","message":{"content":[{"type":"thinking","thinking":"Let me ponder..."}]}}');

    expect(events[0]).toEqual({ type: 'thinking', data: { content: 'Let me ponder...' } });
  });

  it('should parse tool_use and tool_result events', () => {
    createSession();
    const events = collectEvents();

    session.sendMessage('use tool');
    mockProcess.emitStdout('{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Read","input":{"path":"test.ts"}}]}}');
    mockProcess.emitStdout('{"type":"assistant","message":{"content":[{"type":"tool_result","name":"Read","output":"file content"}]}}');

    expect(events[0]).toEqual({ type: 'tool_use', data: { name: 'Read', input: { path: 'test.ts' } } });
    expect(events[1]).toEqual({ type: 'tool_result', data: { name: 'Read', output: 'file content' } });
  });
});
