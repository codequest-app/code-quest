# 互動戰鬥事件實作細節

**文檔創建日期**: 2026-02-05
**版本**: v1.0
**狀態**: 設計階段
**來源**: Interactive-Battle-Events-Design.md

---

## 目錄

1. [技術架構](#技術架構)
2. [Bridge Layer 實作](#bridge-layer-實作)
3. [事件處理流程](#事件處理流程)
4. [WebSocket 協議](#websocket-協議)
5. [UI 組件實作](#ui-組件實作)
6. [測試策略](#測試策略)

---

## 技術架構

### 整體架構圖

```
┌──────────────────────────────────────────────────────────┐
│                  UI Layer (React)                        │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  BattleEventModal (統一事件彈窗)                   │ │
│  │  • Plan Mode Content                               │ │
│  │  • Question Content                                │ │
│  │  • Error Content                                   │ │
│  │  • Permission Content                              │ │
│  └────────────────────────────────────────────────────┘ │
└───────────────────────┬──────────────────────────────────┘
                        │ WebSocket
┌───────────────────────▼──────────────────────────────────┐
│              Bridge Layer (Node.js)                      │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  ToolDetector (工具偵測器)                         │ │
│  │  • detectToolCall()                                │ │
│  │  • parseToolOutput()                               │ │
│  └────────────────────────────────────────────────────┘ │
│                        │                                 │
│  ┌────────────────────▼─────────────────────────────┐  │
│  │  ToolMapper (工具映射器)                          │  │
│  │  • mapToolToMagic()                               │  │
│  │  • calculateMPCost()                              │  │
│  │  • generateBattleEffect()                         │  │
│  └────────────────────────────────────────────────────┘ │
│                        │                                 │
│  ┌────────────────────▼─────────────────────────────┐  │
│  │  EventManager (事件管理器)                        │  │
│  │  • handlePlanMode()                               │  │
│  │  • handleAskUserQuestion()                        │  │
│  │  • handleError()                                  │  │
│  │  • handlePermissionRequest()                      │  │
│  └────────────────────────────────────────────────────┘ │
│                        │                                 │
│  ┌────────────────────▼─────────────────────────────┐  │
│  │  ParallelDetector (並行偵測器)                    │  │
│  │  • detectParallelTools()                          │  │
│  │  • calculateComboBonus()                          │  │
│  └────────────────────────────────────────────────────┘ │
└───────────────────────┬──────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────┐
│              Claude CLI Process                          │
│  • stdout → Tool outputs                                │
│  • stderr → Errors                                       │
│  • stdin  → User responses                               │
└──────────────────────────────────────────────────────────┘
```

---

## Bridge Layer 實作

### 1. ToolDetector - 工具偵測器

**職責**: 偵測 Claude Code 工具調用並解析參數

```typescript
// bridge/events/ToolDetector.ts

interface ToolCall {
  tool: string;
  params: Record<string, any>;
  timestamp: number;
}

class ToolDetector {
  /**
   * 偵測工具調用
   * 從 Claude CLI stdout 解析工具名稱和參數
   */
  detectToolCall(output: string): ToolCall | null {
    // 偵測 <invoke> 標籤
    const toolCallMatch = output.match(
      /<invoke name="(\w+)">(.*?)<\/antml:invoke>/s
    );

    if (!toolCallMatch) return null;

    const toolName = toolCallMatch[1];
    const paramsBlock = toolCallMatch[2];
    const params = this.extractParams(paramsBlock);

    return {
      tool: toolName,
      params,
      timestamp: Date.now()
    };
  }

  /**
   * 提取參數
   */
  private extractParams(paramBlock: string): Record<string, any> {
    const params: Record<string, any> = {};

    const paramMatches = paramBlock.matchAll(
      /<parameter name="(\w+)">(.*?)<\/antml:parameter>/gs
    );

    for (const match of paramMatches) {
      const paramName = match[1];
      const paramValue = match[2].trim();

      // 嘗試解析 JSON
      try {
        params[paramName] = JSON.parse(paramValue);
      } catch {
        params[paramName] = paramValue;
      }
    }

    return params;
  }

  /**
   * 偵測 Bash 命令
   */
  detectBashCommand(params: Record<string, any>): {
    command: string;
    type: string;
  } | null {
    const command = params.command;
    if (!command || typeof command !== 'string') return null;

    // Git 命令
    if (command.startsWith('git ')) {
      const gitCmd = command.split(' ')[1];
      return { command, type: `git_${gitCmd}` };
    }

    // npm 命令
    if (command.startsWith('npm ')) {
      const npmCmd = command.split(' ')[1];
      return { command, type: `npm_${npmCmd}` };
    }

    // 其他系統命令
    const cmd = command.split(' ')[0];
    return { command, type: `bash_${cmd}` };
  }
}

export default ToolDetector;
```

---

### 2. ToolMapper - 工具映射器

**職責**: 將工具調用映射為 RPG 魔法

```typescript
// bridge/events/ToolMapper.ts

interface MagicMapping {
  name: string;          // 魔法名稱
  icon: string;          // 圖標
  mpCost: number;        // MP 消耗
  castTime: string;      // 施法時間類型
  damageRange: [number, number];  // 傷害範圍
  effects?: string[];    // 特殊效果
}

class ToolMapper {
  private mappings: Map<string, MagicMapping>;

  constructor() {
    this.mappings = new Map();
    this.initializeMappings();
  }

  /**
   * 初始化工具映射表
   */
  private initializeMappings(): void {
    // 文件操作
    this.mappings.set('Read', {
      name: '讀心術',
      icon: '📖',
      mpCost: 3,
      castTime: 'fast',
      damageRange: [0, 0],
      effects: ['discover_weakness']
    });

    this.mappings.set('Write', {
      name: '創造術',
      icon: '✍️',
      mpCost: 8,
      castTime: 'medium',
      damageRange: [100, 200],
      effects: ['create_asset']
    });

    this.mappings.set('Edit', {
      name: '改寫術',
      icon: '✏️',
      mpCost: 6,
      castTime: 'medium',
      damageRange: [80, 150],
      effects: ['refactor', 'heal_if_fix_bug']
    });

    // Git 命令
    this.mappings.set('git_commit', {
      name: '版本封印術',
      icon: '📦',
      mpCost: 5,
      castTime: 'fast',
      damageRange: [60, 100],
      effects: ['create_checkpoint']
    });

    this.mappings.set('git_push', {
      name: '遠程傳送術',
      icon: '🚀',
      mpCost: 10,
      castTime: 'medium',
      damageRange: [150, 250],
      effects: ['sync_remote']
    });

    // npm 命令
    this.mappings.set('npm_install', {
      name: '依賴召喚術',
      icon: '📚',
      mpCost: 15,
      castTime: 'slow',
      damageRange: [200, 350],
      effects: ['gain_ability', 'streaming']
    });

    this.mappings.set('npm_test', {
      name: '試煉之法',
      icon: '🧪',
      mpCost: 8,
      castTime: 'medium',
      damageRange: [80, 120],
      effects: ['validate_code', 'possible_backlash']
    });

    // 召喚術
    this.mappings.set('Task', {
      name: '召喚夥伴',
      icon: '🌟',
      mpCost: 20,
      castTime: 'medium',
      damageRange: [0, 0],
      effects: ['summon_agent']
    });

    // 更多映射...
  }

  /**
   * 映射工具到魔法
   */
  mapToolToMagic(tool: string, bashType?: string): MagicMapping | null {
    // 如果是 Bash 命令，使用特定類型
    if (tool === 'Bash' && bashType) {
      const mapping = this.mappings.get(bashType);
      if (mapping) return mapping;

      // 如果沒有特定映射，返回通用 Bash 魔法
      return {
        name: '系統魔法',
        icon: '⚙️',
        mpCost: 5,
        castTime: 'fast',
        damageRange: [40, 80],
        effects: []
      };
    }

    return this.mappings.get(tool) || null;
  }

  /**
   * 計算 MP 消耗（考慮並行）
   */
  calculateMPCost(tools: MagicMapping[], isParallel: boolean): number {
    const baseCost = tools.reduce((sum, tool) => sum + tool.mpCost, 0);

    if (!isParallel) return baseCost;

    // 並行額外消耗
    const parallelCount = tools.length;
    let extraCost = 0;

    if (parallelCount >= 6) {
      extraCost = 15;  // 究極魔法
    } else if (parallelCount >= 4) {
      extraCost = 10;  // 多重施法
    } else if (parallelCount >= 2) {
      extraCost = 5;   // 雙重施法
    }

    return baseCost + extraCost;
  }

  /**
   * 生成戰鬥效果
   */
  generateBattleEffect(
    magic: MagicMapping,
    params: Record<string, any>,
    success: boolean
  ): BattleEffect {
    const baseDamage = success
      ? this.randomInRange(magic.damageRange)
      : 0;

    const effect: BattleEffect = {
      magicName: magic.name,
      icon: magic.icon,
      mpCost: magic.mpCost,
      damage: baseDamage,
      success,
      logs: [],
      buffs: [],
      debuffs: []
    };

    // 根據效果添加 Buff/Debuff
    if (success && magic.effects) {
      magic.effects.forEach(effectType => {
        this.applyEffect(effect, effectType, params);
      });
    }

    // 失敗時的反噬
    if (!success) {
      effect.backlashDamage = magic.mpCost * 5;
      effect.logs.push(`⚠️ 施法失敗，受到 ${effect.backlashDamage} 點反噬傷害`);
    }

    return effect;
  }

  /**
   * 應用特殊效果
   */
  private applyEffect(
    effect: BattleEffect,
    effectType: string,
    params: Record<string, any>
  ): void {
    switch (effectType) {
      case 'discover_weakness':
        effect.buffs.push({
          name: '發現弱點',
          icon: '🎯',
          description: '下 2 次攻擊 +20% 傷害',
          duration: 2,
          damageBonus: 0.2
        });
        effect.logs.push('✨ 發現敵人弱點！');
        break;

      case 'refactor':
        effect.logs.push('🔄 代碼重構成功');
        break;

      case 'heal_if_fix_bug':
        // 檢測是否修復了 Bug（簡化邏輯）
        const diffText = params.new_string || '';
        if (diffText.includes('fix') || diffText.includes('修復')) {
          effect.heal = 15;
          effect.logs.push('💚 修復漏洞，恢復 15 HP');
        }
        break;

      case 'create_checkpoint':
        effect.logs.push('📦 創建檢查點');
        break;

      case 'summon_agent':
        effect.logs.push('🌟 召喚 Agent 協助戰鬥');
        break;

      // 更多效果...
    }
  }

  /**
   * 生成隨機傷害值
   */
  private randomInRange(range: [number, number]): number {
    const [min, max] = range;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

interface BattleEffect {
  magicName: string;
  icon: string;
  mpCost: number;
  damage: number;
  success: boolean;
  logs: string[];
  buffs: Buff[];
  debuffs: Debuff[];
  heal?: number;
  backlashDamage?: number;
}

interface Buff {
  name: string;
  icon: string;
  description: string;
  duration: number;
  damageBonus?: number;
}

interface Debuff {
  name: string;
  icon: string;
  description: string;
  duration: number;
}

export default ToolMapper;
```

---

### 3. EventManager - 事件管理器

**職責**: 處理互動事件（Plan Mode, AskUserQuestion, 錯誤, 權限）

```typescript
// bridge/events/EventManager.ts

import { EventEmitter } from 'events';

class EventManager extends EventEmitter {
  /**
   * 處理 Plan Mode 事件
   */
  async handlePlanMode(planContent: string, planFile: string): Promise<boolean> {
    // 暫停戰鬥
    this.emit('battle:pause');

    // 構建事件數據
    const event = {
      eventType: 'plan_mode',
      icon: '🧙',
      title: '戰術規劃',
      description: '魔法師正在制定戰術...',
      content: {
        planText: planContent,
        planFile: planFile
      },
      actions: [
        {
          id: 'approve',
          label: '✅ 批准戰術',
          style: 'primary',
          mpCost: 10
        },
        {
          id: 'reject',
          label: '❌ 重新規劃',
          style: 'secondary'
        }
      ]
    };

    // 發送到 UI
    this.emit('battle:event', event);

    // 等待用戶決策
    const result = await this.waitForUserAction();

    // 恢復戰鬥
    this.emit('battle:resume');

    return result.actionId === 'approve';
  }

  /**
   * 處理 AskUserQuestion 事件
   */
  async handleAskUserQuestion(questions: any[]): Promise<Record<string, string>> {
    // 暫停戰鬥
    this.emit('battle:pause');

    // 構建事件數據
    const event = {
      eventType: 'enemy_question',
      icon: '❓',
      title: '敵人的發問攻擊！',
      description: '敵人發動「困惑之問」，你必須正確回答！',
      content: questions,
      actions: [
        {
          id: 'submit',
          label: '✅ 確認選擇',
          style: 'primary'
        },
        {
          id: 'later',
          label: '⏸️ 稍後決定',
          style: 'secondary'
        }
      ]
    };

    // 發送到 UI
    this.emit('battle:event', event);

    // 等待用戶答案
    const result = await this.waitForUserAction();

    // 恢復戰鬥
    this.emit('battle:resume');

    return result.answers;
  }

  /**
   * 處理錯誤事件
   */
  async handleError(error: Error, tool: string): Promise<string> {
    // 暫停戰鬥
    this.emit('battle:pause');

    // 計算反噬傷害
    const backlashDamage = this.calculateBacklashDamage(error, tool);

    // 構建事件數據
    const event = {
      eventType: 'skill_backlash',
      icon: '⚠️',
      title: '技能反噬！',
      description: '施法失敗，魔法反彈！',
      content: {
        errorMessage: error.message,
        errorStack: error.stack,
        damage: backlashDamage,
        tool: tool
      },
      actions: [
        {
          id: 'retry',
          label: '🔄 重試',
          style: 'primary',
          mpCost: 5
        },
        {
          id: 'defend',
          label: '🛡️ 防禦',
          style: 'secondary'
        },
        {
          id: 'cancel',
          label: '❌ 取消',
          style: 'danger'
        }
      ]
    };

    // 發送到 UI
    this.emit('battle:event', event);

    // 應用反噬傷害
    this.emit('battle:damage', backlashDamage);

    // 等待用戶決策
    const result = await this.waitForUserAction();

    // 恢復戰鬥
    this.emit('battle:resume');

    return result.actionId;
  }

  /**
   * 處理權限請求事件
   */
  async handlePermissionRequest(
    capabilities: string[],
    riskLevel: string
  ): Promise<boolean> {
    // 暫停戰鬥
    this.emit('battle:pause');

    // 構建事件數據
    const event = {
      eventType: 'permission_request',
      icon: '🔐',
      title: '力量借用請求',
      description: '魔法師需要借用額外的力量來施放這個強大的魔法！',
      content: {
        capabilities,
        riskLevel
      },
      actions: [
        {
          id: 'grant',
          label: '✅ 授予力量',
          style: 'primary'
        },
        {
          id: 'deny',
          label: '❌ 拒絕請求',
          style: 'danger'
        }
      ]
    };

    // 發送到 UI
    this.emit('battle:event', event);

    // 等待用戶決策
    const result = await this.waitForUserAction();

    // 恢復戰鬥
    this.emit('battle:resume');

    return result.actionId === 'grant';
  }

  /**
   * 等待用戶操作
   */
  private waitForUserAction(): Promise<any> {
    return new Promise((resolve) => {
      this.once('user:action', resolve);
    });
  }

  /**
   * 計算反噬傷害
   */
  private calculateBacklashDamage(error: Error, tool: string): number {
    // 基礎傷害 = 工具 MP 消耗 × 5
    const baseDamage = this.getToolMPCost(tool) * 5;

    // 嚴重度倍率
    let severityMultiplier = 1.0;
    if (error.message.includes('Syntax')) severityMultiplier = 1.0;
    if (error.message.includes('Permission')) severityMultiplier = 1.2;
    if (error.message.includes('Memory')) severityMultiplier = 1.5;

    return Math.floor(baseDamage * severityMultiplier);
  }

  /**
   * 獲取工具 MP 消耗
   */
  private getToolMPCost(tool: string): number {
    const costs: Record<string, number> = {
      Read: 3,
      Write: 8,
      Edit: 6,
      Bash: 5,
      Task: 20
    };
    return costs[tool] || 5;
  }
}

export default EventManager;
```

---

### 4. ParallelDetector - 並行偵測器

**職責**: 偵測並行工具調用並計算連擊加成

```typescript
// bridge/events/ParallelDetector.ts

interface ParallelExecution {
  tools: string[];
  count: number;
  comboType: 'double' | 'multi' | 'ultimate';
  damageBonus: number;
  extraMPCost: number;
}

class ParallelDetector {
  private pendingTools: Map<number, string[]>;
  private detectionWindow: number = 1000; // 1 秒內視為並行

  constructor() {
    this.pendingTools = new Map();
  }

  /**
   * 記錄工具調用
   */
  recordToolCall(tool: string, timestamp: number): void {
    const window = Math.floor(timestamp / this.detectionWindow);

    if (!this.pendingTools.has(window)) {
      this.pendingTools.set(window, []);
    }

    this.pendingTools.get(window)!.push(tool);

    // 清理舊窗口
    this.cleanupOldWindows(window);
  }

  /**
   * 偵測並行執行
   */
  detectParallel(timestamp: number): ParallelExecution | null {
    const window = Math.floor(timestamp / this.detectionWindow);
    const tools = this.pendingTools.get(window) || [];

    if (tools.length < 2) return null;

    const count = tools.length;
    let comboType: ParallelExecution['comboType'];
    let damageBonus: number;
    let extraMPCost: number;

    if (count >= 6) {
      comboType = 'ultimate';
      damageBonus = 0.40;  // +40%
      extraMPCost = 15;
    } else if (count >= 4) {
      comboType = 'multi';
      damageBonus = 0.25;  // +25%
      extraMPCost = 10;
    } else {
      comboType = 'double';
      damageBonus = 0.15;  // +15%
      extraMPCost = 5;
    }

    return {
      tools,
      count,
      comboType,
      damageBonus,
      extraMPCost
    };
  }

  /**
   * 清理舊窗口
   */
  private cleanupOldWindows(currentWindow: number): void {
    for (const [window, _] of this.pendingTools) {
      if (window < currentWindow - 1) {
        this.pendingTools.delete(window);
      }
    }
  }
}

export default ParallelDetector;
```

---

## 事件處理流程

### 完整流程圖

```
Claude CLI 輸出
    ↓
┌────────────────────────────────────┐
│ ToolDetector.detectToolCall()     │
│ • 解析 <invoke> 標籤         │
│ • 提取工具名稱和參數               │
└────────────┬───────────────────────┘
             │
             ↓
┌────────────────────────────────────┐
│ 判斷工具類型                       │
├────────────────────────────────────┤
│ 互動事件? (Plan Mode, Ask, Error)  │
│ → EventManager                     │
│                                    │
│ 工具執行? (Read, Write, Bash...)  │
│ → ToolMapper                       │
└────────────┬───────────────────────┘
             │
        ┌────┴────┐
        │         │
        ▼         ▼
   [互動事件]  [工具執行]
        │         │
        │         ↓
        │    ┌─────────────────────┐
        │    │ ToolMapper          │
        │    │ • mapToolToMagic()  │
        │    └──────┬──────────────┘
        │           │
        │           ↓
        │    ┌─────────────────────┐
        │    │ ParallelDetector    │
        │    │ • detectParallel()  │
        │    └──────┬──────────────┘
        │           │
        │           ↓
        │    ┌─────────────────────┐
        │    │ 生成戰鬥效果         │
        │    │ • 計算傷害          │
        │    │ • 計算 MP           │
        │    │ • 生成日誌          │
        │    └──────┬──────────────┘
        │           │
        └────┬──────┘
             │
             ↓
┌────────────────────────────────────┐
│ WebSocket 廣播                     │
│ • battle:event (互動事件)         │
│ • battle:tool_effect (工具效果)   │
└────────────┬───────────────────────┘
             │
             ↓
┌────────────────────────────────────┐
│ UI 更新                            │
│ • 顯示事件彈窗 / 戰鬥日誌          │
│ • 更新 HP/MP 條                    │
│ • 播放動畫                         │
└────────────────────────────────────┘
```

---

## WebSocket 協議

### 事件定義

```typescript
// bridge/websocket/events.ts

export const BattleEvents = {
  // 互動事件
  BATTLE_EVENT: 'battle:event',          // 觸發互動事件
  USER_ACTION: 'user:action',            // 用戶操作
  BATTLE_PAUSE: 'battle:pause',          // 戰鬥暫停
  BATTLE_RESUME: 'battle:resume',        // 戰鬥恢復

  // 工具執行
  TOOL_EXECUTE: 'battle:tool_execute',   // 工具執行開始
  TOOL_EFFECT: 'battle:tool_effect',     // 工具執行效果
  TOOL_COMPLETE: 'battle:tool_complete', // 工具執行完成

  // 戰鬥狀態
  BATTLE_DAMAGE: 'battle:damage',        // 造成傷害
  BATTLE_HEAL: 'battle:heal',            // 恢復 HP
  BATTLE_MP_CHANGE: 'battle:mp_change',  // MP 變化
  BATTLE_BUFF: 'battle:buff',            // 獲得 Buff
  BATTLE_DEBUFF: 'battle:debuff',        // 獲得 Debuff

  // 並行操作
  PARALLEL_COMBO: 'battle:parallel_combo' // 並行連擊
};
```

### 事件數據結構

```typescript
// 互動事件
interface BattleEventData {
  eventType: 'plan_mode' | 'enemy_question' | 'skill_backlash' | 'permission_request';
  icon: string;
  title: string;
  description: string;
  content: any;
  actions: ActionButton[];
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

// 工具效果
interface ToolEffectData {
  magicName: string;
  icon: string;
  mpCost: number;
  damage: number;
  heal?: number;
  backlashDamage?: number;
  logs: string[];
  buffs: Buff[];
  debuffs: Debuff[];
  isCombo?: boolean;
  comboType?: 'double' | 'multi' | 'ultimate';
}

// 並行連擊
interface ParallelComboData {
  tools: string[];
  count: number;
  comboType: 'double' | 'multi' | 'ultimate';
  damageBonus: number;
  extraMPCost: number;
  totalDamage: number;
}
```

---

## UI 組件實作

### React Hooks

```typescript
// ui/src/hooks/useBattleEvents.ts

import { useState, useEffect } from 'react';
import { socket } from '../services/socket';

export function useBattleEvents() {
  const [currentEvent, setCurrentEvent] = useState<BattleEventData | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // 監聽事件
    socket.on('battle:event', (event: BattleEventData) => {
      setCurrentEvent(event);
    });

    socket.on('battle:pause', () => {
      setIsPaused(true);
    });

    socket.on('battle:resume', () => {
      setIsPaused(false);
      setCurrentEvent(null);
    });

    return () => {
      socket.off('battle:event');
      socket.off('battle:pause');
      socket.off('battle:resume');
    };
  }, []);

  const handleAction = (actionId: string, data?: any) => {
    socket.emit('user:action', {
      actionId,
      ...data
    });
  };

  return {
    currentEvent,
    isPaused,
    handleAction
  };
}
```

---

## 測試策略

### 單元測試

```typescript
// bridge/__tests__/ToolDetector.test.ts

import ToolDetector from '../events/ToolDetector';

describe('ToolDetector', () => {
  let detector: ToolDetector;

  beforeEach(() => {
    detector = new ToolDetector();
  });

  test('should detect Read tool call', () => {
    const output = `
      <invoke name="Read">
        <parameter name="file_path">/path/to/file.ts