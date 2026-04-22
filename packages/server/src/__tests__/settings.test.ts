import type { Ack, RpcResult } from '@code-quest/shared';
import { segments as s } from '@code-quest/summoner/test';
import type { SettingsStore } from '../services/settings-store.ts';

type SettingsApplyResp = Ack;
type SettingsStateResp = RpcResult<{ state: Record<string, unknown> }>;
type SettingsStateOk = Extract<SettingsStateResp, { ok: true }>;

import { afterEach, vi } from 'vitest';
import { createFakeServer, createFakeSummoner, createTestContainer } from '../test/index.ts';
import { TYPES } from '../types.ts';

const configMock = vi.hoisted(() => ({
  autoMode: true,
  database: { url: undefined, sqliteUrl: 'file::memory:' },
  rawEvents: { writeDeltas: false, readDeltas: false },
  explorerRoots: [],
}));
vi.mock('../config.ts', () => ({ config: configMock }));
afterEach(() => {
  configMock.autoMode = true;
});

async function setup(sessionId = 'cli-sess') {
  const container = createTestContainer();
  const server = createFakeServer(container);
  const summoner = createFakeSummoner(server);
  const claude = summoner.claude();
  const channelId = await claude.initialize(s.init(sessionId));
  const settingsStore = container.get<SettingsStore>(TYPES.SettingsStore);
  return { container, claude, channelId, settingsStore };
}

