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
  describe('settings:set_permission_mode', () => {
    it('sends set_permission_mode control_request to CLI', async () => {
      const { claude, channelId } = await setup();

      await claude.send('settings:set_permission_mode', { channelId, mode: 'plan' });

      const received = claude.received('control_request');
      expect(received.some((r) => (r.request as any)?.subtype === 'set_permission_mode')).toBe(
        true,
      );
    });

    it('silently ignores set_permission_mode for unknown session', async () => {
      const { claude } = await setup();

      await claude.send('settings:set_permission_mode', { channelId: 'unknown', mode: 'plan' });

      expect(claude.socket.connected).toBe(true);
    });

    it('persists permissionMode to settingsStore on success', async () => {
      const { claude, channelId, settingsStore } = await setup();

      await claude.send('settings:set_permission_mode', { channelId, mode: 'plan' });

      expect(await settingsStore.get('claude', 'permissionMode')).toBe('plan');
    });

    it('emits settings:update with permissionMode after success', async () => {
      const { claude, channelId } = await setup();
      const events: any[] = [];
      claude.socket.on('settings:update', (p: any) => events.push(p));

      await claude.send('settings:set_permission_mode', { channelId, mode: 'plan' });

      const match = events.find((e) => e.initialPermissionMode === 'plan');
      expect(match).toBeDefined();
    });
  });

  describe('settings:set_model', () => {
    it('sends set_model control_request to CLI', async () => {
      const { claude, channelId } = await setup();

      await claude.send('settings:set_model', { channelId, model: 'claude-sonnet-4-6' });

      const received = claude.received('control_request');
      expect(received.some((r) => (r.request as any)?.subtype === 'set_model')).toBe(true);
    });

    it('returns error via callback for unknown session', async () => {
      const { claude } = await setup();

      const result = await claude.send('settings:set_model', {
        channelId: 'unknown',
        model: 'claude-sonnet-4-6',
      });
      expect(result).toEqual({ success: false, error: 'Session not found' });
    });

    it('returns success via callback', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send('settings:set_model', {
        channelId,
        model: 'claude-sonnet-4-6',
      });
      expect(result).toEqual({ success: true });
    });

    it('persists model to settingsStore on success', async () => {
      const { claude, channelId, settingsStore } = await setup();

      await claude.send('settings:set_model', { channelId, model: 'claude-sonnet-4-6' });

      expect(await settingsStore.get('claude', 'model')).toBe('claude-sonnet-4-6');
    });
  });

  describe('settings:set_thinking_level', () => {
    it('sends set_max_thinking_tokens for "default_on"', async () => {
      const { claude, channelId } = await setup();

      await claude.send('settings:set_thinking_level', { channelId, thinkingLevel: 'default_on' });

      const received = claude.received('control_request');
      expect(received.some((r) => (r.request as any)?.subtype === 'set_max_thinking_tokens')).toBe(
        true,
      );
    });

    it('sends set_max_thinking_tokens(0) for "off"', async () => {
      const { claude, channelId } = await setup();

      await claude.send('settings:set_thinking_level', { channelId, thinkingLevel: 'off' });

      const received = claude.received('control_request');
      expect(
        received.some(
          (r) =>
            (r.request as any)?.subtype === 'set_max_thinking_tokens' &&
            (r.request as any)?.tokens === 0,
        ),
      ).toBe(true);
    });

    it('emits settings:update with thinkingLevel after success', async () => {
      const { claude, channelId } = await setup();
      const events: any[] = [];
      claude.socket.on('settings:update', (p: any) => events.push(p));

      await claude.send('settings:set_thinking_level', { channelId, thinkingLevel: 'default_on' });

      const match = events.find((e) => e.thinkingLevel === 'default_on');
      expect(match).toBeDefined();
    });

    it('silently ignores set_thinking_level for unknown session', async () => {
      const { claude } = await setup();

      await claude.send('settings:set_thinking_level', {
        channelId: 'unknown',
        thinkingLevel: 'default_on',
      });

      expect(claude.socket.connected).toBe(true);
    });

    it('persists thinkingLevel to settingsStore on success', async () => {
      const { claude, channelId, settingsStore } = await setup();

      await claude.send('settings:set_thinking_level', { channelId, thinkingLevel: 'default_on' });

      expect(await settingsStore.get('claude', 'thinkingLevel')).toBe('default_on');
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

    it('stores cwd in channel.workspaceFolder when cwd is provided', async () => {
      const claude = createFakeClaude();

      const channelId = await claude.initialize({ launch: { cwd: '/some/path' } });

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const channelManager = claude.container.get(TYPES.ChannelManager) as InstanceType<
        typeof ChannelManager
      >;
      const channel = channelManager.get(channelId);
      expect(channel?.workspaceFolder).toBe('/some/path');
    });

    it('resolves relative cwd to absolute path', async () => {
      const claude = createFakeClaude();

      const channelId = await claude.initialize({ launch: { cwd: '../' } });

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const channelManager = claude.container.get(TYPES.ChannelManager) as InstanceType<
        typeof ChannelManager
      >;
      const channel = channelManager.get(channelId);
      expect(channel?.workspaceFolder).not.toBe('../');
      expect(channel?.workspaceFolder?.startsWith('/')).toBe(true);
    });
  });

  it('apply_settings forwards settings to CLI session', async () => {
    const { claude, channelId } = await setup();

    const result = await claude.send<{ success: boolean; error?: string }>('settings:apply', {
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

  it('apply_settings emits settings:update with effort after success', async () => {
    const { claude, channelId } = await setup();
    const events: unknown[] = [];
    claude.socket.on('settings:update', (payload: unknown) => events.push(payload));

    await claude.send('settings:apply', {
      channelId,
      settings: { effortLevel: 'low' },
    });

    const effortUpdate = events.find((e: any) => e.channelId === channelId && e.effort === 'low');
    expect(effortUpdate).toBeTruthy();
  });

  it('apply_settings persists effortLevel to settingsStore', async () => {
    const { claude, channelId } = await setup();

    await claude.send('settings:apply', {
      channelId,
      settings: { effortLevel: 'high' },
    });

    const settingsStore = claude.container.get<SettingsStore>(TYPES.SettingsStore);
    expect(await settingsStore.get('claude', 'effortLevel')).toBe('high');
  });

  it('app:config returns persisted effort after settings:apply', async () => {
    const { claude, channelId } = await setup();

    await claude.send('settings:apply', {
      channelId,
      settings: { effortLevel: 'medium' },
    });

    const result = await claude.send<{ effort?: string }>('app:config', { channelId: '' });
    expect(result.effort).toBe('medium');
  });

  it('chat:get_state returns settings for an active session', async () => {
    const { claude, channelId } = await setup();

    const settingsStore = claude.container.get<SettingsStore>(TYPES.SettingsStore);
    await settingsStore.set('claude', 'model', 'opus');

    const result = await claude.send<{
      success: boolean;
      state?: Record<string, unknown>;
    }>('settings:state', { channelId });

    expect(result.success).toBe(true);
    expect(result.state).toMatchObject({ model: 'opus' });
  });

  it('chat:get_state returns error for missing session', async () => {
    const claude = createFakeClaude();

    const result = await claude.send<{ success: boolean; error?: string }>('settings:state', {
      channelId: 'nonexistent',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Session not found');
  });

  it('get_settings response includes model and permissionMode', async () => {
    const { claude, channelId } = await setup();

    const settingsStore = claude.container.get<SettingsStore>(TYPES.SettingsStore);
    await settingsStore.set('claude', 'model', 'opus');
    await settingsStore.set('claude', 'permissionMode', 'plan');

    const result = await claude.send<{ success: boolean; state?: Record<string, unknown> }>(
      'settings:state',
      { channelId },
    );

    expect(result.success).toBe(true);
    expect(result.state).toMatchObject({ model: 'opus', permissionMode: 'plan' });
  });

  describe('chat:rewind_code', () => {
    it('sends rewind_files control_request and returns result via callback', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send('chat:rewind_code', {
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

      const result = await claude.send('chat:rewind_code', {
        channelId: 'unknown',
        userMessageId: 'msg-1',
        dryRun: false,
      });
      expect(result).toMatchObject({ error: 'Session not found' });
    });
  });

  describe('settings:set_proactive', () => {
    it('emits settings:update with fastModeState after success', async () => {
      const { claude, channelId } = await setup();
      const events: any[] = [];
      claude.socket.on('settings:update', (p: any) => events.push(p));

      await claude.send('settings:set_proactive', { channelId, enabled: true });

      const match = events.find((e) => e.fastModeState != null);
      expect(match).toBeDefined();
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
      claude.socket.on('settings:usage' as any, (payload: any) => {
        usageUpdates.push(payload);
      });

      await claude.send('chat:send', { channelId, message: 'hello' });
      await claude.emit(s.assistant('hi'));
      await claude.emit(s.rateLimitEvent({ status: 'allowed', rateLimitType: 'five_hour' }));
      await claude.emit(s.result());

      usageUpdates.length = 0;

      await claude.send('settings:refresh_usage', { channelId });

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
          return {
            categories: [
              { name: 'System prompt', tokens: 6000, color: 'promptBorder' },
              { name: 'Messages', tokens: 4000, color: 'purple' },
              { name: 'Free space', tokens: 190000, color: 'promptBorder' },
            ],
            totalTokens: 10000,
            maxTokens: 200000,
            rawMaxTokens: 200000,
            percentage: 5,
            gridRows: [[{ color: 'x', isFilled: true }]],
            apiUsage: { something: 'extra' },
            mcpTools: ['tool1'],
          };
        }
        return null;
      });

      const usageUpdates: any[] = [];
      claude.socket.on('settings:usage' as any, (payload: any) => {
        usageUpdates.push(payload);
      });

      await claude.send('settings:refresh_usage', { channelId });

      expect(usageUpdates.length).toBe(1);
      const ctx = (usageUpdates[0] as any).contextUsage;
      expect(ctx.totalTokens).toBe(10000);
      expect(ctx.maxTokens).toBe(200000);
      expect(ctx.percentage).toBe(5);
      expect(ctx.categories).toHaveLength(3);
      expect(ctx.categories[0].name).toBe('System prompt');
      // Extra fields should be stripped
      expect(ctx.gridRows).toBeUndefined();
      expect(ctx.apiUsage).toBeUndefined();
      expect(ctx.mcpTools).toBeUndefined();
      expect(ctx.rawMaxTokens).toBeUndefined();
    });
  });

  describe('settings control_request (client → server → CLI)', () => {
    it('set_model sends control_request to CLI', async () => {
      const { claude, channelId } = await setup();

      await claude.send('settings:set_model', { channelId, model: 'haiku' });

      const received = claude.received('control_request');
      expect(received.some((r: any) => (r.request as any)?.subtype === 'set_model')).toBe(true);
    });

    it('set_permission_mode sends control_request to CLI', async () => {
      const { claude, channelId } = await setup();

      await claude.send('settings:set_permission_mode', { channelId, mode: 'plan' });

      const received = claude.received('control_request');
      expect(received.some((r: any) => (r.request as any)?.subtype === 'set_permission_mode')).toBe(
        true,
      );
    });
  });

  describe('control_request from CLI', () => {
    it('set_model updates sessionConfig and responds', async () => {
      const { claude, channelId } = await setup();

      await claude.emit(s.controlRequest('sm-1', 'set_model', undefined, { model: 'haiku' }));

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const channelManager = claude.container.get(TYPES.ChannelManager) as InstanceType<
        typeof ChannelManager
      >;
      const channel = channelManager.get(channelId);
      expect(channel?.sessionConfig.model).toBe('haiku');
      expect(
        claude.received('control_response').some((r: any) => r.response?.request_id === 'sm-1'),
      ).toBe(true);
    });

    it('set_permission_mode updates sessionConfig and responds', async () => {
      const { claude, channelId } = await setup();

      await claude.emit(
        s.controlRequest('sp-1', 'set_permission_mode', undefined, { mode: 'plan' }),
      );

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const channelManager = claude.container.get(TYPES.ChannelManager) as InstanceType<
        typeof ChannelManager
      >;
      const channel = channelManager.get(channelId);
      expect(channel?.sessionConfig.permissionMode).toBe('plan');
      expect(
        claude.received('control_response').some((r: any) => r.response?.request_id === 'sp-1'),
      ).toBe(true);
    });

    it('get_settings responds with current settings', async () => {
      const { claude, settingsStore } = await setup();
      await settingsStore.set('claude', 'model', 'opus');

      await claude.emit(s.controlRequest('gs-1', 'get_settings'));

      expect(
        claude.received('control_response').some((r: any) => r.response?.request_id === 'gs-1'),
      ).toBe(true);
    });
  });
});
