import type { ListFilesResponse } from '@code-quest/shared';
import { segments as s } from '@code-quest/summoner/test';
import { createFakeSummoner } from '../test/index.ts';

type ListFilesOk = Extract<ListFilesResponse, { ok: true }>;

async function setup(sessionId = 'cli-sess') {
  const summoner = createFakeSummoner();
  summoner.filesystem().setRoots(['/app']);
  summoner.filesystem().addDirectory('/app', ['src', 'node_modules']);
  summoner.filesystem().addDirectory('/app/src', ['utils']);
  summoner.filesystem().addFile('/app/package.json', '{"name":"test-app"}');
  summoner.filesystem().addFile('/app/src/index.ts', 'export {}');
  summoner.filesystem().addFile('/app/session-connect.ts', 'export const x = 1;');
  summoner.filesystem().addFile('/app/src/utils/helpers.ts', 'export function help() {}');

  const claude = summoner.claude();
  const channelId = await claude.initialize({ launch: { cwd: '/app' } }, s.init(sessionId));
  return { claude, channelId };
}

describe('ChatHandler > file', () => {
  describe('file:list', () => {
    it('empty pattern returns root-level entries (directories + files)', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send<ListFilesOk>('file:list', { channelId, pattern: '' });

      expect(result.data.files.some((f) => f.type === 'directory')).toBe(true);
      expect(result.data.files.some((f) => f.type === 'file')).toBe(true);
    });

    it('pattern with trailing slash lists directory contents', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send<ListFilesOk>('file:list', { channelId, pattern: 'src/' });

      expect(result.data.files.length).toBeGreaterThan(0);
      expect(result.data.files.every((f) => f.path.startsWith('src/'))).toBe(true);
    });

    it('pattern without slash does fuzzy search', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send<ListFilesOk>('file:list', {
        channelId,
        pattern: 'session-connect',
      });

      expect(result.data.files.length).toBeGreaterThan(0);
      expect(result.data.files.some((f) => f.name.includes('session-connect'))).toBe(true);
    });

    it('does not return terminal results (terminal mention is separate)', async () => {
      const { claude, channelId } = await setup();

      const pattern = channelId.slice(0, 8);
      const result = await claude.send<ListFilesOk>('file:list', { channelId, pattern });

      expect(result.data.files.every((f) => (f.type as string) !== 'terminal')).toBe(true);
    });

    it('limits results to 20 entries', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send<ListFilesOk>('file:list', { channelId, pattern: '' });

      expect(result.data.files.length).toBeLessThanOrEqual(20);
    });

    it('returns empty for no matches', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send<ListFilesOk>('file:list', {
        channelId,
        pattern: 'xyznonexistent999',
      });

      expect(result.data.files).toEqual([]);
    });
  });

  describe('file:read', () => {
    it('reads a file within session cwd', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'hi' });
      await claude.emit(s.result());

      const result = await claude.send<{ content?: string; error?: string }>('file:read', {
        channelId,
        filePath: 'package.json',
      });

      expect(result.content).toBeDefined();
      expect(JSON.parse(result.content!).name).toBe('test-app');
    });

    it('blocks path traversal', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'hi' });
      await claude.emit(s.result());

      const result = await claude.send<{ content?: string; error?: string }>('file:read', {
        channelId,
        filePath: '../../../etc/passwd',
      });

      expect(result.error).toBe('Path traversal not allowed');
      expect(result.content).toBeUndefined();
    });

    it('returns error for non-existent file', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'hi' });
      await claude.emit(s.result());

      const result = await claude.send<{ content?: string; error?: string }>('file:read', {
        channelId,
        filePath: 'nonexistent-file.xyz',
      });

      expect(result.error).toContain('File not found');
    });

    it('returns error for invalid session', async () => {
      const { claude } = await setup();

      const result = await claude.send<{ content?: string; error?: string }>('file:read', {
        channelId: 'invalid-session',
        filePath: 'package.json',
      });

      expect(result.error).toBe('Session not found');
    });
  });
});
