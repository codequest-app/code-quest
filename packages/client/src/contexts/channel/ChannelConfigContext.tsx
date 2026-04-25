import {
  type AccountInfo,
  type Ack,
  type ControlResponse,
  type EffortLevel,
  EVENTS,
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
import { useSession } from '../SessionContext';
import { useSocket } from '../SocketContext';
import { useChannelMessagesActions } from './ChannelMessagesContext';
import { useChannelId } from './ChannelMetaContext';
import { useChannelSocketRouter } from './ChannelSocketRouterContext';
import { configHandlers, createConfigActions, parseModels, toEffort } from './handlers/settings';

export interface ConfigState {
  model: string | null;
  availableModels: ModelInfo[];
  mcpServers: Array<{ name: string; status: string; scope?: string }>;
  tools: string[];
  permissionMode: string | null;
  thinkingLevel: string;
  effort: EffortLevel | null;
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
  setEffort: (effort: string) => Promise<Ack>;
  mcpStatus: () => Promise<ControlResponse>;
  mcpToggle: (serverName: string, enabled: boolean) => Promise<ControlResponse>;
  mcpReconnect: (serverName: string) => Promise<ControlResponse>;
  mcpSetServers: (servers: Record<string, unknown>) => Promise<ControlResponse>;
  mcpMessage: (serverName: string, message: Record<string, unknown>) => Promise<ControlResponse>;
  mcpListTools: (serverName: string) => Promise<unknown[]>;
  mcpAuthenticate: (serverName: string) => Promise<RpcResult<{ authUrl?: string }>>;
  mcpOAuthCallback: (serverName: string, callbackUrl: string) => Promise<Ack>;
  mcpClearAuth: (serverName: string) => Promise<Ack>;
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
    socket.emit(EVENTS.app.config, { channelId }, (raw) => {
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

  const router = useChannelSocketRouter();

  // ── Auto-wiring: handler map events ──
  useEffect(() => {
    if (!channelId) return;
    return router.register(configHandlers, setConfigState);
  }, [channelId, router]);

  // ── Derive model/permissionMode/effort from SessionContext.sessions ──
  // Every session:states broadcast reseats `sessions` globally, firing this
  // effect for every channel's ConfigContext. Bail by value (===) so
  // unrelated channels don't churn setConfigState.
  const { sessions } = useSession();
  useEffect(() => {
    if (!channelId) return;
    const summary = sessions.find((s) => s.channelId === channelId);
    if (!summary) return;
    setConfigState((prev) => {
      const nextModel = summary.modelSetting ?? prev.model;
      const nextPermissionMode = summary.permissionMode ?? prev.permissionMode;
      const nextEffort = summary.effort ? toEffort(summary.effort) : prev.effort;
      if (
        prev.model === nextModel &&
        prev.permissionMode === nextPermissionMode &&
        prev.effort === nextEffort
      ) {
        return prev;
      }
      return {
        ...prev,
        model: nextModel,
        permissionMode: nextPermissionMode,
        effort: nextEffort,
      };
    });
  }, [channelId, sessions]);

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
