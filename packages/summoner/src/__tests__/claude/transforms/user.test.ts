import { describe, expect, it } from 'vitest';
import { ClaudeAdapter } from '../../../claude/adapter.ts';
import { segments as s } from '../../../test/segments-node.ts';
import { toClientMessage } from '../helpers.ts';

const adapter = new ClaudeAdapter();

describe('transform — user events', () => {
  it('converts user with tool_result', () => {
    const base = JSON.parse(s.toolResult('tu-1', 'output'));
    base.message.content = [
      { type: 'tool_result', tool_use_id: 'tu-1', name: 'Bash', content: 'output' },
      { type: 'text', text: 'user said' },
    ];
    const result = toClientMessage(JSON.stringify(base));
    expect(result).toMatchObject({
      name: 'message:user',
      payload: {
        content: [
          { type: 'tool_result', toolUseId: 'tu-1' },
          { type: 'text', text: 'user said' },
        ],
      },
    });
  });

  it('preserves CLI uuid in payload', () => {
    const base = JSON.parse(s.toolResult('tu-1', 'output'));
    base.uuid = 'cli-uuid-123';
    const result = toClientMessage(JSON.stringify(base));
    const event = Array.isArray(result) ? result[0] : result;
    expect(event?.payload).toHaveProperty('uuid', 'cli-uuid-123');
  });

  // Regression: CLI echoes slash-command results with content as a plain string,
  // e.g. "<local-command-stdout>Set model to sonnet</local-command-stdout>".
  // parseLine() must NOT return status:'error' for this shape — that would cause
  // the runner to emit a raw_event parse_error visible in the client UI.
  it('slash command stdout echo (string content) does not produce parse_error', () => {
    const line = JSON.stringify({
      type: 'user',
      message: {
        role: 'user',
        content:
          '<local-command-stdout>Set model to sonnet (claude-sonnet-4-6)</local-command-stdout>',
      },
      isReplay: true,
    });
    const result = adapter.parseLine(line);
    expect(result.status).not.toBe('error');
  });

  it('slash command stdout echo is silently skipped (not shown as a user message)', () => {
    // CLI echoes slash-command results (e.g. model switch) as string content.
    // These are internal CLI notifications — they must NOT appear as conversation messages.
    const line = JSON.stringify({
      type: 'user',
      message: {
        role: 'user',
        content:
          '<local-command-stdout>Set model to sonnet (claude-sonnet-4-6)</local-command-stdout>',
      },
      isReplay: true,
    });
    const result = toClientMessage(line);
    expect(result).toBeNull();
  });

  it('isSynthetic user event sets history: false', () => {
    const line = JSON.stringify({
      type: 'user',
      isSynthetic: true,
      message: {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Base directory for this skill: /p/skills/foo\n\n# Heading\n\n**bold**',
          },
        ],
      },
    });
    const result = toClientMessage(line);
    const event = Array.isArray(result) ? result[0] : result;
    expect(event?.name).toBe('message:user');
    expect(event?.payload).toMatchObject({ history: false });
  });

  it('isSynthetic slash-command body sets history: false', () => {
    const line = JSON.stringify({
      type: 'user',
      isSynthetic: true,
      message: {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Propose a new change - create the change and generate all artifacts in one step.\n\n**Steps**\n\n1. Foo\n2. Bar',
          },
        ],
      },
    });
    const result = toClientMessage(line);
    const event = Array.isArray(result) ? result[0] : result;
    expect(event?.payload).toMatchObject({ history: false });
  });

  it('non-synthetic text sets history: true regardless of content', () => {
    const line = JSON.stringify({
      type: 'user',
      message: {
        role: 'user',
        content: [
          { type: 'text', text: 'Base directory for this skill: whatever — user quoted the docs' },
        ],
      },
    });
    const result = toClientMessage(line);
    const event = Array.isArray(result) ? result[0] : result;
    expect(event?.payload).toMatchObject({ history: true });
  });

  it('plain typed user input sets history: true', () => {
    const segment = s.user('hello plain', { uuid: 'u-1' });
    const result = toClientMessage(segment);
    const event = Array.isArray(result) ? result[0] : result;
    expect(event?.payload).toMatchObject({ history: true });
  });

  it('text user echo (--replay-user-messages) carries uuid through transform', () => {
    const segment = s.user('hello-from-user', { uuid: 'real-cli-echo-uuid' });
    const result = toClientMessage(segment);
    const event = Array.isArray(result) ? result[0] : result;
    expect(event?.name).toBe('message:user');
    expect(event?.payload).toMatchObject({
      content: [{ type: 'text', text: 'hello-from-user' }],
      uuid: 'real-cli-echo-uuid',
    });
  });

  it('plain user echo (no isSynthetic, no parent_tool_use_id) sets history: true', () => {
    const segment = s.user('typed by user', { uuid: 'u-typed' });
    const result = toClientMessage(segment);
    const event = Array.isArray(result) ? result[0] : result;
    expect(event?.payload).toMatchObject({ history: true });
  });

  it('isSynthetic user event with plain text sets history: false', () => {
    const line = JSON.stringify({
      type: 'user',
      isSynthetic: true,
      message: { role: 'user', content: [{ type: 'text', text: 'skill body' }] },
    });
    const result = toClientMessage(line);
    const event = Array.isArray(result) ? result[0] : result;
    expect(event?.payload).toMatchObject({ history: false });
  });

  it('user event with parent_tool_use_id (loop wakeup) sets history: false', () => {
    const line = JSON.stringify({
      type: 'user',
      parent_tool_use_id: 'toolu_loop123',
      message: { role: 'user', content: [{ type: 'text', text: 'wake up' }] },
    });
    const result = toClientMessage(line);
    const event = Array.isArray(result) ? result[0] : result;
    expect(event?.payload).toMatchObject({ history: false });
  });
});
