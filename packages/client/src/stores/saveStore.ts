import { useBattleStore } from './battleStore';
import { useMapStore } from './mapStore';
import { useMcpStore } from './mcpStore';
import { useShopStore } from './shopStore';

const SAVE_KEY = 'code-quest-save';
const VALID_ZONES = new Set(['town', 'wilderness', 'dungeon']);
const GRID_MAX_X = 9;
const GRID_MAX_Y = 7;

export function saveGame(): void {
  try {
    const map = useMapStore.getState();
    const player = useBattleStore.getState().player;
    const shop = useShopStore.getState();

    const mcp = useMcpStore.getState();
    const planText = (() => {
      try {
        return localStorage.getItem('code-quest-plan-text') ?? '';
      } catch {
        return '';
      }
    })();

    const data = {
      map: {
        playerPosition: map.playerPosition,
        currentZone: map.currentZone,
        completedDungeons: [...map.completedDungeons],
      },
      player: {
        level: player.level,
        totalExp: player.totalExp,
        totalGold: player.totalGold,
      },
      shop: {
        inventory: shop.inventory,
      },
      mcp: {
        installedToolIds: mcp.tools.filter((t) => t.installed).map((t) => t.id),
      },
      planText,
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function loadGame(): void {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;

    const data = JSON.parse(raw);

    if (data.map) {
      const mapUpdates: Record<string, unknown> = {};
      if (
        data.map.playerPosition &&
        typeof data.map.playerPosition.x === 'number' &&
        typeof data.map.playerPosition.y === 'number'
      ) {
        mapUpdates.playerPosition = {
          x: Math.max(0, Math.min(GRID_MAX_X, data.map.playerPosition.x)),
          y: Math.max(0, Math.min(GRID_MAX_Y, data.map.playerPosition.y)),
        };
      }
      if (data.map.currentZone && VALID_ZONES.has(data.map.currentZone)) {
        mapUpdates.currentZone = data.map.currentZone;
      }
      if (Array.isArray(data.map.completedDungeons)) {
        mapUpdates.completedDungeons = new Set(data.map.completedDungeons);
      }
      // Reset transient UI state on load
      mapUpdates.planModeActive = false;
      mapUpdates.pendingNpc = null;
      mapUpdates.pendingEncounter = false;
      useMapStore.setState(mapUpdates);
    }

    if (data.player) {
      useBattleStore.setState({ player: data.player });
    }

    if (data.shop) {
      if (Array.isArray(data.shop.inventory)) {
        useShopStore.setState({ inventory: data.shop.inventory });
      }
    }

    if (data.mcp && Array.isArray(data.mcp.installedToolIds)) {
      const installedIds = new Set<string>(data.mcp.installedToolIds);
      const mcpState = useMcpStore.getState();
      useMcpStore.setState({
        tools: mcpState.tools.map((t) => ({ ...t, installed: installedIds.has(t.id) })),
      });
    }

    if (typeof data.planText === 'string') {
      try {
        localStorage.setItem('code-quest-plan-text', data.planText);
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore corrupt data
  }
}

// Auto-load on module init
loadGame();
