/* biome-ignore-all lint/suspicious/noExplicitAny: test file uses type assertions */
import { segments as s } from '@code-quest/summoner/test';
import * as helpers from '../socket/handlers/helpers.ts';
import { createFakeClaude } from '../test/index.ts';
import { TYPES } from '../types.ts';

async function setup(sessionId = 'cli-sess') {
  const claude = createFakeClaude();
  const channelId = await claude.initialize(s.init(sessionId));
  return { claude, channelId };
}

describe('ChatHandler > misc', () => {
  describe('list_files_request', () => {
    // biome-ignore lint/suspicious/noExplicitAny: vi.spyOn generic inference
    let rgListFilesSpy: any;
    const origRgAvailable = helpers.rgAvailable;

    beforeEach(() => {
      rgListFilesSpy = vi.spyOn(helpers, 'rgListFiles');
    });

    afterEach(() => {
      helpers.setRgAvailable(origRgAvailable);
      rgListFilesSpy.mockRestore();
    });

    it('uses rg when available and returns matching files', async () => {
      helpers.setRgAvailable(true);
      rgListFilesSpy.mockReturnValue([
        'src/socket/chat-handler.ts',
        'src/__tests__/chat-handler.test.ts',
        'src/services/session-manager.ts',
      ]);

      const { claude, channelId } = await setup();

      const result = await claude.send<{
        files: Array<{ path: string; name: string; type: string }>;
      }>('list_files_request', { channelId, pattern: 'chat-handler' });

      expect(rgListFilesSpy).toHaveBeenCalled();
      expect(result.files.length).toBe(2);
      expect(result.files.every((f) => f.path.includes('chat-handler'))).toBe(true);
    });

    it('limits results to 20 entries', async () => {
      helpers.setRgAvailable(true);
      const manyFiles = Array.from({ length: 30 }, (_, i) => `src/file-${i}.ts`);
      rgListFilesSpy.mockReturnValue(manyFiles);

      const { claude, channelId } = await setup();

      const result = await claude.send<{
        files: Array<{ path: string; name: string; type: string }>;
      }>('list_files_request', { channelId, pattern: 'file' });

      expect(result.files.length).toBe(20);
    });

    it('falls back to walk when rg is not available', async () => {
      helpers.setRgAvailable(false);

      const { claude, channelId } = await setup();

      const result = await claude.send<{
        files: Array<{ path: string; name: string; type: string }>;
      }>('list_files_request', { channelId, pattern: 'chat-handler' });

      expect(rgListFilesSpy).not.toHaveBeenCalled();
      expect(result.files.length).toBeGreaterThan(0);
      expect(result.files.some((f) => f.name.includes('chat-handler'))).toBe(true);
    });

    it('returns empty array for no matches', async () => {
      helpers.setRgAvailable(true);
      rgListFilesSpy.mockReturnValue(['src/app.ts', 'src/main.ts']);

      const { claude, channelId } = await setup();

      const result = await claude.send<{
        files: Array<{ path: string; name: string; type: string }>;
      }>('list_files_request', { channelId, pattern: 'xyznonexistent999' });

      expect(result.files).toEqual([]);
    });

    it('returns terminal results for matching active sessions', async () => {
      helpers.setRgAvailable(true);
      rgListFilesSpy.mockReturnValue([]);

      const { claude, channelId } = await setup();

      const pattern = channelId.slice(0, 8);
      const result = await claude.send<{
        files: Array<{ path: string; name: string; type: string }>;
      }>('list_files_request', { channelId, pattern });

      expect(result.files.some((f) => f.type === 'terminal')).toBe(true);
      const terminal = result.files.find((f) => f.type === 'terminal')!;
      expect(terminal.path).toBe(channelId);
      expect(terminal.name).toBe(channelId);
    });

    it('merges terminal results with file results', async () => {
      helpers.setRgAvailable(true);

      const { claude, channelId } = await setup();

      const prefix = channelId.slice(0, 4);
      rgListFilesSpy.mockReturnValue([`src/${prefix}-utils.ts`]);

      const result = await claude.send<{
        files: Array<{ path: string; name: string; type: string }>;
      }>('list_files_request', { channelId, pattern: prefix });

      const fileResults = result.files.filter((f) => f.type === 'file');
      const terminalResults = result.files.filter((f) => f.type === 'terminal');
      expect(fileResults.length).toBeGreaterThan(0);
      expect(terminalResults.length).toBeGreaterThan(0);
    });

    it('caps combined file and terminal results at 20', async () => {
      helpers.setRgAvailable(true);
      const manyFiles = Array.from({ length: 25 }, (_, i) => `src/match-${i}.ts`);
      rgListFilesSpy.mockReturnValue(manyFiles);

      const { claude, channelId } = await setup();

      const result = await claude.send<{
        files: Array<{ path: string; name: string; type: string }>;
      }>('list_files_request', { channelId, pattern: 'match' });

      expect(result.files.length).toBe(20);
    });
  });

  describe('usage tracking', () => {
    it('does NOT emit usage_update when rate_limit_event is received', async () => {
      const { claude, channelId } = await setup();
      const usageUpdates: any[] = [];
      claude.socket.on('request', (payload: any) => {
        if (payload.request?.type === 'usage_update') usageUpdates.push(payload.request);
      });

      await claude.send('chat:send', { channelId, message: 'hello' });
      await claude.emit(s.assistant('hi'));
      await claude.emit(
        s.rateLimitEvent({
          status: 'blocked',
          rateLimitType: 'five_hour',
          resetsAt: 1772319600,
        }),
      );
      await claude.emit(s.result());

      expect(usageUpdates.length).toBe(0);
    });

    it('responds to request_usage_update with current usage', async () => {
      const { claude, channelId } = await setup();
      const usageUpdates: any[] = [];
      claude.socket.on('state:usage' as any, (payload: any) => {
        usageUpdates.push(payload);
      });

      await claude.send('chat:send', { channelId, message: 'hello' });
      await claude.emit(s.assistant('hi'));
      await claude.emit(s.rateLimitEvent({ status: 'allowed', rateLimitType: 'five_hour' }));
      await claude.emit(s.result());

      usageUpdates.length = 0;

      await claude.send('request_usage_update', { channelId });

      expect(usageUpdates.length).toBe(1);
      expect(usageUpdates[0]).not.toHaveProperty('sessionId');
      expect((usageUpdates[0] as any).usage).toMatchObject({
        five_hour: { utilization: 0 },
      });
    });

    it('request_usage_update includes context usage from CLI', async () => {
      const { claude, channelId } = await setup();

      claude.onControlRequest((req) => {
        if (req.subtype === 'get_context_usage') {
          return { input_tokens: 50000, output_tokens: 5000, context_window: 200000 };
        }
        return null;
      });

      const usageUpdates: any[] = [];
      claude.socket.on('state:usage' as any, (payload: any) => {
        usageUpdates.push(payload);
      });

      await claude.send('request_usage_update', { channelId });

      expect(usageUpdates.length).toBe(1);
      expect((usageUpdates[0] as any).contextUsage).toMatchObject({
        inputTokens: 50000,
        outputTokens: 5000,
        contextWindow: 200000,
      });
    });
  });

  describe('auth handlers', () => {
    it('auth:status returns unauthenticated by default', async () => {
      const { claude } = await setup();

      const status = await claude.send<{ authenticated: boolean }>('get_auth_status');

      expect(status.authenticated).toBe(false);
    });

    it('auth:login sends claude_authenticate to CLI and returns auth URL', async () => {
      const { claude } = await setup();

      claude.onControlRequest((req) => {
        if (req.subtype === 'claude_authenticate') {
          return {
            manualUrl: 'https://auth.example.com/manual',
            automaticUrl: 'https://auth.example.com/auto',
          };
        }
        return null;
      });

      const result = await claude.send<{ success: boolean; auth?: { response?: { manualUrl?: string } } }>(
        'login',
        { method: 'oauth' },
      );
      expect(result.success).toBe(true);
    });

    it('auth:login fails when no active session', async () => {
      const claude = createFakeClaude();
      // Don't initialize — no active channel

      const result = await claude.send<{ success: boolean; error?: string }>('login', {
        method: 'oauth',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('No active session');
    });

    it('auth:oauth_code sends claude_oauth_callback to CLI', async () => {
      const { claude } = await setup();

      const result = await claude.send<{ success: boolean }>('submit_oauth_code', {
        code: 'test-code',
        state: 'test-state',
      });
      expect(result.success).toBe(true);

      const status = await claude.send<{
        authenticated: boolean;
        user?: { name: string };
        method?: string;
      }>('get_auth_status');

      expect(status.authenticated).toBe(true);
      expect(status.user?.name).toBe('oauth-user');
      expect(status.method).toBe('oauth');
    });
  });

  describe('plugin handlers', () => {
    let runPluginSpy: any;

    beforeEach(() => {
      runPluginSpy = vi.spyOn(helpers, 'runPluginCommand');
    });

    afterEach(() => {
      runPluginSpy.mockRestore();
    });

    it('plugin:list parses JSON stdout from CLI', async () => {
      runPluginSpy.mockReturnValue({
        ok: true,
        stdout: '[{"id":"p1","name":"Test Plugin","enabled":true}]',
        stderr: '',
      });

      const { claude } = await setup();

      const result = await claude.send<{ installed: unknown[]; available: unknown[] }>(
        'list_plugins',
        {},
      );

      expect(runPluginSpy).toHaveBeenCalledWith(['list', '--json']);
      expect(result.installed).toEqual([{ id: 'p1', name: 'Test Plugin', enabled: true }]);
    });

    it('plugin:list returns empty array when CLI fails', async () => {
      runPluginSpy.mockReturnValue({ ok: false, stdout: '', stderr: 'not found' });

      const { claude } = await setup();

      const result = await claude.send<{ installed: unknown[]; available: unknown[] }>(
        'list_plugins',
        {},
      );

      expect(result.installed).toEqual([]);
    });

    it('plugin:install returns success with needsRestart when CLI succeeds', async () => {
      runPluginSpy.mockReturnValue({ ok: true, stdout: 'Installed', stderr: '' });

      const { claude } = await setup();

      const result = await claude.send<{ success: boolean; needsRestart?: boolean }>(
        'install_plugin',
        { pluginId: 'test-plugin' },
      );

      expect(runPluginSpy).toHaveBeenCalledWith(['install', 'test-plugin']);
      expect(result).toEqual({ success: true, needsRestart: true });
    });

    it('plugin:install returns error when CLI fails', async () => {
      runPluginSpy.mockReturnValue({ ok: false, stdout: '', stderr: 'Plugin not found' });

      const { claude } = await setup();

      const result = await claude.send<{ success: boolean; error?: string }>('install_plugin', {
        pluginId: 'bad-plugin',
      });

      expect(result).toEqual({ success: false, error: 'Plugin not found' });
    });

    it('plugin:uninstall returns success with needsRestart', async () => {
      runPluginSpy.mockReturnValue({ ok: true, stdout: 'Uninstalled', stderr: '' });

      const { claude } = await setup();

      const result = await claude.send<{ success: boolean; needsRestart?: boolean }>(
        'uninstall_plugin',
        { pluginId: 'test-plugin' },
      );

      expect(runPluginSpy).toHaveBeenCalledWith(['uninstall', 'test-plugin']);
      expect(result).toEqual({ success: true, needsRestart: true });
    });

    it('plugin:set_enabled calls enable/disable and returns needsRestart', async () => {
      runPluginSpy.mockReturnValue({ ok: true, stdout: '', stderr: '' });

      const { claude } = await setup();

      const result = await claude.send<{ success: boolean; needsRestart?: boolean }>(
        'set_plugin_enabled',
        { pluginId: 'test-plugin', enabled: true },
      );

      expect(runPluginSpy).toHaveBeenCalledWith(['enable', 'test-plugin']);
      expect(result).toEqual({ success: true, needsRestart: true });

      runPluginSpy.mockClear();

      const result2 = await claude.send<{ success: boolean; needsRestart?: boolean }>(
        'set_plugin_enabled',
        { pluginId: 'test-plugin', enabled: false },
      );

      expect(runPluginSpy).toHaveBeenCalledWith(['disable', 'test-plugin']);
      expect(result2).toEqual({ success: true, needsRestart: true });
    });
  });

  describe('marketplace handlers', () => {
    let runPluginSpy: any;

    beforeEach(() => {
      runPluginSpy = vi.spyOn(helpers, 'runPluginCommand');
    });

    afterEach(() => {
      runPluginSpy.mockRestore();
    });

    it('plugin:list_marketplaces parses JSON stdout', async () => {
      runPluginSpy.mockReturnValue({
        ok: true,
        stdout:
          '[{"name":"m1","source":"github","repo":"anthropics/test-plugins","installLocation":"/tmp/plugins/m1"}]',
        stderr: '',
      });

      const { claude } = await setup();

      const result = await claude.send<{ marketplaces: unknown[] }>('list_marketplaces');

      expect(runPluginSpy).toHaveBeenCalledWith(['marketplace', 'list', '--json']);
      expect(result.marketplaces).toEqual([
        {
          name: 'm1',
          config: {
            source: { source: 'github', repo: 'anthropics/test-plugins' },
            installLocation: '/tmp/plugins/m1',
          },
          pluginCount: 0,
          installedCount: 0,
        },
      ]);
    });

    it('plugin:list_marketplaces returns empty on failure', async () => {
      runPluginSpy.mockReturnValue({ ok: false, stdout: '', stderr: 'err' });

      const { claude } = await setup();

      const result = await claude.send<{ marketplaces: unknown[] }>('list_marketplaces');

      expect(result.marketplaces).toEqual([]);
    });

    it('plugin:add_marketplace succeeds', async () => {
      runPluginSpy.mockReturnValue({ ok: true, stdout: 'Added', stderr: '' });

      const { claude } = await setup();

      const result = await claude.send<{ success: boolean }>('add_marketplace', {
        source: 'https://example.com',
      });

      expect(runPluginSpy).toHaveBeenCalledWith(['marketplace', 'add', 'https://example.com']);
      expect(result).toEqual({ success: true });
    });

    it('plugin:remove_marketplace succeeds', async () => {
      runPluginSpy.mockReturnValue({ ok: true, stdout: 'Removed', stderr: '' });

      const { claude } = await setup();

      const result = await claude.send<{ success: boolean }>('remove_marketplace', {
        marketplaceId: 'm1',
      });

      expect(runPluginSpy).toHaveBeenCalledWith(['marketplace', 'remove', 'm1']);
      expect(result).toEqual({ success: true });
    });

    it('plugin:refresh_marketplace succeeds', async () => {
      runPluginSpy.mockReturnValue({ ok: true, stdout: 'Updated', stderr: '' });

      const { claude } = await setup();

      const result = await claude.send<{ success: boolean }>('refresh_marketplace', {
        marketplaceId: 'm1',
      });

      expect(runPluginSpy).toHaveBeenCalledWith(['marketplace', 'update', 'm1']);
      expect(result).toEqual({ success: true });
    });
  });

  describe('git:log and git:diff', () => {
    let execGitSpy: any;

    beforeEach(() => {
      execGitSpy = vi.spyOn(helpers, 'execGit');
    });

    afterEach(() => {
      execGitSpy.mockRestore();
    });

    it('git:log parses formatted output into entries', async () => {
      execGitSpy.mockResolvedValue(
        'abc123|feat: add login|Alice|2024-01-01 10:00:00 +0000\ndef456|fix: typo|Bob|2024-01-02 11:00:00 +0000\n',
      );

      const { claude } = await setup();

      const result = await claude.send<{
        entries: Array<{ hash: string; message: string; author: string; date: string }>;
      }>('git:log', { limit: 5 });

      expect(execGitSpy).toHaveBeenCalledWith(['log', '--format=%H|%s|%an|%ai', '-n', '5']);
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]).toEqual({
        hash: 'abc123',
        message: 'feat: add login',
        author: 'Alice',
        date: '2024-01-01 10:00:00 +0000',
      });
    });

    it('git:log returns empty entries on error', async () => {
      execGitSpy.mockRejectedValue(new Error('not a git repo'));

      const { claude } = await setup();

      const result = await claude.send<{ entries: unknown[] }>('git:log', {});

      expect(result.entries).toEqual([]);
    });

    it('git:diff returns diff output', async () => {
      execGitSpy.mockResolvedValue('+added\n-removed\n');

      const { claude } = await setup();

      const result = await claude.send<{ diff: string }>('git:diff');

      expect(execGitSpy).toHaveBeenCalledWith(['diff']);
      expect(result.diff).toBe('+added\n-removed\n');
    });

    it('git:diff returns empty string on error', async () => {
      execGitSpy.mockRejectedValue(new Error('fail'));

      const { claude } = await setup();

      const result = await claude.send<{ diff: string }>('git:diff');

      expect(result.diff).toBe('');
    });
  });

  describe('git:checkout multi-strategy', () => {
    let execGitSpy: any;

    beforeEach(() => {
      execGitSpy = vi.spyOn(helpers, 'execGit');
    });

    afterEach(() => {
      execGitSpy.mockRestore();
    });

    it('should succeed on local checkout (strategy 1)', async () => {
      execGitSpy.mockResolvedValue('');

      const { claude } = await setup();

      const result = await claude.send<{ success: boolean; error?: string }>('checkout_branch', {
        branch: 'feature/test',
      });

      expect(result.success).toBe(true);
      expect(execGitSpy).toHaveBeenCalledTimes(1);
      expect(execGitSpy).toHaveBeenCalledWith(['checkout', 'feature/test']);
    });

    it('should try fetch+checkout when local fails (strategy 2)', async () => {
      execGitSpy
        .mockRejectedValueOnce(new Error('pathspec did not match'))
        .mockResolvedValueOnce('')
        .mockResolvedValueOnce('');

      const { claude } = await setup();

      const result = await claude.send<{ success: boolean; error?: string }>('checkout_branch', {
        branch: 'feature/remote',
      });

      expect(result.success).toBe(true);
      expect(execGitSpy).toHaveBeenCalledTimes(3);
      expect(execGitSpy).toHaveBeenNthCalledWith(1, ['checkout', 'feature/remote']);
      expect(execGitSpy).toHaveBeenNthCalledWith(2, ['fetch', 'origin']);
      expect(execGitSpy).toHaveBeenNthCalledWith(3, ['checkout', 'feature/remote']);
    });

    it('should try --track when fetch+checkout fails (strategy 3)', async () => {
      execGitSpy
        .mockRejectedValueOnce(new Error('pathspec did not match'))
        .mockResolvedValueOnce('')
        .mockRejectedValueOnce(new Error('pathspec did not match'))
        .mockResolvedValueOnce('');

      const { claude } = await setup();

      const result = await claude.send<{ success: boolean; error?: string }>('checkout_branch', {
        branch: 'feature/track',
      });

      expect(result.success).toBe(true);
      expect(execGitSpy).toHaveBeenCalledTimes(4);
      expect(execGitSpy).toHaveBeenNthCalledWith(1, ['checkout', 'feature/track']);
      expect(execGitSpy).toHaveBeenNthCalledWith(2, ['fetch', 'origin']);
      expect(execGitSpy).toHaveBeenNthCalledWith(3, ['checkout', 'feature/track']);
      expect(execGitSpy).toHaveBeenNthCalledWith(4, [
        'checkout',
        '--track',
        'origin/feature/track',
      ]);
    });

    it('should return error when all strategies fail', async () => {
      execGitSpy
        .mockRejectedValueOnce(new Error('pathspec did not match'))
        .mockResolvedValueOnce('')
        .mockRejectedValueOnce(new Error('pathspec did not match'))
        .mockRejectedValueOnce(new Error('fatal: no such branch'));

      const { claude } = await setup();

      const result = await claude.send<{ success: boolean; error?: string }>('checkout_branch', {
        branch: 'nonexistent',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
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

  describe('terminal:get_contents', () => {
    it('returns { content: null } when no terminal lines exist', async () => {
      const { claude, channelId } = await setup();

      const res = await claude.send<{ content: string | null }>('terminal:get_contents', {
        channelId,
      });

      expect(res.content).toBeNull();
    });

    it('returns last 100 lines joined by \\n when session has lines', async () => {
      const { claude, channelId } = await setup();

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = claude.container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      const channel = mgr.get(channelId)!;
      channel.terminalLines = ['line1', 'line2', 'line3'];

      const res = await claude.send<{ content: string | null }>('terminal:get_contents', {
        channelId,
      });

      expect(res.content).toBe('line1\nline2\nline3');
    });

    it('returns only last 100 lines when there are more than 100', async () => {
      const { claude, channelId } = await setup();

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = claude.container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      const channel = mgr.get(channelId)!;
      channel.terminalLines = Array.from({ length: 150 }, (_, i) => `line${i + 1}`);

      const res = await claude.send<{ content: string | null }>('terminal:get_contents', {
        channelId,
      });

      expect(res.content).not.toBeNull();
      const lines = res.content!.split('\n');
      expect(lines).toHaveLength(100);
      expect(lines[0]).toBe('line51');
      expect(lines[99]).toBe('line150');
    });
  });

  describe('terminal:open_claude', () => {
    it('creates a new session and returns { success: true, channelId }', async () => {
      const { claude, channelId } = await setup();

      const res = await claude.send<{ success: boolean; channelId?: string; error?: string }>(
        'terminal:open_claude',
        { channelId },
      );

      expect(res.success).toBe(true);
      expect(res.channelId).toBeDefined();

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = claude.container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      expect(mgr.get(res.channelId!)).toBeDefined();
    });

    it('with a prompt, sends message to the spawned session', async () => {
      const { claude, channelId } = await setup();

      const res = await claude.send<{ success: boolean; channelId?: string }>(
        'terminal:open_claude',
        { channelId, prompt: 'hello' },
      );

      expect(res.success).toBe(true);
      expect(res.channelId).toBeDefined();
    });

    it('with a cwd, the new channel uses that cwd', async () => {
      const { claude, channelId } = await setup();

      const res = await claude.send<{ success: boolean; channelId?: string }>(
        'terminal:open_claude',
        { channelId, cwd: '/tmp' },
      );

      expect(res.success).toBe(true);

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = claude.container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      const newChannel = mgr.get(res.channelId!);
      expect(newChannel?.sessionState?.cwd).toBe('/tmp');
    });
  });

  describe('speech-to-text socket events (smoke)', () => {
    it('start_speech_to_text is handled without error', async () => {
      const { claude, channelId } = await setup();

      await claude.send('start_speech_to_text', { channelId });

      // Handler registered — no disconnect or error
      expect(claude.socket.connected).toBe(true);
    });

    it('stop_speech_to_text is handled without error', async () => {
      const { claude, channelId } = await setup();

      await claude.send('stop_speech_to_text', { channelId });

      expect(claude.socket.connected).toBe(true);
    });
  });
});
