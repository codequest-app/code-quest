import { describe, expect, it } from 'vitest';
import { expForLevel, levelFromExp } from '../level-system';

describe('level-system', () => {
  it('level 1 requires 0 exp', () => {
    expect(expForLevel(1)).toBe(0);
  });

  it('level 2 requires 100 exp', () => {
    expect(expForLevel(2)).toBe(100);
  });

  it('level 3 requires 300 exp (100+200)', () => {
    expect(expForLevel(3)).toBe(300);
  });

  it('levelFromExp 0 returns 1', () => {
    expect(levelFromExp(0)).toBe(1);
  });

  it('levelFromExp 99 returns 1', () => {
    expect(levelFromExp(99)).toBe(1);
  });

  it('levelFromExp 100 returns 2', () => {
    expect(levelFromExp(100)).toBe(2);
  });

  it('levelFromExp 300 returns 3', () => {
    expect(levelFromExp(300)).toBe(3);
  });

  it('levelFromExp 999 returns correct level', () => {
    expect(levelFromExp(999)).toBe(4);
  });

  it('levelFromExp 1000 returns 5', () => {
    expect(levelFromExp(1000)).toBe(5);
  });
});
