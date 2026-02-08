# Phase 1: Core Systems - Implementation Plan

**Phase Duration**: 4 weeks
**Phase Status**: Planning
**Dependencies**: Phase 0 (Foundation)
**Deliverables**: Map System (L0), Scene System (L0), Shop System (L0), Worktree System (L0)

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

Phase 1 implements the **L0 Foundation Layer** - the four base systems that all other systems depend on:
1. **Map System**: 3-region world structure (Town, Wilderness, Dungeon)
2. **Scene System**: Dual-mode exploration (Exploration vs Battle)
3. **Shop System**: 7 shops in Shopping District
4. **Worktree System**: Git worktree management ("parallel worlds")

**Key Objectives**:
- Build the spatial foundation (Map System)
- Implement mode switching (Scene System)
- Create commerce infrastructure (Shop System)
- Enable parallel development (Worktree System)
- Establish UI framework with React components

### Timeline

| Week | Focus Area | Key Deliverables |
|------|-----------|------------------|
| Week 1 | Map System | World structure, location data, navigation |
| Week 2 | Scene System | Mode switching, resource recovery, triggers |
| Week 3 | Shop System | 7 shops, purchase flow, Skill Forge |
| Week 4 | Worktree System | Git integration, world management UI |

### Prerequisites

- ✅ Phase 0 complete (types, bridge, tooling)
- ✅ React 18 + TypeScript configured
- ✅ Tailwind CSS setup
- ✅ Framer Motion for animations
- ✅ Zustand for state management

### Deliverables

**Map System (L0)**:
- ✅ 3 regions with 14+ locations
- ✅ 2D overhead map view
- ✅ Dialogue-mode alternative
- ✅ Location switching animations
- ✅ Encounter rate calculation

**Scene System (L0)**:
- ✅ Exploration mode
- ✅ Battle mode
- ✅ Scene transition logic
- ✅ Resource recovery mechanics
- ✅ Prompt complexity routing

**Shop System (L0)**:
- ✅ Shopping District overview
- ✅ 7 individual shops
- ✅ Skill Forge (6-step creation)
- ✅ Purchase/upgrade flows
- ✅ Cost tracking integration

**Worktree System (L0)**:
- ✅ Git worktree operations
- ✅ 5 world types (Feature, Fix, Experiment, Hotfix, Refactor)
- ✅ Time-space manager UI
- ✅ Branch visualization
- ✅ MP cost system

---

## Task Checklist

### Week 1: Map System

#### 1.1 Data Layer
- [ ] Create location database (`locations.ts`)
- [ ] Define 14+ location metadata
- [ ] Implement region boundaries
- [ ] Add encounter rate tables
- [ ] Create location unlock logic

#### 1.2 State Management
- [ ] Create MapStore (Zustand)
- [ ] Current location tracking
- [ ] Visited locations set
- [ ] Fast travel points
- [ ] Location transition state

#### 1.3 Map UI - Overhead Mode
- [ ] Create MapCanvas component
- [ ] Render 2D pixel art map
- [ ] Player sprite with movement
- [ ] Location icons and labels
- [ ] Minimap component

#### 1.4 Map UI - Dialogue Mode
- [ ] Create DialogueMap component
- [ ] Location menu with descriptions
- [ ] Natural language parsing
- [ ] Quick navigation
- [ ] Mode toggle (M key)

#### 1.5 Location Components
- [ ] TownCenter component
- [ ] ShoppingDistrict component
- [ ] Tavern component
- [ ] StasisChamber component
- [ ] GuildHall component
- [ ] PlayerHome component
- [ ] Wilderness (4 zones)
- [ ] Dungeons (4 instances)

#### 1.6 Navigation & Animation
- [ ] Walking animation
- [ ] Fast travel animation
- [ ] Location enter/exit transitions
- [ ] Region boundary crossings
- [ ] Fog of war reveal

### Week 2: Scene System

#### 2.1 Scene State Machine
- [ ] Create SceneStore (Zustand)
- [ ] SceneMode enum (Exploration, Battle)
- [ ] Scene transition logic
- [ ] Scene stack (for nested scenes)
- [ ] Pause/resume mechanics

#### 2.2 Exploration Mode
- [ ] ExplorationScene component
- [ ] Enable free movement
- [ ] Allow shop access
- [ ] Enable worktree operations
- [ ] Fast resource recovery (2 HP/s, 1 MP/s)

