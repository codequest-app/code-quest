/* biome-ignore-all lint/suspicious/noExplicitAny: test file uses type assertions */
import { segments as s } from '@code-quest/summoner/test';
import type { SettingsStore } from '../services/settings-store.ts';
import { createFakeClaude } from '../test/index.ts';
import { TYPES } from '../types.ts';

async function setup(sessionId = 'cli-sess') {
  const claude = createFakeClaude();
  const channelId = await claude.initialize(s.init(sessionId));
  const settingsStore = claude.container.get<SettingsStore>(TYPES.SettingsStore);
  return { claude, channelId, settingsStore };
}

describe('ChatHandler > settings', () => {
  describe('set_permission_mode', () => {
    it('sends set_permission_mode control_request to CLI', async () => {
      const { claude, channelId } = await setup();

      await claude.send('set_permission_mode', { channelId, mode: 'plan' });

      const received = claude.received('control_request');
      expect(received.some((r) => (r.request as any)?.subtype === 'set_permission_mode')).toBe(
        true,
      );
    });

    it('silently ignores set_permission_mode for unknown session', async () => {
      const { claude } = await setup();

      await claude.send('set_permission_mode', { channelId: 'unknown', mode: 'plan' });

      expect(claude.socket.connected).toBe(true);
    });

    it('persists permissionMode to settingsStore on success', async () => {
      const { claude, channelId, settingsStore } = await setup();

      await claude.send('set_permission_mode', { channelId, mode: 'plan' });

      expect(settingsStore.get('permissionMode')).toBe('plan');
    });

    it('emits state:update with permissionMode after success', async () => {
      const { claude, channelId } = await setup();
      const events: any[] = [];
      claude.socket.on('state:update', (p: any) => events.push(p));

      await claude.send('set_permission_mode', { channelId, mode: 'plan' });

      const match = events.find((e) => e.initialPermissionMode === 'plan');
      expect(match).toBeDefined();
    });
  });

  describe('set_model', () => {
    it('sends set_model control_request to CLI', async () => {
      const { claude, channelId } = await setup();

      await claude.send('set_model', { channelId, model: 'claude-sonnet-4-6' });

      const received = claude.received('control_request');
      expect(received.some((r) => (r.request as any)?.subtype === 'set_model')).toBe(true);
    });

    it('returns error via callback for unknown session', async () => {
      const { claude } = await setup();

      const result = await claude.send('set_model', {
        channelId: 'unknown',
        model: 'claude-sonnet-4-6',
      });
      expect(result).toEqual({ success: false, error: 'Session not found' });
    });

    it('returns success via callback', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send('set_model', { channelId, model: 'claude-sonnet-4-6' });
      expect(result).toEqual({ success: true });
    });

    it('persists model to settingsStore on success', async () => {
      const { claude, channelId, settingsStore } = await setup();

      await claude.send('set_model', { channelId, model: 'claude-sonnet-4-6' });

      expect(settingsStore.get('model')).toBe('claude-sonnet-4-6');
    });
  });

  describe('set_thinking_level', () => {
    it('sends set_max_thinking_tokens for "default_on"', async () => {
      const { claude, channelId } = await setup();

      await claude.send('set_thinking_level', { channelId, thinkingLevel: 'default_on' });

      const received = claude.received('control_request');
      expect(received.some((r) => (r.request as any)?.subtype === 'set_max_thinking_tokens')).toBe(
        true,
      );
    });

    it('sends set_max_thinking_tokens(0) for "off"', async () => {
      const { claude, channelId } = await setup();

      await claude.send('set_thinking_level', { channelId, thinkingLevel: 'off' });

      const received = claude.received('control_request');
      expect(
        received.some(
          (r) =>
            (r.request as any)?.subtype === 'set_max_thinking_tokens' &&
            (r.request as any)?.tokens === 0,
        ),
      ).toBe(true);
    });

    it('emits state:update with thinkingLevel after success', async () => {
      const { claude, channelId } = await setup();
      const events: any[] = [];
      claude.socket.on('state:update', (p: any) => events.push(p));

      await claude.send('set_thinking_level', { channelId, thinkingLevel: 'default_on' });

      const match = events.find((e) => e.thinkingLevel === 'default_on');
      expect(match).toBeDefined();
    });

    it('silently ignores set_thinking_level for unknown session', async () => {
      const { claude } = await setup();

      await claude.send('set_thinking_level', {
        channelId: 'unknown',
        thinkingLevel: 'default_on',
      });

      expect(claude.socket.connected).toBe(true);
    });

    it('persists thinkingLevel to settingsStore on success', async () => {
      const { claude, channelId, settingsStore } = await setup();

      await claude.send('set_thinking_level', { channelId, thinkingLevel: 'default_on' });

      expect(settingsStore.get('thinkingLevel')).toBe('default_on');
    });
  });

  describe('launch_claude per-launch settings', () => {
    it('calls setMaxThinkingTokens(31999) when thinkingLevel is "default_on"', async () => {
      const claude = createFakeClaude();

      await claude.initialize({ launch: { thinkingLevel: 'default_on' } });

      const received = claude.received('control_request');
      const thinkingReq = received.find(
        (r) => (r.request as any)?.subtype === 'set_max_thinking_tokens',
      );
      expect(thinkingReq).toBeDefined();
      expect((thinkingReq!.request as any).tokens).toBe(31999);
    });

    it('stores cwd in channel.sessionState when cwd is provided', async () => {
      const claude = createFakeClaude();

      const channelId = await claude.initialize({ launch: { cwd: '/some/path' } });

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const channelManager = claude.container.get(TYPES.ChannelManager) as InstanceType<
        typeof ChannelManager
      >;
      const channel = channelManager.get(channelId);
      expect(channel?.sessionState?.cwd).toBe('/some/path');
    });
  });

  it('init returns settings and sessions in one response', async () => {
    const claude = createFakeClaude();

    const result = await claude.send<{
      settings: Record<string, unknown>;
      sessions: Array<{ channelId: string; state: string }>;
      activeSessionId?: string;
    }>('init');

    expect(result.settings).toMatchObject({});
    expect(result.sessions).toEqual(expect.any(Array));
  });

  it('init response includes providerConfig from adapter', async () => {
    const claude = createFakeClaude();

    const result = await claude.send<{
      providerConfig?: { brand: { name: string; company: string } };
    }>('init');

    expect(result.providerConfig).toBeDefined();
    expect(result.providerConfig!.brand.name).toBe('Claude');
    expect(result.providerConfig!.brand.company).toBe('Anthropic');
  });

  it('apply_settings forwards settings to CLI session', async () => {
    const { claude, channelId } = await setup();

    const result = await claude.send<{ success: boolean; error?: string }>('apply_settings', {
      channelId,
      settings: { effortLevel: 'high' },
    });

    expect(result.success).toBe(true);
    const received = claude.received();
    expect(
      received.some(
        (r: any) =>
          JSON.stringify(r).includes('"apply_flag_settings"') &&
          JSON.stringify(r).includes('"effortLevel"'),
      ),
    ).toBe(true);
  });

  it('apply_settings emits state:update with effort after success', async () => {
    const { claude, channelId } = await setup();
    const events: unknown[] = [];
    claude.socket.on('state:update', (payload: unknown) => events.push(payload));

    await claude.send('apply_settings', {
      channelId,
      settings: { effortLevel: 'low' },
    });

    const effortUpdate = events.find((e: any) => e.channelId === channelId && e.effort === 'low');
    expect(effortUpdate).toBeTruthy();
  });

  it('chat:get_state returns settings for an active session', async () => {
    const { claude, channelId } = await setup();

    const settingsStore = claude.container.get<SettingsStore>(TYPES.SettingsStore);
    settingsStore.set('model', 'opus');

    const result = await claude.send<{
      success: boolean;
      state?: Record<string, unknown>;
    }>('get_claude_state', { channelId });

    expect(result.success).toBe(true);
    expect(result.state).toMatchObject({ model: 'opus' });
  });

  it('chat:get_state returns error for missing session', async () => {
    const claude = createFakeClaude();

    const result = await claude.send<{ success: boolean; error?: string }>('get_claude_state', {
      channelId: 'nonexistent',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Session not found');
  });

  it('get_settings response includes model and permissionMode', async () => {
    const { claude, channelId } = await setup();

    const settingsStore = claude.container.get<SettingsStore>(TYPES.SettingsStore);
    settingsStore.set('model', 'opus');
    settingsStore.set('permissionMode', 'plan');

    const result = await claude.send<{ success: boolean; state?: Record<string, unknown> }>(
      'get_claude_state',
      { channelId },
    );

    expect(result.success).toBe(true);
    expect(result.state).toMatchObject({ model: 'opus', permissionMode: 'plan' });
  });

  describe('rewind_code', () => {
    it('sends rewind_files control_request and returns result via callback', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send('rewind_code', {
        channelId,
        userMessageId: 'msg-1',
        dryRun: true,
      });

      const received = claude.received('control_request');
      expect(received.some((r) => (r.request as any)?.subtype === 'rewind_files')).toBe(true);
      expect(result).toMatchObject({ success: true });
    });

    it('returns error via callback for unknown session', async () => {
      const { claude } = await setup();

      const result = await claude.send('rewind_code', {
        channelId: 'unknown',
        userMessageId: 'msg-1',
        dryRun: false,
      });
      expect(result).toMatchObject({ error: 'Session not found' });
    });
  });

  describe('chat:set_fast_mode', () => {
    it('emits state:update with fastModeState after success', async () => {
      const { claude, channelId } = await setup();
      const events: any[] = [];
      claude.socket.on('state:update', (p: any) => events.push(p));

      await claude.send('chat:set_fast_mode', { channelId, enabled: true });

      const match = events.find((e) => e.fastModeState != null);
      expect(match).toBeDefined();
    });
  });
});
