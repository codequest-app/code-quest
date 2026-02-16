import { describe, expect, it } from 'vitest';
import {
  analyzeComplexity,
  calculateHP,
  classifyTaskType,
  generateEnemy,
} from '../enemy-generator.ts';

describe('analyzeComplexity', () => {
  it('returns low score for short simple prompts', () => {
    const score = analyzeComplexity('fix typo');
    expect(score.total).toBeLessThanOrEqual(3);
    expect(score.lengthScore).toBe(0);
  });

  it('returns higher score for longer prompts', () => {
    const long =
      'refactor the authentication module to use JWT tokens and add refresh token support with proper expiry handling';
    const score = analyzeComplexity(long);
    expect(score.lengthScore).toBeGreaterThan(0);
    expect(score.total).toBeGreaterThan(3);
  });

  it('detects keywords for higher keyword score', () => {
    const score = analyzeComplexity('refactor architecture and optimize performance');
    expect(score.keywordScore).toBeGreaterThan(0);
  });

  it('detects multi-step instructions', () => {
    const score = analyzeComplexity('first add tests, then refactor, finally deploy');
    expect(score.multiStepScore).toBeGreaterThan(0);
  });

  it('caps total at 15', () => {
    const mega =
      'refactor architecture optimize performance debug fix test deploy migrate integrate first then finally also additionally implement redesign overhaul '.repeat(
        10,
      );
    const score = analyzeComplexity(mega);
    expect(score.total).toBeLessThanOrEqual(15);
  });
});

describe('classifyTaskType', () => {
  it('returns code-task for implementation prompts', () => {
    expect(classifyTaskType('implement a new login form')).toBe('code-task');
  });

  it('returns bug-hunt for bug-related prompts', () => {
    expect(classifyTaskType('fix the bug in auth module')).toBe('bug-hunt');
  });

  it('returns architecture for architecture prompts', () => {
    expect(classifyTaskType('refactor the architecture of the system')).toBe('architecture');
  });

  it('returns documentation for doc prompts', () => {
    expect(classifyTaskType('write documentation for the API')).toBe('documentation');
  });

  it('returns testing for test prompts', () => {
    expect(classifyTaskType('add unit tests for the parser')).toBe('testing');
  });

  it('returns optimization for performance prompts', () => {
    expect(classifyTaskType('optimize the database queries')).toBe('optimization');
  });

  it('returns general for unmatched prompts', () => {
    expect(classifyTaskType('hello world')).toBe('general');
  });
});

describe('calculateHP', () => {
  it('calculates HP as level * 100 * typeMultiplier', () => {
    expect(calculateHP(1, 'general')).toBe(100);
  });

  it('applies type multiplier for architecture', () => {
    const hp = calculateHP(1, 'architecture');
    expect(hp).toBeGreaterThan(100);
  });

  it('scales with level', () => {
    expect(calculateHP(5, 'general')).toBe(500);
  });
});

describe('generateEnemy', () => {
  it('generates enemy from prompt', () => {
    const enemy = generateEnemy('fix a bug in the login system');
    expect(enemy.name).toBeTruthy();
    expect(enemy.type).toBe('bug-hunt');
    expect(enemy.level).toBeGreaterThan(0);
    expect(enemy.hp).toBe(enemy.maxHp);
    expect(enemy.hp).toBeGreaterThan(0);
  });

  it('is deterministic: same prompt same enemy', () => {
    const a = generateEnemy('implement auth');
    const b = generateEnemy('implement auth');
    expect(a).toEqual(b);
  });
});
