# 地圖系統 - 實作設計

**日期**: 2026-02-05
**版本**: v1.0
**基於**: requirements.md, ui-design.md

---

## 技術架構

### 整體架構圖

```
┌─────────────────────────────────────────────────────┐
│                    UI Layer (React)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │  MapView     │  │ LocationView │  │ Controls │ │
│  │  Component   │  │  Component   │  │ Component│ │
│  └──────┬───────┘  └──────┬───────┘  └────┬─────┘ │
│         │                 │                │       │
└─────────┼─────────────────┼────────────────┼───────┘
          │                 │                │
┌─────────┼─────────────────┼────────────────┼───────┐
│         ▼                 ▼                ▼       │
│  ┌─────────────────────────────────────────────┐  │
│  │         MapManager (State Management)       │  │
│  │  • currentZone                              │  │
│  │  • currentLocation                          │  │
│  │  • playerPosition                           │  │
│  │  • availableLocations                       │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
│  State Layer (Zustand)                            │
└────────────────────────┬───────────────────────────┘
                         │
┌────────────────────────┼───────────────────────────┐
│                        ▼                           │
│  ┌─────────────────────────────────────────────┐  │
│  │      LocationManager (Business Logic)       │  │
│  │  • changeLocation()                         │  │
│  │  • checkEncounter()                         │  │
│  │  • validateAction()                         │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
│  ┌─────────────────────────────────────────────┐  │
│  │      EncounterSystem (Battle Trigger)       │  │
│  │  • analyzePrompt()                          │  │
│  │  • generateEnemy()                          │  │
│  │  • createWorktree()                         │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
│  Bridge Layer (Node.js)                           │
└────────────────────────┬───────────────────────────┘
                         │
                         ▼
              WebSocket 雙向通訊
                         │
┌────────────────────────┼───────────────────────────┐
│                        ▼                           │
│  ┌─────────────────────────────────────────────┐  │
│  │      BattleManager (戰鬥系統)                │  │
│  │  • startBattle()                            │  │
│  │  • createWorktree()                         │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
│  Backend (戰鬥實例)                                │
└────────────────────────────────────────────────────┘
```

---

## 核心類別設計

### 1. MapManager (State)

**檔案**: `ui/src/store/mapStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 區域類型
type Zone = 'town' | 'wilderness' | 'dungeon';

// 場所類型
type LocationId =
  | 'tavern'           // 酒館
  | 'shopping_district' // 商業街
  | 'guild_hall'       // 公會大廳
  | 'stasis_chamber'   // 靜止之間
  | 'player_home'      // 玩家住所
  | 'forest'           // 森林
  | 'mountains'        // 山脈
  | 'wasteland'        // 荒野
  | 'volcano'          // 火山
  | 'bug_cave'         // Bug洞窟
  | 'architecture_maze'; // 架構迷宮

// 地圖狀態介面
interface MapState {
  // 當前狀態
  currentZone: Zone;
  currentLocation: LocationId | null;
  playerPosition: { x: number; y: number };

  // 戰鬥狀態
  inBattle: boolean;
  canChangeLocation: boolean;

  // 場所資料
  locations: Map<LocationId, Location>;

  // 動作
  changeZone: (zone: Zone) => void;
  enterLocation: (locationId: LocationId) => Promise<boolean>;
  exitLocation: () => void;
  movePlayer: (x: number, y: number) => void;

  // 戰鬥相關
  startBattle: (enemy: Enemy) => void;
  endBattle: () => void;
}

// 場所介面
interface Location {
  id: LocationId;
  name: string;
  displayName: string;
  zone: Zone;

  // 地圖位置（像素座標）
  position: { x: number; y: number };
  size: { width: number; height: number };

  // 互動限制
  enterable: boolean;
  requiresLevel: number;

  // 可用動作
  availableActions: string[];

  // 限制條件
  restrictions: {
    inBattle?: boolean;   // 戰鬥中是否可進入
    minLevel?: number;    // 最低等級要求
  };

  // 特殊機制
  specialMechanics?: {
    timeStop?: boolean;      // 時間暫停（靜止之間）
    planModeOnly?: boolean;  // Plan Mode 專屬
    autoSave?: boolean;      // 自動存檔
  };
}

// 創建 Store
export const useMapStore = create<MapState>()(
  persist(
    (set, get) => ({
      // 初始狀態
      currentZone: 'town',
      currentLocation: null,
      playerPosition: { x: 500, y: 300 },

      inBattle: false,
      canChangeLocation: true,

      locations: new Map(),

      // 切換區域
      changeZone: (zone: Zone) => {
        const { inBattle } = get();

        // 戰鬥中無法切換區域
        if (inBattle) {
          console.warn('Cannot change zone during battle');
          return;
        }

        set({ currentZone: zone, currentLocation: null });

        // 記錄日誌
        console.log(`[MapManager] Changed zone to: ${zone}`);
      },

      // 進入場所
      enterLocation: async (locationId: LocationId) => {
        const { locations, inBattle } = get();
        const location = locations.get(locationId);

        if (!location) {
          console.error(`Location ${locationId} not found`);
          return false;
        }

        // 檢查限制
        if (location.restrictions.inBattle && inBattle) {
          console.warn(`Cannot enter ${locationId} during battle`);
          return false;
        }

        // 進入場所
        set({ currentLocation: locationId });

        // 場所進入動畫
        await playEnterAnimation(location);

        console.log(`[MapManager] Entered location: ${locationId}`);
        return true;
      },

      // 退出場所
      exitLocation: () => {
        set({ currentLocation: null });
        console.log('[MapManager] Exited location');
      },

      // 移動玩家
      movePlayer: (x: number, y: number) => {
        set({ playerPosition: { x, y } });
      },

      // 開始戰鬥
      startBattle: (enemy: Enemy) => {
        set({
          inBattle: true,
          canChangeLocation: false
        });

        console.log('[MapManager] Battle started:', enemy.name);
      },

      // 結束戰鬥
      endBattle: () => {
        set({
          inBattle: false,
          canChangeLocation: true
        });

        console.log('[MapManager] Battle ended');
      }
    }),
    {
      name: 'map-state',
      // 持久化到 localStorage
      partialize: (state) => ({
        currentZone: state.currentZone,
        currentLocation: state.currentLocation,
        playerPosition: state.playerPosition
      })
    }
  )
);
```

