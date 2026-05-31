import { randomUUID } from 'node:crypto';
import { readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryWriter } from '../memory.ts';
import { JsonlFileReader } from '../reader.ts';
import { JsonlFileWriter } from '../writer.ts';

const FIXTURES = join(import.meta.dirname, 'fixtures');
const SESSION_ID = 'b3dbab57-8da8-40c9-86e8-11aadc1881e8';
const JSONL_PATH = join(FIXTURES, 'b3dbab57.jsonl');

const jsonlAssistants = readFileSync(JSONL_PATH, 'utf-8')
  .split('\n')
  .filter(Boolean)
  .filter((l) => JSON.parse(l).type === 'assistant');

describe('JsonlFileWriter', () => {
  let outPath: string;

  beforeEach(() => {
    outPath = join(tmpdir(), `jsonl-writer-test-${randomUUID()}.jsonl`);
  });
  afterEach(() => {
    try {
      unlinkSync(outPath);
    } catch {}
  });

  it('writes assistant entries with correct message.content', async () => {
    const data = await new JsonlFileReader(JSONL_PATH).read(SESSION_ID);
    await new JsonlFileWriter(outPath).write(SESSION_ID, data);

    const written = readFileSync(outPath, 'utf-8').split('\n').filter(Boolean);
    const assistants = written.filter((l) => JSON.parse(l).type === 'assistant');
    expect(assistants).toHaveLength(jsonlAssistants.length);
    assistants.forEach((line, i) => {
      const original = jsonlAssistants[i];
      if (!original) throw new Error(`No fixture for index ${i}`);
      expect(JSON.parse(line).message.content).toEqual(JSON.parse(original).message.content);
    });
  });

  it('skips stream_event entries', async () => {
    const data = await new JsonlFileReader(JSONL_PATH).read(SESSION_ID);
    await new JsonlFileWriter(outPath).write(SESSION_ID, data);
    const written = readFileSync(outPath, 'utf-8').split('\n').filter(Boolean);
    expect(written.every((l) => JSON.parse(l).type !== 'stream_event')).toBe(true);
  });
});

describe('MemoryWriter', () => {
  it('stores written data accessible via .data', async () => {
    const source = await new JsonlFileReader(JSONL_PATH).read(SESSION_ID);
    const writer = new MemoryWriter();
    await writer.write(SESSION_ID, source);
    const stored = writer.data.get(SESSION_ID);
    expect(stored?.events).toHaveLength(source.events.length);
    expect(stored?.record.id).toBe(SESSION_ID);
  });
});
