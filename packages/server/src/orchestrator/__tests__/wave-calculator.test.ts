import type { SubTask } from '@code-quest/shared';
import { describe, expect, it } from 'vitest';
import { calculateWaves } from '../wave-calculator.ts';

function task(description: string, dependsOn?: number[]): SubTask {
  return { description, provider: 'claude', dependsOn };
}

describe('calculateWaves', () => {
  it('should return empty waves for empty task list', () => {
    expect(calculateWaves([])).toEqual([]);
  });

  it('should put all tasks in wave 0 when no dependencies', () => {
    const tasks = [task('A'), task('B'), task('C')];
    const waves = calculateWaves(tasks);

    expect(waves).toHaveLength(1);
    expect(waves[0].indices).toEqual([0, 1, 2]);
  });

  it('should create linear waves for chain dependencies (0→1→2)', () => {
    const tasks = [task('A'), task('B', [0]), task('C', [1])];
    const waves = calculateWaves(tasks);

    expect(waves).toHaveLength(3);
    expect(waves[0].indices).toEqual([0]);
    expect(waves[1].indices).toEqual([1]);
    expect(waves[2].indices).toEqual([2]);
  });

  it('should keep independent tasks in the same wave', () => {
    const tasks = [task('A'), task('B'), task('C', [0]), task('D', [1])];
    const waves = calculateWaves(tasks);

    expect(waves).toHaveLength(2);
    expect(waves[0].indices).toEqual([0, 1]);
    expect(waves[1].indices).toEqual(expect.arrayContaining([2, 3]));
  });

  it('should handle diamond dependency (A,B → C)', () => {
    const tasks = [task('A'), task('B'), task('C', [0, 1])];
    const waves = calculateWaves(tasks);

    expect(waves).toHaveLength(2);
    expect(waves[0].indices).toEqual([0, 1]);
    expect(waves[1].indices).toEqual([2]);
  });

  it('should throw on circular dependency', () => {
    const tasks = [task('A', [1]), task('B', [0])];
    expect(() => calculateWaves(tasks)).toThrow('Circular dependency');
  });

  it('should throw on self-dependency', () => {
    const tasks = [task('A', [0])];
    expect(() => calculateWaves(tasks)).toThrow('depends on itself');
  });

  it('should throw on out-of-bounds dependency index', () => {
    const tasks = [task('A', [5])];
    expect(() => calculateWaves(tasks)).toThrow('invalid dependency index');
  });

  it('should handle tasks with undefined dependsOn as wave 0', () => {
    const tasks = [{ description: 'A', provider: 'claude' as const }];
    const waves = calculateWaves(tasks);

    expect(waves).toHaveLength(1);
    expect(waves[0].indices).toEqual([0]);
  });

  it('should handle complex multi-wave graph', () => {
    // A(0), B(1) → C(2); B(1) → D(3); C(2), D(3) → E(4)
    const tasks = [task('A'), task('B'), task('C', [0, 1]), task('D', [1]), task('E', [2, 3])];
    const waves = calculateWaves(tasks);

    expect(waves).toHaveLength(3);
    expect(waves[0].indices).toEqual([0, 1]);
    expect(waves[1].indices).toEqual(expect.arrayContaining([2, 3]));
    expect(waves[2].indices).toEqual([4]);
  });
});
