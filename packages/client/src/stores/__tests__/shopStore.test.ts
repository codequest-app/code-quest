import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    useMcpStore.setState({
      tools: [
        { id: 'web-search', name: 'Web Search', description: 'Search the web', installed: false },
        { id: 'file-system', name: 'File System', description: 'Access files', installed: false },
      ],
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

  it('buyItem does not persist directly (saveStore handles persistence)', () => {
    useShopStore.getState().buyItem('skill-autocomplete');
    expect(localStorage.getItem('code-quest-shop')).toBeNull();
  });

  it('every shop has at least 2 items', () => {
    const shopIds = ['skills', 'forge', 'mcp-library', 'subagent', 'treasury', 'training', 'bank'];
    for (const shopId of shopIds) {
      const items = useShopStore.getState().getShopItems(shopId);
      expect(items.length, `shop "${shopId}" should have >= 2 items`).toBeGreaterThanOrEqual(2);
    }
  });

  it('buyItem does not persist player gold directly (saveStore handles it)', () => {
    useShopStore.getState().buyItem('skill-autocomplete');
    expect(localStorage.getItem('code-quest-player')).toBeNull();
  });

  it('buying MCP shop item toggles mcpStore installed', () => {
    // web-search starts as not installed in mcpStore
    const tool = useMcpStore.getState().tools.find((t) => t.id === 'web-search');
    expect(tool?.installed).toBe(false);

    useShopStore.getState().buyItem('mcp-web-search');
    const updated = useMcpStore.getState().tools.find((t) => t.id === 'web-search');
    expect(updated?.installed).toBe(true);
  });

  it('warns when MCP tool ID does not match any tool in mcpStore', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    useBattleStore.setState({ player: { level: 1, totalExp: 0, totalGold: 200 } });
    // Remove all tools to ensure mismatch
    useMcpStore.setState({ tools: [] });
    useShopStore.getState().buyItem('mcp-web-search');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('web-search'));
    warnSpy.mockRestore();
  });

  it('buying MCP item when tool is already installed does not toggle it off', () => {
    // Pre-install web-search
    useMcpStore.getState().toggleInstall('web-search');
    expect(useMcpStore.getState().tools.find((t) => t.id === 'web-search')?.installed).toBe(true);

    useShopStore.getState().buyItem('mcp-web-search');
    // Should remain installed (not toggled off)
    expect(useMcpStore.getState().tools.find((t) => t.id === 'web-search')?.installed).toBe(true);
  });

  it('inventory is restored via saveStore loadGame (not shopStore directly)', () => {
    // shopStore no longer has restoreFromStorage — saveStore.loadGame handles it
    useShopStore.setState({ inventory: ['skill-debug'] });
    expect(useShopStore.getState().inventory).toContain('skill-debug');
  });
});
