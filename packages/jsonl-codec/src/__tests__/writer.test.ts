import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RawEvent } from '@code-quest/summoner';
import { describe, expect, it } from 'vitest';
import { JsonlWriter } from '../writer.ts';

const FIXTURES = join(import.meta.dirname, 'fixtures');
const SESSION_ID = 'b3dbab57-8da8-40c9-86e8-11aadc1881e8';

const rawEvents: Array<{ dir: string; raw: string }> = JSON.parse(
  readFileSync(join(FIXTURES, 'b3dbab57-raw-events.json'), 'utf-8'),
);

const jsonlLines = readFileSync(join(FIXTURES, 'b3dbab57.jsonl'), 'utf-8')
  .split('\n')
  .filter(Boolean);

function toRawEvent(row: { dir: string; raw: string }): RawEvent {
  return {
    sessionId: SESSION_ID,
    direction: row.dir as 'in' | 'out' | 'err',
    raw: row.raw,
    timestamp: 0,
  };
}

function writeAll(events: RawEvent[]): string[] {
  const writer = new JsonlWriter();
  return events.map((e) => writer.writeLine(e)).filter((l): l is string => l !== null);
}

describe('JsonlWriter', () => {
  it('skips stream_event entries', () => {
    const lines = writeAll(rawEvents.map(toRawEvent));
    expect(lines.every((l) => JSON.parse(l).type !== 'stream_event')).toBe(true);
  });

  it('skips control_request and control_response', () => {
    const lines = writeAll(rawEvents.map(toRawEvent));
    const types = lines.map((l) => JSON.parse(l).type);
    expect(types).not.toContain('control_request');
    expect(types).not.toContain('control_response');
  });

  it('skips dir:out user echo (text content) but keeps tool_result user', () => {
    const lines = writeAll(rawEvents.map(toRawEvent));
    const userLines = lines.filter((l) => JSON.parse(l).type === 'user');
    // 5 human (dir:in text) + 45 tool_result (dir:out) = 50
    expect(userLines).toHaveLength(50);
    // no dir:out text user (echoes)
    const echos = rawEvents.filter((r) => {
      if (r.dir !== 'out') return false;
      const d = JSON.parse(r.raw);
      if (d.type !== 'user') return false;
      const content = d.message?.content;
      return Array.isArray(content) && content[0]?.type === 'text';
    });
    for (const echo of echos) {
      expect(lines).not.toContain(echo.raw);
    }
  });

  it('includes assistant entries', () => {
    const lines = writeAll(rawEvents.map(toRawEvent));
    const assistants = lines.filter((l) => JSON.parse(l).type === 'assistant');
    expect(assistants).toHaveLength(64);
  });

  it('assistant message.content matches original JSONL', () => {
    const lines = writeAll(rawEvents.map(toRawEvent));
    const writtenAssistants = lines.filter((l) => JSON.parse(l).type === 'assistant');
    const jsonlAssistants = jsonlLines.filter((l) => JSON.parse(l).type === 'assistant');

    writtenAssistants.forEach((line, i) => {
      const written = JSON.parse(line).message.content;
      const original = JSON.parse(jsonlAssistants[i]).message.content;
      expect(written).toEqual(original);
    });
  });
});
