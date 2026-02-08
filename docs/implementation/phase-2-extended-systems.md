# Phase 2: Extended Systems - Implementation Plan

**Phase Duration**: 3 weeks
**Phase Status**: Planning
**Dependencies**: Phase 0 (Foundation), Phase 1 (Core Systems)
**Deliverables**: Battle System (L1), Companion System (L2), Summon Beast System (L2)

---

## Phase Overview

### Goals

Phase 2 implements the **battle core** and its extensions:
1. **Battle System (L1)**: Enemy generation, turn-based combat, damage calculation
2. **Companion System (L2)**: Subagent mapping, companion AI, growth mechanics
3. **Summon Beast System (L2)**: 4 summon types, 4 behavior patterns, tactical usage

**Key Objectives**:
- Complete RPG battle mechanics
- Integrate CLI tool usage as combat actions
- Implement AI companions
- Add summon beast tactical layer
- Achieve DQ-style combat feel

### Timeline

| Week | Focus Area | Key Deliverables |
|------|-----------|------------------|
| Week 1 | Battle System Core | Enemy generation, turn system, damage calc |
| Week 2 | Companion System | Subagent integration, AI behavior, growth |
| Week 3 | Summon Beasts | 4 summon types, behaviors, battle integration |

### Deliverables

**Battle System (L1)**:
- ✅ Enemy generation from prompt complexity
- ✅ Turn-based combat engine
- ✅ Damage calculation with affinity
- ✅ Battle UI (DQ-style)
- ✅ Victory/defeat flow
- ✅ Rewards calculation

**Companion System (L2)**:
- ✅ Subagent → Companion mapping
- ✅ Companion AI behavior
- ✅ Growth and leveling
- ✅ Companion management UI
- ✅ Summon flow (20-30 MP)

**Summon Beast System (L2)**:
- ✅ 4 summon types (Skill, Combo, MCP, Item)
- ✅ 4 behavior types (Immediate, Auto, Passive, Interactive)
- ✅ Summon catalog
- ✅ Battle integration
- ✅ Visual effects

---

## Task Checklist

### Week 1: Battle System

#### 1.1 Enemy Generator
- [ ] ComplexityAnalyzer service
- [ ] EnemyFactory class
- [ ] 7 enemy types with metadata
- [ ] HP calculation by type
- [ ] Special mechanics (counter, multi-phase, etc.)
- [ ] Boss generation (Lv 13+)

#### 1.2 Battle State Machine
- [ ] BattleManager class
- [ ] Battle lifecycle (init, in-progress, ended)
- [ ] Turn order calculation (by speed)
- [ ] Action queue
- [ ] Battle log accumulation

#### 1.3 Damage Calculator
- [ ] Base damage formula
- [ ] Affinity system lookup
- [ ] Weakness/resistance multipliers
- [ ] Final damage calculation
- [ ] Effect label generation

#### 1.4 Turn System
- [ ] Player turn handler
- [ ] Companion turn (auto)
- [ ] Enemy turn (AI)
- [ ] Summon beast turn
- [ ] Turn transition animations

#### 1.5 Battle UI
- [ ] BattleScene component
- [ ] Enemy display card
- [ ] Player/Companion panels
- [ ] Action menu (Attack, Skill, Item, Flee)
- [ ] Battle log scrollable list
- [ ] Turn indicator
- [ ] Damage numbers animation

#### 1.6 Rewards & Victory
- [ ] Calculate EXP (with bonuses)
- [ ] Calculate Gold (with bonuses)
- [ ] Item drops
- [ ] Victory animation
- [ ] Defeat handling
- [ ] Flee mechanics

### Week 2: Companion System

#### 2.1 Companion Data
- [ ] Companion type definitions
- [ ] Default companions (3)
- [ ] Stats calculation by level
- [ ] Skill sets per companion
- [ ] Rarity tiers (Common, Rare, Epic)

#### 2.2 Summon Flow
- [ ] Summon companion action
- [ ] MP cost by rarity (20/25/30)
- [ ] Cooldown enforcement (180/240/300s)
- [ ] Max 2 companions limit
- [ ] Summon animation

#### 2.3 Companion AI
- [ ] Priority system:
  - [ ] Player HP < 30% → Support skill
  - [ ] Enemy weakness → Effective skill
  - [ ] Default → Best available attack
- [ ] Skill selection logic
- [ ] Target selection logic
- [ ] MP management

