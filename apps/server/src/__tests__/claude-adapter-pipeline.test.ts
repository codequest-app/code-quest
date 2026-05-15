import type { ClientMessage } from '@code-quest/schemas';
import { ClaudeAdapter } from '@code-quest/summoner';
import { segments as s } from '@code-quest/summoner/test';
import { describe, expect, it } from 'vitest';

const adapter = new ClaudeAdapter();

function pipeline(jsonLine: string): ClientMessage[] {
  const parsed = adapter.parseLine(jsonLine);
  if (parsed.status !== 'ok') return [];

  const output = adapter.transform(parsed.message);
  return output.messages;
}

function expectName<N extends ClientMessage['name']>(
  msg: ClientMessage,
  name: N,
): Extract<ClientMessage, { name: N }> {
  expect(msg.name).toBe(name);
  return msg as Extract<ClientMessage, { name: N }>;
}

describe('End-to-end: FakeClaude → ClaudeAdapter → ClientMessage', () => {
  it('assistant text → message:assistant', () => {
    const results = pipeline(s.assistant('hello world'));
    expect(results).toHaveLength(1);
    const msg = expectName(results[0]!, 'message:assistant');
    expect(msg.payload.content[0]).toMatchObject({ type: 'text', text: 'hello world' });
  });

  it('system/init → session:init', () => {
    const results = pipeline(s.init('sess-1', { model: 'opus' }));
    expect(results).toHaveLength(1);
    const msg = expectName(results[0]!, 'session:init');
    expect(msg.payload.sessionId).toBe('sess-1');
    expect(msg.payload.model).toBe('opus');
  });

  it('control_request can_use_tool → control:permission', () => {
    const results = pipeline(s.controlRequestBash('req-1', { command: 'ls' }));
    expect(results).toHaveLength(1);
    const msg = expectName(results[0]!, 'control:permission');
    expect(msg.payload.requestId).toBe('req-1');
    expect(msg.payload.toolName).toBe('Bash');
  });

  it('stream text_delta → stream:chunk with kind=text', () => {
    const results = pipeline(s.textDelta('hi'));
    expect(results).toHaveLength(1);
    const msg = expectName(results[0]!, 'stream:chunk');
    expect(msg.payload.chunk).toMatchObject({ kind: 'text', content: 'hi' });
  });

  it('stream thinking_delta → stream:chunk with kind=thinking', () => {
    const results = pipeline(s.thinkingDelta('hmm'));
    expect(results).toHaveLength(1);
    const msg = expectName(results[0]!, 'stream:chunk');
    expect(msg.payload.chunk).toMatchObject({ kind: 'thinking', content: 'hmm' });
  });

  it('result → message:result', () => {
    const results = pipeline(s.result());
    expect(results.length).toBeGreaterThanOrEqual(1);
    const msg = expectName(results[0]!, 'message:result');
    expect(msg.payload.stats).toBeDefined();
  });

  it('status → session:status', () => {
    const parsed = adapter.parseLine(s.status({ status: 'idle' }));
    if (parsed.status === 'ok') {
      const output = adapter.transform(parsed.message);
      expect(output.messages).toHaveLength(1);
      expect(output.messages[0]!.name).toBe('session:status');
    } else {
      expect(['error', 'unknown']).toContain(parsed.status);
    }
  });

  it('hook_started → hook:started', () => {
    const parsed = adapter.parseLine(s.hookStarted());
    if (parsed.status === 'ok') {
      const output = adapter.transform(parsed.message);
      expect(output.messages).toHaveLength(1);
      const msg = expectName(output.messages[0]!, 'hook:started');
      expect(msg.payload.hook).toBeDefined();
    } else {
      expect(['error', 'unknown']).toContain(parsed.status);
    }
  });

  it('rate_limit_event → system:rate_limit', () => {
    const results = pipeline(s.rateLimitEvent());
    expect(results).toHaveLength(1);
    const msg = expectName(results[0]!, 'system:rate_limit');
    expect(msg.payload.info).toBeDefined();
  });

  it('control_request open_url → action:open_url with requestId and response (no serverActions)', () => {
    const adapter = new ClaudeAdapter();
    const line = s.controlRequest('req-url', 'open_url', undefined, { url: 'https://example.com' });
    const parsed = adapter.parseLine(line);
    expect(parsed.status).toBe('ok');
    if (parsed.status !== 'ok') return;

    const output = adapter.transform(parsed.message);

    expect(output.messages).toHaveLength(1);
    const msg = expectName(output.messages[0]!, 'action:open_url');
    expect(msg.payload.url).toBe('https://example.com');
    expect(msg.payload.requestId).toBe('req-url');
    expect(msg.payload.response).toEqual({ type: 'open_url_response' });
  });

  it('message_stop → stream:end', () => {
    const results = pipeline(s.messageStop());
    expect(results).toHaveLength(1);
    expect(results[0]!.name).toBe('stream:end');
  });

  it('content_block_start → stream:block_start', () => {
    const results = pipeline(s.contentBlockStart());
    expect(results).toHaveLength(1);
    expect(results[0]!.name).toBe('stream:block_start');
  });

  it('assistant with tool_use → message:assistant with tool_use content', () => {
    const results = pipeline(
      s.assistant({ toolUse: { id: 'toolu_1', name: 'Read', input: { file: '/a.ts' } } }),
    );
    expect(results).toHaveLength(1);
    const msg = expectName(results[0]!, 'message:assistant');
    expect(msg.payload.content[0]).toMatchObject({ type: 'tool_use', toolName: 'Read' });
  });
});
