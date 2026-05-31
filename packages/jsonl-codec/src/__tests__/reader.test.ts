import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MemoryReader } from '../memory.ts';
import { JsonlFileReader } from '../reader.ts';

const FIXTURES = join(import.meta.dirname, 'fixtures');
const SESSION_ID = 'b3dbab57-8da8-40c9-86e8-11aadc1881e8';
const JSONL_PATH = join(FIXTURES, 'b3dbab57.jsonl');

const mysqlAssistant: string[] = JSON.parse(
  readFileSync(join(FIXTURES, 'b3dbab57-assistant-raw-events.json'), 'utf-8'),
);

describe('JsonlFileReader', () => {
  it('reads assistant events from JSONL file', async () => {
    const reader = new JsonlFileReader(JSONL_PATH);
    const { events } = await reader.read(SESSION_ID);
    const assistants = events.filter((e) => JSON.parse(e.raw).type === 'assistant');
    expect(assistants).toHaveLength(64);
  });

  it('assistant message.content matches MySQL raw_events', async () => {
    const reader = new JsonlFileReader(JSONL_PATH);
    const { events } = await reader.read(SESSION_ID);
    const assistants = events.filter((e) => JSON.parse(e.raw).type === 'assistant');

    assistants.forEach((event, i) => {
      const original = mysqlAssistant[i];
      if (!original) throw new Error(`No fixture for index ${i}`);
      expect(JSON.parse(event.raw).message.content).toEqual(JSON.parse(original).message.content);
    });
  });

  it('returns session record with correct id and cwd', async () => {
    const reader = new JsonlFileReader(JSONL_PATH);
    const { record } = await reader.read(SESSION_ID);
    expect(record.id).toBe(SESSION_ID);
    expect(record.cwd).toBe('/Users/recca0120/WebstormProjects/cc-office');
  });
});

describe('MemoryReader', () => {
  it('returns empty data for unknown sessionId', async () => {
    const reader = new MemoryReader(new Map());
    const { events } = await reader.read('unknown');
    expect(events).toHaveLength(0);
  });

  it('round-trips with MemoryWriter', async () => {
    const source = new JsonlFileReader(JSONL_PATH);
    const { events, record } = await source.read(SESSION_ID);

    const memory = new Map([[SESSION_ID, { events, record }]]);
    const reader = new MemoryReader(memory);
    const result = await reader.read(SESSION_ID);
    expect(result.events).toHaveLength(events.length);
    expect(result.record.id).toBe(SESSION_ID);
  });
});