describe('ChatHandler > settings', () => {
  describe('settings:set_permission_mode', () => {
    it('sends set_permission_mode control_request to CLI', async () => {
      const { claude, channelId } = await setup();

      await claude.send('settings:set_permission_mode', { channelId, mode: 'plan' });

      const received = claude.received('control_request');
      expect(received.some((r) => r.request.subtype === 'set_permission_mode')).toBe(true);
    });

    it('persists permissionMode to settingsStore on success', async () => {
      const { claude, channelId, settingsStore } = await setup();

      await claude.send('settings:set_permission_mode', { channelId, mode: 'plan' });

      expect(await settingsStore.get('claude', 'permissionMode')).toBe('plan');
    });

    it('emits settings:update with permissionMode after success', async () => {
      const { claude, channelId } = await setup();

      await claude.send('settings:set_permission_mode', { channelId, mode: 'plan' });

      const match = claude
        .events('settings:update')
        .find((e) => e.initialPermissionMode === 'plan');
      expect(match).toBeDefined();
    });

    it('updates channel.sessionConfig.permissionMode after success', async () => {
      const { container, claude, channelId } = await setup();
      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const channelManager = container.get(TYPES.ChannelManager) as InstanceType<
        typeof ChannelManager
      >;

      await claude.send('settings:set_permission_mode', { channelId, mode: 'bypassPermissions' });

      const channel = channelManager.get(channelId);
      expect(channel?.sessionConfig.permissionMode).toBe('bypassPermissions');
    });
  });

  describe('settings:set_model', () => {
    it('sends set_model control_request to CLI', async () => {
      const { claude, channelId } = await setup();

      await claude.send('settings:set_model', { channelId, model: 'claude-sonnet-4-6' });

      const received = claude.received('control_request');
      expect(received.some((r) => r.request.subtype === 'set_model')).toBe(true);
    });

    it('returns error via callback for unknown session', async () => {
      const { claude } = await setup();

      const result = await claude.send('settings:set_model', {
        channelId: 'unknown',
        model: 'claude-sonnet-4-6',
      });
      expect(result).toEqual({ ok: false, error: 'Session not found', code: 'session_not_found' });
    });

    it('returns success via callback', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send('settings:set_model', {
        channelId,
        model: 'claude-sonnet-4-6',
      });
      expect(result).toEqual({ ok: true, data: {} });
    });

    it('persists model to settingsStore on success', async () => {
      const { claude, channelId, settingsStore } = await setup();

      await claude.send('settings:set_model', { channelId, model: 'claude-sonnet-4-6' });

      expect(await settingsStore.get('claude', 'model')).toBe('claude-sonnet-4-6');
    });

    it('re-broadcasts app:models after set_model with supportsAutoMode unchanged from CLI', async () => {
      const models = [{ value: 'claude-opus-4-6', displayName: 'Opus', supportsAutoMode: true }];
      const claude = createFakeSummoner().claude();
      const channelId = await claude.initialize(
        s.init('cli-sess'),
        s.controlResponse('init', { models }),
      );

      await claude.send('settings:set_model', { channelId, model: 'claude-haiku-4-5' });

      const events = claude.events('app:models');
      const last = events.at(-1);
      expect(last?.models).toEqual([
        { value: 'claude-opus-4-6', displayName: 'Opus', supportsAutoMode: true },
      ]);
    });

    it('re-broadcasts app:models with supportsAutoMode false when config.autoMode is false', async () => {
      configMock.autoMode = false;
      const models = [{ value: 'claude-opus-4-6', displayName: 'Opus', supportsAutoMode: true }];
      const claude = createFakeSummoner().claude();
      const channelId = await claude.initialize(
        s.init('cli-sess'),
        s.controlResponse('init', { models }),
      );

      await claude.send('settings:set_model', { channelId, model: 'claude-haiku-4-5' });

      const events = claude.events('app:models');
      const last = events.at(-1);
      expect(last?.models).toEqual([
        { value: 'claude-opus-4-6', displayName: 'Opus', supportsAutoMode: false },
      ]);
    });

    it('still returns success when settingsStore.set fails (CLI already received update)', async () => {
      const failingStore = {
        get: async () => undefined,
        getMany: async () => ({}),
        set: async (): Promise<void> => {
          throw new Error('disk full');
        },
      };
      const container = createTestContainer();
      container.rebindSync(TYPES.SettingsStore).toConstantValue(failingStore);
      const server = createFakeServer(container);
      const summoner = createFakeSummoner(server);
      const claude = summoner.claude();
      const channelId = await claude.initialize(s.init('cli-sess-fail'));

      const result = await claude.send('settings:set_model', {
        channelId,
        model: 'claude-sonnet-4-6',
      });

      expect(result).toEqual({ ok: true, data: {} });
    });
  });

  describe('settings:set_thinking_level', () => {
    it('sends set_max_thinking_tokens for "default_on"', async () => {
      const { claude, channelId } = await setup();

      await claude.send('settings:set_thinking_level', { channelId, thinkingLevel: 'default_on' });

      const received = claude.received('control_request');
      expect(received.some((r) => r.request.subtype === 'set_max_thinking_tokens')).toBe(true);
    });

    it('sends set_max_thinking_tokens(0) for "off"', async () => {
      const { claude, channelId } = await setup();

      await claude.send('settings:set_thinking_level', { channelId, thinkingLevel: 'off' });

      const received = claude.received('control_request');
      expect(
        received.some(
          (r) =>
            r.request.subtype === 'set_max_thinking_tokens' &&
            'tokens' in r.request &&
            r.request.tokens === 0,
        ),
      ).toBe(true);
    });

    it('emits settings:update with thinkingLevel after success', async () => {
      const { claude, channelId } = await setup();

      await claude.send('settings:set_thinking_level', { channelId, thinkingLevel: 'default_on' });

      const match = claude.events('settings:update').find((e) => e.thinkingLevel === 'default_on');
      expect(match).toBeDefined();
    });

    it('persists thinkingLevel to settingsStore on success', async () => {
      const { claude, channelId, settingsStore } = await setup();

      await claude.send('settings:set_thinking_level', { channelId, thinkingLevel: 'default_on' });

      expect(await settingsStore.get('claude', 'thinkingLevel')).toBe('default_on');
    });

    it('persists thinkingDisplay when supplied', async () => {
      const { claude, channelId, settingsStore } = await setup();

      await claude.send('settings:set_thinking_level', {
        channelId,
        thinkingLevel: 'default_on',
        thinkingDisplay: 'omitted',
      });

      expect(await settingsStore.get('claude', 'thinkingDisplay')).toBe('omitted');
    });

    it('does not touch thinkingDisplay in store when payload omits it', async () => {
      const { claude, channelId, settingsStore } = await setup();
      await settingsStore.set('claude', 'thinkingDisplay', 'summarized');

      await claude.send('settings:set_thinking_level', { channelId, thinkingLevel: 'default_on' });

      expect(await settingsStore.get('claude', 'thinkingDisplay')).toBe('summarized');
    });

    it('emits thinkingDisplay in settings:update when supplied', async () => {
      const { claude, channelId } = await setup();

      await claude.send('settings:set_thinking_level', {
        channelId,
        thinkingLevel: 'default_on',
        thinkingDisplay: 'omitted',
      });

      const match = claude.events('settings:update').find((e) => e.thinkingDisplay === 'omitted');
      expect(match).toBeDefined();
    });
  });

  describe('launch_claude per-launch settings', () => {
    it('calls setMaxThinkingTokens(31999) when thinkingLevel is "default_on"', async () => {
      const claude = createFakeSummoner().claude();

      await claude.initialize({ launch: { thinkingLevel: 'default_on' } });

      const received = claude.received('control_request');
      const thinkingReq = received.find((r) => r.request.subtype === 'set_max_thinking_tokens');
      expect(thinkingReq).toBeDefined();
      expect((thinkingReq!.request as { tokens?: number }).tokens).toBe(31999);
    });

    it('stores cwd in channel.cwd when cwd is provided', async () => {
      const container = createTestContainer();
      const server = createFakeServer(container);
      const claude = createFakeSummoner(server).claude();

      const channelId = await claude.initialize({ launch: { cwd: '/some/path' } });

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const channelManager = container.get(TYPES.ChannelManager) as InstanceType<
        typeof ChannelManager
      >;
      const channel = channelManager.get(channelId);
      expect(channel?.cwd).toBe('/some/path');
    });

    it('resolves relative cwd to absolute path', async () => {
      const container = createTestContainer();
      const server = createFakeServer(container);
      const claude = createFakeSummoner(server).claude();

      const channelId = await claude.initialize({ launch: { cwd: '../' } });

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const channelManager = container.get(TYPES.ChannelManager) as InstanceType<
        typeof ChannelManager
      >;
      const channel = channelManager.get(channelId);
      expect(channel?.cwd).not.toBe('../');
      expect(channel?.cwd?.startsWith('/')).toBe(true);
    });
  });

  it('apply_settings forwards settings to CLI session', async () => {
    const { claude, channelId } = await setup();

    const result = await claude.send<SettingsApplyResp>('settings:apply', {
      channelId,
      settings: { effortLevel: 'high' },
    });

    expect(result.ok).toBe(true);
    const received = claude.received();
    expect(
      received.some(
        (r) =>
          JSON.stringify(r).includes('"apply_flag_settings"') &&
          JSON.stringify(r).includes('"effortLevel"'),
      ),
    ).toBe(true);
  });

  it('apply_settings emits settings:update with effort after success', async () => {
    const { claude, channelId } = await setup();

    await claude.send('settings:apply', {
      channelId,
      settings: { effortLevel: 'low' },
    });

    const effortUpdate = claude
      .events('settings:update')
      .find((e) => e.channelId === channelId && e.effort === 'low');
    expect(effortUpdate).toBeTruthy();
  });

  it('apply_settings persists effortLevel to settingsStore', async () => {
    const { container, claude, channelId } = await setup();

    await claude.send('settings:apply', {
      channelId,
      settings: { effortLevel: 'high' },
    });

    const settingsStore = container.get<SettingsStore>(TYPES.SettingsStore);
    expect(await settingsStore.get('claude', 'effortLevel')).toBe('high');
  });

  it('apply_settings re-broadcasts app:models with supportsAutoMode unchanged from CLI', async () => {
    const models = [{ value: 'claude-opus-4-6', displayName: 'Opus', supportsAutoMode: true }];
    const claude = createFakeSummoner().claude();
    const channelId = await claude.initialize(
      s.init('cli-sess'),
      s.controlResponse('init', { models }),
    );

    await claude.send('settings:apply', { channelId, settings: { effortLevel: 'high' } });

    const events = claude.events('app:models');
    const last = events.at(-1);
    expect(last?.models).toEqual([
      { value: 'claude-opus-4-6', displayName: 'Opus', supportsAutoMode: true },
    ]);
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
    const { container, claude, channelId } = await setup();

    const settingsStore = container.get<SettingsStore>(TYPES.SettingsStore);
    await settingsStore.set('claude', 'model', 'opus');

    const result = (await claude.send<SettingsStateResp>('settings:state', {
      channelId,
    })) as SettingsStateOk;

    expect(result.ok).toBe(true);
    expect(result.data.state).toMatchObject({ model: 'opus' });
  });

  it('chat:get_state returns error for missing session', async () => {
    const claude = createFakeSummoner().claude();

    const result = await claude.send<SettingsStateResp>('settings:state', {
      channelId: 'nonexistent',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('Session not found');
  });

  it('get_settings response includes model and permissionMode', async () => {
    const { container, claude, channelId } = await setup();

    const settingsStore = container.get<SettingsStore>(TYPES.SettingsStore);
    await settingsStore.set('claude', 'model', 'opus');
    await settingsStore.set('claude', 'permissionMode', 'plan');

    const result = (await claude.send<SettingsStateResp>('settings:state', {
      channelId,
    })) as SettingsStateOk;

    expect(result.ok).toBe(true);
    expect(result.data.state).toMatchObject({ model: 'opus', permissionMode: 'plan' });
  });

  describe('chat:rewind_code', () => {
    it('sends rewind_files control_request and returns result via callback', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send('chat:rewind_code', {
        channelId,
        userMessageId: 'msg-1',
      });

      const received = claude.received('control_request');
      expect(received.some((r) => r.request.subtype === 'rewind_files')).toBe(true);
      expect(result).toMatchObject({ ok: true });
    });

    it('returns error via callback for unknown session', async () => {
      const { claude } = await setup();

      const result = await claude.send('chat:rewind_code', {
        channelId: 'unknown',
        userMessageId: 'msg-1',
      });
      expect(result).toMatchObject({ ok: false, error: 'Session not found' });
    });
  });

  describe('chat:ask_side_question', () => {
    it('sends side_question control_request and returns answer via callback', async () => {
      const { claude, channelId } = await setup();

      claude.onControlRequest((req) => {
        if (req.subtype === 'side_question') {
          return { response: 'The answer is 42', synthetic: false };
        }
        return null;
      });

      const result = await claude.send('chat:ask_side_question', {
        channelId,
        question: 'What is the answer?',
      });

      expect(result).toMatchObject({ ok: true, data: { answer: 'The answer is 42' } });
    });

    it('returns error when Claude returns null response', async () => {
      const { claude, channelId } = await setup();

      claude.onControlRequest((req) => {
        if (req.subtype === 'side_question') {
          return { response: null, synthetic: false };
        }
        return null;
      });

      const result = await claude.send('chat:ask_side_question', {
        channelId,
        question: 'What is the answer?',
      });

      expect(result).toMatchObject({ ok: false, error: 'No answer returned' });
    });

    it('returns error for unknown channel', async () => {
      const { claude } = await setup();

      const result = await claude.send('chat:ask_side_question', {
        channelId: 'unknown',
        question: 'hello',
      });

      expect(result).toMatchObject({ ok: false });
    });
  });

  describe('settings:set_proactive', () => {
    it('emits settings:update with fastModeState after success', async () => {
      const { claude, channelId } = await setup();

      await claude.send('settings:set_proactive', { channelId, enabled: true });

      const match = claude.events('settings:update').find((e) => e.fastModeState != null);
      expect(match).toBeDefined();
    });
  });

  describe('usage tracking', () => {
    it('does NOT emit usage_update when rate_limit_event is received', async () => {
      const { claude, channelId } = await setup();

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

      const usageUpdates = claude.events('request').filter((p) => {
        if (typeof p !== 'object' || p === null || !('request' in p)) return false;
        const req = p.request;
        return (
          typeof req === 'object' && req !== null && 'type' in req && req.type === 'usage_update'
        );
      });
      expect(usageUpdates.length).toBe(0);
    });

    it('responds to request_usage_update with current usage', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'hello' });
      await claude.emit(s.assistant('hi'));
      await claude.emit(s.rateLimitEvent({ status: 'allowed', rateLimitType: 'five_hour' }));
      await claude.emit(s.result());

      const countBefore = claude.events('settings:usage').length;

      await claude.send('settings:refresh_usage', { channelId });

      const newUpdates = claude.events('settings:usage').slice(countBefore);
      expect(newUpdates.length).toBe(1);
      expect(newUpdates[0]).not.toHaveProperty('sessionId');
      expect(newUpdates[0].usage).toMatchObject({
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

      await claude.send('settings:refresh_usage', { channelId });

      const usageUpdates = claude.events('settings:usage');
      expect(usageUpdates.length).toBe(1);
      // contextUsage in settings:usage payload is z.record(string, unknown);
      // the strict ContextUsageData shape isn't carried through. Cast once.
      const ctx = usageUpdates[0].contextUsage as {
        totalTokens?: number;
        maxTokens?: number;
        percentage?: number;
        categories: Array<{ name: string }>;
        gridRows?: unknown;
        apiUsage?: unknown;
        mcpTools?: unknown;
        rawMaxTokens?: unknown;
      };
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
      expect(received.some((r) => r.request.subtype === 'set_model')).toBe(true);
    });

    it('set_permission_mode sends control_request to CLI', async () => {
      const { claude, channelId } = await setup();

      await claude.send('settings:set_permission_mode', { channelId, mode: 'plan' });

      const received = claude.received('control_request');
      expect(received.some((r) => r.request.subtype === 'set_permission_mode')).toBe(true);
    });
  });

  describe('control_request from CLI', () => {
    it('set_model updates sessionConfig and responds', async () => {
      const { container, claude, channelId } = await setup();

      await claude.emit(s.controlRequest('sm-1', 'set_model', undefined, { model: 'haiku' }));

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const channelManager = container.get(TYPES.ChannelManager) as InstanceType<
        typeof ChannelManager
      >;
      const channel = channelManager.get(channelId);
      expect(channel?.sessionConfig.model).toBe('haiku');
      expect(
        claude.received('control_response').some((r) => r.response?.request_id === 'sm-1'),
      ).toBe(true);
    });

    it('set_permission_mode updates sessionConfig and responds', async () => {
      const { container, claude, channelId } = await setup();

      await claude.emit(
        s.controlRequest('sp-1', 'set_permission_mode', undefined, { mode: 'plan' }),
      );

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const channelManager = container.get(TYPES.ChannelManager) as InstanceType<
        typeof ChannelManager
      >;
      const channel = channelManager.get(channelId);
      expect(channel?.sessionConfig.permissionMode).toBe('plan');
      expect(
        claude.received('control_response').some((r) => r.response?.request_id === 'sp-1'),
      ).toBe(true);
    });

    it('get_settings responds with current settings', async () => {
      const { claude, settingsStore } = await setup();
      await settingsStore.set('claude', 'model', 'opus');

      await claude.emit(s.controlRequest('gs-1', 'get_settings'));

      expect(
        claude.received('control_response').some((r) => r.response?.request_id === 'gs-1'),
      ).toBe(true);
    });
  });
});
