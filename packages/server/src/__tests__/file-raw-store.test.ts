import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { RawEntry } from '@code-quest/summoner';
import { segments as s } from '@code-quest/summoner/test';
import { FileRawStore } from '../services/file-raw-store.ts';

describe('FileRawStore', () => {
  let dir: string;
  let store: FileRawStore;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'file-raw-store-'));
    store = new FileRawStore(dir);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('appends and retrieves raw events', async () => {
    const entry: RawEntry = {
      timestamp: Date.now(),
      sessionId: 'sess-1',
      promptId: 'prompt-1',
      direction: 'out',
      raw: s.assistant('hello'),
      seq: 0,
    };

    await store.append(entry);
    const results = await store.getBySession('sess-1');

    expect(results).toHaveLength(1);
    expect(results[0].sessionId).toBe('sess-1');
    expect(results[0].direction).toBe('out');
    expect(results[0].raw).toBe(entry.raw);
    expect(results[0].promptId).toBe('prompt-1');
  });

  it('returns empty array for unknown session', async () => {
    const results = await store.getBySession('nonexistent');
    expect(results).toEqual([]);
  });

  it('appends multiple events for same session', async () => {
    for (let i = 0; i < 3; i++) {
      await store.append({
        timestamp: Date.now() + i,
        sessionId: 'sess-2',
        promptId: `prompt-${i}`,
        direction: 'out',
        raw: `line ${i}`,
        seq: i,
      });
    }

    const results = await store.getBySession('sess-2');
    expect(results).toHaveLength(3);
  });

  it('rejects sessionId with path traversal', async () => {
    await expect(
      store.append({
        timestamp: Date.now(),
        sessionId: '../etc/passwd',
        promptId: 'prompt-0',
        direction: 'out',
        raw: 'malicious',
        seq: 0,
      }),
    ).rejects.toThrow();
  });

  it('rejects sessionId with slashes', async () => {
    await expect(
      store.append({
        timestamp: Date.now(),
        sessionId: 'foo/bar',
        promptId: 'prompt-0',
        direction: 'out',
        raw: 'malicious',
        seq: 0,
      }),
    ).rejects.toThrow();
  });

  it('rejects getBySession with path traversal', async () => {
    await expect(store.getBySession('../etc/passwd')).rejects.toThrow();
  });

  it('creates directory if it does not exist', async () => {
    const nestedDir = join(dir, 'nested', 'deep');
    const nestedStore = new FileRawStore(nestedDir);

    await nestedStore.append({
      timestamp: Date.now(),
      sessionId: 'sess-3',
      promptId: 'prompt-0',
      direction: 'in',
      raw: 'test',
      seq: 0,
    });

    const results = await nestedStore.getBySession('sess-3');
    expect(results).toHaveLength(1);
  });

  describe('getPreview', () => {
    it('returns last assistant text', async () => {
      await store.append({
        timestamp: Date.now(),
        sessionId: 'sess-prev',
        promptId: 'p1',
        direction: 'out',
        raw: s.assistant('Looking...'),
        seq: 0,
      });
      await store.append({
        timestamp: Date.now() + 1,
        sessionId: 'sess-prev',
        promptId: 'p1',
        direction: 'out',
        raw: s.assistant('Done fixing'),
        seq: 1,
      });

      const preview = await store.getPreview('sess-prev');
      expect(preview.lastAssistant).toBe('Done fixing');
    });

    it('returns empty for nonexistent session', async () => {
      const preview = await store.getPreview('nope');
      expect(preview.lastAssistant).toBeUndefined();
    });
  });
});
