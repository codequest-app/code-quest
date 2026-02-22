import type { ChatStats, ChatStreamEvent } from '@code-quest/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createParser } from '../parsers/index.ts';
import { ChatSessionImpl } from '../session.ts';
import { createMockProcessFactory, MockProcess } from '../test/mock-process.ts';
import type { ChatSession, ProcessFactory } from '../types.ts';

const tick = () => new Promise<void>((resolve) => process.nextTick(resolve));

describe('ChatSessionImpl', () => {
  let session: ChatSession;
  let mockProcess: MockProcess;
  let mockProcessFactory: ReturnType<typeof createMockProcessFactory>;
  let processFactory: ProcessFactory;

  beforeEach(() => {
    mockProcess = new MockProcess();
    mockProcessFactory = createMockProcessFactory(mockProcess);
    processFactory = mockProcessFactory;
  });

  afterEach(() => {
    session?.kill();
  });

  function createSession(provider: 'claude' | 'gemini' = 'claude', baseArgs: string[] = []) {
    session = new ChatSessionImpl({
      provider,
      command: 'mock',
      baseArgs,
      processFactory,
      parserFactory: createParser,
    });
    return session;
  }

  function collectEvents(): ChatStreamEvent[] {
    const events: ChatStreamEvent[] = [];
    session.onEvent((e) => {
      if (e.type !== 'spawn') events.push(e);
    });
    return events;
  }

  it('should spawn process and write message to stdin as stream-json', () => {
    session = new ChatSessionImpl({
      provider: 'claude',
      command: 'claude',
      baseArgs: ['-p', '--output-format', 'stream-json'],
      processFactory,
      parserFactory: createParser,
    });

    session.sendMessage('hello');

    expect(mockProcessFactory.records).toHaveLength(1);
    expect(mockProcessFactory.records[0].command).toBe('claude');
    expect(mockProcessFactory.records[0].args).toEqual(['-p', '--output-format', 'stream-json']);

    const stdinData = mockProcess.getStdinData().trim();
    expect(JSON.parse(stdinData)).toEqual({
      type: 'user',
      message: { role: 'user', content: [{ type: 'text', text: 'hello' }] },
    });
  });

  it('should reuse same process for subsequent messages', async () => {
    let count = 0;
    const factory = createMockProcessFactory(() => {
      count++;
      return new MockProcess();
    });
    processFactory = factory;

    session = new ChatSessionImpl({
      provider: 'claude',
      command: 'mock',
      baseArgs: ['-p'],
      processFactory,
      parserFactory: createParser,
    });

    session.sendMessage('first');
    factory.records[0].process.emitStdout('{"type":"system","subtype":"init","session_id":"s1"}');
    factory.records[0].process.emitStdout(
      '{"type":"result","total_cost_usd":0.001,"duration_ms":50}',
    );
    await tick();

    session.sendMessage('second');

    expect(count).toBe(1);

    const lines = factory.records[0].process.getStdinData().trim().split('\n');
    expect(lines).toHaveLength(2);
  });

  it('should parse streaming events from stdout', async () => {
    createSession();
    const events = collectEvents();

    session.sendMessage('test');

    mockProcess.emitStdout('{"type":"system","subtype":"init","session_id":"abc"}');
    mockProcess.emitStdout(
      '{"type":"assistant","message":{"content":[{"type":"text","text":"Hello!"}]}}',
    );
    await tick();

    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ type: 'init', data: { sessionId: 'abc' } });
    expect(events[1]).toEqual({ type: 'text', data: { content: 'Hello!' } });
  });

  it('should emit complete on result event', async () => {
    createSession();
    let completedStats: ChatStats | null = null;
    session.onComplete((stats) => {
      completedStats = stats;
    });

    session.sendMessage('test');
    mockProcess.emitStdout(
      '{"type":"result","total_cost_usd":0.01,"duration_ms":500,"input_tokens":10,"output_tokens":20}',
    );
    await tick();

    expect(completedStats).toEqual({
      costUsd: 0.01,
      durationMs: 500,
      inputTokens: 10,
      outputTokens: 20,
    });
  });

  it('should transition state: idle -> processing -> idle on result', async () => {
    createSession();
    expect(session.state).toBe('idle');

    session.sendMessage('test');
    expect(session.state).toBe('processing');

    mockProcess.emitStdout(
      '{"type":"result","total_cost_usd":0.001,"duration_ms":100,"input_tokens":5,"output_tokens":3}',
    );
    await tick();
    expect(session.state).toBe('idle');
  });

  it('should include --allowedTools in spawn args when added before first message', () => {
    session = new ChatSessionImpl({
      provider: 'claude',
      command: 'claude',
      baseArgs: ['-p', '--output-format', 'stream-json'],
      processFactory,
      parserFactory: createParser,
    });

    session.addAllowedTool('Read');
    session.addAllowedTool('Write');

    session.sendMessage('hello');

    expect(mockProcessFactory.records[0].args).toEqual([
      '-p',
      '--output-format',
      'stream-json',
      '--allowedTools',
      'Read,Write',
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

  it('should not emit stderr as error if result was received', async () => {
    createSession();
    let errorMessage = '';
    session.onError((msg) => {
      errorMessage = msg;
    });

    session.sendMessage('test');
    mockProcess.emitStdout(
      '{"type":"result","total_cost_usd":0.001,"duration_ms":100,"input_tokens":5,"output_tokens":3}',
    );
    await tick();
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

  it('should support multi-turn conversation via stdin', async () => {
    createSession();
    const events = collectEvents();

    session.sendMessage('first');
    mockProcess.emitStdout('{"type":"system","subtype":"init","session_id":"s1"}');
    mockProcess.emitStdout(
      '{"type":"assistant","message":{"content":[{"type":"text","text":"Reply 1"}]}}',
    );
    mockProcess.emitStdout(
      '{"type":"result","total_cost_usd":0.001,"duration_ms":50,"input_tokens":5,"output_tokens":3}',
    );
    await tick();

    session.sendMessage('second');
    mockProcess.emitStdout(
      '{"type":"assistant","message":{"content":[{"type":"text","text":"Reply 2"}]}}',
    );
    mockProcess.emitStdout(
      '{"type":"result","total_cost_usd":0.002,"duration_ms":60,"input_tokens":8,"output_tokens":5}',
    );
    await tick();

    const textEvents = events.filter((e) => e.type === 'text');
    expect(textEvents).toHaveLength(2);
    expect(textEvents[0].data).toEqual({ content: 'Reply 1' });
    expect(textEvents[1].data).toEqual({ content: 'Reply 2' });

    // Single process, two stdin messages
    expect(mockProcessFactory.records).toHaveLength(1);
    const lines = mockProcess.getStdinData().trim().split('\n');
    expect(lines).toHaveLength(2);
  });

  it('should keep process alive after result event', async () => {
    createSession();

    session.sendMessage('test');
    mockProcess.emitStdout(
      '{"type":"result","total_cost_usd":0.001,"duration_ms":100,"input_tokens":5,"output_tokens":3}',
    );
    await tick();

    expect(session.state).toBe('idle');
    expect(mockProcess.isKilled).toBe(false);
  });

  it('should respawn process after unexpected close', () => {
    let count = 0;
    const factory = createMockProcessFactory(() => {
      count++;
      return new MockProcess();
    });
    processFactory = factory;

    session = new ChatSessionImpl({
      provider: 'claude',
      command: 'mock',
      baseArgs: [],
      processFactory,
      parserFactory: createParser,
    });

    session.sendMessage('first');
    factory.records[0].process.emitClose(1);

    session.sendMessage('second');

    expect(count).toBe(2);
  });

  it('should pass --resume with cliSessionId when respawning after crash', async () => {
    const processes: MockProcess[] = [];
    const factory = createMockProcessFactory(() => {
      const proc = new MockProcess();
      processes.push(proc);
      return proc;
    });
    processFactory = factory;

    session = new ChatSessionImpl({
      provider: 'claude',
      command: 'mock',
      baseArgs: ['-p'],
      processFactory,
      parserFactory: createParser,
    });

    // 1st message — init with session_id, then result, then crash
    session.sendMessage('first');
    processes[0].emitStdout('{"type":"system","subtype":"init","session_id":"sess-42"}');
    processes[0].emitStdout('{"type":"result","total_cost_usd":0.001,"duration_ms":50}');
    await tick();
    processes[0].emitClose(1);

    // 2nd message — should respawn with --resume
    session.sendMessage('second');

    expect(factory.records).toHaveLength(2);
    expect(factory.records[1].args).toContain('--resume');
    expect(factory.records[1].args).toContain('sess-42');
  });

  it('should emit error on spawn failure', () => {
    const failFactory = () => {
      throw new Error('spawn ENOENT');
    };
    processFactory = failFactory as unknown as ProcessFactory;

    session = new ChatSessionImpl({
      provider: 'claude',
      command: '/nonexistent',
      baseArgs: [],
      processFactory,
      parserFactory: createParser,
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
    const session2 = new ChatSessionImpl({
      provider: 'claude',
      command: 'mock',
      baseArgs: [],
      processFactory,
      parserFactory: createParser,
    });

    expect(session.id).toBeTruthy();
    expect(session2.id).toBeTruthy();
    expect(session.id).not.toBe(session2.id);

    session2.kill();
  });

  it('should parse thinking events', async () => {
    createSession();
    const events = collectEvents();

    session.sendMessage('think');
    mockProcess.emitStdout(
      '{"type":"assistant","message":{"content":[{"type":"thinking","thinking":"Let me ponder..."}]}}',
    );
    await tick();

    expect(events[0]).toEqual({ type: 'thinking', data: { content: 'Let me ponder...' } });
  });

  it('should parse tool_use and tool_result events', async () => {
    createSession();
    const events = collectEvents();

    session.sendMessage('use tool');
    mockProcess.emitStdout(
      '{"type":"assistant","message":{"content":[{"type":"tool_use","id":"toolu_01","name":"Read","input":{"path":"test.ts"}}]}}',
    );
    mockProcess.emitStdout(
      '{"type":"assistant","message":{"content":[{"type":"tool_result","tool_use_id":"toolu_01","content":"file content"}]}}',
    );
    await tick();

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
      session = new ChatSessionImpl({
        provider: 'claude',
        command: 'mock',
        baseArgs: [],
        processFactory,
        parserFactory: createParser,
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
    session = new ChatSessionImpl({
      provider: 'claude',
      command: 'mock',
      baseArgs: [],
      cwd: '/tmp/test',
      processFactory,
      parserFactory: createParser,
    });

    session.sendMessage('test');

    const opts = mockProcessFactory.records[0].options;
    expect(opts.cwd).toBe('/tmp/test');
    expect(opts.stdio).toEqual(['pipe', 'pipe', 'pipe']);
  });

  it('should use injected env when provided', () => {
    session = new ChatSessionImpl({
      provider: 'claude',
      command: 'mock',
      baseArgs: [],
      env: { CUSTOM_VAR: 'test-value', PATH: '/usr/bin' },
      processFactory,
      parserFactory: createParser,
    });

    session.sendMessage('test');

    const opts = mockProcessFactory.records[0].options;
    expect((opts.env as Record<string, string>).CUSTOM_VAR).toBe('test-value');
  });

  it('should default mode to print', () => {
    createSession();
    expect(session.mode).toBe('print');
  });

  it('should accept interactive mode', () => {
    session = new ChatSessionImpl({
      provider: 'claude',
      command: 'mock',
      baseArgs: [],
      mode: 'interactive',
      processFactory,
      parserFactory: createParser,
    });
    expect(session.mode).toBe('interactive');
  });

  describe('control protocol', () => {
    it('should send initialize control_request via stdin', () => {
      createSession();
      session.initialize();

      const stdinData = mockProcess.getLastStdinLine();
      const parsed = JSON.parse(stdinData);
      expect(parsed.type).toBe('control_request');
      expect(parsed.request.subtype).toBe('initialize');
      expect(parsed.request_id).toMatch(/^initialize-\d+$/);
    });

    it('should send set_model control_request via stdin', () => {
      createSession();
      session.setModel('sonnet');

      const stdinData = mockProcess.getLastStdinLine();
      const parsed = JSON.parse(stdinData);
      expect(parsed.type).toBe('control_request');
      expect(parsed.request.subtype).toBe('set_model');
      expect(parsed.request.model).toBe('sonnet');
    });

    it('should emit control_response via onControlResponse handler', async () => {
      createSession();
      const responses: Array<{ requestId: string; success: boolean }> = [];
      session.onControlResponse((r) => responses.push(r));

      session.initialize();
      mockProcess.emitStdout(
        '{"type":"control_response","response":{"subtype":"success","request_id":"initialize-001","response":{"models":[{"value":"sonnet","displayName":"Sonnet","description":"Sonnet 4.6"}]}}}',
      );
      await tick();

      expect(responses).toHaveLength(1);
      expect(responses[0].requestId).toBe('initialize-001');
      expect(responses[0].success).toBe(true);
    });

    it('should also emit control_response as a regular event', async () => {
      createSession();
      const events = collectEvents();

      session.initialize();
      mockProcess.emitStdout(
        '{"type":"control_response","response":{"subtype":"success","request_id":"initialize-001"}}',
      );
      await tick();

      expect(events.some((e) => e.type === 'control_response')).toBe(true);
    });

    it('should increment request_id for multiple control requests', () => {
      createSession();
      session.initialize();
      session.setModel('sonnet');

      const allStdin = mockProcess.getStdinData();
      const lines = allStdin.trim().split('\n');
      const parsed = lines.map((l) => JSON.parse(l));
      expect(parsed[0].request_id).toBe('initialize-001');
      expect(parsed[1].request_id).toBe('set_model-002');
    });

    it('should send set_permission_mode control_request', () => {
      createSession();
      session.setPermissionMode('plan');

      const parsed = JSON.parse(mockProcess.getLastStdinLine());
      expect(parsed.type).toBe('control_request');
      expect(parsed.request.subtype).toBe('set_permission_mode');
      expect(parsed.request.permission_mode).toBe('plan');
    });

    it('should send set_max_thinking_tokens control_request', () => {
      createSession();
      session.setMaxThinkingTokens(8192);

      const parsed = JSON.parse(mockProcess.getLastStdinLine());
      expect(parsed.type).toBe('control_request');
      expect(parsed.request.subtype).toBe('set_max_thinking_tokens');
      expect(parsed.request.max_thinking_tokens).toBe(8192);
    });

    it('should send interrupt control_request', () => {
      createSession();
      session.sendMessage('test');
      session.interrupt();

      const lines = mockProcess.getStdinData().trim().split('\n');
      const parsed = JSON.parse(lines[lines.length - 1]);
      expect(parsed.type).toBe('control_request');
      expect(parsed.request.subtype).toBe('interrupt');
    });

    it('should resolve sendControlRequestAsync with matching control_response', async () => {
      createSession();
      session.sendMessage('test'); // ensure process is spawned

      const promise = session.sendControlRequestAsync('initialize');
      mockProcess.emitStdout(
        '{"type":"control_response","response":{"subtype":"success","request_id":"initialize-001","response":{"models":[]}}}',
      );
      await tick();

      const response = await promise;
      expect(response.requestId).toBe('initialize-001');
      expect(response.success).toBe(true);
    });

    it('should reject sendControlRequestAsync on error response', async () => {
      createSession();
      session.sendMessage('test');

      const promise = session.sendControlRequestAsync('bad_request');
      mockProcess.emitStdout(
        '{"type":"control_response","response":{"subtype":"error","request_id":"bad_request-001","error":"Unknown subtype"}}',
      );
      await tick();

      const response = await promise;
      expect(response.success).toBe(false);
      expect(response.error).toBe('Unknown subtype');
    });

    it('should reject sendControlRequestAsync on timeout', async () => {
      createSession();
      session.sendMessage('test');

      const promise = session.sendControlRequestAsync('initialize', {}, 50);

      await expect(promise).rejects.toThrow('timed out');
    });

    it('should emit control_request events via onControlRequest handler', async () => {
      createSession();
      const requests: Array<{ requestId: string; subtype: string }> = [];
      session.onControlRequest((r) => requests.push(r));

      session.sendMessage('test');
      mockProcess.emitStdout(
        '{"type":"control_request","request_id":"req-001","request":{"subtype":"can_use_tool","tool_name":"Write","input":{"file_path":"/tmp/test.txt"},"tool_use_id":"toolu_01"}}',
      );
      await tick();

      expect(requests).toHaveLength(1);
      expect(requests[0].requestId).toBe('req-001');
      expect(requests[0].subtype).toBe('can_use_tool');
    });

    it('should send control_response back to CLI via respondToControlRequest', async () => {
      createSession();
      session.sendMessage('test');

      session.respondToControlRequest('req-001', { allow: true });

      const parsed = JSON.parse(mockProcess.getLastStdinLine());
      expect(parsed.type).toBe('control_response');
      expect(parsed.request_id).toBe('req-001');
      expect(parsed.response.allow).toBe(true);
    });
  });
});