#### 2.3 Battle Mode
- [ ] BattleScene component
- [ ] Disable movement
- [ ] Lock shop access
- [ ] Block worktree operations
- [ ] Slow resource recovery (0.1 HP/s, 0.1 MP/s)

#### 2.4 Prompt Routing
- [ ] Integrate CLIOutputParser
- [ ] Complexity threshold logic
- [ ] 0-2: Dialog mode (no battle)
- [ ] 3-7: Sync battle (main directory)
- [ ] 8+: Async battle (worktree)

#### 2.5 Scene Transitions
- [ ] Transition animations
- [ ] Screen effects (shake, flash, fade)
- [ ] Audio cues
- [ ] Loading states
- [ ] Error recovery

### Week 3: Shop System

#### 3.1 Shopping District
- [ ] Create ShoppingDistrict component
- [ ] 7 shop icons with hotkeys (1-7)
- [ ] Shop status indicators
- [ ] Hover tooltips
- [ ] Enter animations

#### 3.2 Skills Shop
- [ ] SkillsShop component
- [ ] Skill catalog display
- [ ] Filter/sort options
- [ ] Skill details modal
- [ ] Purchase confirmation
- [ ] Unlock level check

#### 3.3 Skill Forge (Craft Shop)
- [ ] SkillForge component
- [ ] 6-step wizard:
  - [ ] Step 1: Define name
  - [ ] Step 2: Choose type
  - [ ] Step 3: Describe effect
  - [ ] Step 4: Set MP cost
  - [ ] Step 5: Preview
  - [ ] Step 6: Confirm creation
- [ ] Custom skill storage
- [ ] Cost validation (200 gold, 50 MP)

#### 3.4 MCP Tools Library
- [ ] MCPLibrary component
- [ ] Tool catalog
- [ ] Installation flow
- [ ] Configuration panel
- [ ] Version management

#### 3.5 Subagent Guild
- [ ] SubagentGuild component
- [ ] Companion list
- [ ] Create new companion
- [ ] Companion stats display
- [ ] Rename/configure

#### 3.6 Treasury
- [ ] Treasury component
- [ ] Achievement list
- [ ] Summon beast catalog
- [ ] Collection stats
- [ ] Progress bars

#### 3.7 Training Ground
- [ ] TrainingGround component
- [ ] Tutorial selector
- [ ] Simulated battle setup
- [ ] Skill testing mode
- [ ] Practice rewards

#### 3.8 Bank
- [ ] Bank component
- [ ] Resource statistics
- [ ] Cost tracking charts
- [ ] Model selection
- [ ] Budget management
- [ ] Usage graphs

#### 3.9 Purchase Flow
- [ ] Transaction validation
- [ ] Gold deduction
- [ ] Inventory update
- [ ] Success animations
- [ ] Receipt display

### Week 4: Worktree System

#### 4.1 Git Integration
- [ ] Create GitWorktreeService
- [ ] `git worktree add` wrapper
- [ ] `git worktree list` parser
- [ ] `git worktree remove` handler
- [ ] `git stash` operations
- [ ] Branch status checking

#### 4.2 Worktree State
- [ ] Create WorktreeStore (Zustand)
- [ ] Active worktrees list
- [ ] Main branch protection
- [ ] Creation timestamps
- [ ] Last activity tracking
- [ ] Auto-cleanup suggestions

#### 4.3 Time-Space Manager UI
- [ ] TimeSpaceManager component
- [ ] World list view
- [ ] Main world display
- [ ] Active battle worlds
- [ ] Manual worlds
- [ ] Timeline visualization

#### 4.4 World Creation Flow
- [ ] CreateWorldModal component
- [ ] World type selector (5 types)
- [ ] Branch naming
- [ ] Base branch selection
- [ ] MP cost validation
- [ ] Cooldown enforcement

#### 4.5 World Operations
- [ ] Switch world action
- [ ] View world details
- [ ] Merge world flow
- [ ] Delete world confirmation
- [ ] Stash management
- [ ] Conflict resolution UI

#### 4.6 MP Cost System
- [ ] Implement MP costs:
  - [ ] Feature: 10 MP
  - [ ] Fix: 10 MP
  - [ ] Experiment: 5 MP
  - [ ] Hotfix: 15 MP (5 min cooldown)
  - [ ] Refactor: 20 MP (10 min cooldown)
  - [ ] Switch: 5 MP
  - [ ] Merge: 20 MP (reward: 30 gold)
  - [ ] Stash save/apply: 3 MP each

