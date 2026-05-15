import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FIXTURES_DIR } from '@code-quest/test-kit';
import { describe, expect, it } from 'vitest';
import { ClaudeProtocol } from '../../claude/protocol.ts';

const protocol = new ClaudeProtocol();

const REAL_DIR = join(FIXTURES_DIR, 'real');
const SYNTHETIC_DIR = join(FIXTURES_DIR, 'synthetic');

function fixtureLines(dir: string, file: string): string[] {
  return readFileSync(join(dir, file), 'utf-8')
    .split('\n')
    .filter((l) => l.trim());
}

// ── Snapshot tests: every fixture line → parseLine → snapshot ──

describe('ClaudeProtocol.parseLine (real fixtures)', () => {
  function realIt(file: string, lineNo: number) {
    const line = fixtureLines(REAL_DIR, file)[lineNo - 1]!;
    it(`parses ${file}:${lineNo}`, () => {
      const result = protocol.parseLine(line);
      expect(result.status).toBe('ok');
      if (result.status === 'ok') {
        expect(result.message).toMatchSnapshot();
      }
    });
  }

  realIt('api-retry.jsonl', 1);
  realIt('assistant-agent.jsonl', 1);
  realIt('assistant-text.jsonl', 1);
  realIt('assistant-tool.jsonl', 1);
  realIt('auth-status.jsonl', 1);
  realIt('cli-error.jsonl', 1);
  realIt('control-cancel-request.jsonl', 1);
  realIt('control-get-context-usage.jsonl', 1);
  realIt('control-get-context-usage.jsonl', 2);
  realIt('control-get-settings.jsonl', 1);
  realIt('control-initialize.jsonl', 1);
  realIt('control-initialize.jsonl', 2);
  realIt('control-request-ask-user-question.jsonl', 1);
  realIt('control-request-bash.jsonl', 1);
  realIt('control-request-can-use-tool.jsonl', 1);
  realIt('control-request-exit-plan-mode.jsonl', 1);
  realIt('control-request-hook-callback.jsonl', 1);
  realIt('control-request.jsonl', 1);
  realIt('control-response-error.jsonl', 1);
  realIt('control-response.jsonl', 1);
  realIt('control-set-effort.jsonl', 1);
  realIt('control-set-effort.jsonl', 2);
  realIt('hook-response.jsonl', 1);
  realIt('hook-started.jsonl', 1);
  realIt('init.jsonl', 1);
  realIt('rate-limit-event.jsonl', 1);
  realIt('result-error.jsonl', 1);
  realIt('result-is-error-no-errors.jsonl', 1);
  realIt('result-success.jsonl', 1);
  realIt('status.jsonl', 1);
  realIt('stream-content-block-start.jsonl', 1);
  realIt('stream-content-block-stop.jsonl', 1);
  realIt('stream-input-json-delta.jsonl', 1);
  realIt('stream-message-delta.jsonl', 1);
  realIt('stream-message-start.jsonl', 1);
  realIt('stream-message-stop.jsonl', 1);
  realIt('stream-signature-delta.jsonl', 1);
  realIt('stream-text-delta.jsonl', 1);
  realIt('stream-thinking-delta.jsonl', 1);
  realIt('task-notification.jsonl', 1);
  realIt('task-progress.jsonl', 1);
  realIt('task-started-local-bash.jsonl', 1);
  realIt('task-started.jsonl', 1);
  realIt('thinking.jsonl', 1);
  realIt('tool-result.jsonl', 1);
  realIt('tool-use.jsonl', 1);
  realIt('user-skill-body.jsonl', 1);
  realIt('user-synthetic-slash.jsonl', 1);
  realIt('user-text.jsonl', 1);
});

