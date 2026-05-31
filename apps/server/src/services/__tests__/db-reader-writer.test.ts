import { join } from 'node:path';
import { JsonlFileReader, MemoryWriter } from '@code-quest/jsonl-codec';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTestContainer } from '../../test/create-test-container.ts';
import { TYPES } from '../../types.ts';
import { DbReader } from '../db-reader.ts';
import { DbWriter } from '../db-writer.ts';
import type { RawEventService } from '../raw-event-service.ts';
import type { SessionStore } from '../session-store.ts';

const FIXTURES = join(import.meta.dirname, 'fixtures');
const SESSION_ID = 'b3dbab57-8da8-40c9-86e8-11aadc1881e8';
const JSONL_PATH = join(FIXTURES, 'b3dbab57.jsonl');

describe('DbWriter', () => {
  let rawEventService: RawEventService;
  let sessionStore: SessionStore;

  beforeEach(() => {
    const container = createTestContainer();
    rawEventService = container.get<RawEventService>(TYPES.RawEventService);
    sessionStore = container.get<SessionStore>(TYPES.SessionStore);
  });

  it('writes session record and events to DB', async () => {
    const data = await new JsonlFileReader(JSONL_PATH).read(SESSION_ID);
    const writer = new DbWriter(rawEventService, sessionStore);
    await writer.write(SESSION_ID, data);

    const session = await sessionStore.getById(SESSION_ID);
    expect(session?.id).toBe(SESSION_ID);
    expect(session?.cwd).toBe('/Users/recca0120/WebstormProjects/cc-office');

    const events = await rawEventService.getBySession(SESSION_ID);
    expect(events.length).toBe(data.events.length);
  });

  it('skip guard: does not re-write if already in DB', async () => {
    const data = await new JsonlFileReader(JSONL_PATH).read(SESSION_ID);
    const writer = new DbWriter(rawEventService, sessionStore);
    await writer.write(SESSION_ID, data);
    const countFirst = (await rawEventService.getBySession(SESSION_ID)).length;
    expect(countFirst).toBeGreaterThan(0);

    await writer.write(SESSION_ID, data);
    const countSecond = (await rawEventService.getBySession(SESSION_ID)).length;
    expect(countSecond).toBe(countFirst);
  });
});

describe('DbReader', () => {
  let rawEventService: RawEventService;
  let sessionStore: SessionStore;

  beforeEach(async () => {
    const container = createTestContainer();
    rawEventService = container.get<RawEventService>(TYPES.RawEventService);
    sessionStore = container.get<SessionStore>(TYPES.SessionStore);

    const data = await new JsonlFileReader(JSONL_PATH).read(SESSION_ID);
    await new DbWriter(rawEventService, sessionStore).write(SESSION_ID, data);
  });

  it('reads back the same events that were written', async () => {
    const reader = new DbReader(rawEventService, sessionStore);
    const { events, record } = await reader.read(SESSION_ID);
    expect(record.id).toBe(SESSION_ID);
    expect(events.length).toBeGreaterThan(0);
  });

  it('round-trips: write to DB → read from DB → write to Memory', async () => {
    const reader = new DbReader(rawEventService, sessionStore);
    const data = await reader.read(SESSION_ID);
    const sink = new MemoryWriter();
    await sink.write(SESSION_ID, data);
    expect(sink.data.get(SESSION_ID)?.record.id).toBe(SESSION_ID);
  });
});
