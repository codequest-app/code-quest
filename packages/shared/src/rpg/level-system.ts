/**
 * Total XP required to reach the given level.
 * L1=0, L2=100, L3=300, L4=600, L5=1000
 * Formula: 100 * (n-1) * n / 2 where n = level - 1
 */
export function expForLevel(level: number): number {
  if (level <= 1) return 0;
  const n = level - 1;
  return (100 * n * (n + 1)) / 2;
}

/** Determine level from total accumulated XP */
export function levelFromExp(totalExp: number): number {
  let level = 1;
  while (expForLevel(level + 1) <= totalExp) {
    level++;
  }
  return level;
}
