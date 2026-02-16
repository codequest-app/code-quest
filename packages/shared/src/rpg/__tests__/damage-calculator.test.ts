import { describe, expect, it } from 'vitest';
import { calculateDamage, getAffinityMultiplier } from '../damage-calculator.ts';
import type { Enemy, SkillInfo } from '../types.ts';

const makeSkill = (overrides: Partial<SkillInfo> = {}): SkillInfo => ({
  name: 'Read',
  japaneseName: '讀心術',
  category: 'read',
  mpCost: 3,
  ...overrides,
});

const makeEnemy = (overrides: Partial<Enemy> = {}): Enemy => ({
  name: 'Bug Slime',
  type: 'bug-hunt',
  level: 3,
  hp: 300,
  maxHp: 300,
  ...overrides,
});

describe('getAffinityMultiplier', () => {
  it('returns 1.0 for neutral matchups', () => {
    expect(getAffinityMultiplier('execute', 'general')).toBe(1.0);
  });

  it('returns higher multiplier for strong matchups', () => {
    const mult = getAffinityMultiplier('search', 'bug-hunt');
    expect(mult).toBeGreaterThan(1.0);
  });

  it('returns lower multiplier for weak matchups', () => {
    const mult = getAffinityMultiplier('read', 'optimization');
    expect(mult).toBeLessThan(1.0);
  });
});

describe('calculateDamage', () => {
  it('computes base damage from formula', () => {
    const result = calculateDamage(makeSkill(), makeEnemy(), 1);
    // baseDamage = 100 + (3 × 3) + (1 × 10) = 119
    expect(result.baseDamage).toBe(119);
  });

  it('applies affinity multiplier', () => {
    const result = calculateDamage(makeSkill(), makeEnemy(), 1);
    expect(result.totalDamage).toBe(Math.round(result.baseDamage * result.affinityMultiplier));
  });

  it('scales with player level', () => {
    const low = calculateDamage(makeSkill(), makeEnemy(), 1);
    const high = calculateDamage(makeSkill(), makeEnemy(), 10);
    expect(high.baseDamage).toBeGreaterThan(low.baseDamage);
  });

  it('scales with MP cost', () => {
    const cheap = calculateDamage(makeSkill({ mpCost: 1 }), makeEnemy(), 1);
    const expensive = calculateDamage(makeSkill({ mpCost: 10 }), makeEnemy(), 1);
    expect(expensive.baseDamage).toBeGreaterThan(cheap.baseDamage);
  });
});
