import { create } from 'zustand';
import { useBattleStore } from './battleStore';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  shopId: string;
}

interface ShopStore {
  inventory: string[];
  getShopItems: (shopId: string) => ShopItem[];
  buyItem: (itemId: string) => boolean;
}

const ALL_ITEMS: ShopItem[] = [
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
  {
    id: 'forge-upgrade-1',
    name: 'Skill Sharpener',
    description: 'Upgrade skill effectiveness',
    price: 60,
    shopId: 'forge',
  },
  {
    id: 'subagent-scout',
    name: 'Scout Agent',
    description: 'A helper for codebase exploration',
    price: 80,
    shopId: 'subagent',
  },
  {
    id: 'bank-interest',
    name: 'Interest Plan',
    description: 'Earn passive gold over time',
    price: 100,
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

    useBattleStore.setState({
      player: { ...player, totalGold: player.totalGold - item.price },
    });
    set({ inventory: [...inventory, itemId] });
    return true;
  },
}));
