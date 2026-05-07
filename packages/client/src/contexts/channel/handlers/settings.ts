import {
  type Ack,
  type ControlResponse,
  EVENTS,
  effortLevelSchema,
  type ModelInfo,
  modelInfoSchema,
  type RpcResult,
  type UsageQuota,
  usageQuotaSchema,
  worktreeInfoSchema,
} from '@code-quest/shared';
import { toast } from 'sonner';
import type { TypedSocket } from '@/socket/client';
import { channelEmit, rpc } from '@/socket/rpc';
import { findModel } from '@/utils/model-utils';
import type { ConfigState } from '../ChannelConfigContext.tsx';
import type { Payload } from './guard.ts';

function toEffort(value: string | undefined): ConfigState['effort'] {
  return effortLevelSchema.safeParse(value).data ?? null;
}

function parseModels(raw: unknown[]): ModelInfo[] {
  return raw
    .map((m) => {
      if (typeof m === 'string') return { value: m };
      const parsed = modelInfoSchema.safeParse(m);
      return parsed.success ? parsed.data : null;
    })
    .filter((m): m is ModelInfo => m !== null);
}

// ── On handlers: (state, payload) → newState ──

function onSettingsUpdate(state: ConfigState, payload: Payload<'settings:update'>): ConfigState {
  const update: Partial<ConfigState> = {};
  if (payload.model !== undefined) update.model = payload.model;
  if (payload.permissionMode !== undefined) update.permissionMode = payload.permissionMode;
  if (payload.tools !== undefined) update.tools = payload.tools;
  if (payload.thinkingLevel !== undefined) update.thinkingLevel = payload.thinkingLevel;
  if (payload.fastModeState !== undefined) update.fastModeState = payload.fastModeState;
  if (payload.config !== undefined) update.config = payload.config;
  if (payload.mcpServers !== undefined) update.mcpServers = payload.mcpServers;
  if (payload.effort !== undefined) update.effort = toEffort(payload.effort);
  if (payload.currentRepo !== undefined) update.currentRepo = payload.currentRepo ?? null;
  if (payload.accountInfo !== undefined) {
    update.accountInfo = state.accountInfo
      ? { ...state.accountInfo, ...payload.accountInfo }
      : (payload.accountInfo ?? null);
  }
  if ('worktree' in payload) {
    update.worktree = worktreeInfoSchema.safeParse(payload.worktree).data ?? null;
  }
  if (Object.keys(update).length === 0) return state;
  return { ...state, ...update };
}

function onExperimentGates(state: ConfigState, p: Payload<'app:experiment_gates'>): ConfigState {
  return { ...state, experimentGates: p.gates };
}

function buildSlashCommands(names: string[]): string[] {
  return [...new Set([...names, 'usage'])];
}

function onSessionInit(state: ConfigState, payload: Payload<'session:init'>): ConfigState {
  const availableModels = [...state.availableModels];
  if (payload.model && !findModel(payload.model, availableModels)) {
    const defaults = state.providerConfig?.defaultModels ?? [];
    const match = findModel(
      payload.model,
      defaults.map((d) => ({ ...d })),
    );
    availableModels.push(match ?? { value: payload.model });
  }
  return {
    ...state,
    model: payload.model ?? null,
    availableModels,
    mcpServers: payload.mcpServers ?? state.mcpServers,
    tools: payload.tools ?? [],
    permissionMode: state.permissionMode ?? payload.permissionMode ?? null,
    fastModeState:
      payload.fastModeState === 'on' || payload.fastModeState === 'off'
        ? payload.fastModeState
        : null,
    slashCommands: buildSlashCommands(payload.slashCommands ?? []),
  };
}

function onPluginReloaded(state: ConfigState, payload: Payload<'plugin:reloaded'>): ConfigState {
  const update: Partial<ConfigState> = {};
  if (payload.commands) {
    update.slashCommands = buildSlashCommands(payload.commands.map((c) => c.name));
  }
  if (payload.mcpServers) {
    update.mcpServers = payload.mcpServers;
  }
  if (Object.keys(update).length === 0) return state;
  return { ...state, ...update };
}