---

## File-by-File Implementation Guide

### 1. Map System

#### File: `packages/ui/src/stores/mapStore.ts`

```typescript
import { create } from 'zustand';
import { MapRegion, LocationId, LOCATIONS } from '@code-quest/shared';

interface MapState {
  currentLocation: LocationId;
  currentRegion: MapRegion;
  visitedLocations: Set<LocationId>;
  unlockedLocations: Set<LocationId>;
  fastTravelPoints: Set<LocationId>;
  mapMode: 'overhead' | 'dialogue';

  // Actions
  moveTo: (location: LocationId) => void;
  toggleMapMode: () => void;
  unlockLocation: (location: LocationId) => void;
  addFastTravelPoint: (location: LocationId) => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  currentLocation: LOCATIONS.TOWN_CENTER,
  currentRegion: MapRegion.TOWN,
  visitedLocations: new Set([LOCATIONS.TOWN_CENTER]),
  unlockedLocations: new Set([
    LOCATIONS.TOWN_CENTER,
    LOCATIONS.SHOPPING_DISTRICT,
    LOCATIONS.TAVERN,
    LOCATIONS.PLAYER_HOME,
  ]),
  fastTravelPoints: new Set([LOCATIONS.TOWN_CENTER]),
  mapMode: 'overhead',

  moveTo: (location: LocationId) => {
    const { visitedLocations, unlockedLocations } = get();

    // Check if location is unlocked
    if (!unlockedLocations.has(location)) {
      throw new Error('Location not unlocked');
    }

    // Extract region from location ID
    const region = location.split(':')[0] as MapRegion;

    // Update state
    set({
      currentLocation: location,
      currentRegion: region,
      visitedLocations: new Set([...visitedLocations, location]),
    });

    // Emit event for scene system
    window.dispatchEvent(
      new CustomEvent('location-changed', {
        detail: { location, region },
      })
    );
  },

  toggleMapMode: () => {
    set((state) => ({
      mapMode: state.mapMode === 'overhead' ? 'dialogue' : 'overhead',
    }));
  },

  unlockLocation: (location: LocationId) => {
    set((state) => ({
      unlockedLocations: new Set([...state.unlockedLocations, location]),
    }));
  },

  addFastTravelPoint: (location: LocationId) => {
    set((state) => ({
      fastTravelPoints: new Set([...state.fastTravelPoints, location]),
    }));
  },
}));
```

**Purpose**: Central state for map system
**Key Points**:
- Track current location and region
- Manage visited and unlocked locations
- Support both map modes
- Emit events for scene system

---

#### File: `packages/ui/src/data/locations.ts`