describe('ClaudeProtocol.parseLine (synthetic fixtures)', () => {
  function syntheticIt(file: string, lineNo: number) {
    const line = fixtureLines(SYNTHETIC_DIR, file)[lineNo - 1]!;
    it(`parses ${file}:${lineNo}`, () => {
      const result = protocol.parseLine(line);
      // Files with unknown event types produce 'unknown' status
      if (result.status === 'unknown') {
        expect(result.type).toBeDefined();
        expect(result.data).toMatchSnapshot();
      } else {
        expect(result.status).toBe('ok');
        if (result.status === 'ok') {
          expect(result.message).toMatchSnapshot();
        }
      }
    });
  }

  syntheticIt('auth-status.jsonl', 1);
  syntheticIt('auth-url.jsonl', 1);
  syntheticIt('bridge-state.jsonl', 1);
  syntheticIt('citations-delta.jsonl', 1);
  syntheticIt('compact-boundary.jsonl', 1);
  syntheticIt('compaction-delta.jsonl', 1);
  syntheticIt('control-channel-enable.jsonl', 1);
  syntheticIt('control-channel-enable.jsonl', 2);
  syntheticIt('control-claude-authenticate.jsonl', 1);
  syntheticIt('control-claude-authenticate.jsonl', 2);
  syntheticIt('control-claude-oauth-callback.jsonl', 1);
  syntheticIt('control-claude-oauth-callback.jsonl', 2);
  syntheticIt('control-claude-oauth-wait.jsonl', 1);
  syntheticIt('control-claude-oauth-wait.jsonl', 2);
  syntheticIt('control-reload-plugins.jsonl', 1);
  syntheticIt('control-request-elicitation.jsonl', 1);
  syntheticIt('control-request-open-diff.jsonl', 1);
  syntheticIt('control-request-open-in-editor.jsonl', 1);
  syntheticIt('control-request-show-notification.jsonl', 1);
  syntheticIt('control-seed-read-state.jsonl', 1);
  syntheticIt('control-seed-read-state.jsonl', 2);
  syntheticIt('control-side-question.jsonl', 1);
  syntheticIt('control-side-question.jsonl', 2);
  syntheticIt('control-ultrareview-launch.jsonl', 1);
  syntheticIt('experiment-gates.jsonl', 1);
  syntheticIt('new-session-notification.jsonl', 1);
  syntheticIt('notification.jsonl', 1);
  syntheticIt('post-turn-summary.jsonl', 1);
  syntheticIt('result-resume-not-found.jsonl', 1);
  syntheticIt('session-state-changed.jsonl', 1);
  syntheticIt('speech-to-text-message.jsonl', 1);
  syntheticIt('stream-thinking-delta-legacy.jsonl', 1);
  syntheticIt('streamlined-text.jsonl', 1);
  syntheticIt('streamlined-tool-use-summary.jsonl', 1);
  syntheticIt('system-mirror-error.jsonl', 1);
  syntheticIt('unknown-event.jsonl', 1);
});

// ── Edge cases ──

describe('ClaudeProtocol.parseLine (edge cases)', () => {
  it('returns skip/empty for empty string', () => {
    expect(protocol.parseLine('')).toEqual({ status: 'skip', raw: '', reason: 'empty' });
  });

  it('returns skip/empty for whitespace-only string', () => {
    expect(protocol.parseLine('   \t  ')).toEqual({
      status: 'skip',
      raw: '   \t  ',
      reason: 'empty',
    });
  });

  it('returns skip/invalid_json for non-JSON string', () => {
    expect(protocol.parseLine('not json at all')).toEqual({
      status: 'skip',
      raw: 'not json at all',
      reason: 'invalid_json',
    });
  });

  it('returns skip/no_type for JSON without type field', () => {
    expect(protocol.parseLine('{"foo":"bar"}')).toEqual({
      status: 'skip',
      raw: '{"foo":"bar"}',
      reason: 'no_type',
    });
  });

  it('returns skip/keep_alive for keep_alive', () => {
    expect(protocol.parseLine('{"type":"keep_alive"}')).toEqual({
      status: 'skip',
      raw: '{"type":"keep_alive"}',
      reason: 'keep_alive',
    });
  });

  it('returns unknown for unknown type', () => {
    const result = protocol.parseLine('{"type":"some_future_type","data":123}');
    expect(result.status).toBe('unknown');
    if (result.status === 'unknown') {
      expect(result.type).toBe('some_future_type');
      expect(result.data).toEqual({ type: 'some_future_type', data: 123 });
    }
  });

  it('returns error for known type with missing required fields', () => {
    // system/init requires session_id
    const result = protocol.parseLine('{"type":"system","subtype":"init"}');
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.error).toBeDefined();
    }
  });
});

