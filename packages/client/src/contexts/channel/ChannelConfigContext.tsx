import type {
  McpAuthResult,
  ModelInfo,
  ProviderClientConfig,
  ServerToClientEvents,
} from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { rpc } from '../../socket/rpc';
import { useSocket } from '../SocketContext';

type Payload<E extends keyof ServerToClientEvents> = Parameters<ServerToClientEvents[E]>[0];

export interface ConfigState {
  model: string | null;
  availableModels: ModelInfo[];
  mcpServers: Array<{ name: string; status: string; scope?: string }>;
  tools: string[];
  permissionMode: string | null;
  thinkingLevel: string;
  effort: 'low' | 'medium' | 'high' | 'max' | null;
  fastModeState: string | null;
  config: Record<string, unknown>;
  currentRepo: string | null;
  slashCommands: string[];
  providerConfig?: ProviderClientConfig;
}

export type McpResponse = { success: boolean; response?: Record<string, unknown>; error?: string };

export interface ChannelConfigValue extends Omit<ConfigState, 'effort'> {
  effort: 'low' | 'medium' | 'high' | 'max';
  isFastMode: boolean;
  providerConfig?: ProviderClientConfig;
  // Config actions
  setModel: (model: string) => void;
  setPermissionMode: (mode: string) => void;
  setThinkingLevel: (level: string) => void;
  setFastMode: (enabled: boolean) => void;
  setEffort: (
    effort: 'low' | 'medium' | 'high' | 'max',
  ) => Promise<{ success: boolean; error?: string }>;
  // MCP actions
  mcpStatus: () => Promise<McpResponse>;
  mcpToggle: (serverName: string, enabled: boolean) => Promise<McpResponse>;
  mcpReconnect: (serverName: string) => Promise<McpResponse>;
  mcpSetServers: (servers: Record<string, unknown>) => Promise<McpResponse>;
  mcpMessage: (serverName: string, message: Record<string, unknown>) => Promise<McpResponse>;
  mcpListTools: (serverName: string) => Promise<unknown[]>;
  mcpAuthenticate: (serverName: string) => Promise<McpAuthResult>;
  mcpOAuthCallback: (
    serverName: string,
    callbackUrl: string,
  ) => Promise<{ success: boolean; error?: string }>;
  mcpClearAuth: (serverName: string) => Promise<{ success: boolean; error?: string }>;
  // Integrations
  ensureChromeMcpEnabled: () => Promise<McpResponse>;
  disableChromeMcp: () => Promise<McpResponse>;
  enableJupyterMcp: () => Promise<McpResponse>;
  disableJupyterMcp: () => Promise<McpResponse>;
  askDebuggerHelp: () => Promise<McpResponse>;
}

const ChannelConfigContext = createContext<ChannelConfigValue | null>(null);

export function useChannelConfig(): ChannelConfigValue {
  const ctx = useContext(ChannelConfigContext);
  if (!ctx) throw new Error('useChannelConfig must be used within a ChannelProvider');
  return ctx;
}

const INITIAL_CONFIG: ConfigState = {
  model: null,
  availableModels: [],
  mcpServers: [],
  tools: [],
  permissionMode: null,
  thinkingLevel: 'off',
  effort: null,
  fastModeState: null,
  config: {},
  currentRepo: null,
  slashCommands: [],
};

const CONFIG_MAP: Record<string, keyof ConfigState> = {
  modelSetting: 'model',
  initialPermissionMode: 'permissionMode',
  tools: 'tools',
  thinkingLevel: 'thinkingLevel',
  effort: 'effort',
  fastModeState: 'fastModeState',
  currentRepo: 'currentRepo',
  config: 'config',
  mcpServers: 'mcpServers',
};