```typescript
import { Location, MapRegion, LOCATIONS, LocationFeature } from '@code-quest/shared';

export const LOCATION_DATA: Record<string, Location> = {
  [LOCATIONS.TOWN_CENTER]: {
    id: LOCATIONS.TOWN_CENTER,
    name: 'town-center',
    displayName: '城鎮中心',
    icon: '🏰',
    region: MapRegion.TOWN,
    description: 'CodeLand 的心臟，冒險從這裡開始。',
    coordinates: { x: 50, y: 50 },
    safeZone: true,
    encounterRate: 0,
    recommendedLevel: { min: 1, max: 99 },
    features: [LocationFeature.REST_POINT],
    canAccessShops: false,
    canManageWorktrees: false,
  },

  [LOCATIONS.SHOPPING_DISTRICT]: {
    id: LOCATIONS.SHOPPING_DISTRICT,
    name: 'shopping-district',
    displayName: '商業街',
    icon: '🏪',
    region: MapRegion.TOWN,
    description: '7個商店提供各種服務和商品。',
    coordinates: { x: 70, y: 40 },
    safeZone: true,
    encounterRate: 0,
    recommendedLevel: { min: 1, max: 99 },
    features: [LocationFeature.SHOPS],
    canAccessShops: true,
    canManageWorktrees: false,
    bgm: 'town-theme.mp3',
  },

  [LOCATIONS.TAVERN]: {
    id: LOCATIONS.TAVERN,
    name: 'tavern',
    displayName: '酒館',
    icon: '🍺',
    region: MapRegion.TOWN,
    description: '與AI對話，不消耗MP的安全場所。',
    coordinates: { x: 30, y: 40 },
    safeZone: true,
    encounterRate: 0,
    recommendedLevel: { min: 1, max: 99 },
    features: [LocationFeature.TAVERN],
    canAccessShops: false,
    canManageWorktrees: false,
    bgm: 'tavern-theme.mp3',
  },

  [LOCATIONS.GUILD_HALL]: {
    id: LOCATIONS.GUILD_HALL,
    name: 'guild-hall',
    displayName: '公會大廳',
    icon: '🏛️',
    region: MapRegion.TOWN,
    description: 'Worktree管理中心，時空管理器所在地。',
    coordinates: { x: 70, y: 60 },
    safeZone: true,
    encounterRate: 0,
    recommendedLevel: { min: 1, max: 99 },
    features: [LocationFeature.GUILD_HALL],
    canAccessShops: false,
    canManageWorktrees: true,
    bgm: 'guild-theme.mp3',
  },

  [LOCATIONS.STASIS_CHAMBER]: {
    id: LOCATIONS.STASIS_CHAMBER,
    name: 'stasis-chamber',
    displayName: '靜止之間',
    icon: '⏸️',
    region: MapRegion.TOWN,
    description: '時間靜止的空間，Plan Mode在此展開。',
    coordinates: { x: 50, y: 20 },
    safeZone: true,
    encounterRate: 0,
    recommendedLevel: { min: 3, max: 99 },
    features: [LocationFeature.STASIS_CHAMBER],
    canAccessShops: false,
    canManageWorktrees: false,
    bgm: 'stasis-theme.mp3',
  },

  [LOCATIONS.PLAYER_HOME]: {
    id: LOCATIONS.PLAYER_HOME,
    name: 'player-home',
    displayName: '玩家住所',
    icon: '🏠',
    region: MapRegion.TOWN,
    description: '休息恢復、存檔、設定的地方。',
    coordinates: { x: 50, y: 80 },
    safeZone: true,
    encounterRate: 0,
    recommendedLevel: { min: 1, max: 99 },
    features: [LocationFeature.REST_POINT],
    canAccessShops: false,
    canManageWorktrees: false,
  },

  // Wilderness Locations
  [LOCATIONS.FOREST]: {
    id: LOCATIONS.FOREST,
    name: 'forest',
    displayName: '森林',
    icon: '🌳',
    region: MapRegion.WILDERNESS,
    description: '入門級任務區域，遭遇率中等。',
    coordinates: { x: 20, y: 50 },
    safeZone: false,
    encounterRate: 0.3,
    recommendedLevel: { min: 2, max: 6 },
    features: [],
    canAccessShops: false,
    canManageWorktrees: false,
    bgm: 'forest-theme.mp3',
  },

  [LOCATIONS.MOUNTAINS]: {
    id: LOCATIONS.MOUNTAINS,
    name: 'mountains',
    displayName: '山脈',
    icon: '⛰️',
    region: MapRegion.WILDERNESS,
    description: '中級任務區域，遭遇率較高。',
    coordinates: { x: 80, y: 30 },
    safeZone: false,
    encounterRate: 0.5,
    recommendedLevel: { min: 7, max: 11 },
    features: [],
    canAccessShops: false,
    canManageWorktrees: false,
    bgm: 'mountain-theme.mp3',
  },

  // Add remaining locations (wasteland, volcano, dungeons)...
};
```

**Purpose**: Location metadata database
**Key Points**:
- Complete location data
- Pixel art coordinates
- Encounter rates
- Feature flags
- BGM assignments

---

### 2. Scene System

#### File: `packages/ui/src/stores/sceneStore.ts`

