import {
  type ControlResponse,
  type ModelInfo,
  modelInfoSchema,
  type RpcResult,
  type UsageQuota,
  worktreeInfoSchema,
} from '@code-quest/shared';
import { toast } from 'sonner';
import type { TypedSocket } from '@/socket/client';
import { channelEmit, rpc } from '@/socket/rpc';
import { findModel } from '@/utils/model-utils';
import type { ConfigState } from '../ChannelConfigContext';
import type { Payload } from './guard';

function toEffort(value: string | undefined): ConfigState['effort'] {
  if (value === 'low' || value === 'medium' || value === 'high' || value === 'max') return value;
  return null;
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

/** Maps settings:update payload keys → ConfigState keys for direct assignment. */
const SETTINGS_KEY_MAP: Array<[keyof Payload<'settings:update'>, keyof ConfigState]> = [
  ['modelSetting', 'model'],
  ['initialPermissionMode', 'permissionMode'],
  ['tools', 'tools'],
  ['thinkingLevel', 'thinkingLevel'],
  ['fastModeState', 'fastModeState'],
  ['config', 'config'],
  ['mcpServers', 'mcpServers'],
];

function onSettingsUpdate(state: ConfigState, payload: Payload<'settings:update'>): ConfigState {
  const update: Partial<ConfigState> = {};
  for (const [payloadKey, stateKey] of SETTINGS_KEY_MAP) {
    if (payload[payloadKey] !== undefined) {
      (update as Record<string, unknown>)[stateKey] = payload[payloadKey];
    }
  }
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

function onSessionStates(
  state: ConfigState,
  payload: Payload<'session:states'>,
  channelId: string,
): ConfigState {
  for (const summary of payload.sessions) {
    if (summary.channelId !== channelId) continue;
    const update: Partial<ConfigState> = {};
    if (summary.modelSetting) update.model = summary.modelSetting;
    if (summary.permissionMode) update.permissionMode = summary.permissionMode;
    if (summary.effort) update.effort = toEffort(summary.effort);
    if (Object.keys(update).length > 0) return { ...state, ...update };
  }
  return state;
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
    fastModeState: typeof payload.fastModeState === 'string' ? payload.fastModeState : null,
    slashCommands: [...new Set([...(payload.slashCommands ?? []), 'usage'])],
  };
}

function onSessionStatus(state: ConfigState, payload: Payload<'session:status'>): ConfigState {
  if (payload.permissionMode === undefined) return state;
  return { ...state, permissionMode: payload.permissionMode ?? null };
}

function onAvailableModels(state: ConfigState, payload: Payload<'app:models'>): ConfigState {
  if (!Array.isArray(payload.models)) return state;
  return { ...state, availableModels: parseModels(payload.models) };
}

type TierKey = 'five_hour' | 'seven_day' | 'seven_day_sonnet';
function isTierKey(v: string | undefined): v is TierKey {
  return v === 'five_hour' || v === 'seven_day' || v === 'seven_day_sonnet';
}

function onRateLimitQuota(state: ConfigState, p: Payload<'system:rate_limit'>): ConfigState {
  const { rateLimitType, resetsAt, utilization } = p.info;
  if (!isTierKey(rateLimitType)) return state;
  const currentQuota: UsageQuota = state.usageQuota ?? {};
  return {
    ...state,
    usageQuota: {
      ...currentQuota,
      [rateLimitType]: {
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

export const configHandlers = {
  'settings:update': onSettingsUpdate,
  'session:init': onSessionInit,
  'session:status': onSessionStatus,
  'app:models': onAvailableModels,
  'app:experiment_gates': onExperimentGates,
  'settings:usage': onSettingsUsage,
  'system:rate_limit': onRateLimitQuota,
} satisfies Record<string, (state: ConfigState, payload: never) => ConfigState>;

// session:states needs channelId — handled specially in context
export { onSessionStates, parseModels, toEffort };

// ── Emit actions (send) ──

interface ConfigActionsDeps {
  socket: TypedSocket;
  channelId: string;
}

export function createConfigActions(deps: ConfigActionsDeps) {
  const emit = (event: string, payload: Record<string, unknown>, ...rest: unknown[]) =>
    channelEmit(deps.socket, deps.channelId, event, payload, ...rest);

  function setModel(model: string) {
    emit('settings:set_model', { model }, (res: { success: boolean; error?: string }) => {
      if (!res?.success) toast.error(res?.error ?? 'Failed to switch model');
    });
  }

  function setPermissionMode(mode: string) {
    emit('settings:set_permission_mode', { mode });
  }

  function setThinkingLevel(thinkingLevel: string) {
    emit('settings:set_thinking_level', { thinkingLevel });
  }

  function setFastMode(enabled: boolean) {
    emit('settings:set_proactive', { enabled });
  }

  function setEffort(effort: string): Promise<RpcResult<Record<string, never>>> {
    return rpc(deps.socket, 'settings:apply', {
      channelId: deps.channelId,
      settings: { effortLevel: effort },
    });
  }

  function mcpStatus(): Promise<ControlResponse> {
    return rpc(deps.socket, 'mcp:servers', { channelId: deps.channelId });
  }

  function mcpToggle(serverName: string, enabled: boolean): Promise<ControlResponse> {
    return rpc(deps.socket, 'mcp:toggle', { channelId: deps.channelId, serverName, enabled });
  }

  function mcpReconnect(serverName: string): Promise<ControlResponse> {
    return rpc(deps.socket, 'mcp:reconnect', { channelId: deps.channelId, serverName });
  }

  function mcpSetServers(servers: Record<string, unknown>): Promise<ControlResponse> {
    return rpc(deps.socket, 'mcp:set_servers', { channelId: deps.channelId, servers });
  }

  function mcpMessage(
    serverName: string,
    message: Record<string, unknown>,
  ): Promise<ControlResponse> {
    return rpc(deps.socket, 'mcp:message', { channelId: deps.channelId, serverName, message });
  }

  async function mcpListTools(serverName: string): Promise<unknown[]> {
    const result = await rpc(deps.socket, 'mcp:message', {
      channelId: deps.channelId,
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
    return rpc(deps.socket, 'mcp:authenticate', { channelId: deps.channelId, serverName });
  }

  function mcpOAuthCallback(
    serverName: string,
    callbackUrl: string,
  ): Promise<RpcResult<Record<string, never>>> {
    return rpc(deps.socket, 'mcp:oauth_callback', {
      channelId: deps.channelId,
      serverName,
      callbackUrl,
    });
  }

  function mcpClearAuth(serverName: string): Promise<RpcResult<Record<string, never>>> {
    return rpc(deps.socket, 'mcp:clear_auth', { channelId: deps.channelId, serverName });
  }

  function ensureChromeMcpEnabled(): Promise<ControlResponse> {
    return rpc(deps.socket, 'mcp:ensure_chrome', { channelId: deps.channelId });
  }

  function disableChromeMcp(): Promise<ControlResponse> {
    return rpc(deps.socket, 'mcp:disable_chrome', { channelId: deps.channelId });
  }

  function enableJupyterMcp(): Promise<ControlResponse> {
    return rpc(deps.socket, 'mcp:enable_jupyter', { channelId: deps.channelId });
  }

  function disableJupyterMcp(): Promise<ControlResponse> {
    return rpc(deps.socket, 'mcp:disable_jupyter', { channelId: deps.channelId });
  }

  function askDebuggerHelp(): Promise<
    RpcResult<{ response: { type: 'ask_debugger_help_response' } }>
  > {
    return rpc(deps.socket, 'mcp:ask_debugger', { channelId: deps.channelId });
  }

  function requestUsageUpdate(): void {
    deps.socket.emit('settings:refresh_usage', { channelId: deps.channelId });
  }

  return {
    setModel,
    setPermissionMode,
    setThinkingLevel,
    setFastMode,
    setEffort,
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
    requestUsageUpdate,
  };
}