function onSessionStatus(state: ConfigState, payload: Payload<'session:status'>): ConfigState {
  if (payload.permissionMode === undefined) return state;
  return { ...state, permissionMode: payload.permissionMode ?? null };
}

function onAvailableModels(state: ConfigState, payload: Payload<'app:models'>): ConfigState {
  if (!Array.isArray(payload.models)) return state;
  const existing = state.availableModels;
  const defaults = state.providerConfig?.defaultModels ?? [];
  const models = parseModels(payload.models).map((m) => {
    if (Object.keys(m).length > 1) return m;
    return findModel(m.value, existing) ?? findModel(m.value, defaults) ?? m;
  });
  return { ...state, availableModels: models };
}

type TierKey = keyof typeof usageQuotaSchema.shape;

function onRateLimitQuota(state: ConfigState, p: Payload<'system:rate_limit'>): ConfigState {
  const { rateLimitType, resetsAt, utilization } = p.info;
  if (!rateLimitType || !(rateLimitType in usageQuotaSchema.shape)) return state;
  const tierKey = rateLimitType as TierKey;
  const currentQuota: UsageQuota = state.usageQuota ?? {};
  return {
    ...state,
    usageQuota: {
      ...currentQuota,
      [tierKey]: {
        utilization: typeof utilization === 'number' ? utilization : 0,
        ...(resetsAt != null ? { resets_at: new Date(Number(resetsAt) * 1000).toISOString() } : {}),
      },
    },
  };
}

function onSettingsUsage(state: ConfigState, p: Payload<'settings:usage'>): ConfigState {
  return {
    ...state,
    usageQuota: p.usage,
    ...(p.contextUsage ? { contextUsage: p.contextUsage } : {}),
  };
}

export const configHandlers: {
  'settings:update': typeof onSettingsUpdate;
  'session:init': typeof onSessionInit;
  'session:status': typeof onSessionStatus;
  'app:models': typeof onAvailableModels;
  'app:experiment_gates': typeof onExperimentGates;
  'settings:usage': typeof onSettingsUsage;
  'system:rate_limit': typeof onRateLimitQuota;
  'plugin:reloaded': typeof onPluginReloaded;
} = {
  'settings:update': onSettingsUpdate,
  'session:init': onSessionInit,
  'session:status': onSessionStatus,
  'app:models': onAvailableModels,
  'app:experiment_gates': onExperimentGates,
  'settings:usage': onSettingsUsage,
  'system:rate_limit': onRateLimitQuota,
  'plugin:reloaded': onPluginReloaded,
} satisfies Record<string, (state: ConfigState, payload: never) => ConfigState>;

export { parseModels, toEffort };

// ── Emit actions (send) ──

interface ConfigActionCtx {
  socket: TypedSocket;
  channelId: string;
  setState?: (updater: (prev: ConfigState) => ConfigState) => void;
  addSystemMessage?: (type: string, content: string) => void;
}