```typescript
import { create } from 'zustand';
import { SceneMode } from '@code-quest/shared';

interface SceneState {
  currentMode: SceneMode;
  previousMode: SceneMode | null;
  isTransitioning: boolean;
  canSwitchScene: boolean;

  // Resource recovery rates
  hpRecoveryRate: number;
  mpRecoveryRate: number;

  // Actions
  enterExploration: () => void;
  enterBattle: (battleId: string) => void;
  exitBattle: () => void;
  setTransitioning: (transitioning: boolean) => void;
}

export const useSceneStore = create<SceneState>((set, get) => ({
  currentMode: SceneMode.EXPLORATION,
  previousMode: null,
  isTransitioning: false,
  canSwitchScene: true,
  hpRecoveryRate: 2, // 2 HP/s in exploration
  mpRecoveryRate: 1, // 1 MP/s in exploration

  enterExploration: () => {
    const { canSwitchScene } = get();

    if (!canSwitchScene) {
      console.warn('Cannot switch scene now');
      return;
    }

    set({
      previousMode: get().currentMode,
      currentMode: SceneMode.EXPLORATION,
      hpRecoveryRate: 2,
      mpRecoveryRate: 1,
      isTransitioning: true,
    });

    // Emit event
    window.dispatchEvent(new CustomEvent('scene-changed', {
      detail: { mode: SceneMode.EXPLORATION },
    }));

    // End transition after animation
    setTimeout(() => {
      set({ isTransitioning: false });
    }, 800);
  },

  enterBattle: (battleId: string) => {
    const { canSwitchScene } = get();

    if (!canSwitchScene) {
      console.warn('Cannot switch scene now');
      return;
    }

    set({
      previousMode: get().currentMode,
      currentMode: SceneMode.BATTLE,
      hpRecoveryRate: 0.1, // Slow recovery in battle
      mpRecoveryRate: 0.1,
      isTransitioning: true,
      canSwitchScene: false, // Lock until battle ends
    });

    // Emit event
    window.dispatchEvent(new CustomEvent('scene-changed', {
      detail: { mode: SceneMode.BATTLE, battleId },
    }));

    setTimeout(() => {
      set({ isTransitioning: false });
    }, 1000);
  },

  exitBattle: () => {
    set({
      currentMode: SceneMode.EXPLORATION,
      canSwitchScene: true,
    });

    get().enterExploration();
  },

  setTransitioning: (transitioning: boolean) => {
    set({ isTransitioning: transitioning });
  },
}));
```

**Purpose**: Scene mode state management
**Key Points**:
- Track current scene mode
- Control resource recovery rates
- Manage scene transitions
- Lock scenes during battle

---

### 3. Shop System

#### File: `packages/ui/src/components/shops/SkillsShop.tsx`

```typescript
import { useState } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { DEFAULT_SKILLS, Skill } from '@code-quest/shared';
import { SkillCard } from './SkillCard';
import { PurchaseModal } from './PurchaseModal';

export function SkillsShop() {
  const { player, purchaseSkill } = usePlayerStore();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [filter, setFilter] = useState<'all' | 'owned' | 'locked'>('all');

  const skills = DEFAULT_SKILLS.filter((skill) => {
    if (filter === 'owned') return skill.isUnlocked;
    if (filter === 'locked') return !skill.isUnlocked;
    return true;
  });

  const handlePurchase = (skill: Skill) => {
    if (player.stats.gold < skill.requiredGold) {
      alert('金幣不足！');
      return;
    }

    if (player.level < skill.requiredPlayerLevel) {
      alert(`需要等級 ${skill.requiredPlayerLevel}！`);
      return;
    }

    purchaseSkill(skill.id);
    setSelectedSkill(null);
  };

  return (
    <div className="skills-shop">
      <div className="shop-header">
        <h1 className="pixel-font">🔮 技能商店</h1>
        <div className="filter-buttons">
          <button onClick={() => setFilter('all')}>全部</button>
          <button onClick={() => setFilter('owned')}>已擁有</button>
          <button onClick={() => setFilter('locked')}>未解鎖</button>
        </div>
      </div>

      <div className="skill-grid">
        {skills.map((skill) => (
          <SkillCard
            key={skill.id}
            skill={skill}
            onClick={() => setSelectedSkill(skill)}
          />
        ))}
      </div>

      {selectedSkill && (
        <PurchaseModal
          skill={selectedSkill}
          onPurchase={() => handlePurchase(selectedSkill)}
          onClose={() => setSelectedSkill(null)}
        />
      )}
    </div>
  );
}
```

**Purpose**: Skills shop UI component
**Key Points**:
- Display skill catalog
- Filter by ownership
- Purchase validation
- Modal for confirmation

---

### 4. Worktree System

#### File: `packages/bridge/src/services/GitWorktreeService.ts`

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import { Worktree, WorktreeType } from '@code-quest/shared';

const execAsync = promisify(exec);

