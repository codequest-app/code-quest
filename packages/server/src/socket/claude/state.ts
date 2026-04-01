import type { AuthStatus, AvailablePlugin, MarketplaceInfo, PluginInfo } from '@code-quest/shared';

export interface PluginCacheEntry {
  installed: PluginInfo[];
  available: AvailablePlugin[];
  marketplaces: MarketplaceInfo[];
  ts: number;
}

/** Claude-specific state. */
export const claudeState = {
  chromeMcpState: { status: 'disconnected' as 'disconnected' | 'connecting' | 'connected' },
  pluginCache: new Map<string, PluginCacheEntry>(),
  PLUGIN_CACHE_TTL: 30_000,
  authState: { authenticated: false } as AuthStatus,
};

/** Reset state for test isolation. */
export function resetClaudeState(): void {
  claudeState.chromeMcpState = { status: 'disconnected' };
  claudeState.pluginCache.clear();
  claudeState.authState = { authenticated: false };
}