---

### 2. LocationManager (業務邏輯)

**檔案**: `bridge/map/LocationManager.js`

```javascript
const locations = require('../../rpg-config/locations.json');
const { EventEmitter } = require('events');

class LocationManager extends EventEmitter {
  constructor(mapStore) {
    super();
    this.mapStore = mapStore;
    this.locations = new Map();

    this.loadLocations();
  }

  /**
   * 載入場所資料
   */
  loadLocations() {
    for (const [id, data] of Object.entries(locations)) {
      this.locations.set(id, {
        ...data,
        id
      });
    }

    console.log(`[LocationManager] Loaded ${this.locations.size} locations`);
  }

  /**
   * 取得場所資料
   */
  getLocation(locationId) {
    return this.locations.get(locationId);
  }

  /**
   * 取得區域內所有場所
   */
  getLocationsByZone(zone) {
    return Array.from(this.locations.values())
      .filter(loc => loc.zone === zone);
  }

  /**
   * 檢查是否可進入場所
   */
  canEnterLocation(locationId, player, battleState) {
    const location = this.getLocation(locationId);

    if (!location) {
      return { allowed: false, reason: 'Location not found' };
    }

    if (!location.enterable) {
      return { allowed: false, reason: 'Location not enterable' };
    }

    // 檢查等級限制
    if (location.requiresLevel > player.level) {
      return {
        allowed: false,
        reason: `Requires level ${location.requiresLevel}`
      };
    }

    // 檢查戰鬥限制
    if (location.restrictions.inBattle === false && battleState.inBattle) {
      return {
        allowed: false,
        reason: 'Cannot enter during battle'
      };
    }

    return { allowed: true };
  }

  /**
   * 切換場所
   */
  async changeLocation(fromId, toId, player, battleState) {
    // 檢查是否可進入
    const check = this.canEnterLocation(toId, player, battleState);

    if (!check.allowed) {
      this.emit('location_change_failed', {
        from: fromId,
        to: toId,
        reason: check.reason
      });

      return { success: false, reason: check.reason };
    }

    // 執行切換
    const fromLoc = this.getLocation(fromId);
    const toLoc = this.getLocation(toId);

    // 廣播切換事件
    this.emit('location_changing', {
      from: fromLoc,
      to: toLoc
    });

    // 執行切換動畫（根據場所類型）
    const animationType = this.getAnimationType(fromLoc, toLoc);
    await this.playTransitionAnimation(animationType);

    // 更新狀態
    this.mapStore.enterLocation(toId);

    // 廣播完成事件
    this.emit('location_changed', {
      from: fromLoc,
      to: toLoc
    });

    console.log(`[LocationManager] Changed location: ${fromId} → ${toId}`);

    return { success: true };
  }

  /**
   * 取得動畫類型
   */
  getAnimationType(fromLoc, toLoc) {
    // 區域切換（城鎮 ↔ 野外）
    if (fromLoc && fromLoc.zone !== toLoc.zone) {
      return 'zone_transition';
    }

    // 快速傳送（快捷鍵）
    if (!fromLoc) {
      return 'quick_teleport';
    }

    // 進入靜止之間
    if (toLoc.id === 'stasis_chamber') {
      return 'time_freeze';
    }

    // 一般進入
    return 'normal_enter';
  }

  /**
   * 播放轉場動畫
   */
  async playTransitionAnimation(type) {
    const animations = {
      zone_transition: 800,   // 0.8秒
      quick_teleport: 300,    // 0.3秒
      time_freeze: 1500,      // 1.5秒
      normal_enter: 500       // 0.5秒
    };

    const duration = animations[type] || 500;

    // 廣播動畫開始
    this.emit('animation_start', { type, duration });

    // 等待動畫完成
    await new Promise(resolve => setTimeout(resolve, duration));

    // 廣播動畫結束
    this.emit('animation_end', { type });
  }

  /**
   * 驗證動作
   */
  validateAction(locationId, action, battleState) {
    const location = this.getLocation(locationId);

    if (!location) {
      return { valid: false, reason: 'Location not found' };
    }

    // 檢查動作是否可用
    if (!location.availableActions.includes(action)) {
      return {
        valid: false,
        reason: `Action ${action} not available at ${locationId}`
      };
    }

    // 檢查戰鬥限制
    if (battleState.inBattle && action === 'enter_shop') {
      return {
        valid: false,
        reason: 'Cannot shop during battle'
      };
    }

    return { valid: true };
  }
}

module.exports = LocationManager;
```

