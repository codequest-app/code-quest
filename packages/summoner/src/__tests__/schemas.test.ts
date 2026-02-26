import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { claudeRawEventSchema } from '../schemas.ts';

const fixtureDir = join(import.meta.dirname, '../__fixtures__/claude');

function loadFixtureLines(filename: string): unknown[] {
  const content = readFileSync(join(fixtureDir, filename), 'utf-8');
  return content
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

describe('claudeRawEventSchema', () => {
  const fixtures = [
    'simple-text.jsonl',
    'tool-use-read.jsonl',
    'control-initialize.jsonl',
    'control-interrupt.jsonl',
    'control-set-model.jsonl',
    'control-set-permission-mode.jsonl',
    'control-set-max-thinking-tokens.jsonl',
    'control-response-error.jsonl',
    'control-rewind-files.jsonl',
    'control-stop-task.jsonl',
    'control-mcp-message.jsonl',
    'control-mcp-reconnect.jsonl',
    'control-mcp-set-servers.jsonl',
    'control-mcp-status.jsonl',
    'control-mcp-toggle.jsonl',
    'control-request-can-use-tool.jsonl',
    'control-request-hook-callback.jsonl',
  ];

  for (const fixture of fixtures) {
    it(`should parse all lines in ${fixture}`, () => {
      const lines = loadFixtureLines(fixture);
      expect(lines.length).toBeGreaterThan(0);

      for (const line of lines) {
        const result = claudeRawEventSchema.safeParse(line);
        if (!result.success) {
          throw new Error(
            `Failed to parse line in ${fixture}: ${JSON.stringify(line).slice(0, 200)}\n` +
              `Error: ${result.error.message}`,
          );
        }
      }
    });
  }

  it('should reject malformed data', () => {
    expect(claudeRawEventSchema.safeParse({ type: 'unknown_garbage' }).success).toBe(false);
    expect(claudeRawEventSchema.safeParse('not an object').success).toBe(false);
    expect(claudeRawEventSchema.safeParse(null).success).toBe(false);
  });

  it('should accept rate_limit_event', () => {
    const event = {
      type: 'rate_limit_event',
      rate_limit_info: { status: 'allowed' },
      uuid: 'test',
      session_id: 'test',
    };
    expect(claudeRawEventSchema.safeParse(event).success).toBe(true);
  });

  it('should accept system hook_started', () => {
    const event = {
      type: 'system',
      subtype: 'hook_started',
      hook_id: 'abc',
      hook_name: 'SessionStart:startup',
      hook_event: 'SessionStart',
      uuid: 'test',
      session_id: 'test',
    };
    expect(claudeRawEventSchema.safeParse(event).success).toBe(true);
  });

  it('should accept system hook_response', () => {
    const event = {
      type: 'system',
      subtype: 'hook_response',
      hook_id: 'abc',
      hook_name: 'SessionStart:startup',
      hook_event: 'SessionStart',
      output: '{}',
      stdout: '',
      stderr: '',
      exit_code: 0,
      outcome: 'success',
      uuid: 'test',
      session_id: 'test',
    };
    expect(claudeRawEventSchema.safeParse(event).success).toBe(true);
  });
});
