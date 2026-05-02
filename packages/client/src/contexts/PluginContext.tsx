import {
  type AvailablePlugin,
  EVENTS,
  type MarketplaceInfo,
  type PluginInfo,
} from '@code-quest/shared';
import {
  createContext,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { rpc } from '../socket/rpc.ts';
import { useSocket } from './SocketContext.tsx';

interface PluginState {
  installed: PluginInfo[];
  available: AvailablePlugin[];
  marketplaces: MarketplaceInfo[];
  needsRestart: boolean;
  installing: string | null;
}

interface PluginContextValue extends PluginState {
  refreshPlugins: () => Promise<void>;
  refreshMarketplaces: () => Promise<void>;
  install: (pluginId: string, scope: 'user' | 'project' | 'local') => Promise<void>;
  uninstall: (pluginId: string) => Promise<void>;
  toggle: (pluginId: string, enabled: boolean) => Promise<void>;
  addMarketplace: (source: string) => Promise<void>;
  removeMarketplace: (marketplaceId: string) => Promise<void>;
}

const PluginContext = createContext<PluginContextValue | null>(null);

export function usePlugins(): PluginContextValue {
  const ctx = useContext(PluginContext);
  if (!ctx) throw new Error('usePlugins must be used within a PluginProvider');
  return ctx;
}

export function PluginProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { socket } = useSocket();
  const [state, setState] = useState<PluginState>({
    installed: [],
    available: [],
    marketplaces: [],
    needsRestart: false,
    installing: null,
  });

  const socketRef = useRef(socket);
  useLayoutEffect(() => {
    socketRef.current = socket;
  });

  type PluginActions = Omit<PluginContextValue, keyof PluginState>;

  const [actions] = useState<PluginActions>(() => {
    const refreshPlugins = async () => {
      const s = socketRef.current;
      const installedResult = await rpc(s, EVENTS.plugin.list, {});
      setState((prev) => ({ ...prev, installed: installedResult.installed }));
      const result = await rpc(s, EVENTS.plugin.list, { includeAvailable: true });
      setState((prev) => ({
        ...prev,
        installed: result.installed.length > 0 ? result.installed : prev.installed,
        available: result.available,
      }));
    };

    const refreshMarketplaces = async () => {
      const result = await rpc(socketRef.current, EVENTS.plugin.list_marketplaces);
      setState((prev) => ({ ...prev, marketplaces: result.marketplaces }));
    };

    const install = async (pluginId: string, scope: 'user' | 'project' | 'local') => {
      setState((prev) => ({ ...prev, installing: pluginId }));
      try {
        const result = await rpc(socketRef.current, EVENTS.plugin.install, { pluginId, scope });
        if (result.needsRestart) setState((prev) => ({ ...prev, needsRestart: true }));
      } finally {
        await refreshPlugins();
        setState((prev) => ({ ...prev, installing: null }));
      }
    };

    const uninstall = async (pluginId: string) => {
      const result = await rpc(socketRef.current, EVENTS.plugin.uninstall, { pluginId });
      if (result.needsRestart) setState((prev) => ({ ...prev, needsRestart: true }));
      await refreshPlugins();
    };

    const toggle = async (pluginId: string, enabled: boolean) => {
      const result = await rpc(socketRef.current, EVENTS.plugin.toggle, {
        pluginId,
        enabled: !enabled,
      });
      if (result.needsRestart) setState((prev) => ({ ...prev, needsRestart: true }));
      await refreshPlugins();
    };

    return {
      refreshPlugins,
      refreshMarketplaces,
      install,
      uninstall,
      toggle,
      addMarketplace: async (source: string) => {
        await rpc(socketRef.current, EVENTS.plugin.add_marketplace, { source });
        await refreshMarketplaces();
      },
      removeMarketplace: async (marketplaceId: string) => {
        await rpc(socketRef.current, EVENTS.plugin.remove_marketplace, { marketplaceId });
        await refreshMarketplaces();
      },
    };
  });

  return (
    <PluginContext.Provider value={{ ...state, ...actions }}>{children}</PluginContext.Provider>
  );
}