---

### 3. EncounterSystem (遭遇戰系統)

**檔案**: `bridge/battle/EncounterSystem.js`

```javascript
const { analyzeComplexity, analyzePromptType } = require('./PromptAnalyzer');

class EncounterSystem {
  constructor(battleManager, worktreeManager) {
    this.battleMgr = battleManager;
    this.worktreeMgr = worktreeManager;

    // 遭遇率設定
    this.encounterRates = {
      forest: 0.3,
      mountains: 0.5,
      wasteland: 0.7,
      volcano: 0.9
    };
  }

  /**
   * 檢查是否觸發遭遇戰
   */
  checkEncounter(prompt, currentZone, currentLocation) {
    console.log('[EncounterSystem] Checking encounter...');
    console.log('  Zone:', currentZone);
    console.log('  Location:', currentLocation);
    console.log('  Prompt:', prompt.substring(0, 50) + '...');

    // 1. 城鎮是安全區
    if (currentZone === 'town') {
      return {
        encounter: false,
        reason: 'Town is safe zone'
      };
    }

    // 2. 副本中，所有任務都是戰鬥
    if (currentZone === 'dungeon') {
      return {
        encounter: true,
        forced: true,
        reason: 'Dungeon forces battle'
      };
    }

    // 3. 分析 Prompt 類型
    const promptType = analyzePromptType(prompt);

    if (promptType === 'dialog') {
      return {
        encounter: false,
        reason: 'Dialog prompt, no battle'
      };
    }

    // 4. 分析複雜度
    const complexity = analyzeComplexity(prompt);

    console.log('  Prompt type:', promptType);
    console.log('  Complexity:', complexity);

    if (complexity < 8) {
      return {
        encounter: false,
        reason: 'Task too simple (< 8)',
        handleIn: 'main_cli'
      };
    }

    // 5. 複雜度 >= 8，在野外觸發戰鬥
    if (currentZone === 'wilderness') {
      return {
        encounter: true,
        complexity,
        zone: currentLocation,  // forest/mountains/etc
        createWorktree: true,
        reason: `Task complexity ${complexity} >= 8`
      };
    }

    return { encounter: false };
  }

  /**
   * 生成敵人
   */
  generateEnemy(prompt, complexity, zone) {
    console.log('[EncounterSystem] Generating enemy...');

    // 從 Prompt 提取關鍵字
    const keywords = this.extractKeywords(prompt);

    // 選擇敵人類型
    const enemyType = this.selectEnemyType(keywords, zone);

    // 生成敵人資料
    const enemy = {
      id: `enemy_${Date.now()}`,
      name: this.generateEnemyName(enemyType, complexity),
      displayName: this.generateEnemyDisplayName(enemyType, complexity),
      level: complexity,

      // 屬性計算
      hp: this.calculateEnemyHP(complexity),
      maxHp: this.calculateEnemyHP(complexity),
      attack: this.calculateEnemyAttack(complexity),
      defense: this.calculateEnemyDefense(complexity),
      speed: this.calculateEnemySpeed(complexity),

      // 敵人類型和區域
      type: enemyType,
      zone,

      // 視覺
      icon: this.getEnemyIcon(enemyType),
      color: this.getEnemyColor(enemyType)
    };

    console.log('[EncounterSystem] Enemy generated:', enemy.displayName);

    return enemy;
  }

  /**
   * 提取關鍵字
   */
  extractKeywords(prompt) {
    const keywords = [];

    // 代碼相關
    if (/implement|add|create|build/i.test(prompt)) {
      keywords.push('implementation');
    }

    // 重構相關
    if (/refactor|restructure|redesign/i.test(prompt)) {
      keywords.push('refactor');
    }

    // Bug 相關
    if (/bug|fix|error|issue/i.test(prompt)) {
      keywords.push('bug');
    }

    // 測試相關
    if (/test|testing|coverage/i.test(prompt)) {
      keywords.push('test');
    }

    // 架構相關
    if (/architecture|system|structure/i.test(prompt)) {
      keywords.push('architecture');
    }

    return keywords;
  }

  /**
   * 選擇敵人類型
   */
  selectEnemyType(keywords, zone) {
    if (keywords.includes('bug')) return 'bug';
    if (keywords.includes('refactor')) return 'refactor';
    if (keywords.includes('architecture')) return 'architecture';
    if (keywords.includes('test')) return 'test';

    // 默認基於區域
    const zoneTypes = {
      forest: 'implementation',
      mountains: 'refactor',
      wasteland: 'architecture',
      volcano: 'boss'
    };

    return zoneTypes[zone] || 'implementation';
  }

  /**
   * 生成敵人名稱
   */
  generateEnemyName(type, level) {
    const names = {
      bug: 'Bug',
      implementation: 'Implementation Monster',
      refactor: 'Refactor Demon',
      architecture: 'Architecture Dragon',
      test: 'Test Golem'
    };

    return `${names[type] || 'Monster'} Lv.${level}`;
  }

  generateEnemyDisplayName(type, level) {
    const displayNames = {
      bug: `Bug 魔物 Lv.${level}`,
      implementation: `功能實現魔物 Lv.${level}`,
      refactor: `重構惡魔 Lv.${level}`,
      architecture: `架構巨龍 Lv.${level}`,
      test: `測試魔像 Lv.${level}`
    };

    return displayNames[type] || `敵人 Lv.${level}`;
  }

  /**
   * 計算敵人屬性
   */
  calculateEnemyHP(level) {
    return Math.floor(100 + level * 50);
  }

  calculateEnemyAttack(level) {
    return Math.floor(10 + level * 3);
  }

  calculateEnemyDefense(level) {
    return Math.floor(5 + level * 2);
  }

  calculateEnemySpeed(level) {
    return Math.floor(50 + level * 2);
  }

  /**
   * 取得敵人圖標
   */
  getEnemyIcon(type) {
    const icons = {
      bug: '🐛',
      implementation: '⚔️',
      refactor: '🔧',
      architecture: '🐉',
      test: '🧪'
    };

    return icons[type] || '👾';
  }

  getEnemyColor(type) {
    const colors = {
      bug: '#E74C3C',
      implementation: '#3498DB',
      refactor: '#9B59B6',
      architecture: '#E67E22',
      test: '#1ABC9C'
    };

    return colors[type] || '#95A5A6';
  }

  /**
   * 開始戰鬥（整合 Worktree）
   */
  async startBattle(prompt, encounterInfo) {
    console.log('[EncounterSystem] Starting battle...');

    const { complexity, zone } = encounterInfo;

    // 1. 生成敵人
    const enemy = this.generateEnemy(prompt, complexity, zone);

    // 2. 創建 Worktree（如果需要）
    let worktree = null;

    if (encounterInfo.createWorktree) {
      const worktreeName = this.generateWorktreeName(prompt, enemy.type);

      console.log('[EncounterSystem] Creating worktree:', worktreeName);

      worktree = await this.worktreeMgr.createWorktree({
        name: worktreeName,
        type: 'feature',  // 默認 feature 分支
        baseBranch: 'main',
        description: prompt.substring(0, 100),
        autoCreated: true  // 標記為自動創建
      });

      console.log('[EncounterSystem] Worktree created:', worktree.path);
    }

    // 3. 啟動戰鬥實例
    const battleInstance = await this.battleMgr.createBattleInstance({
      enemy,
      prompt,
      worktree,
      zone,
      complexity
    });

    console.log('[EncounterSystem] Battle instance created:', battleInstance.id);

    // 4. 返回戰鬥資訊
    return {
      battleId: battleInstance.id,
      enemy,
      worktree,
      zone
    };
  }

  /**
   * 生成 Worktree 名稱
   */
  generateWorktreeName(prompt, enemyType) {
    // 從 prompt 提取主要動詞和名詞
    let name = '';

    if (prompt.includes('implement') || prompt.includes('add')) {
      name = 'feature/';
    } else if (prompt.includes('fix') || prompt.includes('bug')) {
      name = 'fix/';
    } else if (prompt.includes('refactor')) {
      name = 'refactor/';
    } else {
      name = 'feature/';
    }

    // 簡化 prompt 作為分支名
    const simplified = prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(' ')
      .slice(0, 3)
      .join('-');

    return name + simplified;
  }
}

module.exports = EncounterSystem;
```

