import type { DamageResult, Enemy, EnemyType, SkillInfo } from './types.ts';

type SkillCategory = SkillInfo['category'];

const AFFINITY_TABLE: Record<SkillCategory, Partial<Record<EnemyType, number>>> = {
  read: {
    'bug-hunt': 1.5,
    documentation: 1.3,
    optimization: 0.7,
  },
  write: {
    'code-task': 1.5,
    documentation: 1.8,
    architecture: 0.8,
  },
  search: {
    'bug-hunt': 1.8,
    testing: 1.3,
    general: 1.0,
  },
  execute: {
    testing: 1.5,
    optimization: 1.3,
    architecture: 0.5,
  },
  summon: {
    architecture: 1.5,
    'code-task': 1.3,
    documentation: 0.8,
  },
};

export function getAffinityMultiplier(category: SkillCategory, enemyType: EnemyType): number {
  return AFFINITY_TABLE[category]?.[enemyType] ?? 1.0;
}

export function calculateDamage(skill: SkillInfo, enemy: Enemy, playerLevel: number): DamageResult {
  const baseDamage = 100 + skill.mpCost * 3 + playerLevel * 10;
  const affinityMultiplier = getAffinityMultiplier(skill.category, enemy.type);
  const totalDamage = Math.round(baseDamage * affinityMultiplier);
  const isCritical = affinityMultiplier >= 1.5;

  return { baseDamage, affinityMultiplier, totalDamage, isCritical };
}