#### 2.4 Companion Growth
- [ ] EXP gain formula
- [ ] Level progression
- [ ] Stat increases per level
- [ ] Skill unlocks at Lv 5, 10, 15
- [ ] Loyalty system (optional)

#### 2.5 Companion Management UI
- [ ] CompanionList component
- [ ] CompanionCard with stats
- [ ] CreateCompanion modal
- [ ] Rename companion
- [ ] View active battles
- [ ] Companion storage (max 5)

#### 2.6 Integration with Subagents
- [ ] Map Subagent → Companion
- [ ] Track subagent usage
- [ ] Sync stats with activity
- [ ] EXP from subagent completions

### Week 3: Summon Beast System

#### 2.7 Summon Types
- [ ] Skill Summons (high MP, powerful)
- [ ] Combo Summons (auto-trigger)
- [ ] MCP Tool Summons (utility)
- [ ] Item Summons (passive buffs)

#### 2.8 Behavior Implementation
- [ ] Immediate behavior (one-shot)
- [ ] Automatic behavior (2-3 turns)
- [ ] Passive behavior (3-5 turns)
- [ ] Interactive behavior (player control)

#### 2.9 Summon Catalog
- [ ] 10+ summon beasts
- [ ] Rarity tiers
- [ ] MP costs (20-120)
- [ ] Cooldowns (120-600s)
- [ ] Unlock conditions

#### 2.10 Battle Integration
- [ ] Summon action in battle menu
- [ ] Unit limit (5 total: player + 2 companions + 2 summons)
- [ ] Replace oldest summon if limit hit
- [ ] Turn order integration
- [ ] Summon expiration handling

#### 2.11 Summon UI
- [ ] SummonBeastCatalog component
- [ ] SummonCard with details
- [ ] Summon animation (magic circle)
- [ ] Active summon indicators
- [ ] Duration countdown

#### 2.12 Visual Effects
- [ ] Summoning magic circle
- [ ] Beast appearance animation
- [ ] Skill cast effects
- [ ] Passive aura effects
- [ ] Departure animation

---

## File-by-File Implementation Guide

### 1. Battle System

#### File: `packages/ui/src/services/EnemyFactory.ts`

```typescript
import {
  Enemy,
  EnemyType,
  EnemyMechanic,
  ComplexityAnalysis,
} from '@code-quest/shared';

export class EnemyFactory {
  /**
   * Generate enemy from complexity analysis
   */
  generateEnemy(analysis: ComplexityAnalysis): Enemy {
    const { level, classification } = analysis;

    const enemy: Enemy = {
      id: `enemy-${Date.now()}`,
      name: this.getEnemyName(classification, level),
      displayName: this.getDisplayName(classification, level),
      type: classification,
      level,
      hp: this.calculateMaxHP(level, classification),
      maxHp: this.calculateMaxHP(level, classification),
      icon: this.getEnemyIcon(classification),
      color: this.getEnemyColor(classification),
      weaknesses: this.getWeaknesses(classification),
      resistances: this.getResistances(classification),
      mechanics: this.getMechanics(level, classification),
      phase: 1,
      affinityTable: this.buildAffinityTable(classification),
    };

    return enemy;
  }

  /**
   * Calculate max HP
   * Formula: level * 100 * hpMultiplier
   */
  private calculateMaxHP(level: number, type: EnemyType): number {
    const multipliers: Record<EnemyType, number> = {
      [EnemyType.CODE_TASK]: 1.0,
      [EnemyType.BUG_HUNT]: 1.5,
      [EnemyType.ARCHITECTURE]: 2.0,
      [EnemyType.DOCUMENTATION]: 0.8,
      [EnemyType.TESTING]: 1.2,
      [EnemyType.OPTIMIZATION]: 1.8,
      [EnemyType.GENERAL]: 1.0,
    };

    return level * 100 * multipliers[type];
  }

  /**
   * Get enemy mechanics based on level and type
   */
  private getMechanics(level: number, type: EnemyType): EnemyMechanic[] {
    const mechanics: EnemyMechanic[] = [];

    // Counter attack for bug-hunt Lv 5+
    if (type === EnemyType.BUG_HUNT && level >= 5) {
      mechanics.push(EnemyMechanic.COUNTER_ATTACK);
    }

    // Multi-phase for architecture Lv 10+
    if (type === EnemyType.ARCHITECTURE && level >= 10) {
      mechanics.push(EnemyMechanic.MULTI_PHASE);
    }

    // Speed boost for optimization Lv 5+
    if (type === EnemyType.OPTIMIZATION && level >= 5) {
      mechanics.push(EnemyMechanic.SPEED_BOOST);
    }

    // Boss special attack Lv 13+
    if (level >= 13) {
      mechanics.push(EnemyMechanic.SPECIAL_ATTACK);
    }

    return mechanics;
  }

  /**
   * Get weaknesses by enemy type
   */
  private getWeaknesses(type: EnemyType): string[] {
    const weaknessMap: Record<EnemyType, string[]> = {
      [EnemyType.CODE_TASK]: ['code-generator', 'code-reviewer'],
      [EnemyType.BUG_HUNT]: ['debug-helper', 'test-generator', 'code-reviewer'],
      [EnemyType.ARCHITECTURE]: ['code-reviewer'],
      [EnemyType.DOCUMENTATION]: ['doc-writer'],
      [EnemyType.TESTING]: ['test-generator'],
      [EnemyType.OPTIMIZATION]: ['code-reviewer', 'debug-helper'],
      [EnemyType.GENERAL]: [],
    };

    return weaknessMap[type];
  }

  // Additional helper methods...
}
```