---

## 資料結構

### 場所資料（JSON）

**檔案**: `rpg-config/locations.json`

```json
{
  "tavern": {
    "name": "Tavern",
    "displayName": "酒館",
    "zone": "town",

    "position": { "x": 200, "y": 300 },
    "size": { "width": 100, "height": 80 },

    "enterable": true,
    "requiresLevel": 0,

    "availableActions": ["talk", "quest", "rest"],

    "restrictions": {
      "inBattle": true
    },

    "npcs": ["bartender"],
    "description": "友善的酒館，可以與 AI 對話和接受任務"
  },

  "shopping_district": {
    "name": "Shopping District",
    "displayName": "商業街",
    "zone": "town",

    "position": { "x": 600, "y": 200 },
    "size": { "width": 150, "height": 120 },

    "enterable": true,
    "requiresLevel": 0,

    "availableActions": ["shop", "browse"],

    "restrictions": {
      "inBattle": false
    },

    "shops": [
      "skills_shop",
      "skill_forge",
      "mcp_library",
      "subagent_guild",
      "treasury",
      "training_ground",
      "bank"
    ],
    "description": "包含七大商店的商業中心"
  },

  "stasis_chamber": {
    "name": "Stasis Chamber",
    "displayName": "靜止之間",
    "zone": "town",

    "position": { "x": 500, "y": 100 },
    "size": { "width": 120, "height": 100 },

    "enterable": true,
    "requiresLevel": 0,

    "availableActions": ["plan_mode", "deep_thinking"],

    "restrictions": {
      "inBattle": true
    },

    "specialMechanics": {
      "timeStop": true,
      "planModeOnly": true,
      "grayScale": true
    },
    "description": "時間靜止的規劃空間，Plan Mode 專屬場所"
  },

  "guild_hall": {
    "name": "Guild Hall",
    "displayName": "公會大廳",
    "zone": "town",

    "position": { "x": 500, "y": 400 },
    "size": { "width": 140, "height": 120 },

    "enterable": true,
    "requiresLevel": 0,

    "availableActions": ["worktree_manage", "view_battles"],

    "restrictions": {
      "inBattle": true
    },

    "specialMechanics": {
      "worktreeManagement": true,
      "battleMonitoring": true
    },
    "description": "Worktree 管理中心和戰鬥監控"
  },

  "player_home": {
    "name": "Player Home",
    "displayName": "玩家住所",
    "zone": "town",

    "position": { "x": 500, "y": 600 },
    "size": { "width": 100, "height": 80 },

    "enterable": true,
    "requiresLevel": 0,

    "availableActions": ["rest", "save", "settings"],

    "restrictions": {},

    "specialMechanics": {
      "autoSave": true,
      "fullRestore": true
    },
    "description": "休息、存檔和設定的個人空間"
  },

  "forest": {
    "name": "Forest",
    "displayName": "森林",
    "zone": "wilderness",

    "enterable": false,
    "requiresLevel": 0,

    "encounterRate": 0.3,
    "recommendedLevel": { "min": 5, "max": 10 },

    "description": "入門級野外區域，遭遇率中等"
  },

  "mountains": {
    "name": "Mountains",
    "displayName": "山脈",
    "zone": "wilderness",

    "enterable": false,
    "requiresLevel": 8,

    "encounterRate": 0.5,
    "recommendedLevel": { "min": 8, "max": 12 },

    "description": "中級野外區域，遭遇率較高"
  },

  "wasteland": {
    "name": "Wasteland",
    "displayName": "荒野",
    "zone": "wilderness",

    "enterable": false,
    "requiresLevel": 12,

    "encounterRate": 0.7,
    "recommendedLevel": { "min": 12, "max": 15 },

    "description": "高級野外區域，遭遇率高"
  },

  "volcano": {
    "name": "Volcano",
    "displayName": "火山",
    "zone": "wilderness",

    "enterable": false,
    "requiresLevel": 15,

    "encounterRate": 0.9,
    "recommendedLevel": { "min": 15, "max": 20 },

    "description": "專家級野外區域，遭遇率極高"
  },

  "bug_cave": {
    "name": "Bug Cave",
    "displayName": "Bug 洞窟",
    "zone": "dungeon",

    "enterable": true,
    "requiresLevel": 8,

    "availableActions": ["challenge_dungeon"],

    "boss": {
      "name": "Bug King",
      "displayName": "Bug 之王",
      "level": 12
    },

    "specialMechanics": {
      "noExit": true,
      "trackErrors": true,
      "stages": 3
    },

    "rewards": {
      "exp": { "min": 800, "max": 1200 },
      "gold": { "min": 400, "max": 600 },
      "skill": "debug_master"
    },

    "description": "Debug 任務專屬副本，需要追蹤錯誤日誌"
  }
}
```

