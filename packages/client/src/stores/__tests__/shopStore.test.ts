import { beforeEach, describe, expect, it } from 'vitest';
import { useBattleStore } from '../battleStore';
import { useShopStore } from '../shopStore';

describe('shopStore', () => {
  beforeEach(() => {
    useShopStore.setState({
      inventory: [],
    });
    useBattleStore.setState({
      player: { level: 1, totalExp: 0, totalGold: 100 },
      battles: new Map(),
    });
  });

  it('lists items for a given shop', () => {
    const items = useShopStore.getState().getShopItems('skills');
    expect(items.length).toBeGreaterThan(0);
  });

  it('buyItem succeeds when player has enough gold', () => {
    const items = useShopStore.getState().getShopItems('skills');
    const item = items[0];
    const result = useShopStore.getState().buyItem(item.id);
    expect(result).toBe(true);
    expect(useShopStore.getState().inventory).toContain(item.id);
    expect(useBattleStore.getState().player.totalGold).toBe(100 - item.price);
  });

  it('buyItem fails when player has insufficient gold', () => {
    useBattleStore.setState({
      player: { level: 1, totalExp: 0, totalGold: 0 },
    });
    const items = useShopStore.getState().getShopItems('skills');
    const result = useShopStore.getState().buyItem(items[0].id);
    expect(result).toBe(false);
    expect(useShopStore.getState().inventory.length).toBe(0);
  });

  it('cannot buy same item twice', () => {
    const items = useShopStore.getState().getShopItems('skills');
    useShopStore.getState().buyItem(items[0].id);
    const result = useShopStore.getState().buyItem(items[0].id);
    expect(result).toBe(false);
  });
});