**Purpose**: Generate enemies from prompts
**Key Points**:
- Complexity → Enemy mapping
- HP calculation with multipliers
- Mechanics based on level/type
- Weakness/resistance tables

---

#### File: `packages/ui/src/services/BattleManager.ts`

```typescript
import {
  Battle,
  BattleState,
  BattleParticipant,
  BattleAction,
  Enemy,
} from '@code-quest/shared';
import { DamageCalculator } from './DamageCalculator';
import { v4 as uuidv4 } from 'uuid';

export class BattleManager {
  private battle: Battle;
  private damageCalc: DamageCalculator;

  constructor(enemy: Enemy, player: BattleParticipant) {
    this.damageCalc = new DamageCalculator();

    this.battle = {
      id: uuidv4(),
      enemy,
      state: BattleState.INITIALIZING,
      participants: [player],
      turnOrder: [],
      currentTurn: 0,
      log: [],
      rewards: {
        exp: 0,
        gold: 0,
        items: [],
        unlockedSkills: [],
        achievements: [],
      },
      startedAt: new Date(),
    };
  }

  /**
   * Start battle
   */
  startBattle(): void {
    this.battle.state = BattleState.IN_PROGRESS;
    this.calculateTurnOrder();

    this.emit('battle-started', this.battle);
  }

  /**
   * Calculate turn order based on speed
   */
  private calculateTurnOrder(): void {
    const units = [...this.battle.participants];

    // Sort by speed (descending)
    units.sort((a, b) => b.speed - a.speed);

    this.battle.turnOrder = units.map((u) => u.id);
  }

  /**
   * Execute player action
   */
  async executePlayerAction(action: BattleAction): Promise<void> {
    if (action.type === 'skill') {
      await this.executeSkillAction(action);
    } else if (action.type === 'attack') {
      await this.executeAttackAction(action);
    } else if (action.type === 'flee') {
      this.handleFlee();
    }

    // Check battle end
    if (this.battle.enemy.hp <= 0) {
      this.endBattle(true);
    }

    // Proceed to next turn
    this.nextTurn();
  }

  /**
   * Execute skill action
   */
  private async executeSkillAction(action: BattleAction): Promise<void> {
    const { skillId, actorId } = action;
    const actor = this.battle.participants.find((p) => p.id === actorId);

    if (!actor) return;

    const skill = actor.skills.find((s) => s.id === skillId);
    if (!skill) return;

    // Check MP
    if (actor.stats.mp < skill.mpCost) {
      throw new Error('MP不足');
    }

    // Calculate damage
    const damage = this.damageCalc.calculate({
      skillMpCost: skill.mpCost,
      playerLevel: actor.level || 1,
      skillId: skill.id,
      enemyType: this.battle.enemy.type,
      enemyWeaknesses: this.battle.enemy.weaknesses,
      enemyResistances: this.battle.enemy.resistances,
    });

    // Apply damage
    this.battle.enemy.hp -= damage.finalDamage;

    // Deduct MP
    actor.stats.mp -= skill.mpCost;

    // Log action
    this.battle.log.push({
      id: uuidv4(),
      turn: this.battle.currentTurn,
      action,
      result: {
        success: true,
        damage: damage.finalDamage,
        effectMultiplier: damage.affinityMultiplier,
        effectLabel: damage.effectLabel,
        message: `${actor.name}使用${skill.displayName}！造成${damage.finalDamage}點傷害！`,
      },
      timestamp: new Date(),
    });

    this.emit('battle-action', action);
  }

  /**
   * End battle
   */
  private endBattle(victory: boolean): void {
    this.battle.state = victory ? BattleState.VICTORY : BattleState.DEFEAT;
    this.battle.endedAt = new Date();

    if (victory) {
      this.calculateRewards();
    }

    this.emit('battle-ended', {
      battle: this.battle,
      victory,
    });
  }

  /**
   * Calculate battle rewards
   */
  private calculateRewards(): void {
    const { enemy } = this.battle;
    const baseExp = enemy.level * 30;
    const baseGold = enemy.level * 15;

    // Apply multipliers (type, difficulty, bonuses)
    const typeMultiplier = 1.0; // Simplified
    const difficultyMultiplier = 1.0;

    this.battle.rewards.exp = Math.floor(
      baseExp * typeMultiplier * difficultyMultiplier
    );
    this.battle.rewards.gold = Math.floor(
      baseGold * typeMultiplier * difficultyMultiplier
    );
  }

  /**
   * Get battle state
   */
  getBattle(): Battle {
    return this.battle;
  }

  /**
   * Emit battle event
   */
  private emit(event: string, data: any): void {
    window.dispatchEvent(
      new CustomEvent(event, { detail: data })
    );
  }
}
```

