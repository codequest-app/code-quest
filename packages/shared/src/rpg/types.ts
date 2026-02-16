export type EnemyType =
  | 'code-task'
  | 'bug-hunt'
  | 'architecture'
  | 'documentation'
  | 'testing'
  | 'optimization'
  | 'general';

export interface Enemy {
  name: string;
  type: EnemyType;
  level: number;
  hp: number;
  maxHp: number;
}

export interface ComplexityScore {
  total: number;
  lengthScore: number;
  keywordScore: number;
  multiStepScore: number;
}

export interface SkillInfo {
  name: string;
  japaneseName: string;
  category: 'read' | 'write' | 'search' | 'execute' | 'summon';
  mpCost: number;
}

export interface DamageResult {
  baseDamage: number;
  affinityMultiplier: number;
  totalDamage: number;
  isCritical: boolean;
}

export interface BattleLogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'skill' | 'damage' | 'heal' | 'victory' | 'error';
}

export type BattlePhase = 'idle' | 'active' | 'victory' | 'defeat';

export type PauseReason = 'plan_mode' | 'question' | 'permission' | 'error';

export type TrapRiskLevel = 'low' | 'medium' | 'high';

export interface ActiveDialogue {
  question: string;
  options: string[];
}

export interface ActiveTrap {
  toolName: string;
  description: string;
  riskLevel: TrapRiskLevel;
}

export interface BattleState {
  enemy: Enemy;
  phase: BattlePhase;
  playerLevel: number;
  playerHp: number;
  playerMaxHp: number;
  playerMp: number;
  playerMaxMp: number;
  playerExp: number;
  comboCount: number;
  log: BattleLogEntry[];
  goldEarned: number;
  expEarned: number;
  isPaused: boolean;
  pauseReason?: PauseReason;
  activeDialogue?: ActiveDialogue;
  activeTrap?: ActiveTrap;
}

export type BattleEventType =
  | 'battle_start'
  | 'skill_cast'
  | 'damage'
  | 'enemy_counter'
  | 'mp_consumed'
  | 'victory'
  | 'gold_earned'
  | 'exp_earned'
  | 'combo'
  | 'stasis_enter'
  | 'stasis_exit'
  | 'npc_dialogue'
  | 'trap_detected';

export interface BattleEvent {
  type: BattleEventType;
  data: Record<string, unknown>;
}
