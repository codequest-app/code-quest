import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { JsonlReader } from '../reader.ts';

const FIXTURES = join(import.meta.dirname, 'fixtures');
const SESSION_ID = 'b3dbab57-8da8-40c9-86e8-11aadc1881e8';

const jsonlLines = readFileSync(join(FIXTURES, 'b3dbab57.jsonl'), 'utf-8')
  .split('\n')
  .filter(Boolean);

const mysqlAssistant: string[] = JSON.parse(
  readFileSync(join(FIXTURES, 'b3dbab57-assistant-raw-events.json'), 'utf-8'),
);

// synthetic line with isSidechain=true to validate the skip logic
const SIDECHAIN_LINE =
  '{"type":"user","isSidechain":true,"sessionId":"b3dbab57-8da8-40c9-86e8-11aadc1881e8","cwd":"/tmp","timestamp":"2026-01-01T00:00:00.000Z","message":{"role":"user","content":[{"type":"text","text":"sidechain"}]}}';

describe('JsonlReader', () => {
  let events: NonNullable<ReturnType<JsonlReader['readLine']>>[];

  beforeAll(() => {
    const reader = new JsonlReader(SESSION_ID);
    events = jsonlLines.map((l) => reader.readLine(l)).filter((e) => e !== null);
  });

  it('produces assistant events with dir: out', () => {
    const assistants = events.filter((e) => JSON.parse(e.raw).type === 'assistant');
    expect(assistants).toHaveLength(64);
    expect(assistants.every((e) => e.direction === 'out')).toBe(true);
  });

  it('produces user events with dir: out', () => {
    const users = events.filter((e) => JSON.parse(e.raw).type === 'user');
    expect(users).toHaveLength(50);
    expect(users.every((e) => e.direction === 'out')).toBe(true);
  });

  it('assistant message.content matches MySQL raw_events', () => {
    const assistants = events.filter((e) => JSON.parse(e.raw).type === 'assistant');
    assistants.forEach((event, i) => {
      const fromJsonl = JSON.parse(event.raw).message.content;
      const fromMysql = JSON.parse(mysqlAssistant[i]).message.content;
      expect(fromJsonl).toEqual(fromMysql);
    });
  });

  it('skips isSidechain entries', () => {
    const reader = new JsonlReader(SESSION_ID);
    const linesWithSidechain = [...jsonlLines, SIDECHAIN_LINE];
    const result = linesWithSidechain.map((l) => reader.readLine(l)).filter((e) => e !== null);
    expect(result.every((e) => !JSON.parse(e.raw).isSidechain)).toBe(true);
    // sidechain line was present but filtered out
    expect(result.length).toBe(events.length);
  });

  it('sets sessionId on every event', () => {
    expect(events.every((e) => e.sessionId === SESSION_ID)).toBe(true);
  });

  it('sets a positive timestamp on every event', () => {
    expect(events.every((e) => typeof e.timestamp === 'number' && e.timestamp > 0)).toBe(true);
  });
});

describe('JsonlReader.extractSessionRecord', () => {
  it('returns correct sessionId and cwd', () => {
    const reader = new JsonlReader(SESSION_ID);
    const record = reader.extractSessionRecord(jsonlLines);
    expect(record.id).toBe(SESSION_ID);
    expect(record.cwd).toBe('/Users/recca0120/WebstormProjects/cc-office');
  });

  it('returns provider as claude', () => {
    const reader = new JsonlReader(SESSION_ID);
    const record = reader.extractSessionRecord(jsonlLines);
    expect(record.provider).toBe('claude');
  });
});
