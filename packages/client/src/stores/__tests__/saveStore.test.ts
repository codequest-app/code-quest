import { beforeEach, describe, expect, it } from 'vitest';
import { useBattleStore } from '../battleStore';
import { useMapStore } from '../mapStore';
import { loadGame, saveGame } from '../saveStore';
import { useShopStore } from '../shopStore';

describe('saveStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useMapStore.setState({
      currentZone: 'town',
      playerPosition: { x: 4, y: 4 },
      currentLocationId: null,
      completedDungeons: new Set(),
    });
    useBattleStore.setState({
      player: { level: 1, totalExp: 0, totalGold: 0 },
    });
    useShopStore.setState({ inventory: [] });
  });

  it('saveGame persists all stores into one localStorage key', () => {
    useMapStore.setState({ playerPosition: { x: 7, y: 2 }, currentZone: 'wilderness' });
    useBattleStore.setState({ player: { level: 3, totalExp: 300, totalGold: 150 } });
    useShopStore.setState({ inventory: ['skill-debug'] });

    saveGame();

    const raw = localStorage.getItem('code-quest-save');
    expect(raw).toBeTruthy();
    const data = JSON.parse(raw as string);
    expect(data.map.playerPosition).toEqual({ x: 7, y: 2 });
    expect(data.map.currentZone).toBe('wilderness');
    expect(data.player.level).toBe(3);
    expect(data.player.totalGold).toBe(150);
    expect(data.shop.inventory).toEqual(['skill-debug']);
  });

  it('loadGame restores all stores from one localStorage key', () => {
    localStorage.setItem(
      'code-quest-save',
      JSON.stringify({
        map: { playerPosition: { x: 1, y: 1 }, currentZone: 'dungeon' },
        player: { level: 5, totalExp: 1000, totalGold: 500 },
        shop: { inventory: ['bank-interest'] },
      }),
    );

    loadGame();

    expect(useMapStore.getState().playerPosition).toEqual({ x: 1, y: 1 });
    expect(useMapStore.getState().currentZone).toBe('dungeon');
    expect(useBattleStore.getState().player.level).toBe(5);
    expect(useBattleStore.getState().player.totalGold).toBe(500);
    expect(useShopStore.getState().inventory).toEqual(['bank-interest']);
  });

  it('loadGame with no saved data does nothing', () => {
    useMapStore.setState({ playerPosition: { x: 3, y: 3 } });
    loadGame();
    expect(useMapStore.getState().playerPosition).toEqual({ x: 3, y: 3 });
  });

  it('loadGame with corrupt data does nothing', () => {
    localStorage.setItem('code-quest-save', 'not-json');
    useMapStore.setState({ playerPosition: { x: 3, y: 3 } });
    loadGame();
    expect(useMapStore.getState().playerPosition).toEqual({ x: 3, y: 3 });
  });

  it('saveGame includes completedDungeons as array', () => {
    useMapStore.setState({ completedDungeons: new Set(['bug_cave', 'arch_maze']) });
    saveGame();
    const data = JSON.parse(localStorage.getItem('code-quest-save') as string);
    expect(data.map.completedDungeons).toEqual(['bug_cave', 'arch_maze']);
  });

  it('loadGame prefers unified save over per-store keys', () => {
    // Old per-store key
    localStorage.setItem(
      'code-quest-map',
      JSON.stringify({ playerPosition: { x: 1, y: 1 }, currentZone: 'town' }),
    );
    // Unified save with different data
    localStorage.setItem(
      'code-quest-save',
      JSON.stringify({
        map: { playerPosition: { x: 9, y: 9 }, currentZone: 'wilderness' },
        player: { level: 1, totalExp: 0, totalGold: 0 },
        shop: { inventory: [] },
      }),
    );
    loadGame();
    // Unified save wins
    expect(useMapStore.getState().playerPosition).toEqual({ x: 9, y: 9 });
    expect(useMapStore.getState().currentZone).toBe('wilderness');
  });

  it('loadGame restores completedDungeons as Set', () => {
    localStorage.setItem(
      'code-quest-save',
      JSON.stringify({
        map: {
          playerPosition: { x: 4, y: 4 },
          currentZone: 'town',
          completedDungeons: ['legacy_tomb'],
        },
        player: { level: 1, totalExp: 0, totalGold: 0 },
        shop: { inventory: [] },
      }),
    );
    loadGame();
    expect(useMapStore.getState().completedDungeons).toEqual(new Set(['legacy_tomb']));
  });
});