export function ChannelConfigProvider({
  channelId,
  initialConfig,
  children,
}: {
  channelId: string;
  initialConfig?: Partial<ConfigState>;
  children: ReactNode;
}) {
  const [configState, setConfigState] = useState<ConfigState>(() => ({
    ...INITIAL_CONFIG,
    ...initialConfig,
  }));

  const { socket } = useSocket();

  useEffect(() => {
    if (!channelId) return;

    const guard = (payload: { channelId: string }) =>
      payload.channelId === channelId || payload.channelId === '';

    const onStateUpdate = (payload: Payload<'state:update'>) => {
      if (!guard(payload)) return;
      const update: Partial<ConfigState> = {};
      for (const [payloadKey, stateKey] of Object.entries(CONFIG_MAP)) {
        const value = (payload as unknown as Record<string, unknown>)[payloadKey];
        if (value !== undefined) {
          (update as Record<string, unknown>)[stateKey] = value;
        }
      }
      if (Object.keys(update).length > 0) {
        setConfigState((prev) => ({ ...prev, ...update }));
      }
    };

    const onSessionStates = (payload: Payload<'session:states'>) => {
      for (const summary of payload.sessions) {
        if (summary.channelId !== channelId) continue;
        const update: Partial<ConfigState> = {};
        if (summary.modelSetting) update.model = summary.modelSetting;
        if (summary.permissionMode) update.permissionMode = summary.permissionMode;
        if (summary.effort) update.effort = summary.effort as ConfigState['effort'];
        if (Object.keys(update).length > 0) {
          setConfigState((prev) => ({ ...prev, ...update }));
        }
      }
    };

    const onSessionInit = (payload: Payload<'session:init'>) => {
      if (!guard(payload)) return;
      setConfigState((prev) => {
        // Preserve existing availableModels (managed by system:available_models event)
        // Only ensure the current model is in the list
        const availableModels = [...prev.availableModels];
        if (payload.model && !availableModels.some((m) => m.value === payload.model)) {
          availableModels.push({ value: payload.model });
        }
        return {
          ...prev,
          model: payload.model ?? null,
          availableModels,
          mcpServers: payload.mcpServers ?? prev.mcpServers,
          tools: payload.tools ?? [],
          permissionMode: prev.permissionMode ?? payload.permissionMode ?? null,
          fastModeState: (payload.fastModeState as string) ?? null,
          slashCommands: [...new Set([...(payload.slashCommands ?? []), 'usage'])],
          ...(payload.providerConfig ? { providerConfig: payload.providerConfig } : {}),
        };
      });
    };

    const onSessionStatus = (payload: Payload<'session:status'>) => {
      if (!guard(payload)) return;
      if (payload.permissionMode !== undefined) {
        setConfigState((prev) => ({ ...prev, permissionMode: payload.permissionMode ?? null }));
      }
    };

    const onAvailableModels = (payload: Payload<'system:available_models'>) => {
      const models = (payload.models as Array<string | { value: string }>).map((m) =>
        typeof m === 'string' ? { value: m } : (m as ModelInfo),
      );
      setConfigState((prev) => ({ ...prev, availableModels: models }));
    };

    socket.on('state:update', onStateUpdate);
    socket.on('session:states', onSessionStates);
    socket.on('session:init', onSessionInit);
    socket.on('session:status', onSessionStatus);
    socket.on('system:available_models', onAvailableModels);

    return () => {
      socket.off('state:update', onStateUpdate);
      socket.off('session:states', onSessionStates);
      socket.off('session:init', onSessionInit);
      socket.off('session:status', onSessionStatus);
      socket.off('system:available_models', onAvailableModels);
    };
  }, [channelId, socket]);

  // ── Stable actions (don't depend on configState) ──
  const actions = useMemo(() => {
    const emit = (event: string, payload: Record<string, unknown>, ...rest: unknown[]) => {
      (socket.emit as (...a: unknown[]) => unknown)(event, { channelId, ...payload }, ...rest);
    };

    return {
      setModel: (model: string) =>
        emit('set_model', { model }, (res: { success: boolean; error?: string }) => {
          if (!res?.success) toast.error(res?.error ?? 'Failed to switch model');
        }),
      setPermissionMode: (mode: string) => emit('set_permission_mode', { mode }),
      setThinkingLevel: (thinkingLevel: string) => emit('set_thinking_level', { thinkingLevel }),
      setFastMode: (enabled: boolean) => emit('chat:set_fast_mode', { enabled }),
      setEffort: (effort: 'low' | 'medium' | 'high' | 'max') =>
        rpc(socket, 'apply_settings', { channelId, settings: { effortLevel: effort } }),
      mcpStatus: () => rpc(socket, 'get_mcp_servers', { channelId }),
      mcpToggle: (serverName: string, enabled: boolean) =>
        rpc(socket, 'set_mcp_server_enabled', { channelId, serverName, enabled }),
      mcpReconnect: (serverName: string) =>
        rpc(socket, 'reconnect_mcp_server', { channelId, serverName }),
      mcpSetServers: (servers: Record<string, unknown>) =>
        rpc(socket, 'mcp_set_servers', { channelId, servers }),
      mcpMessage: (serverName: string, message: Record<string, unknown>) =>
        rpc(socket, 'mcp_message', { channelId, serverName, message }),
      mcpListTools: async (serverName: string) => {
        const result = await rpc(socket, 'mcp_message', {
          channelId,
          serverName,
          message: { jsonrpc: '2.0', method: 'tools/list', params: {}, id: Date.now() },
        });
        if (result.success && result.response) {
          const tools = (result.response as Record<string, unknown>).tools;
          return Array.isArray(tools) ? tools : [];
        }
        return [];
      },
      mcpAuthenticate: (serverName: string) =>
        rpc(socket, 'authenticate_mcp_server', { channelId, serverName }),
      mcpOAuthCallback: (serverName: string, callbackUrl: string) =>
        rpc(socket, 'submit_mcp_oauth_callback_url', { channelId, serverName, callbackUrl }),
      mcpClearAuth: (serverName: string) =>
        rpc(socket, 'clear_mcp_server_auth', { channelId, serverName }),
      ensureChromeMcpEnabled: () => rpc(socket, 'ensure_chrome_mcp_enabled', { channelId }),
      disableChromeMcp: () => rpc(socket, 'disable_chrome_mcp', { channelId }),
      enableJupyterMcp: () => rpc(socket, 'enable_jupyter_mcp', { channelId }),
      disableJupyterMcp: () => rpc(socket, 'disable_jupyter_mcp', { channelId }),
      askDebuggerHelp: () => rpc(socket, 'ask_debugger_help', { channelId }),
    };
  }, [socket, channelId]);

  // ── Context value (state + stable actions) ──
  const value = useMemo<ChannelConfigValue>(
    () => ({
      ...configState,
      effort: configState.effort ?? 'max',
      isFastMode: !!configState.fastModeState && configState.fastModeState !== 'off',
      ...actions,
    }),
    [configState, actions],
  );

  return <ChannelConfigContext.Provider value={value}>{children}</ChannelConfigContext.Provider>;
}
