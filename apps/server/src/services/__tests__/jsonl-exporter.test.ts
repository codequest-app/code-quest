import { randomUUID } from 'node:crypto';
import { readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestContainer } from '../../test/create-test-container.ts';
import { TYPES } from '../../types.ts';
import { exportSession } from '../jsonl-exporter.ts';
import type { RawEventService } from '../raw-event-service.ts';
import type { SessionStore } from '../session-store.ts';

const FIXTURES = join(import.meta.dirname, 'fixtures');
const SESSION_ID = 'b3dbab57-8da8-40c9-86e8-11aadc1881e8';
const CWD = '/Users/recca0120/WebstormProjects/cc-office';

const rawEvents: Array<{ dir: string; raw: string }> = JSON.parse(
  readFileSync(join(FIXTURES, 'b3dbab57-raw-events.json'), 'utf-8'),
);

describe('exportSession', () => {
  let rawEventService: RawEventService;
  let sessionStore: SessionStore;
  let OUT_PATH: string;

  beforeEach(async () => {
    OUT_PATH = join(tmpdir(), `jsonl-exporter-test-${randomUUID()}.jsonl`);
    const container = createTestContainer();
    rawEventService = container.get<RawEventService>(TYPES.RawEventService);
    sessionStore = container.get<SessionStore>(TYPES.SessionStore);

    await sessionStore.upsert({
      id: SESSION_ID,
      channelId: SESSION_ID,
      provider: 'claude',
      command: 'claude',
      args: '[]',
      cwd: CWD,
      projectRoot: CWD,
      mode: 'interactive',
      role: 'chat',
      createdAt: '2026-05-14T04:24:52.507Z',
    });
    for (const row of rawEvents) {
      await rawEventService.appendEvent({
        sessionId: SESSION_ID,
        direction: row.dir as 'in' | 'out' | 'err',
        raw: row.raw,
        timestamp: 0,
      });
    }
  });

  afterEach(() => {
    try {
      unlinkSync(OUT_PATH);
    } catch {
      /* ok if not created */
    }
  });

  it('exported entries carry camelCase sessionId', async () => {
    await exportSession(SESSION_ID, OUT_PATH, rawEventService, sessionStore);
    const lines = readFileSync(OUT_PATH, 'utf-8').split('\n').filter(Boolean);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.every((l) => JSON.parse(l).sessionId === SESSION_ID)).toBe(true);
  });

  it('exported entries carry cwd from session record', async () => {
    await exportSession(SESSION_ID, OUT_PATH, rawEventService, sessionStore);
    const lines = readFileSync(OUT_PATH, 'utf-8').split('\n').filter(Boolean);
    expect(lines.every((l) => JSON.parse(l).cwd === CWD)).toBe(true);
  });
});
