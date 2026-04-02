import type { AccountInfo, McpAuthResult, ModelInfo, ProviderClientConfig, ServerToClientEvents, UsageQuota } from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useSocket } from '../SocketContext';
import {
  configHandlers,
  createConfigActions,
  onSessionStates,
  parseModels,
  toEffort,
} from '../handlers/channel/configHandlers';

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
  accountInfo: AccountInfo | null;
  experimentGates: Record<string, boolean>;
  usageQuota: UsageQuota | null;
  contextUsage: Record<string, unknown> | null;
}

export type McpResponse = { success: boolean; response?: Record<string, unknown>; error?: string };

export interface ChannelConfigValue extends ConfigState {
  isFastMode: boolean;
  providerConfig?: ProviderClientConfig;
  setModel: (model: string) => void;
  setPermissionMode: (mode: string) => void;
  setThinkingLevel: (level: string) => void;
  setFastMode: (enabled: boolean) => void;
  setEffort: (effort: string) => Promise<{ success: boolean; error?: string }>;
  mcpStatus: () => Promise<McpResponse>;
  mcpToggle: (serverName: string, enabled: boolean) => Promise<McpResponse>;
  mcpReconnect: (serverName: string) => Promise<McpResponse>;
  mcpSetServers: (servers: Record<string, unknown>) => Promise<McpResponse>;
  mcpMessage: (serverName: string, message: Record<string, unknown>) => Promise<McpResponse>;
  mcpListTools: (serverName: string) => Promise<unknown[]>;
  mcpAuthenticate: (serverName: string) => Promise<McpAuthResult>;
  mcpOAuthCallback: (serverName: string, callbackUrl: string) => Promise<{ success: boolean; error?: string }>;
  mcpClearAuth: (serverName: string) => Promise<{ success: boolean; error?: string }>;
  ensureChromeMcpEnabled: () => Promise<McpResponse>;
  disableChromeMcp: () => Promise<McpResponse>;
  enableJupyterMcp: () => Promise<McpResponse>;
  disableJupyterMcp: () => Promise<McpResponse>;
  askDebuggerHelp: () => Promise<McpResponse>;
  requestUsageUpdate: () => void;
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
  accountInfo: null,
  experimentGates: {},
  usageQuota: null,
  contextUsage: null,
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

  // ── Fetch provider config on mount ──
  useEffect(() => {
    if (!channelId) return;
    socket.emit('app:config', { channelId }, (res) => {
      const models =
        Array.isArray(res.models) && res.models.length > 0
          ? parseModels(res.models)
          : res.providerConfig?.defaultModels
            ? parseModels(res.providerConfig.defaultModels)
            : undefined;
      setConfigState((prev) => ({
        ...prev,
        ...(res.providerConfig ? { providerConfig: res.providerConfig } : {}),
        ...(models ? { availableModels: models } : {}),
        ...(res.effort ? { effort: toEffort(res.effort) } : {}),
      }));
    });
  }, [channelId, socket]);

  // ── Auto-wiring: handler map events ──
  useEffect(() => {
    if (!channelId) return;
    const guard = (p: { channelId: string }) => p.channelId === channelId || p.channelId === '';

    const entries = Object.entries(configHandlers) as Array<
      [string, (state: ConfigState, payload: never) => ConfigState]
    >;
    const wired = entries.map(([event, handler]) => {
      const fn = (payload: { channelId: string }) => {
        if (!guard(payload)) return;
        setConfigState((prev) => handler(prev, payload as never));
      };
      socket.on(event as never, fn as never);
      return { event, fn };
    });

    return () => {
      for (const { event, fn } of wired) {
        socket.off(event as never, fn as never);
      }
    };
  }, [channelId, socket]);

  // ── Special: session:states (needs channelId for matching) ──
  useEffect(() => {
    if (!channelId) return;
    const fn = (payload: Payload<'session:states'>) => {
      setConfigState((prev) => onSessionStates(prev, payload, channelId));
    };
    socket.on('session:states', fn);
    return () => { socket.off('session:states', fn); };
  }, [channelId, socket]);

  // ── Stable actions ──
  const actions = useMemo(
    () => createConfigActions({ socket, channelId }),
    [socket, channelId],
  );

  // ── Context value ──
  const value = useMemo<ChannelConfigValue>(
    () => ({
      ...configState,
      isFastMode: !!configState.fastModeState && configState.fastModeState !== 'off',
      ...actions,
    }),
    [configState, actions],
  );

  return <ChannelConfigContext.Provider value={value}>{children}</ChannelConfigContext.Provider>;
}