---

## WebSocket 通訊協議

### 事件定義

**檔案**: `bridge/websocket/MapEvents.js`

```javascript
// 客戶端 → 伺服器

module.exports = {
  // 地圖相關
  MAP_CHANGE_ZONE: 'map:change_zone',
  MAP_ENTER_LOCATION: 'map:enter_location',
  MAP_EXIT_LOCATION: 'map:exit_location',
  MAP_MOVE_PLAYER: 'map:move_player',

  // 遭遇戰相關
  ENCOUNTER_CHECK: 'encounter:check',
  ENCOUNTER_START_BATTLE: 'encounter:start_battle',

  // 場所動作
  LOCATION_ACTION: 'location:action',

  // 伺服器 → 客戶端

  // 地圖狀態更新
  MAP_STATE_UPDATED: 'map:state_updated',
  MAP_LOCATION_CHANGED: 'map:location_changed',
  MAP_ANIMATION: 'map:animation',

  // 遭遇戰事件
  ENCOUNTER_TRIGGERED: 'encounter:triggered',
  ENCOUNTER_NO_BATTLE: 'encounter:no_battle',

  // 戰鬥事件
  BATTLE_CREATED: 'battle:created',
  BATTLE_WORKTREE_CREATED: 'battle:worktree_created',

  // 錯誤
  MAP_ERROR: 'map:error'
};
```

