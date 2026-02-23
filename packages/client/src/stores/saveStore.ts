import { useBattleStore } from './battleStore';
import { useMapStore } from './mapStore';
import { useShopStore } from './shopStore';

const SAVE_KEY = 'code-quest-save';

export function saveGame(): void {
  try {
    const map = useMapStore.getState();
    const player = useBattleStore.getState().player;
    const shop = useShopStore.getState();

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
      if (data.map.playerPosition) mapUpdates.playerPosition = data.map.playerPosition;
      if (data.map.currentZone) mapUpdates.currentZone = data.map.currentZone;
      if (Array.isArray(data.map.completedDungeons)) {
        mapUpdates.completedDungeons = new Set(data.map.completedDungeons);
      }
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
  } catch {
    // ignore corrupt data
  }
}

// Auto-load on module init
loadGame();
