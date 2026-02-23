import { beforeEach, describe, expect, it } from 'vitest';
import { useBattleStore } from '../battleStore';
import { useMcpStore } from '../mcpStore';
import { useShopStore } from '../shopStore';

describe('shopStore', () => {
  beforeEach(() => {
    localStorage.clear();
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

  it('persists inventory to localStorage on buy', () => {
    useShopStore.getState().buyItem('skill-autocomplete');
    const saved = JSON.parse(localStorage.getItem('code-quest-shop') ?? '[]');
    expect(saved).toContain('skill-autocomplete');
  });

  it('every shop has at least 2 items', () => {
    const shopIds = ['skills', 'forge', 'mcp-library', 'subagent', 'treasury', 'training', 'bank'];
    for (const shopId of shopIds) {
      const items = useShopStore.getState().getShopItems(shopId);
      expect(items.length, `shop "${shopId}" should have >= 2 items`).toBeGreaterThanOrEqual(2);
    }
  });

  it('buyItem persists player gold to localStorage', () => {
    useShopStore.getState().buyItem('skill-autocomplete');
    const saved = JSON.parse(localStorage.getItem('code-quest-player') ?? '{}');
    expect(saved.totalGold).toBe(100 - 30); // skill-autocomplete costs 30
  });

  it('buying MCP shop item toggles mcpStore installed', () => {
    // web-search starts as not installed in mcpStore
    const tool = useMcpStore.getState().tools.find((t) => t.id === 'web-search');
    expect(tool?.installed).toBe(false);

    useShopStore.getState().buyItem('mcp-web-search');
    const updated = useMcpStore.getState().tools.find((t) => t.id === 'web-search');
    expect(updated?.installed).toBe(true);
  });

  it('restores inventory from localStorage', () => {
    localStorage.setItem('code-quest-shop', JSON.stringify(['skill-debug']));
    useShopStore.getState().restoreFromStorage();
    expect(useShopStore.getState().inventory).toContain('skill-debug');
  });
});