export class GitWorktreeService {
  constructor(private projectRoot: string) {}

  /**
   * List all worktrees
   */
  async listWorktrees(): Promise<Worktree[]> {
    try {
      const { stdout } = await execAsync('git worktree list --porcelain', {
        cwd: this.projectRoot,
      });

      return this.parseWorktreeList(stdout);
    } catch (error) {
      console.error('Failed to list worktrees:', error);
      return [];
    }
  }

  /**
   * Create new worktree
   */
  async createWorktree(
    name: string,
    type: WorktreeType,
    baseBranch: string = 'main'
  ): Promise<Worktree> {
    const branchName = `${type}/${name}`;
    const worktreePath = `${this.projectRoot}/worktrees/${name}`;

    try {
      await execAsync(
        `git worktree add -b ${branchName} ${worktreePath} ${baseBranch}`,
        { cwd: this.projectRoot }
      );

      return {
        id: branchName,
        name,
        type,
        path: worktreePath,
        branch: branchName,
        baseBranch,
        createdAt: new Date(),
        lastActivity: new Date(),
        status: 'active',
      };
    } catch (error) {
      throw new Error(`Failed to create worktree: ${error.message}`);
    }
  }

  /**
   * Remove worktree
   */
  async removeWorktree(path: string): Promise<void> {
    try {
      await execAsync(`git worktree remove ${path} --force`, {
        cwd: this.projectRoot,
      });
    } catch (error) {
      throw new Error(`Failed to remove worktree: ${error.message}`);
    }
  }

  /**
   * Parse worktree list output
   */
  private parseWorktreeList(output: string): Worktree[] {
    const worktrees: Worktree[] = [];
    const lines = output.split('\n');
    let current: Partial<Worktree> = {};

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        if (current.path) {
          worktrees.push(current as Worktree);
        }
        current = { path: line.substring(9) };
      } else if (line.startsWith('branch ')) {
        current.branch = line.substring(7);
      }
    }

    if (current.path) {
      worktrees.push(current as Worktree);
    }

    return worktrees;
  }
}
```

**Purpose**: Git worktree operations
**Key Points**:
- Create/remove worktrees
- List active worktrees
- Parse git output
- Error handling

---

## Testing Strategy

### Unit Tests

**Test Files**:
```
packages/ui/src/__tests__/
├── stores/
│   ├── mapStore.test.ts
│   ├── sceneStore.test.ts
│   └── worktreeStore.test.ts
├── components/
│   ├── MapCanvas.test.tsx
│   ├── ShopsDistrict.test.tsx
│   └── TimeSpaceManager.test.tsx
└── services/
    └── GitWorktreeService.test.ts
```

**Sample Test**:
```typescript
describe('MapStore', () => {
  it('should move to unlocked location', () => {
    const { moveTo, currentLocation } = useMapStore.getState();

    moveTo(LOCATIONS.TAVERN);

    expect(currentLocation).toBe(LOCATIONS.TAVERN);
  });

  it('should throw error for locked location', () => {
    const { moveTo } = useMapStore.getState();

    expect(() => moveTo(LOCATIONS.SECURITY_DUNGEON)).toThrow();
  });
});
```

### Integration Tests

1. Map → Scene integration
2. Scene → Battle trigger
3. Shop → Player state update
4. Worktree → Git operations

### E2E Tests

1. Navigate to tavern → start conversation
2. Go to wilderness → trigger battle
3. Purchase skill → use in battle
4. Create worktree → run battle → merge

---

## Integration Points

### Internal (Phase 1)
```
Map System ←→ Scene System (location affects mode)
Scene System ←→ Shop System (exploration required)
Map System ←→ Worktree System (guild hall access)
```

### External (To Phase 2+)
```
Scene System → Battle System (mode switch)
Shop System → Skill System (purchase flow)
Worktree System → Async Battle (isolation)
Map System → Battle System (encounter rates)
```

---

## Success Criteria

- [ ] Can navigate 14+ locations
- [ ] Exploration/Battle mode switches correctly
- [ ] Resource recovery rates apply
- [ ] All 7 shops functional
- [ ] Skill Forge creates custom skills
- [ ] Worktrees create/remove successfully
- [ ] MP costs deducted correctly
- [ ] All animations smooth (60 FPS)

---

**Document Version**: 1.0
**Last Updated**: 2026-02-08
**Status**: Ready for Implementation
