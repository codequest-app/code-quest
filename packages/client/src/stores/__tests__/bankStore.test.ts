import { beforeEach, describe, expect, it } from 'vitest';
import { useBankStore } from '../bankStore';

describe('bankStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useBankStore.setState({
      sessionCosts: new Map(),
      totalCost: 0,
      budget: undefined,
    });
  });

  it('records cost for a session', () => {
    useBankStore.getState().recordCost('s1', 'haiku', 0.005);
    expect(useBankStore.getState().totalCost).toBe(0.005);
  });

  it('accumulates costs across sessions', () => {
    useBankStore.getState().recordCost('s1', 'haiku', 0.005);
    useBankStore.getState().recordCost('s2', 'sonnet', 0.05);
    expect(useBankStore.getState().totalCost).toBeCloseTo(0.055);
  });

  it('tracks per-session cost breakdown', () => {
    useBankStore.getState().recordCost('s1', 'haiku', 0.005);
    useBankStore.getState().recordCost('s1', 'haiku', 0.003);
    const session = useBankStore.getState().sessionCosts.get('s1');
    expect(session?.total).toBeCloseTo(0.008);
  });

  it('tracks per-model breakdown in session', () => {
    useBankStore.getState().recordCost('s1', 'haiku', 0.005);
    useBankStore.getState().recordCost('s1', 'sonnet', 0.05);
    const session = useBankStore.getState().sessionCosts.get('s1');
    expect(session?.byModel.haiku).toBeCloseTo(0.005);
    expect(session?.byModel.sonnet).toBeCloseTo(0.05);
  });

  it('persists to localStorage', () => {
    useBankStore.getState().recordCost('s1', 'opus', 0.1);
    const saved = JSON.parse(localStorage.getItem('code-quest-bank') ?? '{}');
    expect(saved.totalCost).toBeCloseTo(0.1);
  });

  it('converts cost to gold (1 USD = 1000 gold)', () => {
    useBankStore.getState().recordCost('s1', 'opus', 0.1);
    expect(useBankStore.getState().getTotalGold()).toBe(100);
  });

  it('sets and checks budget warning', () => {
    useBankStore.getState().setBudget(0.5);
    useBankStore.getState().recordCost('s1', 'opus', 0.45);
    expect(useBankStore.getState().isBudgetWarning()).toBe(true);
  });

  it('no budget warning when under threshold', () => {
    useBankStore.getState().setBudget(1.0);
    useBankStore.getState().recordCost('s1', 'haiku', 0.01);
    expect(useBankStore.getState().isBudgetWarning()).toBe(false);
  });

  it('no budget warning when no budget set', () => {
    useBankStore.getState().recordCost('s1', 'opus', 10);
    expect(useBankStore.getState().isBudgetWarning()).toBe(false);
  });
});
