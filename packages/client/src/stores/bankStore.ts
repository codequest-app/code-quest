import type { ModelTier } from '@code-quest/shared';
import { create } from 'zustand';

interface SessionCost {
  total: number;
  byModel: Partial<Record<ModelTier, number>>;
}

interface BankStore {
  sessionCosts: Map<string, SessionCost>;
  totalCost: number;
  budget: number | undefined;

  recordCost: (sessionId: string, model: ModelTier, cost: number) => void;
  setBudget: (amount: number) => void;
  getTotalGold: () => number;
  isBudgetWarning: () => boolean;
}

const BANK_STORAGE_KEY = 'code-quest-bank';
const GOLD_PER_USD = 1000;
const BUDGET_WARNING_THRESHOLD = 0.8;

function saveBankState(totalCost: number): void {
  try {
    localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify({ totalCost }));
  } catch {
    // ignore quota errors
  }
}

export const useBankStore = create<BankStore>((set, get) => ({
  sessionCosts: new Map(),
  totalCost: 0,
  budget: undefined,

  recordCost: (sessionId: string, model: ModelTier, cost: number) => {
    set((state) => {
      const sessionCosts = new Map(state.sessionCosts);
      const existing = sessionCosts.get(sessionId) ?? { total: 0, byModel: {} };
      const byModel = { ...existing.byModel };
      byModel[model] = (byModel[model] ?? 0) + cost;
      sessionCosts.set(sessionId, { total: existing.total + cost, byModel });
      const totalCost = state.totalCost + cost;
      saveBankState(totalCost);
      return { sessionCosts, totalCost };
    });
  },

  setBudget: (amount: number) => {
    set({ budget: amount });
  },

  getTotalGold: () => {
    return Math.round(get().totalCost * GOLD_PER_USD);
  },

  isBudgetWarning: () => {
    const { budget, totalCost } = get();
    if (budget === undefined) return false;
    return totalCost >= budget * BUDGET_WARNING_THRESHOLD;
  },
}));
