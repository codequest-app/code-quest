import type { AuthStatus, AvailablePlugin, MarketplaceInfo, PluginInfo } from '@code-quest/shared';

interface PluginCacheEntry {
  installed: PluginInfo[];
  available: AvailablePlugin[];
  marketplaces: MarketplaceInfo[];
  ts: number;
}

type ChromeMcpStatus = 'disconnected' | 'connecting' | 'connected';

/** Claude-specific state. */
export const claudeState = {
  chromeMcpState: { status: 'disconnected' as ChromeMcpStatus },
  pluginCache: null as PluginCacheEntry | null,
  PLUGIN_CACHE_TTL: 30_000,
  authState: { authenticated: false } as AuthStatus,
};

/** Reset state for test isolation. */
export function resetClaudeState(): void {
  claudeState.chromeMcpState = { status: 'disconnected' };
  claudeState.pluginCache = null;
  claudeState.authState = { authenticated: false };
}
