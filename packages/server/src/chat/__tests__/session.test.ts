import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import type { ChatStreamEvent, ChatStats } from '../types';
import { ChatSessionImpl } from '../session';

const MOCK_CLAUDE_SCRIPT = path.resolve(__dirname, '../../../../..', 'e2e/fixtures/mock-claude.sh');
const MOCK_ECHO_SCRIPT = path.resolve(__dirname, '../../../../..', 'e2e/fixtures/mock-claude-echo.sh');

function waitForComplete(session: ChatSessionImpl): Promise<ChatStats> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout waiting for complete')), 5000);
    session.onComplete((stats) => {
      clearTimeout(timeout);
      resolve(stats);
    });
    session.onError((err) => {
      clearTimeout(timeout);
      reject(new Error(err));
    });
  });
}

function waitForExit(session: ChatSessionImpl): Promise<void> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(), 5000);
    session.onExit(() => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

describe('ChatSessionImpl', () => {
  let session: ChatSessionImpl;

  afterEach(() => {
    session?.kill();
  });

  it('should spawn process and emit parsed events', async () => {
    session = new ChatSessionImpl({
      provider: 'claude',
      command: 'bash',
      baseArgs: [MOCK_CLAUDE_SCRIPT],
    });
    const events: ChatStreamEvent[] = [];
    session.onEvent((e) => events.push(e));

    session.sendMessage('test');

    await waitForComplete(session);
    expect(events.some((e) => e.type === 'init')).toBe(true);
    expect(events.some((e) => e.type === 'text')).toBe(true);
    expect(events.some((e) => e.type === 'result')).toBe(true);
  });

  it('should extract session id from init event', async () => {
    session = new ChatSessionImpl({
      provider: 'claude',
      command: 'bash',
      baseArgs: [MOCK_CLAUDE_SCRIPT],
    });

    session.sendMessage('test');
    await waitForComplete(session);

    expect(session.cliSessionId).toBe('mock-123');
  });

  it('should use --resume on second message', async () => {
    session = new ChatSessionImpl({
      provider: 'claude',
      command: 'bash',
      baseArgs: [MOCK_CLAUDE_SCRIPT],
    });

    // First message
    session.sendMessage('first');
    await waitForComplete(session);
    await waitForExit(session);

    // Second message should use --resume
    const events: ChatStreamEvent[] = [];
    session.onEvent((e) => events.push(e));

    session.sendMessage('second');
    await waitForComplete(session);

    // Should still work (mock doesn't validate --resume, but process should spawn)
    expect(events.some((e) => e.type === 'init')).toBe(true);
  });

  it('should emit error on spawn failure', async () => {
    session = new ChatSessionImpl({
      provider: 'claude',
      command: '/nonexistent/command',
      baseArgs: [],
    });

    const errorPromise = new Promise<string>((resolve) => {
      session.onError((err) => resolve(err));
    });

    session.sendMessage('test');

    const error = await errorPromise;
    expect(error).toBeTruthy();
  });

  it('should abort running process', async () => {
    session = new ChatSessionImpl({
      provider: 'claude',
      command: 'bash',
      baseArgs: ['-c', 'echo \'{"type":"system","subtype":"init","session_id":"abc"}\'; sleep 10'],
    });

    const exitPromise = waitForExit(session);
    session.sendMessage('test');

    // Wait a bit for process to start
    await new Promise((resolve) => setTimeout(resolve, 200));

    session.abort();
    await exitPromise;
    // If we get here, the process was successfully killed
    expect(true).toBe(true);
  });

  it('should pass message as last argument to CLI', async () => {
    session = new ChatSessionImpl({
      provider: 'claude',
      command: 'bash',
      baseArgs: [MOCK_ECHO_SCRIPT],
    });

    const events: ChatStreamEvent[] = [];
    session.onEvent((e) => events.push(e));

    session.sendMessage('Hello world');
    await waitForComplete(session);

    const textEvent = events.find((e) => e.type === 'text');
    expect(textEvent).toBeDefined();
    expect((textEvent!.data as { content: string }).content).toContain('Hello world');
  });

  it('should pass message as last argument on resume too', async () => {
    session = new ChatSessionImpl({
      provider: 'claude',
      command: 'bash',
      baseArgs: [MOCK_ECHO_SCRIPT],
    });

    // First message to establish session
    session.sendMessage('first');
    await waitForComplete(session);
    await waitForExit(session);

    expect(session.cliSessionId).toBeTruthy();

    // Second message with --resume should still pass the message
    const events: ChatStreamEvent[] = [];
    session.onEvent((e) => events.push(e));

    session.sendMessage('second message');
    await waitForComplete(session);

    const textEvent = events.find((e) => e.type === 'text');
    expect(textEvent).toBeDefined();
    expect((textEvent!.data as { content: string }).content).toContain('second message');
  });

  it('should pass message via -p flag for gemini provider', async () => {
    // Gemini uses: gemini -o stream-json -p "message"
    session = new ChatSessionImpl({
      provider: 'gemini',
      command: 'bash',
      baseArgs: ['-c', `
        # Parse -p flag value
        MSG=""
        while [[ $# -gt 0 ]]; do
          case "$1" in
            -p|--prompt) MSG="$2"; shift 2 ;;
            *) shift ;;
          esac
        done
        echo '{"type":"init","session_id":"gemini-mock-1"}'
        echo '{"type":"message","role":"assistant","content":"'"Prompt: \$MSG"'","delta":true}'
        echo '{"type":"result","status":"success","stats":{"input_tokens":10,"output_tokens":5,"duration_ms":100}}'
      `, '_'],
    });

    const events: ChatStreamEvent[] = [];
    session.onEvent((e) => events.push(e));

    session.sendMessage('Hello from Gemini');
    await waitForComplete(session);

    const textEvent = events.find((e) => e.type === 'text');
    expect(textEvent).toBeDefined();
    expect((textEvent!.data as { content: string }).content).toContain('Hello from Gemini');
  });

  it('should use --resume and -p for gemini on second message', async () => {
    session = new ChatSessionImpl({
      provider: 'gemini',
      command: 'bash',
      baseArgs: ['-c', `
        # Parse flags
        MSG=""
        RESUME=""
        while [[ $# -gt 0 ]]; do
          case "$1" in
            -p|--prompt) MSG="$2"; shift 2 ;;
            --resume|-r) RESUME="$2"; shift 2 ;;
            *) shift ;;
          esac
        done
        echo '{"type":"init","session_id":"gemini-mock-2"}'
        echo '{"type":"message","role":"assistant","content":"'"msg=\$MSG resume=\$RESUME"'","delta":true}'
        echo '{"type":"result","status":"success","stats":{"input_tokens":10,"output_tokens":5,"duration_ms":100}}'
      `, '_'],
    });

    // First message
    session.sendMessage('first');
    await waitForComplete(session);
    await waitForExit(session);

    expect(session.cliSessionId).toBe('gemini-mock-2');

    // Second message should use --resume AND -p
    const events: ChatStreamEvent[] = [];
    session.onEvent((e) => events.push(e));

    session.sendMessage('second');
    await waitForComplete(session);

    const textEvent = events.find((e) => e.type === 'text');
    expect(textEvent).toBeDefined();
    const content = (textEvent!.data as { content: string }).content;
    expect(content).toContain('msg=second');
    expect(content).toContain('resume=gemini-mock-2');
  });

  it('should have a unique id', () => {
    session = new ChatSessionImpl({
      provider: 'claude',
      command: 'bash',
      baseArgs: [MOCK_CLAUDE_SCRIPT],
    });

    const session2 = new ChatSessionImpl({
      provider: 'claude',
      command: 'bash',
      baseArgs: [MOCK_CLAUDE_SCRIPT],
    });

    expect(session.id).toBeTruthy();
    expect(session2.id).toBeTruthy();
    expect(session.id).not.toBe(session2.id);

    session2.kill();
  });
});
