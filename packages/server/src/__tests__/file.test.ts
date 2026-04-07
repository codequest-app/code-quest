/* biome-ignore-all lint/suspicious/noExplicitAny: test file uses type assertions */
import { segments as s } from '@code-quest/summoner/test';
import { createFakeClaude } from '../test/index.ts';

async function setup(sessionId = 'cli-sess') {
  const claude = createFakeClaude();
  const channelId = await claude.initialize(s.init(sessionId));
  return { claude, channelId };
}

describe('ChatHandler > file', () => {
  describe('file:list', () => {
    it('empty pattern returns root-level entries (directories + files)', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send<{
        files: Array<{ path: string; name: string; type: string }>;
      }>('file:list', { channelId, pattern: '' });

      const nonTerminal = result.files.filter((f) => f.type !== 'terminal');
      // Should have directories like src/ and root files like package.json
      expect(nonTerminal.some((f) => f.type === 'directory')).toBe(true);
      expect(nonTerminal.some((f) => f.type === 'file')).toBe(true);
      // Root entries should not contain deep paths
      expect(nonTerminal.every((f) => !f.path.includes('/') || f.path.endsWith('/'))).toBe(true);
    });

    it('pattern with trailing slash lists directory contents', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send<{
        files: Array<{ path: string; name: string; type: string }>;
      }>('file:list', { channelId, pattern: 'src/' });

      const nonTerminal = result.files.filter((f) => f.type !== 'terminal');
      expect(nonTerminal.length).toBeGreaterThan(0);
      // All results should start with src/
      expect(nonTerminal.every((f) => f.path.startsWith('src/'))).toBe(true);
      // Should be one level deep only (src/xxx or src/xxx/)
      for (const f of nonTerminal) {
        const rest = f.path.slice('src/'.length);
        const stripped = rest.endsWith('/') ? rest.slice(0, -1) : rest;
        expect(stripped.includes('/')).toBe(false);
      }
    });

    it('pattern without slash does fuzzy search', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send<{
        files: Array<{ path: string; name: string; type: string }>;
      }>('file:list', { channelId, pattern: 'session-connect' });

      expect(result.files.length).toBeGreaterThan(0);
      expect(
        result.files.some(
          (f) => f.path.includes('session-connect') || f.name.includes('session-connect'),
        ),
      ).toBe(true);
    });

    it('does not return terminal results (terminal mention is separate)', async () => {
      const { claude, channelId } = await setup();

      const pattern = channelId.slice(0, 8);
      const result = await claude.send<{
        files: Array<{ path: string; name: string; type: string }>;
      }>('file:list', { channelId, pattern });

      expect(result.files.every((f) => f.type !== 'terminal')).toBe(true);
    });

    it('limits results to 20 entries', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send<{
        files: Array<{ path: string; name: string; type: string }>;
      }>('file:list', { channelId, pattern: '' });

      expect(result.files.length).toBeLessThanOrEqual(20);
    });

    it('returns empty for no matches', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send<{
        files: Array<{ path: string; name: string; type: string }>;
      }>('file:list', { channelId, pattern: 'xyznonexistent999' });

      expect(result.files.filter((f) => f.type !== 'terminal')).toEqual([]);
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
      expect(JSON.parse(result.content!).name).toBeDefined();
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