function createMcpActions(socket: TypedSocket, channelId: string) {
  function mcpStatus(): Promise<ControlResponse> {
    return rpc(socket, EVENTS.mcp.servers, { channelId });
  }

  function mcpToggle(serverName: string, enabled: boolean): Promise<ControlResponse> {
    return rpc(socket, EVENTS.mcp.toggle, { channelId, serverName, enabled });
  }

  function mcpReconnect(serverName: string): Promise<ControlResponse> {
    return rpc(socket, EVENTS.mcp.reconnect, { channelId, serverName });
  }

  function mcpSetServers(servers: Record<string, unknown>): Promise<ControlResponse> {
    return rpc(socket, EVENTS.mcp.set_servers, { channelId, servers });
  }

  function mcpMessage(
    serverName: string,
    message: Record<string, unknown>,
  ): Promise<ControlResponse> {
    return rpc(socket, EVENTS.mcp.message, { channelId, serverName, message });
  }

  async function mcpListTools(serverName: string): Promise<unknown[]> {
    const result = await rpc(socket, EVENTS.mcp.message, {
      channelId,
      serverName,
      message: { jsonrpc: '2.0', method: 'tools/list', params: {}, id: Date.now() },
    });
    if (
      result.success &&
      result.response &&
      typeof result.response === 'object' &&
      'tools' in result.response &&
      Array.isArray(result.response.tools)
    ) {
      return result.response.tools;
    }
    return [];
  }

  function mcpAuthenticate(serverName: string): Promise<RpcResult<{ authUrl?: string }>> {
    return rpc(socket, EVENTS.mcp.authenticate, { channelId, serverName });
  }

  function mcpOAuthCallback(serverName: string, callbackUrl: string): Promise<Ack> {
    return rpc(socket, EVENTS.mcp.oauth_callback, { channelId, serverName, callbackUrl });
  }

  function mcpClearAuth(serverName: string): Promise<Ack> {
    return rpc(socket, EVENTS.mcp.clear_auth, { channelId, serverName });
  }

  function ensureChromeMcpEnabled(): Promise<ControlResponse> {
    return rpc(socket, EVENTS.mcp.ensure_chrome, { channelId });
  }

  function disableChromeMcp(): Promise<ControlResponse> {
    return rpc(socket, EVENTS.mcp.disable_chrome, { channelId });
  }

  function enableJupyterMcp(): Promise<ControlResponse> {
    return rpc(socket, EVENTS.mcp.enable_jupyter, { channelId });
  }

  function disableJupyterMcp(): Promise<ControlResponse> {
    return rpc(socket, EVENTS.mcp.disable_jupyter, { channelId });
  }

  function askDebuggerHelp(): Promise<
    RpcResult<{ response: { type: 'ask_debugger_help_response' } }>
  > {
    return rpc(socket, EVENTS.mcp.ask_debugger, { channelId });
  }

  return {
    mcpStatus,
    mcpToggle,
    mcpReconnect,
    mcpSetServers,
    mcpMessage,
    mcpListTools,
    mcpAuthenticate,
    mcpOAuthCallback,
    mcpClearAuth,
    ensureChromeMcpEnabled,
    disableChromeMcp,
    enableJupyterMcp,
    disableJupyterMcp,
    askDebuggerHelp,
  };
}

export function createConfigActions(ctx: ConfigActionCtx): {
  setModel: (model: string) => void;
  setPermissionMode: (mode: string) => void;
  setThinkingLevel: (thinkingLevel: string) => void;
  setFastMode: (enabled: boolean) => void;
  setEffort: (effort: string) => Promise<Ack>;
  requestUsageUpdate: () => void;
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
} {
  const emit = (event: string, payload: Record<string, unknown>, ...rest: unknown[]) =>
    channelEmit(ctx.socket, ctx.channelId, event, payload, ...rest);

  function setModel(model: string): void {
    ctx.addSystemMessage?.('slash_command_result', `Set model to ${model}`);
    ctx.setState?.((prev) => ({ ...prev, model }));
    emit(EVENTS.settings.set_model, { model }, (res: { ok: boolean; error?: string }) => {
      if (!res?.ok) toast.error(res?.error ?? 'Failed to switch model');
    });
  }

  function setPermissionMode(mode: string): void {
    ctx.setState?.((prev) => ({ ...prev, permissionMode: mode }));
    emit(EVENTS.settings.set_permission_mode, { mode });
  }

  function setThinkingLevel(thinkingLevel: string): void {
    emit(EVENTS.settings.set_thinking_level, { thinkingLevel });
  }

  function setFastMode(enabled: boolean): void {
    emit(EVENTS.settings.set_proactive, { enabled });
  }

  function setEffort(effort: string): Promise<Ack> {
    return rpc(ctx.socket, EVENTS.settings.apply, {
      channelId: ctx.channelId,
      settings: { effortLevel: effort },
    });
  }

  function requestUsageUpdate(): void {
    ctx.socket.emit(EVENTS.settings.refresh_usage, { channelId: ctx.channelId });
  }

  return {
    setModel,
    setPermissionMode,
    setThinkingLevel,
    setFastMode,
    setEffort,
    requestUsageUpdate,
    ...createMcpActions(ctx.socket, ctx.channelId),
  };
}
