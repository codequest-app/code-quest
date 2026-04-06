import type { AuthStatus, AvailablePlugin, MarketplaceInfo, PluginInfo } from '@code-quest/shared';

interface PluginCacheEntry {
  installed: PluginInfo[];
  available: AvailablePlugin[];
  marketplaces: MarketplaceInfo[];
  ts: number;
}

type ChromeMcpStatus = 'disconnected' | 'connecting' | 'connected';
type JupyterMcpStatus = 'inactive' | 'active';

type McpStateKey = 'chromeMcpState' | 'jupyterMcpState';

/** Claude-specific state. */
export const claudeState = {
  chromeMcpState: { status: 'disconnected' as ChromeMcpStatus },
  jupyterMcpState: { status: 'inactive' as JupyterMcpStatus },
  pluginCache: null as PluginCacheEntry | null,
  PLUGIN_CACHE_TTL: 30_000,
  authState: { authenticated: false } as AuthStatus,
};

/** Type-safe setter for MCP state fields. */
export function setMcpState(key: McpStateKey, value: { status: string }): void {
  if (key === 'chromeMcpState') {
    claudeState.chromeMcpState = value as { status: ChromeMcpStatus };
  } else {
    claudeState.jupyterMcpState = value as { status: JupyterMcpStatus };
  }
}

/** Type-safe setter for auth state. */
export function setAuthState(value: AuthStatus): void {
  claudeState.authState = value;
}

/** Update plugin cache, merging with existing values. */
export function updatePluginCache(patch: Partial<PluginCacheEntry> & { ts?: number }): void {
  const existing = claudeState.pluginCache;
  claudeState.pluginCache = {
    installed: patch.installed ?? existing?.installed ?? [],
    available: patch.available ?? existing?.available ?? [],
    marketplaces: patch.marketplaces ?? existing?.marketplaces ?? [],
    ts: patch.ts ?? existing?.ts ?? Date.now(),
  };
}

/** Clear plugin cache. */
export function clearPluginCache(): void {
  claudeState.pluginCache = null;
}

/** Reset state for test isolation. */
export function resetClaudeState(): void {
  claudeState.chromeMcpState = { status: 'disconnected' };
  claudeState.jupyterMcpState = { status: 'inactive' };
  claudeState.pluginCache = null;
  claudeState.authState = { authenticated: false };
}