// ── Format methods ──

describe('ClaudeProtocol.formatUserMessage', () => {
  it('produces valid stdin JSON', () => {
    const raw = protocol.formatUserMessage('hello');
    const parsed = JSON.parse(raw);
    expect(parsed).toEqual({
      type: 'user',
      message: {
        role: 'user',
        content: [{ type: 'text', text: 'hello' }],
      },
    });
  });
});

describe('ClaudeProtocol.formatControlResponse', () => {
  it('produces valid stdin JSON', () => {
    const raw = protocol.formatControlResponse('req-1', { behavior: 'allow' });
    const parsed = JSON.parse(raw);
    expect(parsed).toEqual({
      type: 'control_response',
      response: {
        subtype: 'success',
        request_id: 'req-1',
        response: { behavior: 'allow' },
      },
    });
  });
});

describe('ClaudeProtocol.formatControlRequest', () => {
  it('always includes request_id (auto-generated UUID)', () => {
    const raw = protocol.formatControlRequest('set_model', { model: 'opus' });
    const parsed = JSON.parse(raw);
    expect(parsed).toMatchObject({
      type: 'control_request',
      request: { subtype: 'set_model', model: 'opus' },
    });
    expect(typeof parsed.request_id).toBe('string');
    expect(parsed.request_id.length).toBeGreaterThan(0);
  });

  it('uses provided request_id when given', () => {
    const raw = protocol.formatControlRequest('set_model', { model: 'opus' }, 'my-rid');
    const parsed = JSON.parse(raw);
    expect(parsed.request_id).toBe('my-rid');
  });

  it('works without input', () => {
    const raw = protocol.formatControlRequest('interrupt');
    const parsed = JSON.parse(raw);
    expect(parsed).toMatchObject({
      type: 'control_request',
      request: { subtype: 'interrupt' },
    });
    expect(typeof parsed.request_id).toBe('string');
  });
});

// ── buildArgs ──

describe('ClaudeProtocol.buildArgs', () => {
  it('returns base args without options', () => {
    const args = protocol.buildArgs();
    expect(args).toContain('--output-format');
    expect(args).toContain('stream-json');
    expect(args).not.toContain('--resume');
  });

  it('base args include --replay-user-messages so CLI echoes user msgs with uuid', () => {
    const args = protocol.buildArgs();
    expect(args).toContain('--replay-user-messages');
  });

  it('includes --resume when resumeSessionId provided', () => {
    const args = protocol.buildArgs({ resumeSessionId: 'abc-123' });
    const idx = args.indexOf('--resume');
    expect(idx).toBeGreaterThan(-1);
    expect(args[idx + 1]).toBe('abc-123');
  });
});

// ── parseInitializeResponse ──

describe('ClaudeProtocol.parseInitializeResponse', () => {
  it('extracts commands, models, account', () => {
    const result = protocol.parseInitializeResponse({
      commands: [{ name: 'help' }, { name: 'compact' }],
      models: [{ id: 'opus', name: 'Claude Opus' }],
      account: { email: 'test@example.com' },
    });
    expect(result.commands).toEqual(['help', 'compact']);
    expect(result.models).toEqual([{ id: 'opus', name: 'Claude Opus' }]);
    expect(result.account).toEqual({ email: 'test@example.com' });
  });

  it('returns undefined for missing fields', () => {
    const result = protocol.parseInitializeResponse({});
    expect(result.commands).toBeUndefined();
    expect(result.models).toBeUndefined();
    expect(result.account).toBeUndefined();
  });

  it('handles undefined response', () => {
    const result = protocol.parseInitializeResponse(undefined);
    expect(result.commands).toBeUndefined();
    expect(result.models).toBeUndefined();
    expect(result.account).toBeUndefined();
  });
});