### WebSocket Handler

**檔案**: `bridge/websocket/MapHandler.js`

```javascript
const MapEvents = require('./MapEvents');

class MapHandler {
  constructor(wsServer, locationManager, encounterSystem) {
    this.wss = wsServer;
    this.locationMgr = locationManager;
    this.encounterSys = encounterSystem;

    this.setupHandlers();
  }

  setupHandlers() {
    this.wss.on('connection', (ws) => {
      console.log('[MapHandler] Client connected');

      // 切換區域
      ws.on(MapEvents.MAP_CHANGE_ZONE, async (data) => {
        const { zone } = data;

        try {
          // TODO: 實際切換邏輯

          ws.send(JSON.stringify({
            event: MapEvents.MAP_STATE_UPDATED,
            data: { currentZone: zone }
          }));

        } catch (error) {
          ws.send(JSON.stringify({
            event: MapEvents.MAP_ERROR,
            data: { error: error.message }
          }));
        }
      });

      // 進入場所
      ws.on(MapEvents.MAP_ENTER_LOCATION, async (data) => {
        const { locationId, player, battleState } = data;

        try {
          const result = await this.locationMgr.changeLocation(
            null,
            locationId,
            player,
            battleState
          );

          if (result.success) {
            ws.send(JSON.stringify({
              event: MapEvents.MAP_LOCATION_CHANGED,
              data: { locationId }
            }));
          } else {
            ws.send(JSON.stringify({
              event: MapEvents.MAP_ERROR,
              data: { error: result.reason }
            }));
          }

        } catch (error) {
          ws.send(JSON.stringify({
            event: MapEvents.MAP_ERROR,
            data: { error: error.message }
          }));
        }
      });

      // 檢查遭遇戰
      ws.on(MapEvents.ENCOUNTER_CHECK, async (data) => {
        const { prompt, currentZone, currentLocation } = data;

        try {
          const encounterInfo = this.encounterSys.checkEncounter(
            prompt,
            currentZone,
            currentLocation
          );

          if (encounterInfo.encounter) {
            // 觸發遭遇戰
            ws.send(JSON.stringify({
              event: MapEvents.ENCOUNTER_TRIGGERED,
              data: encounterInfo
            }));

            // 開始戰鬥
            const battleInfo = await this.encounterSys.startBattle(
              prompt,
              encounterInfo
            );

            ws.send(JSON.stringify({
              event: MapEvents.BATTLE_CREATED,
              data: battleInfo
            }));

            if (battleInfo.worktree) {
              ws.send(JSON.stringify({
                event: MapEvents.BATTLE_WORKTREE_CREATED,
                data: {
                  worktree: battleInfo.worktree,
                  battleId: battleInfo.battleId
                }
              }));
            }

          } else {
            // 不觸發戰鬥
            ws.send(JSON.stringify({
              event: MapEvents.ENCOUNTER_NO_BATTLE,
              data: encounterInfo
            }));
          }

        } catch (error) {
          ws.send(JSON.stringify({
            event: MapEvents.MAP_ERROR,
            data: { error: error.message }
          }));
        }
      });
    });
  }
}

module.exports = MapHandler;
```

