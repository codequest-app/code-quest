/* biome-ignore-all lint/suspicious/noExplicitAny: test file uses type assertions */
import { createFakeClaude } from '../test/index.ts';

async function setup() {
  const claude = createFakeClaude();
  const channelId = await claude.initialize();
  return { claude, channelId };
}

describe('ChatHandler > mcp', () => {
  describe('mcp:reconnect', () => {
    it('returns error via callback when session not found', async () => {
      const { claude } = await setup();

      const result = await claude.send('mcp:reconnect', {
        channelId: 'nonexistent',
        serverName: 'test',
      });
      expect(result).toMatchObject({ error: 'Session not found' });
    });
  });

  describe('mcp:servers', () => {
    it('returns error via callback when session not found', async () => {
      const { claude } = await setup();

      const result = await claude.send('mcp:servers', { channelId: 'nonexistent' });
      expect(result).toMatchObject({ error: 'Session not found' });
    });
  });

  describe('mcp:authenticate and mcp:clear_auth', () => {
    it('mcp:authenticate sends control_request and returns success', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send<{ success: boolean; authUrl?: string; error?: string }>(
        'mcp:authenticate',
        { channelId, serverName: 'test-server' },
      );

      expect(result.success).toBe(true);
      const received = claude.received('control_request');
      expect(received.some((r) => (r.request as any)?.subtype === 'mcp_authenticate')).toBe(true);
    });

    it('mcp:authenticate returns error when no active session', async () => {
      const { claude } = await setup();

      const result = await claude.send<{ success: boolean; error?: string }>('mcp:authenticate', {
        channelId: 'nonexistent',
        serverName: 'test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Session not found');
    });

    it('mcp:clear_auth sends control_request and returns success', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send<{ success: boolean; error?: string }>('mcp:clear_auth', {
        channelId,
        serverName: 'test-server',
      });

      expect(result.success).toBe(true);
      const received = claude.received('control_request');
      expect(received.some((r) => (r.request as any)?.subtype === 'mcp_clear_auth')).toBe(true);
    });

    it('mcp:clear_auth returns error when no active session', async () => {
      const { claude } = await setup();

      const result = await claude.send<{ success: boolean; error?: string }>('mcp:clear_auth', {
        channelId: 'nonexistent',
        serverName: 'test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Session not found');
    });
  });

  describe('mcp:oauth_callback', () => {
    it('sends mcp_oauth_callback_url control_request', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send<{ success: boolean; error?: string }>('mcp:oauth_callback', {
        channelId,
        serverName: 'test-server',
        callbackUrl: 'https://example.com/callback?code=abc',
      });

      expect(result.success).toBe(true);
      const received = claude.received('control_request');
      expect(received.some((r) => (r.request as any)?.subtype === 'mcp_oauth_callback_url')).toBe(
        true,
      );
    });

    it('returns error when session not found', async () => {
      const { claude } = await setup();

      const result = await claude.send<{ success: boolean; error?: string }>('mcp:oauth_callback', {
        channelId: 'nonexistent',
        serverName: 'test',
        callbackUrl: 'https://example.com/cb',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Session not found');
    });

    it('returns error for invalid callbackUrl', async () => {
      const { claude } = await setup();

      const result = await claude.send<{ success: boolean; error?: string }>('mcp:oauth_callback', {
        channelId: 'any',
        serverName: 'test',
        callbackUrl: 'not-a-url',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('MCP control socket events', () => {
    it('ensure_chrome_mcp_enabled: emits connecting then connected and returns wasDisabled:true', async () => {
      const { claude } = await setup();
      const stateUpdates: any[] = [];
      claude.socket.on('settings:update' as any, (p: any) => stateUpdates.push(p));

      const res = await claude.send<{ success: boolean; response?: Record<string, unknown> }>(
        'mcp:ensure_chrome',
        { channelId: 'any' },
      );

      expect(res.success).toBe(true);
      expect((res.response as any).wasDisabled).toBe(true);

      const states = stateUpdates
        .filter((p: any) => p.chromeMcpState)
        .map((p: any) => p.chromeMcpState.status);
      expect(states).toContain('connecting');
      expect(states).toContain('connected');
    });

    it('ensure_chrome_mcp_enabled: returns wasDisabled:false when already connected', async () => {
      const { claude } = await setup();

      await claude.send('mcp:ensure_chrome', { channelId: 'any' });

      const res = await claude.send<{ success: boolean; response?: Record<string, unknown> }>(
        'mcp:ensure_chrome',
        { channelId: 'any' },
      );

      expect(res.success).toBe(true);
      expect((res.response as any).wasDisabled).toBe(false);
    });

    it('disable_chrome_mcp: emits disconnected and returns wasEnabled:true', async () => {
      const { claude } = await setup();

      await claude.send('mcp:ensure_chrome', { channelId: 'any' });

      const stateUpdates: any[] = [];
      claude.socket.on('settings:update' as any, (p: any) => stateUpdates.push(p));

      const res = await claude.send<{ success: boolean; response?: Record<string, unknown> }>(
        'mcp:disable_chrome',
        { channelId: 'any' },
      );

      expect(res.success).toBe(true);
      expect((res.response as any).wasEnabled).toBe(true);

      const states = stateUpdates
        .filter((p: any) => p.chromeMcpState)
        .map((p: any) => p.chromeMcpState.status);
      expect(states).toContain('disconnected');
    });

    it('enable_jupyter_mcp: emits active and returns correct response', async () => {
      const { claude } = await setup();
      const stateUpdates: any[] = [];
      claude.socket.on('settings:update' as any, (p: any) => stateUpdates.push(p));

      const res = await claude.send<{ success: boolean; response?: Record<string, unknown> }>(
        'mcp:enable_jupyter',
        { channelId: 'any' },
      );

      expect(res.success).toBe(true);
      expect((res.response as any).type).toBe('enable_jupyter_mcp_response');

      const states = stateUpdates
        .filter((p: any) => p.jupyterMcpState)
        .map((p: any) => p.jupyterMcpState.status);
      expect(states).toContain('active');
    });

    it('disable_jupyter_mcp: emits inactive and returns correct response', async () => {
      const { claude } = await setup();
      const stateUpdates: any[] = [];
      claude.socket.on('settings:update' as any, (p: any) => stateUpdates.push(p));

      const res = await claude.send<{ success: boolean; response?: Record<string, unknown> }>(
        'mcp:disable_jupyter',
        { channelId: 'any' },
      );

      expect(res.success).toBe(true);
      expect((res.response as any).type).toBe('disable_jupyter_mcp_response');

      const states = stateUpdates
        .filter((p: any) => p.jupyterMcpState)
        .map((p: any) => p.jupyterMcpState.status);
      expect(states).toContain('inactive');
    });

    it('ask_debugger_help: returns ask_debugger_help_response without state mutation', async () => {
      const { claude } = await setup();
      const stateUpdates: any[] = [];
      claude.socket.on('settings:update' as any, (p: any) => stateUpdates.push(p));

      const res = await claude.send<{ success: boolean; response?: Record<string, unknown> }>(
        'mcp:ask_debugger',
        { channelId: 'any' },
      );

      expect(res.success).toBe(true);
      expect((res.response as any).type).toBe('ask_debugger_help_response');
      // No settings:update with debugger state should have been pushed
      const debuggerUpdates = stateUpdates.filter((p: any) => p.debuggerMcpState);
      expect(debuggerUpdates).toHaveLength(0);
    });

    it('all handlers return error when channelId is missing', async () => {
      const { claude } = await setup();

      const events = [
        'mcp:ensure_chrome',
        'mcp:disable_chrome',
        'mcp:enable_jupyter',
        'mcp:disable_jupyter',
        'mcp:ask_debugger',
      ] as const;

      for (const event of events) {
        const res = await claude.send<{ success: boolean; error?: string }>(event, {});
        expect(res.success).toBe(false);
        expect(res.error).toBeDefined();
      }
    });
  });
});
