import { create } from 'zustand';
import { useBattleStore } from './battleStore';
import { useMcpStore } from './mcpStore';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  shopId: string;
}

const SHOP_STORAGE_KEY = 'code-quest-shop';

function saveInventory(inventory: string[]): void {
  try {
    localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(inventory));
  } catch {
    // ignore
  }
}

interface ShopStore {
  inventory: string[];
  getShopItems: (shopId: string) => ShopItem[];
  buyItem: (itemId: string) => boolean;
  restoreFromStorage: () => void;
}

const ALL_ITEMS: ShopItem[] = [
  // Skills Shop
  {
    id: 'skill-autocomplete',
    name: 'Auto-Complete',
    description: 'Predict and complete code',
    price: 30,
    shopId: 'skills',
  },
  {
    id: 'skill-refactor',
    name: 'Refactor',
    description: 'Restructure code cleanly',
    price: 50,
    shopId: 'skills',
  },
  {
    id: 'skill-debug',
    name: 'Debug',
    description: 'Find and fix bugs faster',
    price: 40,
    shopId: 'skills',
  },
  // Forge
  {
    id: 'forge-upgrade-1',
    name: 'Skill Sharpener',
    description: 'Upgrade skill effectiveness',
    price: 60,
    shopId: 'forge',
  },
  {
    id: 'forge-combine',
    name: 'Skill Combiner',
    description: 'Merge two skills into a combo',
    price: 90,
    shopId: 'forge',
  },
  // MCP Library
  {
    id: 'mcp-web-search',
    name: 'Web Search Tool',
    description: 'Search the web from within quests',
    price: 50,
    shopId: 'mcp-library',
  },
  {
    id: 'mcp-file-reader',
    name: 'File Reader Tool',
    description: 'Read external files during battle',
    price: 40,
    shopId: 'mcp-library',
  },
  // Subagent Guild
  {
    id: 'subagent-scout',
    name: 'Scout Agent',
    description: 'A helper for codebase exploration',
    price: 80,
    shopId: 'subagent',
  },
  {
    id: 'subagent-warrior',
    name: 'Warrior Agent',
    description: 'A combat-focused AI assistant',
    price: 120,
    shopId: 'subagent',
  },
  // Treasury
  {
    id: 'trophy-first-blood',
    name: 'First Blood Trophy',
    description: 'Awarded for first battle victory',
    price: 10,
    shopId: 'treasury',
  },
  {
    id: 'trophy-explorer',
    name: 'Explorer Medal',
    description: 'Awarded for visiting all zones',
    price: 20,
    shopId: 'treasury',
  },
  // Training
  {
    id: 'training-dummy',
    name: 'Practice Dummy',
    description: 'A target for skill testing',
    price: 15,
    shopId: 'training',
  },
  {
    id: 'training-manual',
    name: 'Training Manual',
    description: 'Learn new combat techniques',
    price: 25,
    shopId: 'training',
  },
  // Bank
  {
    id: 'bank-interest',
    name: 'Interest Plan',
    description: 'Earn passive gold over time',
    price: 100,
    shopId: 'bank',
  },
  {
    id: 'bank-vault',
    name: 'Vault Upgrade',
    description: 'Increase gold storage capacity',
    price: 150,
    shopId: 'bank',
  },
];

export const useShopStore = create<ShopStore>((set, get) => ({
  inventory: [],

  getShopItems: (shopId: string): ShopItem[] => {
    return ALL_ITEMS.filter((item) => item.shopId === shopId);
  },

  buyItem: (itemId: string): boolean => {
    const { inventory } = get();
    if (inventory.includes(itemId)) return false;

    const item = ALL_ITEMS.find((i) => i.id === itemId);
    if (!item) return false;

    const player = useBattleStore.getState().player;
    if (player.totalGold < item.price) return false;

    const updatedPlayer = { ...player, totalGold: player.totalGold - item.price };
    useBattleStore.setState({ player: updatedPlayer });
    try {
      localStorage.setItem('code-quest-player', JSON.stringify(updatedPlayer));
    } catch {
      // ignore
    }
    const newInventory = [...inventory, itemId];
    saveInventory(newInventory);
    set({ inventory: newInventory });

    // Sync MCP purchases with mcpStore
    if (item.shopId === 'mcp-library') {
      const mcpToolId = itemId.replace(/^mcp-/, '');
      const mcpState = useMcpStore.getState();
      const tool = mcpState.tools.find((t) => t.id === mcpToolId);
      if (tool) {
        if (!tool.installed) {
          mcpState.toggleInstall(mcpToolId);
        }
      } else {
        console.warn(`[shopStore] MCP tool "${mcpToolId}" not found in mcpStore`);
      }
    }

    return true;
  },

  restoreFromStorage: () => {
    try {
      const raw = localStorage.getItem(SHOP_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          set({ inventory: data });
        }
      }
    } catch {
      // ignore
    }
  },
}));

useShopStore.getState().restoreFromStorage();
