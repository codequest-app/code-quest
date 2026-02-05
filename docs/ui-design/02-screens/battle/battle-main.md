# 主戰鬥畫面 (Main Battle Screen)

## 畫面概述

- **功能定位**: 單線戰鬥的主要畫面，展示完整的戰鬥流程和狀態
- **進入條件**: 玩家輸入任務型 Prompt，系統識別為簡單/中等任務
- **退出條件**: 戰鬥勝利、戰鬥失敗或逃跑成功
- **場景模式**: 戰鬥模式（同步執行）

## 完整布局

```
┌──────────────────────────────────────────────────────────────┐
│ ⚔️ 戰鬥模式                        💰 450  ⚡ 75/100  💚 85/100 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                     戰鬥場景背景                              │
│                    (像素化漸層)                               │
│                                                              │
│                    【敵人區域】                               │
│                                                              │
│                  ┌────────────────┐                          │
│                  │     💻         │                          │
│                  │   Lv.5         │  ← 浮動動畫              │
│                  │  Bug 怪物      │                          │
│                  └────────────────┘                          │
│                                                              │
│             HP: ▓▓▓▓▓▓▓░░░  350/500                          │
│             元素: [Logic] 🧠                                  │
│             弱點: code-reviewer ⭐                            │
│                                                              │
│                      ↓                                       │
│                   等待行動...                                 │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  【戰鬥日誌】                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [回合 1] 遭遇敵人: Bug 怪物 Lv.5!                     │   │
│  │ [回合 1] 提示: 弱點是 code-reviewer                   │   │
│  │ [回合 2] 你使用了 code-generator! 造成 120 傷害!     │   │
│  │ [回合 2] 有效攻擊!                                   │   │
│  │ [回合 3] Bug 怪物 反擊! 消耗 8 MP!                   │   │
│  │ [回合 4] 你使用了 code-reviewer! 造成 180 傷害!      │   │
│  │ [回合 4] ⭐ 弱點攻擊! 傷害加成 ×1.5!                 │   │
│  │ ▼ 自動滾動                                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  【行動選單】                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [⚔️ 使用技能]  [🤝 召喚夥伴]  [💼 使用道具]         │   │
│  │  [🛡️ 防禦姿態]  [🏃 逃跑]                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘

【右下角玩家狀態面板】
┌────────────────────┐
│ 👤 CodeMaster      │
│ Lv.10              │
│ HP: ████████ 85/100│
│ MP: ████░░░░ 75/100│
│                    │
│ 狀態:              │
│ ⚡ 攻擊力 +15%     │
│ (弱點發現)         │
└────────────────────┘
```

## 區塊劃分

### 區塊 1: 頂部狀態欄
- **位置**: 固定在頂部
- **內容**:
  - 戰鬥模式標識 ⚔️
  - 玩家資源: 💰 金幣、⚡ MP、💚 HP