---

## UI 組件實作

### MapView Component

**檔案**: `ui/src/components/Map/MapView.tsx`

```typescript
import React, { useEffect, useRef } from 'react';
import { useMapStore } from '../../store/mapStore';
import { useBattleStore } from '../../store/battleStore';
import { usePlayerStore } from '../../store/playerStore';

interface MapViewProps {
  className?: string;
}

const MapView: React.FC<MapViewProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { currentZone, currentLocation, playerPosition } = useMapStore();
  const { inBattle } = useBattleStore();
  const { player } = usePlayerStore();

  // 繪製地圖
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // 清空畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 繪製背景
    drawBackground(ctx, currentZone);

    // 繪製場所（如果在城鎮）
    if (currentZone === 'town') {
      drawTownLocations(ctx);
    }

    // 繪製玩家
    drawPlayer(ctx, playerPosition);

  }, [currentZone, currentLocation, playerPosition]);

  // 繪製背景
  const drawBackground = (ctx: CanvasRenderingContext2D, zone: string) => {
    // 根據區域設定背景色
    const colors = {
      town: '#F5F5DC',
      wilderness: '#90EE90',
      dungeon: '#2C2C2C'
    };

    ctx.fillStyle = colors[zone] || '#FFFFFF';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  // 繪製城鎮場所
  const drawTownLocations = (ctx: CanvasRenderingContext2D) => {
    const locations = [
      { name: '酒館', icon: '🍺', x: 200, y: 300 },
      { name: '商業街', icon: '🏪', x: 600, y: 200 },
      { name: '公會大廳', icon: '🏛️', x: 500, y: 400 },
      { name: '靜止之間', icon: '⏸️', x: 500, y: 100 },
      { name: '玩家住所', icon: '🏠', x: 500, y: 600 }
    ];

    locations.forEach(loc => {
      // 繪製建築圖標
      ctx.font = '48px sans-serif';
      ctx.fillText(loc.icon, loc.x, loc.y);

      // 繪製名稱
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#000';
      ctx.fillText(loc.name, loc.x, loc.y + 60);
    });
  };

  // 繪製玩家
  const drawPlayer = (
    ctx: CanvasRenderingContext2D,
    pos: { x: number; y: number }
  ) => {
    // 玩家圖標
    ctx.font = '32px sans-serif';
    ctx.fillText('👤', pos.x, pos.y);
  };

  // 處理鍵盤移動
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (inBattle) return;  // 戰鬥中無法移動

      const { x, y } = playerPosition;
      const speed = 10;

      let newX = x;
      let newY = y;

      switch (e.key) {
        case 'w':
        case 'ArrowUp':
          newY -= speed;
          break;
        case 's':
        case 'ArrowDown':
          newY += speed;
          break;
        case 'a':
        case 'ArrowLeft':
          newX -= speed;
          break;
        case 'd':
        case 'ArrowRight':
          newX += speed;
          break;
        default:
          return;
      }

      useMapStore.getState().movePlayer(newX, newY);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [playerPosition, inBattle]);

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        style={{ border: '2px solid #2C3E50' }}
      />

      {/* 狀態欄 */}
      <div className="map-status">
        <div>區域: {currentZone}</div>
        <div>場所: {currentLocation || '無'}</div>
        <div>位置: ({playerPosition.x}, {playerPosition.y})</div>
      </div>
    </div>
  );
};

export default MapView;
```

