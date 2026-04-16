import {
  type AccountInfo,
  type ControlResponse,
  getProviderConfigResponseSchema,
  type ModelInfo,
  type ProviderClientConfig,
  type RpcResult,
  type UsageQuota,
  type WorktreeInfo,
} from '@code-quest/shared';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useSocket } from '../SocketContext';
import { useChannelId } from './ChannelIdContext';
import { useChannelMessagesActions } from './ChannelMessagesContext';
import type { Payload } from './handlers/guard';
import { wireHandlers } from './handlers/guard';
import {
  configHandlers,
  createConfigActions,
  onSessionStates,
  parseModels,
  toEffort,
} from './handlers/settings';

export interface ConfigState {
  model: string | null;
  availableModels: ModelInfo[];
  mcpServers: Array<{ name: string; status: string; scope?: string }>;
  tools: string[];
  permissionMode: string | null;
  thinkingLevel: string;
  effort: 'low' | 'medium' | 'high' | 'max' | null;
  fastModeState: 'on' | 'off' | null;
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
  setEffort: (effort: string) => Promise<RpcResult<Record<string, never>>>;
  mcpStatus: () => Promise<ControlResponse>;
  mcpToggle: (serverName: string, enabled: boolean) => Promise<ControlResponse>;
  mcpReconnect: (serverName: string) => Promise<ControlResponse>;
  mcpSetServers: (servers: Record<string, unknown>) => Promise<ControlResponse>;
  mcpMessage: (serverName: string, message: Record<string, unknown>) => Promise<ControlResponse>;
  mcpListTools: (serverName: string) => Promise<unknown[]>;
  mcpAuthenticate: (serverName: string) => Promise<RpcResult<{ authUrl?: string }>>;
  mcpOAuthCallback: (
    serverName: string,
    callbackUrl: string,
  ) => Promise<RpcResult<Record<string, never>>>;
  mcpClearAuth: (serverName: string) => Promise<RpcResult<Record<string, never>>>;
  ensureChromeMcpEnabled: () => Promise<ControlResponse>;
  disableChromeMcp: () => Promise<ControlResponse>;
  enableJupyterMcp: () => Promise<ControlResponse>;
  disableJupyterMcp: () => Promise<ControlResponse>;
  askDebuggerHelp: () => Promise<RpcResult<{ response: { type: 'ask_debugger_help_response' } }>>;
  requestUsageUpdate: () => void;
  openNewChannel: (cwd: string) => void;
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
  initialConfig,
  onNewChannel,
  children,
}: {
  initialConfig?: Partial<ConfigState>;
  onNewChannel?: (cwd: string) => void;
  children: ReactNode;
}) {
  const channelId = useChannelId();
  const { addSystemMessage } = useChannelMessagesActions();
  const [configState, setConfigState] = useState<ConfigState>(() => ({
    ...INITIAL_CONFIG,
    ...initialConfig,
  }));

  const { socket } = useSocket();

  const socketRef = useRef(socket);
  const channelIdRef = useRef(channelId);
  const onNewChannelRef = useRef(onNewChannel);
  useLayoutEffect(() => {
    socketRef.current = socket;
    channelIdRef.current = channelId;
    onNewChannelRef.current = onNewChannel;
  });

  // ── Fetch provider config on mount ──
  useEffect(() => {
    if (!channelId) return;
    socket.emit('app:config', { channelId }, (raw) => {
      const parsed = getProviderConfigResponseSchema.safeParse(raw);
      if (!parsed.success) return;
      const res = parsed.data;
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

  // ── Stable actions (created once, read deps from refs) ──
  const setConfigStateRef = useRef(setConfigState);
  useLayoutEffect(() => {
    setConfigStateRef.current = setConfigState;
  });
  const addSystemMessageRef = useRef(addSystemMessage);
  useLayoutEffect(() => {
    addSystemMessageRef.current = addSystemMessage;
  });
  const [depsProxy] = useState(() => ({
    get socket() {
      return socketRef.current;
    },
    get channelId() {
      return channelIdRef.current;
    },
    get setState() {
      return setConfigStateRef.current;
    },
    get addSystemMessage() {
      return addSystemMessageRef.current;
    },
  }));
  const [actions] = useState<ConfigActionsValue>(() => ({
    ...createConfigActions(depsProxy),
    openNewChannel: (cwd: string) => onNewChannelRef.current?.(cwd),
  }));

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