- **樣式**: 深紅色背景 (#4d1a1a)，白色文字

### 區塊 2: 敵人顯示區域
- **位置**: 畫面中上部
- **內容**:
  - 敵人圖標（Emoji）with 浮動動畫
  - 敵人名稱和等級
  - HP 條（彩色，動態變化）
  - 元素類型標示
  - 弱點提示（如已發現）
  - 行動狀態提示
- **動畫**:
  - 浮動效果（上下 10px，2s 循環）
  - 受傷時閃紅 + 震動
  - HP 條平滑減少

### 區塊 3: 戰鬥日誌區域
- **位置**: 畫面中部偏下
- **內容**:
  - 回合標記
  - 行動記錄（彩色文字）
  - 傷害數字
  - 特殊效果提示
- **功能**:
  - 自動滾動到最新
  - 最多顯示 8 條記錄
  - 不同類型使用不同顏色
- **高度**: 固定 200px，可滾動

### 區塊 4: 行動選單區域
- **位置**: 畫面底部
- **內容**:
  - 5 個行動按鈕（大號，易點擊）
  - 圖標 + 文字標示
  - 可用/不可用狀態
- **快捷鍵**: 數字鍵 1-5 對應各按鈕

### 區塊 5: 玩家狀態面板（浮動）
- **位置**: 右下角固定
- **內容**:
  - 玩家名稱、等級
  - HP/MP 條
  - 當前 Buff/Debuff 狀態
- **樣式**: 半透明背景，可折疊

### 區塊 6: 傷害數字層（覆蓋層）
- **位置**: 絕對定位，在敵人上方
- **內容**: 動態生成的傷害/治療數字
- **動畫**: 向上飄動 + 淡出 (1s)

## 組件清單

### 共用組件（引用）
- **狀態欄**: `04-components/status-displays.md` - 頂部資源顯示
- **HP 條**: `04-components/progress-bars.md` - 生命值條
- **按鈕**: `04-components/buttons.md` - 行動按鈕
- **日誌列表**: `04-components/log-display.md` - 戰鬥日誌

### 特有組件

#### 敵人展示卡片 (EnemyDisplay)
```typescript
interface EnemyDisplayProps {
  enemy: {
    id: string;
    name: string;
    level: number;
    emoji: string;
    hp: number;
    maxHp: number;
    element: string;
    weakness?: string;
    resistances?: string[];
  };
  isActionPhase: boolean;
}
```

**狀態變化**:
- `idle`: 正常浮動動畫
- `attacking`: 向前衝刺動畫
- `hurt`: 閃紅 + 震動
- `defeated`: 閃爍後縮小消失

#### 傷害數字 (DamageNumber)
```typescript
interface DamageNumberProps {
  value: number;
  type: 'normal' | 'weak' | 'critical' | 'heal';
  position: { x: number; y: number };
}
```

**動畫參數**:
```css
.damage-number {
  animation: damage-float 1s ease-out forwards;
  font-size: 2em;
  font-weight: bold;
  text-shadow: 2px 2px 4px #000;
}

.damage-number.weak {
  font-size: 2.5em;
  color: #ff0000;
  animation: damage-float-weak 1s ease-out forwards;
}

@keyframes damage-float {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  50% {
    opacity: 1;
    transform: translateY(-40px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-80px) scale(0.8);
  }
}

@keyframes damage-float-weak {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1.2) rotate(-5deg);
  }
  25% {
    transform: translateY(-20px) scale(1.3) rotate(5deg);
  }
  50% {
    opacity: 1;
    transform: translateY(-40px) scale(1.4) rotate(-5deg);
  }
  100% {
    opacity: 0;
    transform: translateY(-80px) scale(1.2) rotate(0deg);
  }
}
```

#### 行動按鈕 (ActionButton)
```typescript
interface ActionButtonProps {
  icon: string;
  label: string;
  isAvailable: boolean;
  mpCost?: number;
  onClick: () => void;
  shortcut?: string;
}
```

**狀態樣式**:
```css
.action-button {
  background: linear-gradient(to bottom, #f44336, #d32f2f);
  border: 3px solid #b71c1c;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(244, 67, 54, 0.4);
}

.action-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(244, 67, 54, 0.4);
}

.action-button.disabled {
  background: #757575;
  border-color: #616161;
  cursor: not-allowed;
  opacity: 0.5;
}
```

## 互動設計

### 鍵盤操作
- **1**: 使用技能
- **2**: 召喚夥伴
- **3**: 使用道具
- **4**: 防禦姿態
- **5**: 逃跑
- **Ctrl+1~5**: 快速使用技能槽 1-5
- **Space**: 確認選擇
- **Esc**: 返回/取消
- **Tab**: 循環選擇按鈕

### 滑鼠操作
- **左鍵點擊按鈕**: 執行對應行動
- **右鍵點擊敵人**: 查看敵人詳細資訊
- **懸停按鈕**: 顯示詳細說明（工具提示）
- **滾輪滾動日誌**: 查看歷史記錄

### 觸控操作
- **點擊按鈕**: 執行行動
- **長按敵人**: 顯示敵人資訊彈窗
- **雙指滑動日誌**: 滾動查看
- **點擊日誌外部**: 關閉日誌

### 快捷技能槽
```
頂部快捷欄（可選顯示）:
┌──────────────────────────────────────┐
│ [Ctrl+1]    [Ctrl+2]    [Ctrl+3]    │
│   🔮          📦          🧪         │
│ 生成術      封印術      試煉法        │
│ MP: 30      MP: 5       MP: 8       │
└──────────────────────────────────────┘
```

## 轉場設計

### 進入動畫（探索 → 戰鬥）
**時間軸**: 總計 2.0s
```
0.0s  ├─ 畫面震動 (screenShake, 0.3s)
0.2s  ├─ 畫面淡出黑屏 (fadeOut, 0.3s)
0.5s  ├─ 背景淡入 (battleBgFadeIn, 0.5s)
0.8s  ├─ 敵人從上方滑入 (enemySlideIn, 0.5s)
      │   • 旋轉 180° → 0°
      │   • 縮放 0.5 → 1.0
1.0s  ├─ 日誌區域從下滑入 (slideUp, 0.4s)
1.2s  ├─ 行動選單從下滑入 (slideUp, 0.4s, delay 0.2s)
1.4s  ├─ 玩家狀態面板淡入 (fadeIn, 0.3s)
1.7s  ├─ "⚔️ 戰鬥開始！" 文字閃爍 (textFlash, 0.3s)
2.0s  └─ 動畫完成，開始戰鬥
```

**動畫 CSS**:
```css
@keyframes screenShake {
  0%, 100% { transform: translate(0, 0); }
  10%, 30%, 50%, 70%, 90% { transform: translate(-5px, 2px); }
  20%, 40%, 60%, 80% { transform: translate(5px, -2px); }
}

@keyframes enemySlideIn {
  0% {
    transform: translateY(-200px) scale(0.5) rotate(180deg);
    opacity: 0;
  }
  60% {
    transform: translateY(20px) scale(1.1) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(0) scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes slideUp {
  0% {
    transform: translateY(100px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
```

**音效**:
- `battle_start.mp3` (0.5s)
- `enemy_appear.mp3` (0.8s)
- `ui_slide.mp3` (1.0s)

### 退出動畫（戰鬥結束）
參考 `victory-screen` 或 `defeat-screen` 文檔

## 狀態變化

### 初始狀態（戰鬥開始）
- 敵人 HP 滿
- 日誌顯示遭遇訊息
- 所有行動按鈕可用
- 無 Buff/Debuff

### 戰鬥進行中
- HP 條即時更新（平滑動畫）
- 日誌不斷添加新記錄
- 傷害數字彈出並消失
- 技能冷卻倒數

### 玩家回合
- 行動選單高亮
- 提示 "選擇行動"
- 敵人顯示 "等待中..."

### 敵人回合
- 行動選單置灰
- 敵人動作動畫（衝刺、攻擊）
- 玩家受傷特效

### 低 HP 警告（HP < 30%）
```css
.player-hp-bar.critical {
  background: linear-gradient(to right, #ff0000, #ff5722);
  animation: pulse-red 1s infinite;
}

@keyframes pulse-red {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

- HP 條閃爍紅色
- 播放警告音效
- 顯示提示: "⚠️ HP 危險！"

### MP 不足
- 消耗型技能按鈕置灰
- 顯示 "MP 不足" 提示
- 推薦使用道具恢復

## 響應式設計

### 桌面 (1200px+)
```
┌─────────────────────────────────────────┐
│  主畫面 (70%)           │ 側欄 (30%)    │
│                        │               │
│  [敵人]                │ [玩家狀態]     │
│  [日誌]                │ [快捷技能]     │
│  [行動選單]             │ [道具欄]       │
└─────────────────────────────────────────┘
```

### 平板 (768-1199px)
```
┌────────────────────────────┐
│  戰鬥主畫面 (全屏)         │
│  [敵人]                   │
│  [日誌]                   │
│  [行動選單]                │
│                           │
│  玩家狀態浮動在右下角       │
└────────────────────────────┘
```

### 手機 (<768px)
```
┌─────────────────┐
│  [敵人區域]      │
│  HP: ████░      │
├─────────────────┤
│  [精簡日誌]      │
│  最新 3 條       │
├─────────────────┤
│  [大按鈕選單]    │
│  ┌───┬───┬───┐  │
│  │⚔️ │🤝 │💼│  │
│  ├───┼───┼───┤  │
│  │🛡️ │🏃 │   │  │
│  └───┴───┴───┘  │
└─────────────────┘
```

**移動端優化**:
- 按鈕放大到 60×60px
- 日誌簡化為最新 3 條
- 敵人資訊精簡顯示
- 虛擬按鈕位於螢幕下方 1/3

## 無障礙設計

### ARIA 標籤
```html
<div role="region" aria-label="戰鬥畫面" class="battle-screen">

  <!-- 敵人區域 -->
  <section
    role="status"
    aria-live="polite"
    aria-label="敵人狀態"
    class="enemy-display"
  >
    <h2 id="enemy-name">Bug 怪物 Lv.5</h2>
    <div
      role="progressbar"
      aria-valuenow="350"
      aria-valuemin="0"
      aria-valuemax="500"
      aria-label="敵人 HP"
    >
      HP: 350/500
    </div>
  </section>

  <!-- 戰鬥日誌 -->
  <section
    role="log"
    aria-live="polite"
    aria-label="戰鬥日誌"
    class="battle-log"
  >
    <ul>
      <li>[回合 1] 遭遇敵人: Bug 怪物 Lv.5!</li>
      <li>[回合 2] 你使用了 code-generator! 造成 120 傷害!</li>
    </ul>
  </section>

  <!-- 行動選單 -->
  <nav aria-label="戰鬥行動" class="action-menu">
    <button
      aria-label="使用技能 (快捷鍵 1)"
      data-shortcut="1"
    >
      ⚔️ 使用技能
    </button>
    <button
      aria-label="召喚夥伴 (快捷鍵 2)"
      data-shortcut="2"
    >
      🤝 召喚夥伴
    </button>
  </nav>

</div>
```

### 鍵盤導航
**Tab 順序**:
```
1. 行動選單 - 使用技能按鈕
2. 行動選單 - 召喚夥伴按鈕
3. 行動選單 - 使用道具按鈕
4. 行動選單 - 防禦姿態按鈕
5. 行動選單 - 逃跑按鈕
6. 快捷技能槽 1-5 (如果顯示)
7. 日誌滾動控制
```

**焦點樣式**:
```css
.action-button:focus {
  outline: 3px solid #00ccff;
  outline-offset: 2px;
  box-shadow: 0 0 0 6px rgba(0, 204, 255, 0.3);
}

.action-button:focus:not(:focus-visible) {
  outline: none;
  box-shadow: none;
}
```

### 螢幕閱讀器
- 每次行動後朗讀結果
- HP 變化時通知
- 重要事件（弱點發現、勝利）優先通知
- 使用 `aria-live="assertive"` 對於緊急訊息

### 色盲友好
**HP 條設計**:
```
正常視力:
HP: ▓▓▓▓▓▓░░░░  [綠色 → 黃色 → 紅色]

色盲友好:
HP: ████████░░  450/600  [帶數字]
    ▲ 紋理變化  ▲ 明確數值
```

**弱點標示**:
- 不只用顏色，加上圖標: ⭐
- 文字標籤: "弱點攻擊！"
- 動畫特效增強

## 技術規格

### 效能目標
- **初始載入**: < 800ms
- **戰鬥開始動畫**: 2s 內完成
- **幀率**: 保持 60 FPS
- **行動響應**: < 100ms

### 資料結構

```typescript
interface BattleState {
  id: string;
  turn: number;
  phase: 'player' | 'enemy' | 'victory' | 'defeat';

  player: {
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    buffs: Buff[];
    debuffs: Debuff[];
  };

  enemy: {
    id: string;
    name: string;
    level: number;
    emoji: string;
    hp: number;
    maxHp: number;
    element: string;
    weakness?: string;
    resistances?: string[];
    discoveredWeakness: boolean;
  };

  log: BattleLogEntry[];
  availableActions: Action[];
}

interface BattleLogEntry {
  turn: number;
  type: 'encounter' | 'player_action' | 'enemy_action' | 'effect' | 'victory' | 'defeat';
  message: string;
  color: string;
  timestamp: number;
}

interface Action {
  id: string;
  type: 'skill' | 'companion' | 'item' | 'defend' | 'flee';
  name: string;
  icon: string;
  mpCost?: number;
  isAvailable: boolean;
  cooldown?: number;
}
```

### 動畫時序控制

```typescript
class BattleAnimationController {
  private animationQueue: Animation[] = [];
  private isPlaying: boolean = false;

  async playActionSequence(action: Action): Promise<void> {
    // 1. 玩家動作動畫
    await this.playAnimation('playerAction', 300);

    // 2. 技能特效
    await this.playAnimation('skillEffect', 500);

    // 3. 傷害數字
    this.spawnDamageNumber(damage, position);

    // 4. 敵人受傷
    await this.playAnimation('enemyHurt', 300);

    // 5. HP 條減少
    await this.updateHpBar(newHp, 500);

    // 6. 更新日誌
    this.addLogEntry(logEntry);
  }

  spawnDamageNumber(value: number, type: DamageType): void {
    const element = document.createElement('div');
    element.className = `damage-number ${type}`;
    element.textContent = value.toString();

    // 定位在敵人上方
    element.style.left = `${enemyX}px`;
    element.style.top = `${enemyY - 50}px`;

    // 添加到 DOM
    document.querySelector('.damage-layer').appendChild(element);

    // 動畫完成後移除
    setTimeout(() => element.remove(), 1000);
  }
}
```

### 狀態管理

```typescript
// 使用 Zustand 或 Redux
interface BattleStore {
  battle: BattleState | null;

  // Actions
  startBattle: (enemy: Enemy) => void;
  performAction: (action: Action) => Promise<void>;
  updateHp: (target: 'player' | 'enemy', newHp: number) => void;
  addLogEntry: (entry: BattleLogEntry) => void;
  endBattle: (result: 'victory' | 'defeat') => void;

  // Selectors
  isPlayerTurn: () => boolean;
  canPerformAction: (actionId: string) => boolean;
}
```

### 音效管理

```typescript
class BattleSoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();

  preload(): void {
    const soundList = [
      'battle_start',
      'attack_normal',
      'attack_weak',
      'enemy_hit',
      'enemy_counter',
      'button_click',
      'victory',
      'defeat'
    ];

    soundList.forEach(name => {
      const audio = new Audio(`/sounds/${name}.mp3`);
      audio.preload = 'auto';
      this.sounds.set(name, audio);
    });
  }

  play(name: string, volume: number = 1.0): void {
    const sound = this.sounds.get(name);
    if (sound) {
      sound.volume = volume;
      sound.currentTime = 0;
      sound.play();
    }
  }
}
```

## 相關文檔

### 設計系統
- `01-design-system/colors.md` - 戰鬥模式色彩規範
- `01-design-system/typography.md` - 字體和排版
- `01-design-system/animations.md` - 動畫設計規範

### 組件庫
- `04-components/status-displays.md` - 狀態欄組件
- `04-components/progress-bars.md` - 進度條組件
- `04-components/buttons.md` - 按鈕組件
- `04-components/log-display.md` - 日誌顯示組件

### 相關畫面
- `enemy-display.md` - 敵人資訊詳細設計
- `skill-selection.md` - 技能選擇介面
- `companion-panel.md` - 夥伴面板
- `battle-async.md` - 三面板並發戰鬥

### 轉場流程
- `03-flows/battle-entry.md` - 進入戰鬥流程
- `03-flows/battle-exit.md` - 戰鬥結束流程
- `03-flows/screen-transitions.md` - 通用轉場設計

### 系統文檔
- `docs/design/battle-system/battle-flow.md` - 戰鬥系統邏輯
- `docs/design/battle-system/damage-calculation.md` - 傷害計算公式
- `docs/design/battle-system/enemy-ai.md` - 敵人 AI 行為

---

**版本**: v1.0
**創建日期**: 2026-02-05
**最後更新**: 2026-02-05
**狀態**: ✅ 完成