---

## 實作優先級

### Phase 1 (Week 1-2) - MVP

```
核心功能:
- [ ] MapManager (Zustand store)
- [ ] LocationManager (基礎邏輯)
- [ ] EncounterSystem (複雜度檢查 + 敵人生成)
- [ ] locations.json (城鎮場所)
- [ ] MapView Component (簡化版)
- [ ] WebSocket 基礎通訊

測試:
- [ ] 場所切換測試
- [ ] 遭遇戰觸發測試
- [ ] Worktree 自動創建測試
```

### Phase 2 (Week 3-4) - 完整功能

```
完整實作:
- [ ] 所有場所內部 UI
- [ ] 動畫系統
- [ ] 觸控操作支援
- [ ] 野外子區域
- [ ] 副本系統

整合:
- [ ] 與 Shop System 整合
- [ ] 與 Worktree-Battle 整合
- [ ] 與 Interactive Events 整合
```

### Phase 3 (Week 5+) - 優化

```
優化:
- [ ] 效能優化（Canvas 渲染）
- [ ] 音效整合
- [ ] 響應式設計
- [ ] 錯誤處理和恢復
```

---

## 測試策略

### 單元測試

```javascript
// LocationManager.test.js
describe('LocationManager', () => {
  it('should load locations correctly', () => {
    const mgr = new LocationManager();
    expect(mgr.locations.size).toBeGreaterThan(0);
  });

  it('should validate location entry correctly', () => {
    const mgr = new LocationManager();

    const result = mgr.canEnterLocation('tavern', {
      level: 5
    }, {
      inBattle: false
    });

    expect(result.allowed).toBe(true);
  });

  it('should block entry during battle if restricted', () => {
    const mgr = new LocationManager();

    const result = mgr.canEnterLocation('shopping_district', {
      level: 5
    }, {
      inBattle: true
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('battle');
  });
});
```

### 整合測試

```javascript
// EncounterSystem.test.js
describe('EncounterSystem', () => {
  it('should not trigger battle in town', () => {
    const sys = new EncounterSystem();

    const result = sys.checkEncounter(
      'implement user login',
      'town',
      'tavern'
    );

    expect(result.encounter).toBe(false);
    expect(result.reason).toContain('safe');
  });

  it('should trigger battle for complex task in wilderness', () => {
    const sys = new EncounterSystem();

    const result = sys.checkEncounter(
      'refactor entire authentication system',
      'wilderness',
      'forest'
    );

    expect(result.encounter).toBe(true);
    expect(result.complexity).toBeGreaterThanOrEqual(8);
  });
});
```

---

## 效能考量

### 渲染優化

```javascript
// 使用 Canvas 雙緩衝
class MapRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // 離屏 Canvas（雙緩衝）
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = canvas.width;
    this.offscreenCanvas.height = canvas.height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');
  }

  render(scene) {
    // 在離屏 Canvas 繪製
    this.drawScene(this.offscreenCtx, scene);

    // 一次性複製到主 Canvas
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);
  }
}
```

### 資料快取

```javascript
// 場所資料快取
class LocationCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000;  // 5分鐘
  }

  get(locationId) {
    const cached = this.cache.get(locationId);

    if (!cached) return null;

    // 檢查是否過期
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(locationId);
      return null;
    }

    return cached.data;
  }

  set(locationId, data) {
    this.cache.set(locationId, {
      data,
      timestamp: Date.now()
    });
  }
}
```

---

## 錯誤處理

```javascript
class MapErrorHandler {
  constructor(locationManager) {
    this.locationMgr = locationManager;

    // 監聽錯誤
    this.locationMgr.on('location_change_failed', (error) => {
      this.handleLocationChangeFailed(error);
    });
  }

  handleLocationChangeFailed(error) {
    console.error('[MapErrorHandler]', error);

    // 顯示錯誤訊息給用戶
    this.showUserMessage({
      type: 'error',
      title: '無法進入場所',
      message: error.reason
    });

    // 記錄到日誌
    this.logError('location_change_failed', error);
  }

  showUserMessage(message) {
    // TODO: 顯示 Toast 或 Modal
  }

  logError(type, error) {
    // TODO: 發送到錯誤追蹤服務
  }
}
```

---

**版本**:
- v1.0 (2026-02-05): 初始實作設計
