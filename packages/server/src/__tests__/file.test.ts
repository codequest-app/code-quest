/* biome-ignore-all lint/suspicious/noExplicitAny: test file uses type assertions */
import { segments as s } from '@code-quest/summoner/test';
import * as rg from '../socket/utils/rg.ts';
import { createFakeClaude } from '../test/index.ts';

async function setup(sessionId = 'cli-sess') {
  const claude = createFakeClaude();
  const channelId = await claude.initialize(s.init(sessionId));
  return { claude, channelId };
}

describe('ChatHandler > file', () => {
  describe('file:list', () => {
    // biome-ignore lint/suspicious/noExplicitAny: vi.spyOn generic inference
    let rgListFilesSpy: any;
    const origRgAvailable = rg.rgAvailable;

    beforeEach(() => {
      rgListFilesSpy = vi.spyOn(rg, 'rgListFiles');
    });

    afterEach(() => {
      rg.setRgAvailable(origRgAvailable);
      rgListFilesSpy.mockRestore();
    });

    it('uses rg when available and returns matching files', async () => {
      rg.setRgAvailable(true);
      rgListFilesSpy.mockReturnValue([
        'src/socket/chat-handler.ts',
        'src/__tests__/chat-handler.test.ts',
        'src/services/session-manager.ts',
      ]);

      const { claude, channelId } = await setup();

      const result = await claude.send<{
        files: Array<{ path: string; name: string; type: string }>;
      }>('file:list', { channelId, pattern: 'chat-handler' });

      expect(rgListFilesSpy).toHaveBeenCalled();
      expect(result.files.length).toBe(2);
      expect(result.files.every((f) => f.path.includes('chat-handler'))).toBe(true);
    });

    it('limits results to 20 entries', async () => {
      rg.setRgAvailable(true);
      const manyFiles = Array.from({ length: 30 }, (_, i) => `src/file-${i}.ts`);
      rgListFilesSpy.mockReturnValue(manyFiles);

      const { claude, channelId } = await setup();

      const result = await claude.send<{
        files: Array<{ path: string; name: string; type: string }>;
      }>('file:list', { channelId, pattern: 'file' });

      expect(result.files.length).toBe(20);
    });

    it('falls back to walk when rg is not available', async () => {
      rg.setRgAvailable(false);

      const { claude, channelId } = await setup();

      const result = await claude.send<{
        files: Array<{ path: string; name: string; type: string }>;
      }>('file:list', { channelId, pattern: 'session-connect' });

      expect(rgListFilesSpy).not.toHaveBeenCalled();
      expect(result.files.length).toBeGreaterThan(0);
      expect(result.files.some((f) => f.name.includes('session-connect'))).toBe(true);
    });

    it('returns empty array for no matches', async () => {
      rg.setRgAvailable(true);
      rgListFilesSpy.mockReturnValue(['src/app.ts', 'src/main.ts']);

      const { claude, channelId } = await setup();

      const result = await claude.send<{
        files: Array<{ path: string; name: string; type: string }>;
      }>('file:list', { channelId, pattern: 'xyznonexistent999' });

      expect(result.files).toEqual([]);
    });

    it('returns terminal results for matching active sessions', async () => {
      rg.setRgAvailable(true);
      rgListFilesSpy.mockReturnValue([]);

      const { claude, channelId } = await setup();

      const pattern = channelId.slice(0, 8);
      const result = await claude.send<{
        files: Array<{ path: string; name: string; type: string }>;
      }>('file:list', { channelId, pattern });

      expect(result.files.some((f) => f.type === 'terminal')).toBe(true);
      const terminal = result.files.find((f) => f.type === 'terminal')!;
      expect(terminal.path).toBe(channelId);
      expect(terminal.name).toBe(channelId);
    });

    it('merges terminal results with file results', async () => {
      rg.setRgAvailable(true);

      const { claude, channelId } = await setup();

      const prefix = channelId.slice(0, 4);
      rgListFilesSpy.mockReturnValue([`src/${prefix}-utils.ts`]);

      const result = await claude.send<{
        files: Array<{ path: string; name: string; type: string }>;
      }>('file:list', { channelId, pattern: prefix });

      const fileResults = result.files.filter((f) => f.type === 'file');
      const terminalResults = result.files.filter((f) => f.type === 'terminal');
      expect(fileResults.length).toBeGreaterThan(0);
      expect(terminalResults.length).toBeGreaterThan(0);
    });

    it('caps combined file and terminal results at 20', async () => {
      rg.setRgAvailable(true);
      const manyFiles = Array.from({ length: 25 }, (_, i) => `src/match-${i}.ts`);
      rgListFilesSpy.mockReturnValue(manyFiles);

      const { claude, channelId } = await setup();

      const result = await claude.send<{
        files: Array<{ path: string; name: string; type: string }>;
      }>('file:list', { channelId, pattern: 'match' });

      expect(result.files.length).toBe(20);
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
