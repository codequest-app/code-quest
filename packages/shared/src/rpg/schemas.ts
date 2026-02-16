import { z } from 'zod';

export const enemyTypeSchema = z.enum([
  'code-task',
  'bug-hunt',
  'architecture',
  'documentation',
  'testing',
  'optimization',
  'general',
]);

export const enemySchema = z.object({
  name: z.string().min(1),
  type: enemyTypeSchema,
  level: z.number().int().positive(),
  hp: z.number().int().nonnegative(),
  maxHp: z.number().int().positive(),
});

export const skillCategorySchema = z.enum(['read', 'write', 'search', 'execute', 'summon']);

export const skillInfoSchema = z.object({
  name: z.string().min(1),
  japaneseName: z.string().min(1),
  category: skillCategorySchema,
  mpCost: z.number().int().nonnegative(),
});

export const damageResultSchema = z.object({
  baseDamage: z.number().nonnegative(),
  affinityMultiplier: z.number().positive(),
  totalDamage: z.number().nonnegative(),
  isCritical: z.boolean(),
});

export const battlePhaseSchema = z.enum(['idle', 'active', 'victory', 'defeat']);

export const battleLogEntrySchema = z.object({
  id: z.string().min(1),
  timestamp: z.number(),
  message: z.string(),
  type: z.enum(['info', 'skill', 'damage', 'heal', 'victory', 'error']),
});
