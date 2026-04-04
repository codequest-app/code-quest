import type {
  AccountInfo,
  ControlResponse,
  McpAuthResult,
  ModelInfo,
  ProviderClientConfig,
  ServerToClientEvents,
  UsageQuota,
  WorktreeInfo,
} from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { useSocket } from '../SocketContext';
import { wireHandlers } from './handlers/guard';
import {
  configHandlers,
  createConfigActions,
  onSessionStates,
  parseModels,
  toEffort,
} from './handlers/settings';

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
  worktree: WorktreeInfo | null;
}

export interface ChannelConfigValue extends ConfigState {
  isFastMode: boolean;
  providerConfig?: ProviderClientConfig;
  setModel: (model: string) => void;
  setPermissionMode: (mode: string) => void;
  setThinkingLevel: (level: string) => void;
  setFastMode: (enabled: boolean) => void;
  setEffort: (effort: string) => Promise<{ success: boolean; error?: string }>;
  mcpStatus: () => Promise<ControlResponse>;
  mcpToggle: (serverName: string, enabled: boolean) => Promise<ControlResponse>;
  mcpReconnect: (serverName: string) => Promise<ControlResponse>;
  mcpSetServers: (servers: Record<string, unknown>) => Promise<ControlResponse>;
  mcpMessage: (serverName: string, message: Record<string, unknown>) => Promise<ControlResponse>;
  mcpListTools: (serverName: string) => Promise<unknown[]>;
  mcpAuthenticate: (serverName: string) => Promise<McpAuthResult>;
  mcpOAuthCallback: (
    serverName: string,
    callbackUrl: string,
  ) => Promise<{ success: boolean; error?: string }>;
  mcpClearAuth: (serverName: string) => Promise<{ success: boolean; error?: string }>;
  ensureChromeMcpEnabled: () => Promise<ControlResponse>;
  disableChromeMcp: () => Promise<ControlResponse>;
  enableJupyterMcp: () => Promise<ControlResponse>;
  disableJupyterMcp: () => Promise<ControlResponse>;
  askDebuggerHelp: () => Promise<ControlResponse>;
  requestUsageUpdate: () => void;
  openWorktree: (info: WorktreeInfo) => void;
}

type ConfigStateValue = ConfigState & { isFastMode: boolean };
type ConfigActionsValue = Omit<ChannelConfigValue, keyof ConfigStateValue>;

const ConfigStateContext = createContext<ConfigStateValue | null>(null);
const ConfigActionsContext = createContext<ConfigActionsValue | null>(null);

export function useChannelConfig(): ChannelConfigValue {
  const state = useContext(ConfigStateContext);
  const actions = useContext(ConfigActionsContext);
  if (!state || !actions) throw new Error('useChannelConfig must be used within a ChannelProvider');
  return { ...state, ...actions };
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
  worktree: null,
};

export function ChannelConfigProvider({
  channelId,
  initialConfig,
  onWorktree,
  children,
}: {
  channelId: string;
  initialConfig?: Partial<ConfigState>;
  onWorktree?: (info: WorktreeInfo) => void;
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
    return wireHandlers(socket, channelId, configHandlers, setConfigState);
  }, [channelId, socket]);

  // ── Special: session:states (needs channelId for matching) ──
  useEffect(() => {
    if (!channelId) return;
    const fn = (payload: Payload<'session:states'>) => {
      setConfigState((prev) => onSessionStates(prev, payload, channelId));
    };
    socket.on('session:states', fn);
    return () => {
      socket.off('session:states', fn);
    };
  }, [channelId, socket]);

  // ── Stable actions (only re-created when socket/channelId change) ──
  const baseActions = createConfigActions({ socket, channelId });
  const actions = {
    ...baseActions,
    openWorktree: (info: WorktreeInfo) => onWorktree?.(info),
  };

  // ── State value ──
  const stateValue: ConfigStateValue = {
    ...configState,
    isFastMode: !!configState.fastModeState && configState.fastModeState !== 'off',
  };

  return (
    <ConfigActionsContext.Provider value={actions}>
      <ConfigStateContext.Provider value={stateValue}>{children}</ConfigStateContext.Provider>
    </ConfigActionsContext.Provider>
  );
}
