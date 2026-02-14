import type { SubTask } from '@code-quest/shared';

export interface Wave {
  indices: number[];
}

/**
 * Calculate execution waves from task dependencies using Kahn's algorithm.
 * Tasks in the same wave can run in parallel; waves execute sequentially.
 */
export function calculateWaves(tasks: SubTask[]): Wave[] {
  if (tasks.length === 0) return [];

  const n = tasks.length;
  const inDegree = new Array<number>(n).fill(0);
  const dependents = new Map<number, number[]>();

  // Build dependency graph
  for (let i = 0; i < n; i++) {
    const deps = tasks[i].dependsOn;
    if (!deps) continue;

    for (const dep of deps) {
      if (dep < 0 || dep >= n) {
        throw new Error(`Task ${i} has invalid dependency index: ${dep}`);
      }
      if (dep === i) {
        throw new Error(`Task ${i} depends on itself`);
      }
      inDegree[i]++;
      const existing = dependents.get(dep) ?? [];
      existing.push(i);
      dependents.set(dep, existing);
    }
  }

  // Kahn's algorithm — layer by layer
  const waves: Wave[] = [];
  const resolved = new Set<number>();

  // Wave 0: all tasks with inDegree 0
  let currentWave: number[] = [];
  for (let i = 0; i < n; i++) {
    if (inDegree[i] === 0) {
      currentWave.push(i);
    }
  }

  while (currentWave.length > 0) {
    waves.push({ indices: currentWave });
    for (const idx of currentWave) {
      resolved.add(idx);
    }

    const nextWave: number[] = [];
    for (const idx of currentWave) {
      for (const dependent of dependents.get(idx) ?? []) {
        inDegree[dependent]--;
        if (inDegree[dependent] === 0) {
          nextWave.push(dependent);
        }
      }
    }
    currentWave = nextWave;
  }

  if (resolved.size !== n) {
    throw new Error('Circular dependency detected among tasks');
  }

  return waves;
}