**Purpose**: Core battle logic controller
**Key Points**:
- Battle lifecycle management
- Turn-based execution
- Action handling
- Rewards calculation

---

### 2. Companion System

#### File: `packages/ui/src/stores/companionStore.ts`

```typescript
import { create } from 'zustand';
import { Companion } from '@code-quest/shared';

interface CompanionState {
  companions: Companion[];
  activeCompanions: string[]; // IDs of companions in battle
  maxActiveCompanions: number;

  // Actions
  addCompanion: (companion: Companion) => void;
  summonCompanion: (id: string) => void;
  dismissCompanion: (id: string) => void;
  gainCompanionExp: (id: string, exp: number) => void;
}

export const useCompanionStore = create<CompanionState>((set, get) => ({
  companions: [],
  activeCompanions: [],
  maxActiveCompanions: 2,

  addCompanion: (companion: Companion) => {
    set((state) => ({
      companions: [...state.companions, companion],
    }));
  },

  summonCompanion: (id: string) => {
    const { activeCompanions, maxActiveCompanions } = get();

    if (activeCompanions.length >= maxActiveCompanions) {
      throw new Error('已達到夥伴上限');
    }

    if (activeCompanions.includes(id)) {
      throw new Error('夥伴已在戰場上');
    }

    set({
      activeCompanions: [...activeCompanions, id],
    });
  },

  dismissCompanion: (id: string) => {
    set((state) => ({
      activeCompanions: state.activeCompanions.filter((cid) => cid !== id),
    }));
  },

  gainCompanionExp: (id: string, exp: number) => {
    set((state) => {
      const updated = state.companions.map((c) => {
        if (c.id === id) {
          const newExp = c.exp + exp;
          const newLevel = calculateCompanionLevel(newExp);

          return {
            ...c,
            exp: newExp,
            level: newLevel,
          };
        }
        return c;
      });

      return { companions: updated };
    });
  },
}));

function calculateCompanionLevel(exp: number): number {
  // Simplified: 100 * 1.3^(level-1)
  let level = 1;
  let required = 100;

  while (exp >= required) {
    exp -= required;
    level++;
    required = Math.floor(100 * Math.pow(1.3, level - 1));
  }

  return level;
}
```

**Purpose**: Companion state management
**Key Points**:
- Track all companions
- Active companion limit (2)
- Summon/dismiss actions
- EXP and leveling

---

## Testing Strategy

- Unit tests for EnemyFactory, BattleManager, DamageCalculator
- Integration tests for battle flow
- UI component tests for BattleScene
- E2E test: Complete battle from start to victory

---

## Integration Points

```
Battle System → Scene System (mode switch)
Battle System → Map System (encounter rates)
Companion System → Battle System (battle participants)
Summon System → Battle System (unit limit, turn order)
```

---

## Success Criteria

- [ ] Enemies generate correctly from prompts
- [ ] Turn-based combat works smoothly
- [ ] Damage calculation matches formula
- [ ] Companions summon and fight automatically
- [ ] Summon beasts integrate into battles
- [ ] Battle UI feels like DQ/FF
- [ ] Victory rewards calculate correctly

---

**Document Version**: 1.0
**Last Updated**: 2026-02-08
**Status**: Ready for Implementation
