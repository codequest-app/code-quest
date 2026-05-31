import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTestContainer } from '../../test/create-test-container.ts';
import { TYPES } from '../../types.ts';
import { JsonlImporter } from '../jsonl-importer.ts';
import type { RawEventService } from '../raw-event-service.ts';
import type { SessionStore } from '../session-store.ts';

const FIXTURES = join(import.meta.dirname, 'fixtures');
const SESSION_ID = 'b3dbab57-8da8-40c9-86e8-11aadc1881e8';
const JSONL_PATH = join(FIXTURES, 'b3dbab57.jsonl');

describe('JsonlImporter', () => {
  let importer: JsonlImporter;
  let rawEventService: RawEventService;
  let sessionStore: SessionStore;

  beforeEach(() => {
    const container = createTestContainer();
    rawEventService = container.get<RawEventService>(TYPES.RawEventService);
    sessionStore = container.get<SessionStore>(TYPES.SessionStore);
    importer = new JsonlImporter(rawEventService, sessionStore);
  });

  it('imports correct number of assistant events', async () => {
    await importer.importFile(JSONL_PATH);
    const events = await rawEventService.getBySession(SESSION_ID);
    const assistants = events.filter((e) => JSON.parse(e.raw).type === 'assistant');
    expect(assistants).toHaveLength(64);
  });

  it('creates session record with correct sessionId and cwd', async () => {
    await importer.importFile(JSONL_PATH);
    const session = await sessionStore.getById(SESSION_ID);
    expect(session?.id).toBe(SESSION_ID);
    expect(session?.cwd).toBe('/Users/recca0120/WebstormProjects/cc-office');
    expect(session?.provider).toBe('claude');
  });

  it('skip guard: does not re-import if raw_events already exist', async () => {
    await importer.importFile(JSONL_PATH);
    const countAfterFirst = (await rawEventService.getBySession(SESSION_ID)).length;
    expect(countAfterFirst).toBeGreaterThan(0); // guard: first import must succeed

    await importer.importFile(JSONL_PATH);
    const countAfterSecond = (await rawEventService.getBySession(SESSION_ID)).length;
    expect(countAfterSecond).toBe(countAfterFirst);
  });
});
