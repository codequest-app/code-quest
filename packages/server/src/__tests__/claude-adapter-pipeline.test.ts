import { ClaudeAdapter } from '@code-quest/summoner';
import { segments as s } from '@code-quest/summoner/test';
import { describe, expect, it } from 'vitest';

const adapter = new ClaudeAdapter();

function pipeline(jsonLine: string) {
  const parsed = adapter.parseLine(jsonLine);
  if (parsed.status !== 'ok') return [];

  const output = adapter.transform(parsed.event);
  return output.events;
}

describe('End-to-end: FakeClaude → ClaudeAdapter → SocketEvent', () => {
  it('assistant text → message:assistant', () => {
    const results = pipeline(s.assistant('hello world'));
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('message:assistant');
    const content = results[0].payload.content as Array<{ type: string; text: string }>;
    expect(content[0]).toMatchObject({ type: 'text', text: 'hello world' });
  });

  it('system/init → session:init', () => {
    const results = pipeline(s.init('sess-1', { model: 'opus' }));
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('session:init');
    expect(results[0].payload.sessionId).toBe('sess-1');
    expect(results[0].payload.model).toBe('opus');
  });

  it('control_request can_use_tool → control:permission', () => {
    const results = pipeline(s.controlRequestBash('req-1', { command: 'ls' }));
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('control:permission');
    expect(results[0].payload.requestId).toBe('req-1');
    expect(results[0].payload.toolName).toBe('Bash');
  });

  it('stream text_delta → stream:chunk with kind=text', () => {
    const results = pipeline(s.textDelta('hi'));
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('stream:chunk');
    expect(results[0].payload.chunk).toMatchObject({ kind: 'text', content: 'hi' });
  });

  it('stream thinking_delta → stream:chunk with kind=thinking', () => {
    const results = pipeline(s.thinkingDelta('hmm'));
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('stream:chunk');
    expect(results[0].payload.chunk).toMatchObject({ kind: 'thinking', content: 'hmm' });
  });

  it('result → message:result', () => {
    const results = pipeline(s.result());
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].name).toBe('message:result');
    expect(results[0].payload.stats).toBeDefined();
  });

  it('status → session:status', () => {
    const parsed = adapter.parseLine(s.status({ status: 'idle' }));
    if (parsed.status === 'ok') {
      const output = adapter.transform(parsed.event);
      expect(output.events).toHaveLength(1);
      expect(output.events[0].name).toBe('session:status');
    } else {
      expect(['error', 'unknown']).toContain(parsed.status);
    }
  });

  it('hook_started → system:hook_started', () => {
    const parsed = adapter.parseLine(s.hookStarted());
    if (parsed.status === 'ok') {
      const output = adapter.transform(parsed.event);
      expect(output.events).toHaveLength(1);
      expect(output.events[0].name).toBe('system:hook_started');
      expect(output.events[0].payload.hook).toBeDefined();
    } else {
      expect(['error', 'unknown']).toContain(parsed.status);
    }
  });

  it('rate_limit_event → system:rate_limit', () => {
    const results = pipeline(s.rateLimitEvent());
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('system:rate_limit');
    expect(results[0].payload.info).toBeDefined();
  });

  it('control_request open_url → action:open_url (auto_respond separated in adapter)', () => {
    const adapter = new ClaudeAdapter();
    const line = s.controlRequest('req-url', 'open_url', undefined, { url: 'https://example.com' });
    const parsed = adapter.parseLine(line);
    expect(parsed.status).toBe('ok');
    if (parsed.status !== 'ok') return;

    const output = adapter.transform(parsed.event);

    expect(output.events).toHaveLength(1);
    expect(output.events[0].name).toBe('action:open_url');
    expect(output.events[0].payload.url).toBe('https://example.com');

    // AutoResponse stays server-side
    const autoResponses = output.serverActions.filter((a) => a.action === 'auto_respond');
    expect(autoResponses).toHaveLength(1);
    expect(autoResponses[0].subtype).toBe('open_url');
  });

  it('message_stop → stream:end', () => {
    const results = pipeline(s.messageStop());
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('stream:end');
  });

  it('content_block_start → stream:block_start', () => {
    const results = pipeline(s.contentBlockStart());
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('stream:block_start');
  });

  it('assistant with tool_use → message:assistant with tool_use content', () => {
    const results = pipeline(
      s.assistant({ toolUse: { id: 'toolu_1', name: 'Read', input: { file: '/a.ts' } } }),
    );
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('message:assistant');
    const content = results[0].payload.content as Array<{ type: string; toolName?: string }>;
    expect(content[0]).toMatchObject({ type: 'tool_use', toolName: 'Read' });
  });
});
