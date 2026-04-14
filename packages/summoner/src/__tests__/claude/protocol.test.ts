import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ClaudeProtocol } from '../../claude/protocol.ts';

const protocol = new ClaudeProtocol();

const FIXTURE_BASE = join(import.meta.dirname, '../../__fixtures__/claude');
const REAL_DIR = join(FIXTURE_BASE, 'real');
const SYNTHETIC_DIR = join(FIXTURE_BASE, 'synthetic');

function loadFixtureLines(dir: string): Array<{ file: string; lineNo: number; line: string }> {
  const entries: Array<{ file: string; lineNo: number; line: string }> = [];
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith('.jsonl'))
    .sort()) {
    const content = readFileSync(join(dir, file), 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim());
    for (let i = 0; i < lines.length; i++) {
      entries.push({ file, lineNo: i + 1, line: lines[i] });
    }
  }
  return entries;
}

// ── Snapshot tests: every fixture line → parseLine → snapshot ──

describe('ClaudeProtocol.parseLine (real fixtures)', () => {
  const entries = loadFixtureLines(REAL_DIR);
  for (const { file, lineNo, line } of entries) {
    it(`parses ${file}:${lineNo}`, () => {
      const result = protocol.parseLine(line);
      expect(result.status).toBe('ok');
      if (result.status === 'ok') {
        expect(result.message).toMatchSnapshot();
      }
    });
  }
});

describe('ClaudeProtocol.parseLine (synthetic fixtures)', () => {
  const entries = loadFixtureLines(SYNTHETIC_DIR);
  for (const { file, lineNo, line } of entries) {
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
