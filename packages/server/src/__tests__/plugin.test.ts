/* biome-ignore-all lint/suspicious/noExplicitAny: test file uses type assertions */
import { segments as s } from '@code-quest/summoner/test';
import * as claudeCli from '../socket/claude/cli.ts';
import { resetClaudeState } from '../socket/claude/state.ts';
import { createFakeSummoner } from '../test/index.ts';

async function setup(sessionId = 'cli-sess') {
  const claude = createFakeSummoner().claude();
  const channelId = await claude.initialize(s.init(sessionId));
  return { claude, channelId };
}

describe('ChatHandler > plugin', () => {
  beforeEach(() => resetClaudeState());
  describe('plugin handlers', () => {
    let runPluginSpy: any;

    beforeEach(() => {
      runPluginSpy = vi.spyOn(claudeCli, 'runPluginCommand');
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
        'plugin:list',
        {},
      );

      expect(runPluginSpy).toHaveBeenCalledWith(['list', '--json']);
      expect(result.installed).toEqual([{ id: 'p1', name: 'Test Plugin', enabled: true }]);
    });

    it('plugin:list returns empty array when CLI fails', async () => {
      runPluginSpy.mockReturnValue({ ok: false, stdout: '', stderr: 'not found' });

      const { claude } = await setup();

      const result = await claude.send<{ installed: unknown[]; available: unknown[] }>(
        'plugin:list',
        {},
      );

      expect(result.installed).toEqual([]);
    });

    it('plugin:install returns success with needsRestart when CLI succeeds', async () => {
      runPluginSpy.mockReturnValue({ ok: true, stdout: 'Installed', stderr: '' });

      const { claude } = await setup();

      const result = await claude.send<{ success: boolean; needsRestart?: boolean }>(
        'plugin:install',
        { pluginId: 'test-plugin' },
      );

      expect(runPluginSpy).toHaveBeenCalledWith(['install', 'test-plugin']);
      expect(result).toEqual({ success: true, needsRestart: true });
    });

    it('plugin:install returns error when CLI fails', async () => {
      runPluginSpy.mockReturnValue({ ok: false, stdout: '', stderr: 'Plugin not found' });

      const { claude } = await setup();

      const result = await claude.send<{ success: boolean; error?: string }>('plugin:install', {
        pluginId: 'bad-plugin',
      });

      expect(result).toEqual({ success: false, error: 'Plugin not found' });
    });

    it('plugin:uninstall returns success with needsRestart', async () => {
      runPluginSpy.mockReturnValue({ ok: true, stdout: 'Uninstalled', stderr: '' });

      const { claude } = await setup();

      const result = await claude.send<{ success: boolean; needsRestart?: boolean }>(
        'plugin:uninstall',
        { pluginId: 'test-plugin' },
      );

      expect(runPluginSpy).toHaveBeenCalledWith(['uninstall', 'test-plugin']);
      expect(result).toEqual({ success: true, needsRestart: true });
    });

    it('plugin:toggle calls enable/disable and returns needsRestart', async () => {
      runPluginSpy.mockReturnValue({ ok: true, stdout: '', stderr: '' });

      const { claude } = await setup();

      const result = await claude.send<{ success: boolean; needsRestart?: boolean }>(
        'plugin:toggle',
        { pluginId: 'test-plugin', enabled: true },
      );

      expect(runPluginSpy).toHaveBeenCalledWith(['enable', 'test-plugin']);
      expect(result).toEqual({ success: true, needsRestart: true });

      runPluginSpy.mockClear();

      const result2 = await claude.send<{ success: boolean; needsRestart?: boolean }>(
        'plugin:toggle',
        { pluginId: 'test-plugin', enabled: false },
      );

      expect(runPluginSpy).toHaveBeenCalledWith(['disable', 'test-plugin']);
      expect(result2).toEqual({ success: true, needsRestart: true });
    });
  });

  describe('marketplace handlers', () => {
    let runPluginSpy: any;

    beforeEach(() => {
      runPluginSpy = vi.spyOn(claudeCli, 'runPluginCommand');
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

      const result = await claude.send<{ marketplaces: unknown[] }>('plugin:list_marketplaces');

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

      const result = await claude.send<{ marketplaces: unknown[] }>('plugin:list_marketplaces');

      expect(result.marketplaces).toEqual([]);
    });

    it('plugin:add_marketplace succeeds', async () => {
      runPluginSpy.mockReturnValue({ ok: true, stdout: 'Added', stderr: '' });

      const { claude } = await setup();

      const result = await claude.send<{ success: boolean }>('plugin:add_marketplace', {
        source: 'https://example.com',
      });

      expect(runPluginSpy).toHaveBeenCalledWith(['marketplace', 'add', 'https://example.com']);
      expect(result).toEqual({ success: true });
    });

    it('plugin:remove_marketplace succeeds', async () => {
      runPluginSpy.mockReturnValue({ ok: true, stdout: 'Removed', stderr: '' });

      const { claude } = await setup();

      const result = await claude.send<{ success: boolean }>('plugin:remove_marketplace', {
        marketplaceId: 'm1',
      });

      expect(runPluginSpy).toHaveBeenCalledWith(['marketplace', 'remove', 'm1']);
      expect(result).toEqual({ success: true });
    });

    it('plugin:refresh_marketplace succeeds', async () => {
      runPluginSpy.mockReturnValue({ ok: true, stdout: 'Updated', stderr: '' });

      const { claude } = await setup();

      const result = await claude.send<{ success: boolean }>('plugin:refresh_marketplace', {
        marketplaceId: 'm1',
      });

      expect(runPluginSpy).toHaveBeenCalledWith(['marketplace', 'update', 'm1']);
      expect(result).toEqual({ success: true });
    });
  });

  describe('plugin:reload', () => {
    it('returns success with commands/agents/plugins/mcpServers from CLI response', async () => {
      const { claude, channelId } = await setup();

      const reloadResponse = {
        commands: [{ name: 'simplify', description: 'Review code', argumentHint: '' }],
        agents: [{ name: 'general-purpose', description: 'General agent' }],
        plugins: [{ id: 'p1', name: 'Plugin 1', enabled: true }],
        mcpServers: [{ name: 'github', status: 'connected' }],
      };

      claude.onControlRequest((req) => {
        if (req.subtype === 'reload_plugins') {
          return reloadResponse;
        }
        return null;
      });

      const result = await claude.send<{
        success: boolean;
        data?: typeof reloadResponse;
      }>('plugin:reload', { channelId });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(reloadResponse);
    });

    it('returns success:true with no data when CLI responds without response body', async () => {
      const { claude, channelId } = await setup();
      // onControlRequest returns null → FakeClaude auto-responds with success but no response body

      const result = await claude.send<{ success: boolean; data?: unknown }>('plugin:reload', {
        channelId,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
    });
  });
});
