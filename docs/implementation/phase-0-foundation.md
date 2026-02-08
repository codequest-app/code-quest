# Phase 0: Foundation - Implementation Plan

**Phase Duration**: 2 weeks
**Phase Status**: Planning
**Dependencies**: None
**Deliverables**: Complete development infrastructure, type system, and Bridge Layer

---

## Table of Contents

1. [Phase Overview](#phase-overview)
2. [Task Checklist](#task-checklist)
3. [File-by-File Implementation Guide](#file-by-file-implementation-guide)
4. [Testing Strategy](#testing-strategy)
5. [Integration Points](#integration-points)

---

## Phase Overview

### Goals

Phase 0 establishes the **foundation** for the entire Code Quest project. This phase creates the development infrastructure, TypeScript type system, and Bridge Layer that connects the React UI to the Claude Code CLI.

**Key Objectives**:
- Set up monorepo with pnpm + Turborepo
- Define complete TypeScript types for all 11 systems
- Implement Bridge Layer (CLI process management + WebSocket)
- Configure development tooling (ESLint, Prettier, Vitest)
- Create base project structure

### Timeline

| Week | Focus Area | Key Deliverables |
|------|-----------|------------------|
| Week 1 | Monorepo + Types | Workspace setup, type definitions |
| Week 2 | Bridge Layer | CLI integration, WebSocket communication |

### Prerequisites

**Required Tools**:
- Node.js ≥ 18.0.0
- pnpm ≥ 8.0.0
- TypeScript ≥ 5.0.0
- Claude Code CLI (installed and configured)

**Required Knowledge**:
- TypeScript
- Node.js child_process API
- WebSocket (Socket.io)
- React 18
- Monorepo concepts

### Deliverables

**Infrastructure**:
- ✅ Monorepo workspace configured
- ✅ Three packages: `ui`, `bridge`, `shared`
- ✅ Build system with Turborepo

**Type System**:
- ✅ Complete TypeScript types for all 11 systems
- ✅ Shared types package
- ✅ Type safety across packages

**Bridge Layer**:
- ✅ Claude CLI process manager
- ✅ WebSocket server
- ✅ Event bus architecture
- ✅ CLI output parser

**Development Tools**:
- ✅ ESLint + Prettier configured
- ✅ Vitest for testing
- ✅ Hot Module Replacement (HMR)
- ✅ TypeScript path aliases

---

## Task Checklist

### Week 1: Monorepo + Type System

#### 1.1 Monorepo Setup
- [ ] Initialize pnpm workspace
- [ ] Create workspace structure (`packages/ui`, `packages/bridge`, `packages/shared`)
- [ ] Configure Turborepo
- [ ] Set up TypeScript project references
- [ ] Configure path aliases

#### 1.2 Package Configuration
- [ ] Setup `packages/ui` (React + Vite)
- [ ] Setup `packages/bridge` (Node.js + Express)
- [ ] Setup `packages/shared` (TypeScript types only)
- [ ] Configure inter-package dependencies
- [ ] Setup build scripts

#### 1.3 Development Tooling
- [ ] Configure ESLint (TypeScript + React)
- [ ] Configure Prettier
- [ ] Setup Vitest for testing
- [ ] Configure Vite for UI development
- [ ] Setup hot reload

#### 1.4 Type System - Core Types
- [ ] Player types (`Player`, `PlayerStats`, `PlayerState`)
- [ ] Resource types (`HP`, `MP`, `EXP`, `Gold`)
- [ ] Level types (`Level`, `LevelProgression`)

#### 1.5 Type System - Game Systems
- [ ] Map types (`MapRegion`, `Location`, `Coordinate`)
- [ ] Scene types (`SceneMode`, `SceneState`)
- [ ] Battle types (`Battle`, `Enemy`, `BattleState`)
- [ ] Companion types (`Companion`, `CompanionStats`)
- [ ] SummonBeast types (`SummonBeast`, `SummonType`)
- [ ] Shop types (`Shop`, `ShopItem`)
- [ ] Interactive Event types (`Event`, `EventType`)
- [ ] Worktree types (`Worktree`, `WorktreeType`)
- [ ] Async Battle types (`AsyncBattle`, `BattleInstance`)
- [ ] Multi-model types (`AIModel`, `ModelConfig`)
- [ ] UI types (`Theme`, `Animation`)

#### 1.6 Type System - Skills & Tools
- [ ] Skill types (`Skill`, `SkillCategory`, `SkillLevel`)
- [ ] Tool types (`Tool`, `ToolType`, `ToolMetadata`)
- [ ] Combo types (`ComboSkill`, `ComboTrigger`)

#### 1.7 Type System - Bridge Layer
- [ ] CLI types (`CLIProcess`, `CLIOutput`, `CLICommand`)
- [ ] WebSocket types (`WSMessage`, `WSEvent`)
- [ ] Event types (`GameEvent`, `EventPayload`)

### Week 2: Bridge Layer Implementation

#### 2.1 CLI Process Manager
- [ ] Create `CLIProcessManager` class
- [ ] Implement process spawning
- [ ] Implement output stream parsing
- [ ] Implement error handling
- [ ] Add process lifecycle management

#### 2.2 Output Parser
- [ ] Create `CLIOutputParser` class
- [ ] Parse tool usage (Read, Write, Edit, etc.)
- [ ] Parse skill execution
- [ ] Parse subagent spawning
- [ ] Extract prompt complexity

#### 2.3 WebSocket Server
- [ ] Create Express server
- [ ] Setup Socket.io
- [ ] Implement connection handling
- [ ] Create event emitter
- [ ] Add heartbeat mechanism

#### 2.4 Event Bus
- [ ] Create `EventBus` class
- [ ] Implement pub/sub pattern
- [ ] Add event type safety
- [ ] Create event logger
- [ ] Add event replay support

#### 2.5 State Manager
- [ ] Create `StateManager` class
- [ ] Implement state persistence (LocalStorage bridge)
- [ ] Add state synchronization
- [ ] Create state snapshots
- [ ] Implement undo/redo support

#### 2.6 Integration & Testing
- [ ] Test CLI spawning
- [ ] Test WebSocket communication
- [ ] Test event flow
- [ ] Test error scenarios
- [ ] Performance testing

---

## File-by-File Implementation Guide

### 1. Workspace Configuration

#### File: `pnpm-workspace.yaml`

```yaml
packages:
  - 'packages/*'
```

**Purpose**: Define pnpm workspace structure
**Key Points**:
- All packages in `/packages` directory
- Shared dependency management

---

#### File: `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false
    },
    "lint": {},
    "test": {}
  }
}
```

**Purpose**: Configure Turborepo build pipeline
**Key Points**:
- Build dependencies in order
- Cache optimization
- Parallel execution

---

#### File: `package.json` (root)

```json
{
  "name": "code-quest",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,md}\""
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "turbo": "^1.10.0",
    "typescript": "^5.2.0",
    "prettier": "^3.0.0",
    "eslint": "^8.50.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

**Purpose**: Root package configuration
**Key Points**:
- Workspace-level scripts
- Shared dev dependencies
- Engine requirements

---

### 2. Shared Types Package

#### File: `packages/shared/package.json`

```json
{
  "name": "@code-quest/shared",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.2.0"
  }
}
```

---

#### File: `packages/shared/src/types/core.ts`

```typescript
/**
 * Core Game Types
 * These types represent the fundamental entities in Code Quest
 */

/**
 * Player represents the user in the RPG system
 */
export interface Player {
  id: string;
  name: string;
  level: number;
  exp: number;
  expToNextLevel: number;
  stats: PlayerStats;
  state: PlayerState;
  inventory: Inventory;
  skills: Skill[];
  companions: Companion[];
  achievements: Achievement[];
  createdAt: Date;
  lastActive: Date;
}

/**
 * Player stats (resources and attributes)
 */
export interface PlayerStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  gold: number;
  attack: number;
  defense: number;
  speed: number;
  intelligence: number;
}

/**
 * Player state (current status)
 */
export interface PlayerState {
  currentScene: SceneMode;
  currentLocation: LocationId;
  currentRegion: MapRegion;
  activeBattleId?: string;
  activeWorktrees: string[];
  lastAction: string;
  lastActionTime: Date;
}

/**
 * Resource change event
 */
export interface ResourceChange {
  type: 'hp' | 'mp' | 'exp' | 'gold';
  amount: number;
  currentValue: number;
  maxValue?: number;
  reason: string;
  timestamp: Date;
}

/**
 * Level progression calculation
 */
export interface LevelProgression {
  level: number;
  expRequired: number;
  rewards: LevelReward;
}

export interface LevelReward {
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  intelligence: number;
  unlockedSkills?: string[];
  unlockedFeatures?: string[];
}

/**
 * Calculate experience required for next level
 * Formula: 100 * (1.5 ^ (level - 1))
 */
export function calculateExpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * Calculate level rewards
 */
export function calculateLevelRewards(level: number): LevelReward {
  const rewards: LevelReward = {
    maxHp: 20,
    maxMp: 15,
    attack: 5,
    defense: 5,
    speed: 2,
    intelligence: 5,
  };

  // Special level rewards
  if (level === 5) {
    rewards.unlockedFeatures = ['ultimate-skill-slot'];
  } else if (level === 10) {
    rewards.unlockedFeatures = ['second-companion-slot'];
  } else if (level === 15) {
    rewards.unlockedFeatures = ['legendary-summons'];
  }

  return rewards;
}
```

**Purpose**: Core player and resource types
**Key Points**:
- Complete player state representation
- Resource management types
- Level progression logic
- Type-safe resource changes

**Dependencies**: None
**Used By**: All systems

---

#### File: `packages/shared/src/types/map.ts`

```typescript
/**
 * Map System Types
 * Represents the 3-region world structure
 */

/**
 * Map regions in CodeLand
 */
export enum MapRegion {
  TOWN = 'town',
  WILDERNESS = 'wilderness',
  DUNGEON = 'dungeon',
}

/**
 * Location ID format: <region>:<location-name>
 */
export type LocationId = string;

/**
 * Predefined location IDs
 */
export const LOCATIONS = {
  // Town locations
  TOWN_CENTER: 'town:center' as LocationId,
  SHOPPING_DISTRICT: 'town:shopping-district' as LocationId,
  TAVERN: 'town:tavern' as LocationId,
  STASIS_CHAMBER: 'town:stasis-chamber' as LocationId,
  GUILD_HALL: 'town:guild-hall' as LocationId,
  PLAYER_HOME: 'town:player-home' as LocationId,

  // Wilderness locations
  FOREST: 'wilderness:forest' as LocationId,
  MOUNTAINS: 'wilderness:mountains' as LocationId,
  WASTELAND: 'wilderness:wasteland' as LocationId,
  VOLCANO: 'wilderness:volcano' as LocationId,

  // Dungeon locations
  BUG_CAVE: 'dungeon:bug-cave' as LocationId,
  ARCHITECTURE_MAZE: 'dungeon:architecture-maze' as LocationId,
  TESTING_ARENA: 'dungeon:testing-arena' as LocationId,
  SECURITY_DUNGEON: 'dungeon:security-dungeon' as LocationId,
} as const;

/**
 * Location metadata
 */
export interface Location {
  id: LocationId;
  name: string;
  displayName: string;
  icon: string;
  region: MapRegion;
  description: string;
  coordinates: Coordinate;
  safeZone: boolean;
  encounterRate: number; // 0-1
  recommendedLevel: LevelRange;
  features: LocationFeature[];
  canAccessShops: boolean;
  canManageWorktrees: boolean;
  bgm?: string; // Background music
}

export interface Coordinate {
  x: number;
  y: number;
}

export interface LevelRange {
  min: number;
  max: number;
}

export enum LocationFeature {
  SHOPS = 'shops',
  TAVERN = 'tavern',
  GUILD_HALL = 'guild-hall',
  REST_POINT = 'rest-point',
  STASIS_CHAMBER = 'stasis-chamber',
  BOSS_AREA = 'boss-area',
}

/**
 * Encounter trigger rules
 */
export interface EncounterRule {
  region: MapRegion;
  location: LocationId;
  complexityThreshold: number; // Minimum complexity to trigger
  encounterChance: number; // 0-1
}

/**
 * Map state
 */
export interface MapState {
  currentLocation: LocationId;
  visitedLocations: Set<LocationId>;
  unlockedLocations: Set<LocationId>;
  fastTravelPoints: Set<LocationId>;
}
```

**Purpose**: Map system types
**Key Points**:
- 3 regions: Town, Wilderness, Dungeon
- Location metadata
- Encounter rules
- Safe zone definitions

**Dependencies**: `core.ts`
**Used By**: Scene system, Battle system

---

#### File: `packages/shared/src/types/battle.ts`

```typescript
/**
 * Battle System Types
 * Complete battle mechanics and enemy generation
 */

/**
 * Battle instance
 */
export interface Battle {
  id: string;
  enemy: Enemy;
  state: BattleState;
  participants: BattleParticipant[];
  turnOrder: string[]; // participant IDs in turn order
  currentTurn: number;
  log: BattleLogEntry[];
  rewards: BattleRewards;
  startedAt: Date;
  endedAt?: Date;
  worktreePath?: string; // For isolated battles
}

/**
 * Battle state enum
 */
export enum BattleState {
  INITIALIZING = 'initializing',
  IN_PROGRESS = 'in_progress',
  VICTORY = 'victory',
  DEFEAT = 'defeat',
  FLED = 'fled',
}

/**
 * Battle participant (player, companion, summon)
 */
export interface BattleParticipant {
  id: string;
  type: 'player' | 'companion' | 'summon';
  name: string;
  icon: string;
  stats: BattleStats;
  skills: Skill[];
  statusEffects: StatusEffect[];
  speed: number;
}

export interface BattleStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  intelligence: number;
}

/**
 * Enemy generated from prompt
 */
export interface Enemy {
  id: string;
  name: string;
  displayName: string;
  type: EnemyType;
  level: number;
  hp: number;
  maxHp: number;
  icon: string;
  color: string;
  weaknesses: string[]; // Skill IDs
  resistances: string[]; // Skill IDs
  mechanics: EnemyMechanic[];
  phase: number; // For multi-phase bosses
  affinityTable: AffinityMap;
}

export enum EnemyType {
  CODE_TASK = 'code-task',
  BUG_HUNT = 'bug-hunt',
  ARCHITECTURE = 'architecture',
  DOCUMENTATION = 'documentation',
  TESTING = 'testing',
  OPTIMIZATION = 'optimization',
  GENERAL = 'general',
}

export enum EnemyMechanic {
  COUNTER_ATTACK = 'counter_attack',
  MULTI_PHASE = 'multi_phase',
  SPEED_BOOST = 'speed_boost',
  SPECIAL_ATTACK = 'special_attack',
}

/**
 * Affinity system (skill effectiveness against enemy types)
 */
export type AffinityMap = Record<string, number>; // skillId -> multiplier

/**
 * Complexity analysis result
 */
export interface ComplexityAnalysis {
  score: number; // 0-30+
  level: number; // 1-15
  factors: ComplexityFactor[];
  classification: EnemyType;
  recommendation: 'dialog' | 'sync' | 'async';
}

export interface ComplexityFactor {
  name: string;
  score: number;
  reason: string;
}

/**
 * Battle action (player/companion/enemy action)
 */
export interface BattleAction {
  actorId: string;
  actorName: string;
  type: BattleActionType;
  targetId: string;
  targetName: string;
  skillId?: string;
  skillName?: string;
  damage?: number;
  healing?: number;
  mpCost?: number;
  statusEffects?: StatusEffect[];
  timestamp: Date;
}

export enum BattleActionType {
  ATTACK = 'attack',
  SKILL = 'skill',
  DEFEND = 'defend',
  ITEM = 'item',
  FLEE = 'flee',
  SUMMON = 'summon',
}

/**
 * Battle log entry
 */
export interface BattleLogEntry {
  id: string;
  turn: number;
  action: BattleAction;
  result: BattleActionResult;
  timestamp: Date;
}

export interface BattleActionResult {
  success: boolean;
  damage?: number;
  healing?: number;
  effectMultiplier?: number;
  effectLabel?: string; // "非常有效！", "效果不佳", etc.
  message: string;
}

/**
 * Status effect (buff/debuff)
 */
export interface StatusEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff';
  icon: string;
  duration: number; // turns remaining
  stat: string; // stat affected
  modifier: number; // multiplier or flat value
  description: string;
}

/**
 * Battle rewards
 */
export interface BattleRewards {
  exp: number;
  gold: number;
  items: string[];
  unlockedSkills: string[];
  achievements: string[];
}

/**
 * Damage calculation
 */
export interface DamageCalculation {
  baseDamage: number;
  affinityMultiplier: number;
  weaknessMultiplier: number;
  resistanceMultiplier: number;
  finalDamage: number;
  effectLabel: string;
}

/**
 * Calculate base damage
 * Formula: 100 + (skillMpCost * 3) + (playerLevel * 10)
 */
export function calculateBaseDamage(
  skillMpCost: number,
  playerLevel: number
): number {
  return 100 + skillMpCost * 3 + playerLevel * 10;
}

/**
 * Calculate final damage with all multipliers
 */
export function calculateFinalDamage(calc: {
  baseDamage: number;
  affinity: number;
  weakness: boolean;
  resistance: boolean;
}): DamageCalculation {
  const weaknessMultiplier = calc.weakness ? 1.5 : 1.0;
  const resistanceMultiplier = calc.resistance ? 0.5 : 1.0;
  const finalDamage = Math.floor(
    calc.baseDamage *
      calc.affinity *
      weaknessMultiplier *
      resistanceMultiplier
  );

  let effectLabel = '';
  const totalMultiplier =
    calc.affinity * weaknessMultiplier * resistanceMultiplier;

  if (totalMultiplier >= 2.0) effectLabel = '極度有效！';
  else if (totalMultiplier >= 1.5) effectLabel = '非常有效！';
  else if (totalMultiplier >= 1.3) effectLabel = '很有效！';
  else if (totalMultiplier >= 1.1) effectLabel = '有效';
  else if (totalMultiplier < 1.0) effectLabel = '效果不佳';

  return {
    baseDamage: calc.baseDamage,
    affinityMultiplier: calc.affinity,
    weaknessMultiplier,
    resistanceMultiplier,
    finalDamage,
    effectLabel,
  };
}
```

**Purpose**: Complete battle system types
**Key Points**:
- Battle state machine
- Enemy generation
- Damage calculation
- Turn-based mechanics
- Complexity analysis

**Dependencies**: `core.ts`, `skills.ts`
**Used By**: UI, Bridge Layer

---

#### File: `packages/shared/src/types/skills.ts`

```typescript
/**
 * Skill System Types
 * Skills are mapped from Claude Code CLI tools
 */

/**
 * Skill definition
 */
export interface Skill {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  category: SkillCategory;
  description: string;

  // Costs
  mpCost: number;
  cooldown: number; // seconds

  // Level
  level: number;
  maxLevel: number;

  // Requirements
  requiredPlayerLevel: number;
  requiredGold: number;
  prerequisiteSkills: string[];

  // Affinity (effectiveness against enemy types)
  affinity: Record<EnemyType, number>;

  // Metadata
  toolMapping?: string; // Maps to Claude Code tool
  isCustom: boolean;
  isUnlocked: boolean;
}

export enum SkillCategory {
  OFFENSIVE = 'offensive',
  DEFENSIVE = 'defensive',
  UTILITY = 'utility',
  SPECIAL = 'special',
}

/**
 * Skill usage tracking
 */
export interface SkillUsage {
  skillId: string;
  usedAt: Date;
  cooldownEndsAt: Date;
  mpSpent: number;
  damageDealt?: number;
  target?: string;
}

/**
 * Default skills (mapped from Claude Code tools)
 */
export const DEFAULT_SKILLS: Skill[] = [
  {
    id: 'read-skill',
    name: 'read-skill',
    displayName: '讀心術',
    icon: '📖',
    category: SkillCategory.UTILITY,
    description: '讀取文件內容，分析敵人弱點',
    mpCost: 15,
    cooldown: 5,
    level: 1,
    maxLevel: 5,
    requiredPlayerLevel: 1,
    requiredGold: 0,
    prerequisiteSkills: [],
    affinity: {
      [EnemyType.CODE_TASK]: 1.1,
      [EnemyType.BUG_HUNT]: 1.2,
      [EnemyType.ARCHITECTURE]: 1.3,
      [EnemyType.DOCUMENTATION]: 1.5,
      [EnemyType.TESTING]: 1.1,
      [EnemyType.OPTIMIZATION]: 1.0,
      [EnemyType.GENERAL]: 1.0,
    },
    toolMapping: 'Read',
    isCustom: false,
    isUnlocked: true,
  },
  {
    id: 'write-skill',
    name: 'write-skill',
    displayName: '創造術',
    icon: '✍️',
    category: SkillCategory.OFFENSIVE,
    description: '創造新文件，對敵人造成傷害',
    mpCost: 25,
    cooldown: 8,
    level: 1,
    maxLevel: 5,
    requiredPlayerLevel: 1,
    requiredGold: 0,
    prerequisiteSkills: [],
    affinity: {
      [EnemyType.CODE_TASK]: 1.3,
      [EnemyType.BUG_HUNT]: 0.9,
      [EnemyType.ARCHITECTURE]: 1.1,
      [EnemyType.DOCUMENTATION]: 1.4,
      [EnemyType.TESTING]: 1.0,
      [EnemyType.OPTIMIZATION]: 0.8,
      [EnemyType.GENERAL]: 1.0,
    },
    toolMapping: 'Write',
    isCustom: false,
    isUnlocked: true,
  },
  {
    id: 'edit-skill',
    name: 'edit-skill',
    displayName: '改寫術',
    icon: '✏️',
    category: SkillCategory.OFFENSIVE,
    description: '修改現有文件，精準攻擊敵人',
    mpCost: 20,
    cooldown: 6,
    level: 1,
    maxLevel: 5,
    requiredPlayerLevel: 1,
    requiredGold: 0,
    prerequisiteSkills: [],
    affinity: {
      [EnemyType.CODE_TASK]: 1.2,
      [EnemyType.BUG_HUNT]: 1.5,
      [EnemyType.ARCHITECTURE]: 1.3,
      [EnemyType.DOCUMENTATION]: 1.1,
      [EnemyType.TESTING]: 1.2,
      [EnemyType.OPTIMIZATION]: 1.4,
      [EnemyType.GENERAL]: 1.0,
    },
    toolMapping: 'Edit',
    isCustom: false,
    isUnlocked: true,
  },
  {
    id: 'bash-skill',
    name: 'bash-skill',
    displayName: '試煉之法',
    icon: '🧪',
    category: SkillCategory.UTILITY,
    description: '執行命令，測試和驗證',
    mpCost: 30,
    cooldown: 10,
    level: 1,
    maxLevel: 5,
    requiredPlayerLevel: 1,
    requiredGold: 0,
    prerequisiteSkills: [],
    affinity: {
      [EnemyType.CODE_TASK]: 1.0,
      [EnemyType.BUG_HUNT]: 1.3,
      [EnemyType.ARCHITECTURE]: 1.0,
      [EnemyType.DOCUMENTATION]: 0.8,
      [EnemyType.TESTING]: 1.5,
      [EnemyType.OPTIMIZATION]: 1.2,
      [EnemyType.GENERAL]: 1.0,
    },
    toolMapping: 'Bash',
    isCustom: false,
    isUnlocked: true,
  },
];
```

**Purpose**: Skill system types
**Key Points**:
- Skills mapped from CLI tools
- Affinity system
- Cooldown mechanics
- Skill progression

**Dependencies**: `battle.ts`
**Used By**: Battle system, Shop system

---

### 3. Bridge Layer

#### File: `packages/bridge/src/cli/CLIProcessManager.ts`

```typescript
/**
 * CLI Process Manager
 * Spawns and manages Claude Code CLI process
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { CLIOutput, CLICommand, CLIEvent } from '@code-quest/shared';

export class CLIProcessManager extends EventEmitter {
  private process: ChildProcess | null = null;
  private isRunning: boolean = false;

  constructor(private config: CLIConfig) {
    super();
  }

  /**
   * Start Claude Code CLI process
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('CLI process is already running');
    }

    const args = [
      '--streaming', // Enable streaming output
      '--format', 'json', // JSON output for parsing
      ...this.config.additionalArgs,
    ];

    this.process = spawn(this.config.cliPath || 'claude', args, {
      cwd: this.config.workingDirectory,
      env: {
        ...process.env,
        ...this.config.env,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.isRunning = true;

    // Handle stdout (main output)
    this.process.stdout?.on('data', (data) => {
      const output = data.toString();
      this.handleOutput(output);
    });

    // Handle stderr (errors)
    this.process.stderr?.on('data', (data) => {
      const error = data.toString();
      this.emit('error', error);
    });

    // Handle process exit
    this.process.on('exit', (code) => {
      this.isRunning = false;
      this.emit('exit', code);
    });

    this.emit('started');
  }

  /**
   * Send command to CLI
   */
  async sendCommand(command: CLICommand): Promise<void> {
    if (!this.isRunning || !this.process) {
      throw new Error('CLI process is not running');
    }

    const input = JSON.stringify(command) + '\n';
    this.process.stdin?.write(input);

    this.emit('command-sent', command);
  }

  /**
   * Stop CLI process
   */
  async stop(): Promise<void> {
    if (!this.process) {
      return;
    }

    this.process.kill('SIGTERM');
    this.process = null;
    this.isRunning = false;

    this.emit('stopped');
  }

  /**
   * Handle CLI output
   */
  private handleOutput(raw: string): void {
    try {
      const lines = raw.split('\n').filter((line) => line.trim());

      for (const line of lines) {
        const output: CLIOutput = JSON.parse(line);
        this.emit('output', output);

        // Emit specific events based on output type
        if (output.type === 'tool-use') {
          this.emit('tool-use', output);
        } else if (output.type === 'skill-use') {
          this.emit('skill-use', output);
        } else if (output.type === 'completion') {
          this.emit('completion', output);
        }
      }
    } catch (error) {
      // Not JSON, treat as raw text output
      this.emit('raw-output', raw);
    }
  }

  /**
   * Check if CLI is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

export interface CLIConfig {
  cliPath?: string; // Path to claude CLI (default: use PATH)
  workingDirectory: string;
  additionalArgs: string[];
  env?: Record<string, string>;
}
```

**Purpose**: Manage Claude Code CLI process
**Key Points**:
- Process spawning and lifecycle
- Stream-based output handling
- Event-driven architecture
- Error handling

**Dependencies**: Node.js `child_process`, `@code-quest/shared`
**Used By**: Bridge server

**Implementation Notes**:
1. Use `spawn` instead of `exec` for streaming output
2. Parse JSON output from CLI
3. Emit typed events for different output types
4. Handle process crashes gracefully

---

#### File: `packages/bridge/src/parser/CLIOutputParser.ts`

```typescript
/**
 * CLI Output Parser
 * Parses Claude CLI output and extracts game-relevant data
 */

import {
  CLIOutput,
  Skill,
  Tool Usage,
  ComplexityAnalysis,
  EnemyType,
} from '@code-quest/shared';

export class CLIOutputParser {
  /**
   * Parse tool usage from CLI output
   */
  parseToolUsage(output: CLIOutput): ToolUsage | null {
    if (output.type !== 'tool-use') {
      return null;
    }

    const { tool, input, output: toolOutput } = output;

    return {
      toolName: tool,
      skillId: this.mapToolToSkill(tool),
      input,
      output: toolOutput,
      timestamp: new Date(),
      mpCost: this.calculateToolMpCost(tool),
    };
  }

  /**
   * Map CLI tool to game skill
   */
  private mapToolToSkill(tool: string): string {
    const mapping: Record<string, string> = {
      Read: 'read-skill',
      Write: 'write-skill',
      Edit: 'edit-skill',
      Bash: 'bash-skill',
      Grep: 'grep-skill',
      Glob: 'glob-skill',
      WebSearch: 'web-search-skill',
      WebFetch: 'web-fetch-skill',
    };

    return mapping[tool] || 'unknown-skill';
  }

  /**
   * Calculate MP cost for tool usage
   */
  private calculateToolMpCost(tool: string): number {
    const costs: Record<string, number> = {
      Read: 15,
      Write: 25,
      Edit: 20,
      Bash: 30,
      Grep: 10,
      Glob: 10,
      WebSearch: 35,
      WebFetch: 30,
    };

    return costs[tool] || 20;
  }

  /**
   * Analyze prompt complexity
   */
  analyzeComplexity(prompt: string): ComplexityAnalysis {
    let score = 0;
    const factors: ComplexityFactor[] = [];

    // 1. Length factor
    if (prompt.length > 200) {
      score += 3;
      factors.push({
        name: 'length',
        score: 3,
        reason: '超過 200 字',
      });
    } else if (prompt.length > 100) {
      score += 2;
      factors.push({
        name: 'length',
        score: 2,
        reason: '超過 100 字',
      });
    } else {
      score += 1;
      factors.push({
        name: 'length',
        score: 1,
        reason: '基礎長度',
      });
    }

    // 2. Heavy keywords
    const heavyKeywords = [
      'architecture',
      '架構',
      'refactor',
      '重構',
      'optimize',
      '優化',
      'design pattern',
      '設計模式',
    ];

    for (const keyword of heavyKeywords) {
      if (prompt.toLowerCase().includes(keyword.toLowerCase())) {
        score += 2;
        factors.push({
          name: 'heavy-keyword',
          score: 2,
          reason: `包含重量級關鍵字: ${keyword}`,
        });
      }
    }

    // 3. Medium keywords
    const mediumKeywords = [
      'implement',
      '實作',
      'create',
      '創建',
      'review',
      '審查',
      'test',
      '測試',
    ];

    for (const keyword of mediumKeywords) {
      if (prompt.toLowerCase().includes(keyword.toLowerCase())) {
        score += 1;
        factors.push({
          name: 'medium-keyword',
          score: 1,
          reason: `包含中量級關鍵字: ${keyword}`,
        });
      }
    }

    // 4. Multi-step task
    const multiStepIndicators = ['and', 'then', 'after', 'before', '以及', '然後'];
    for (const indicator of multiStepIndicators) {
      if (prompt.includes(indicator)) {
        score += 2;
        factors.push({
          name: 'multi-step',
          score: 2,
          reason: '包含多步驟任務指示詞',
        });
        break;
      }
    }

    // 5. Tech stack complexity
    const techKeywords = ['React', 'Vue', 'Node', 'Python', 'Java', 'TypeScript'];
    const foundTechs = techKeywords.filter((tech) =>
      prompt.includes(tech)
    );

    if (foundTechs.length > 0) {
      score += foundTechs.length;
      factors.push({
        name: 'tech-stack',
        score: foundTechs.length,
        reason: `包含 ${foundTechs.length} 個技術關鍵字: ${foundTechs.join(', ')}`,
      });
    }

    // Calculate level (1-15)
    const level = Math.min(15, Math.max(1, Math.floor(score / 2) + 1));

    // Classify enemy type
    const classification = this.classifyPrompt(prompt);

    // Recommendation
    let recommendation: 'dialog' | 'sync' | 'async';
    if (score <= 2) {
      recommendation = 'dialog';
    } else if (score <= 7) {
      recommendation = 'sync';
    } else {
      recommendation = 'async';
    }

    return {
      score,
      level,
      factors,
      classification,
      recommendation,
    };
  }

  /**
   * Classify prompt into enemy type
   */
  private classifyPrompt(prompt: string): EnemyType {
    const lower = prompt.toLowerCase();

    if (
      lower.includes('bug') ||
      lower.includes('debug') ||
      lower.includes('fix') ||
      lower.includes('錯誤') ||
      lower.includes('修復')
    ) {
      return EnemyType.BUG_HUNT;
    }

    if (
      lower.includes('architecture') ||
      lower.includes('架構') ||
      lower.includes('design') ||
      lower.includes('設計') ||
      lower.includes('pattern') ||
      lower.includes('refactor') ||
      lower.includes('重構')
    ) {
      return EnemyType.ARCHITECTURE;
    }

    if (
      lower.includes('test') ||
      lower.includes('測試') ||
      lower.includes('unit test') ||
      lower.includes('coverage')
    ) {
      return EnemyType.TESTING;
    }

    if (
      lower.includes('document') ||
      lower.includes('文檔') ||
      lower.includes('readme') ||
      lower.includes('comment') ||
      lower.includes('註解')
    ) {
      return EnemyType.DOCUMENTATION;
    }

    if (
      lower.includes('optimize') ||
      lower.includes('優化') ||
      lower.includes('performance') ||
      lower.includes('性能') ||
      lower.includes('speed')
    ) {
      return EnemyType.OPTIMIZATION;
    }

    if (
      lower.includes('code') ||
      lower.includes('程式') ||
      lower.includes('function') ||
      lower.includes('class') ||
      lower.includes('implement') ||
      lower.includes('實作')
    ) {
      return EnemyType.CODE_TASK;
    }

    return EnemyType.GENERAL;
  }
}

interface ToolUsage {
  toolName: string;
  skillId: string;
  input: any;
  output: any;
  timestamp: Date;
  mpCost: number;
}
```

**Purpose**: Parse CLI output and extract game data
**Key Points**:
- Tool usage parsing
- Complexity analysis algorithm
- Prompt classification
- MP cost calculation

**Dependencies**: `@code-quest/shared`
**Used By**: Bridge server, Event bus

---

#### File: `packages/bridge/src/server/WebSocketServer.ts`

```typescript
/**
 * WebSocket Server
 * Real-time communication between Bridge and UI
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { EventBus } from '../events/EventBus';
import { WSMessage, WSEvent } from '@code-quest/shared';

export class WebSocketServer {
  private app: express.Application;
  private server: ReturnType<typeof createServer>;
  private io: SocketIOServer;
  private eventBus: EventBus;

  constructor(
    private config: WebSocketConfig,
    eventBus: EventBus
  ) {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.allowedOrigins,
        methods: ['GET', 'POST'],
      },
    });
    this.eventBus = eventBus;

    this.setupRoutes();
    this.setupSocketHandlers();
    this.setupEventBusListeners();
  }

  /**
   * Setup Express routes
   */
  private setupRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date() });
    });

    this.app.get('/api/state', (req, res) => {
      const state = this.eventBus.getState();
      res.json(state);
    });
  }

  /**
   * Setup Socket.IO handlers
   */
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Send initial state
      const initialState = this.eventBus.getState();
      socket.emit('initial-state', initialState);

      // Handle client messages
      socket.on('message', (message: WSMessage) => {
        this.handleClientMessage(socket, message);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });

      // Heartbeat
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });
    });
  }

  /**
   * Handle messages from client
   */
  private handleClientMessage(socket: any, message: WSMessage): void {
    switch (message.type) {
      case 'command':
        this.eventBus.emit('client-command', message.payload);
        break;

      case 'action':
        this.eventBus.emit('client-action', message.payload);
        break;

      case 'request-state':
        const state = this.eventBus.getState();
        socket.emit('state-update', state);
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  /**
   * Setup event bus listeners (bridge -> UI)
   */
  private setupEventBusListeners(): void {
    // Game events
    this.eventBus.on('game-event', (event: WSEvent) => {
      this.io.emit('game-event', event);
    });

    // Battle events
    this.eventBus.on('battle-started', (battle) => {
      this.io.emit('battle-started', battle);
    });

    this.eventBus.on('battle-action', (action) => {
      this.io.emit('battle-action', action);
    });

    this.eventBus.on('battle-ended', (result) => {
      this.io.emit('battle-ended', result);
    });

    // Resource changes
    this.eventBus.on('resource-changed', (change) => {
      this.io.emit('resource-changed', change);
    });

    // Level up
    this.eventBus.on('level-up', (data) => {
      this.io.emit('level-up', data);
    });

    // Skill usage
    this.eventBus.on('skill-used', (usage) => {
      this.io.emit('skill-used', usage);
    });

    // CLI events
    this.eventBus.on('cli-output', (output) => {
      this.io.emit('cli-output', output);
    });

    // Error events
    this.eventBus.on('error', (error) => {
      this.io.emit('error', error);
    });
  }

  /**
   * Start server
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.config.port, () => {
        console.log(`WebSocket server running on port ${this.config.port}`);
        resolve();
      });
    });
  }

  /**
   * Stop server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.io.close(() => {
        this.server.close(() => {
          console.log('WebSocket server stopped');
          resolve();
        });
      });
    });
  }
}

export interface WebSocketConfig {
  port: number;
  allowedOrigins: string[];
}
```

**Purpose**: WebSocket server for real-time communication
**Key Points**:
- Socket.IO for WebSocket
- Event-driven architecture
- Bidirectional communication
- State synchronization

**Dependencies**: `express`, `socket.io`, `EventBus`
**Used By**: UI package

---

## Testing Strategy

### Unit Tests

**Test Coverage Targets**:
- Type definitions: 100% (compile-time checks)
- CLI Process Manager: 90%
- Output Parser: 95%
- Event Bus: 90%

**Key Test Files**:

```
packages/bridge/src/__tests__/
├── cli/
│   ├── CLIProcessManager.test.ts
│   └── CLIOutputParser.test.ts
├── events/
│   └── EventBus.test.ts
└── server/
    └── WebSocketServer.test.ts
```

**Sample Test: CLI Output Parser**

```typescript
// packages/bridge/src/__tests__/parser/CLIOutputParser.test.ts
import { describe, it, expect } from 'vitest';
import { CLIOutputParser } from '../../parser/CLIOutputParser';
import { EnemyType } from '@code-quest/shared';

describe('CLIOutputParser', () => {
  const parser = new CLIOutputParser();

  describe('analyzeComplexity', () => {
    it('should classify simple prompt as dialog', () => {
      const result = parser.analyzeComplexity('What is React?');

      expect(result.recommendation).toBe('dialog');
      expect(result.level).toBeLessThanOrEqual(3);
    });

    it('should classify medium prompt as sync', () => {
      const result = parser.analyzeComplexity(
        'Create a simple counter component with useState'
      );

      expect(result.recommendation).toBe('sync');
      expect(result.level).toBeGreaterThanOrEqual(4);
      expect(result.level).toBeLessThanOrEqual(7);
    });

    it('should classify complex prompt as async', () => {
      const result = parser.analyzeComplexity(
        'Refactor the authentication system to use JWT tokens, implement password hashing with bcrypt, and add role-based access control with middleware'
      );

      expect(result.recommendation).toBe('async');
      expect(result.level).toBeGreaterThanOrEqual(8);
    });

    it('should detect bug-hunt tasks', () => {
      const result = parser.analyzeComplexity('Fix the login bug in auth.ts');

      expect(result.classification).toBe(EnemyType.BUG_HUNT);
    });

    it('should detect architecture tasks', () => {
      const result = parser.analyzeComplexity(
        'Refactor the codebase to use a layered architecture pattern'
      );

      expect(result.classification).toBe(EnemyType.ARCHITECTURE);
    });
  });

  describe('parseToolUsage', () => {
    it('should parse Read tool usage', () => {
      const output = {
        type: 'tool-use',
        tool: 'Read',
        input: { file_path: '/test.ts' },
        output: 'file content',
      };

      const usage = parser.parseToolUsage(output);

      expect(usage).not.toBeNull();
      expect(usage?.skillId).toBe('read-skill');
      expect(usage?.mpCost).toBe(15);
    });

    it('should parse Write tool usage', () => {
      const output = {
        type: 'tool-use',
        tool: 'Write',
        input: { file_path: '/new.ts', content: 'code' },
        output: 'success',
      };

      const usage = parser.parseToolUsage(output);

      expect(usage).not.toBeNull();
      expect(usage?.skillId).toBe('write-skill');
      expect(usage?.mpCost).toBe(25);
    });
  });
});
```

### Integration Tests

**Test Scenarios**:
1. CLI → Bridge → WebSocket flow
2. Event propagation through system
3. State synchronization
4. Error handling

**Sample Integration Test**:

```typescript
// packages/bridge/src/__tests__/integration/full-flow.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { CLIProcessManager } from '../../cli/CLIProcessManager';
import { WebSocketServer } from '../../server/WebSocketServer';
import { EventBus } from '../../events/EventBus';
import { io as ioClient } from 'socket.io-client';

describe('Full Integration Flow', () => {
  let eventBus: EventBus;
  let cliManager: CLIProcessManager;
  let wsServer: WebSocketServer;
  let client: any;

  beforeAll(async () => {
    eventBus = new EventBus();
    cliManager = new CLIProcessManager({
      workingDirectory: process.cwd(),
      additionalArgs: [],
    });
    wsServer = new WebSocketServer(
      { port: 3001, allowedOrigins: ['*'] },
      eventBus
    );

    await wsServer.start();
    await cliManager.start();

    client = ioClient('http://localhost:3001');
  });

  afterAll(async () => {
    client.disconnect();
    await wsServer.stop();
    await cliManager.stop();
  });

  it('should forward CLI tool usage to WebSocket clients', (done) => {
    client.on('skill-used', (usage) => {
      expect(usage.skillId).toBeDefined();
      expect(usage.mpCost).toBeGreaterThan(0);
      done();
    });

    // Simulate CLI tool usage
    cliManager.sendCommand({
      type: 'prompt',
      content: 'Read the file test.ts',
    });
  });

  it('should update player resources on tool usage', (done) => {
    let initialMp = 0;

    client.on('initial-state', (state) => {
      initialMp = state.player.stats.mp;
    });

    client.on('resource-changed', (change) => {
      if (change.type === 'mp') {
        expect(change.currentValue).toBeLessThan(initialMp);
        done();
      }
    });

    // Trigger resource change
    cliManager.sendCommand({
      type: 'prompt',
      content: 'Write a new file',
    });
  });
});
```

### E2E Tests

**Test Scenarios**:
1. Start application → Send prompt → Receive battle event
2. Complete battle → Receive rewards → Level up
3. Multiple concurrent battles
4. Error recovery

**Tools**:
- Playwright for UI testing
- Custom scripts for CLI simulation

---

## Integration Points

### Internal Integrations (Within Phase 0)

```
TypeScript Types ←→ All Code
     ↓
CLI Process Manager → Output Parser → Event Bus
     ↓                                   ↓
WebSocket Server ←─────────────────────┘
```

### External Integrations (With Future Phases)

**Phase 0 → Phase 1** (Core Systems):
- Types used by Map System, Scene System, Battle System
- Event bus consumed by game logic
- WebSocket consumed by UI components

**Phase 0 → Phase 2+** (Extended Systems):
- Types extended for companions, summons, shops
- Event bus extended for new event types
- Bridge Layer remains stable

### Data Flow

```
User Input (UI)
    ↓ WebSocket
Bridge Layer
    ↓ child_process
Claude CLI
    ↓ stdout
Output Parser
    ↓ parsed data
Event Bus
    ↓ emit events
WebSocket Server
    ↓ Socket.IO
UI Components (React)
    ↓ user interaction
[cycle repeats]
```

### State Management

**Global State** (managed by Bridge):
- Player state
- Current battles
- Active worktrees
- Resource pools

**Local State** (managed by UI):
- UI preferences
- Animation states
- Modal visibility
- Form inputs

---

## Success Criteria

Phase 0 is complete when:

- [ ] **Build System**
  - [ ] All packages build successfully
  - [ ] `turbo build` completes without errors
  - [ ] TypeScript compilation passes

- [ ] **Type System**
  - [ ] All 11 systems have complete type definitions
  - [ ] Types are exported from `@code-quest/shared`
  - [ ] No `any` types in shared package

- [ ] **Bridge Layer**
  - [ ] Claude CLI process starts and runs
  - [ ] Output parser extracts tool usage correctly
  - [ ] WebSocket server accepts connections
  - [ ] Events flow from CLI to UI

- [ ] **Testing**
  - [ ] Unit test coverage ≥ 85%
  - [ ] Integration tests pass
  - [ ] No critical bugs

- [ ] **Documentation**
  - [ ] API documentation generated
  - [ ] Setup guide written
  - [ ] Architecture diagram created

---

## Risk Mitigation

### Risk 1: Claude CLI Integration Issues

**Risk**: Claude CLI API changes or behaves unexpectedly
**Mitigation**:
- Abstract CLI interface behind adapter pattern
- Mock CLI for testing
- Version lock Claude CLI
- Document CLI version compatibility

### Risk 2: WebSocket Connection Stability

**Risk**: Connection drops or high latency
**Mitigation**:
- Implement reconnection logic
- Add message queuing
- Heartbeat mechanism
- Connection status indicators

### Risk 3: Type System Complexity

**Risk**: Types become too complex or circular dependencies
**Mitigation**:
- Keep types simple and focused
- Use type aliases for complex unions
- Separate concerns (core vs. derived types)
- Regular refactoring

---

## Next Steps

After Phase 0 completion:

1. **Phase 1**: Implement Map System and Scene System using the types and bridge
2. **Phase 2**: Build Battle System with enemy generation and combat mechanics
3. **Continue**: Follow implementation plan for remaining phases

---

**Document Version**: 1.0
**Last Updated**: 2026-02-08
**Status**: Ready for Implementation
