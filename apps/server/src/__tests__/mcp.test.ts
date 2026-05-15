import type {
  Ack,
  DisableChromeMcpResponse,
  DisableJupyterMcpResponse,
  EnableJupyterMcpResponse,
  EnsureChromeMcpResponse,
  RpcResult,
} from '@code-quest/schemas';
import { segments as s } from '@code-quest/summoner/test';
import { createFakeSummoner } from '../test/index.ts';

type McpAuthResp = RpcResult<{ authUrl?: string }>;
type McpEmptyResp = Ack;
type McpAskDebuggerResp = RpcResult<{ response: { type: 'ask_debugger_help_response' } }>;
type McpAskDebuggerOk = Extract<McpAskDebuggerResp, { ok: true }>;

async function setup() {
  const claude = createFakeSummoner().claude();
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

      const result = await claude.send<McpAuthResp>('mcp:authenticate', {
        channelId,
        serverName: 'test-server',
      });

      expect(result.ok).toBe(true);
      const received = claude.received('control_request');
      expect(received.some((r) => r.request.subtype === 'mcp_authenticate')).toBe(true);
    });

    it('mcp:authenticate returns error when no active session', async () => {
      const { claude } = await setup();

      const result = await claude.send<McpAuthResp>('mcp:authenticate', {
        channelId: 'nonexistent',
        serverName: 'test',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe('Session not found');
    });

    it('mcp:clear_auth sends control_request and returns success', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send<McpEmptyResp>('mcp:clear_auth', {
        channelId,
        serverName: 'test-server',
      });

      expect(result.ok).toBe(true);
      const received = claude.received('control_request');
      expect(received.some((r) => r.request.subtype === 'mcp_clear_auth')).toBe(true);
    });

    it('mcp:clear_auth returns error when no active session', async () => {
      const { claude } = await setup();

      const result = await claude.send<McpEmptyResp>('mcp:clear_auth', {
        channelId: 'nonexistent',
        serverName: 'test',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe('Session not found');
    });
  });

  describe('mcp:oauth_callback', () => {
    it('sends mcp_oauth_callback_url control_request', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send<McpEmptyResp>('mcp:oauth_callback', {
        channelId,
        serverName: 'test-server',
        callbackUrl: 'https://example.com/callback?code=abc',
      });

      expect(result.ok).toBe(true);
      const received = claude.received('control_request');
      expect(received.some((r) => r.request.subtype === 'mcp_oauth_callback_url')).toBe(true);
    });

    it('returns error when session not found', async () => {
      const { claude } = await setup();

      const result = await claude.send<McpEmptyResp>('mcp:oauth_callback', {
        channelId: 'nonexistent',
        serverName: 'test',
        callbackUrl: 'https://example.com/cb',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe('Session not found');
    });

    it('returns error for invalid callbackUrl', async () => {
      const { claude } = await setup();

      const result = await claude.send<McpEmptyResp>('mcp:oauth_callback', {
        channelId: 'any',
        serverName: 'test',
        callbackUrl: 'not-a-url',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBeDefined();
    });
  });

  describe('MCP control socket events', () => {
    it('ensure_chrome_mcp_enabled: emits connecting then connected and returns wasDisabled:true', async () => {
      const { claude } = await setup();

      const res = await claude.send<EnsureChromeMcpResponse>('mcp:ensure_chrome', {
        channelId: 'any',
      });

      expect(res.success).toBe(true);
      expect(res.response?.wasDisabled).toBe(true);

      const states = claude
        .receivedEvents('settings:update')
        .filter((p) => p.chromeMcpState)
        .map((p) => p.chromeMcpState?.status);
      expect(states).toContain('connecting');
      expect(states).toContain('connected');
    });

    it('ensure_chrome_mcp_enabled: returns wasDisabled:false when already connected', async () => {
      const { claude } = await setup();

      await claude.send('mcp:ensure_chrome', { channelId: 'any' });

      const res = await claude.send<EnsureChromeMcpResponse>('mcp:ensure_chrome', {
        channelId: 'any',
      });

      expect(res.success).toBe(true);
      expect(res.response?.wasDisabled).toBe(false);
    });

    it('disable_chrome_mcp: emits disconnected and returns wasEnabled:true', async () => {
      const { claude } = await setup();

      await claude.send('mcp:ensure_chrome', { channelId: 'any' });

      const countBefore = claude.receivedEvents('settings:update').length;

      const res = await claude.send<DisableChromeMcpResponse>('mcp:disable_chrome', {
        channelId: 'any',
      });

      expect(res.success).toBe(true);
      expect(res.response?.wasEnabled).toBe(true);

      const states = claude
        .receivedEvents('settings:update')
        .slice(countBefore)
        .filter((p) => p.chromeMcpState)
        .map((p) => p.chromeMcpState?.status);
      expect(states).toContain('disconnected');
    });

    it('enable_jupyter_mcp: emits active and returns correct response', async () => {
      const { claude } = await setup();

      const res = await claude.send<EnableJupyterMcpResponse>('mcp:enable_jupyter', {
        channelId: 'any',
      });

      expect(res.success).toBe(true);
      expect(res.response?.type).toBe('enable_jupyter_mcp_response');

      const states = claude
        .receivedEvents('settings:update')
        .filter((p) => p.jupyterMcpState)
        .map((p) => p.jupyterMcpState?.status);
      expect(states).toContain('active');
    });

    it('disable_jupyter_mcp: emits inactive and returns correct response', async () => {
      const { claude } = await setup();

      const res = await claude.send<DisableJupyterMcpResponse>('mcp:disable_jupyter', {
        channelId: 'any',
      });

      expect(res.success).toBe(true);
      expect(res.response?.type).toBe('disable_jupyter_mcp_response');

      const states = claude
        .receivedEvents('settings:update')
        .filter((p) => p.jupyterMcpState)
        .map((p) => p.jupyterMcpState?.status);
      expect(states).toContain('inactive');
    });

    it('ask_debugger_help: returns ask_debugger_help_response without state mutation', async () => {
      const { claude } = await setup();

      const res = (await claude.send<McpAskDebuggerResp>('mcp:ask_debugger', {
        channelId: 'any',
      })) as McpAskDebuggerOk;

      expect(res.ok).toBe(true);
      expect(res.data.response.type).toBe('ask_debugger_help_response');
      // No settings:update with debugger state should have been pushed
      const debuggerUpdates = claude
        .receivedEvents('settings:update')
        .filter((p) => p.debuggerMcpState);
      expect(debuggerUpdates).toHaveLength(0);
    });

    it('all handlers return error when channelId is missing', async () => {
      const { claude } = await setup();

      type ControlResp = { success: boolean; error?: string };
      type RpcResp = { ok: boolean; error?: string };

      const chrome = await claude.send<ControlResp>('mcp:ensure_chrome', {});
      expect(chrome.success).toBe(false);
      expect(chrome.error).toBeDefined();

      const disableChrome = await claude.send<ControlResp>('mcp:disable_chrome', {});
      expect(disableChrome.success).toBe(false);
      expect(disableChrome.error).toBeDefined();

      const enableJ = await claude.send<ControlResp>('mcp:enable_jupyter', {});
      expect(enableJ.success).toBe(false);
      expect(enableJ.error).toBeDefined();

      const disableJ = await claude.send<ControlResp>('mcp:disable_jupyter', {});
      expect(disableJ.success).toBe(false);
      expect(disableJ.error).toBeDefined();

      const askDbg = await claude.send<RpcResp>('mcp:ask_debugger', {});
      expect(askDbg.ok).toBe(false);
      expect(askDbg.error).toBeDefined();
    });
  });

  describe('mcp_message control_request', () => {
    it('forwards to client as control:mcp event', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emitSegment(
        s.controlRequest('mcp-1', 'mcp_message', undefined, {
          server_name: 'test-server',
          message: { jsonrpc: '2.0', method: 'test', id: 1 },
        }),
      );

      expect(claude.receivedEvents('control:mcp').length).toBeGreaterThan(0);
    });

    it('mcp_message is NOT auto-responded — passthrough to client', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emitSegment(
        s.controlRequest('mcp-pass', 'mcp_message', undefined, {
          server_name: 'test',
          message: { jsonrpc: '2.0', method: 'test', id: 1 },
        }),
      );

      const mcpEvents = claude.receivedEvents('control:mcp');
      expect(mcpEvents.length).toBeGreaterThan(0);
      // mcp_message should be forwarded to client, not auto-responded
      expect(mcpEvents[0]!.requestId).toBe('mcp-pass');
    });
  });
});
