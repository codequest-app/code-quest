# 三面板並發戰鬥 (Async Battle System)

## 畫面概述

- **功能定位**: 支援多個戰鬥同時進行的並發戰鬥介面
- **進入條件**: 玩家輸入複雜任務 Prompt，系統識別為高複雜度任務
- **退出條件**: 所有戰鬥完成或取消
- **場景模式**: 戰鬥模式（異步執行）+ 探索模式（對話）混合

## 完整布局

```
┌──────────────────────────────────────────────────────────────────────┐
│ 🎮 Code Quest            Lv.15 | 💰 1,450 | ⚡ 85/100 | 💚 100/100   │
├────────────────────────────┬─────────────────────────────────────────┤
│                            │  ⚔️ 進行中的戰鬥 (2/3)                  │
│  【主對話區】               │  ┌───────────────────────────────────┐ │
│  (Dialog Track + Main)     │  │ 🔴 戰鬥 #1  [焦點]                │ │
│                            │  │ 重構認證系統                       │ │
│ > 你: 重構整個認證系統      │  │ 敵人: 魔王級 Bug (Lv.12)          │ │
│                            │  │ HP: ████████░░░░ 200/500  40%     │ │
│ 🤖 Claude:                 │  │ ⏱️ 5m 23s | 💰 45 金幣             │ │
│ ⚔️ 戰鬥 #1 已啟動！         │  │ [📋 詳情] [⏸️ 暫停] [❌ 取消]      │ │
│                            │  └───────────────────────────────────┘ │
│ ┌──────────────────────┐  │  ┌───────────────────────────────────┐ │
│ │ 任務: 重構認證系統    │  │  │ 🔴 戰鬥 #2                        │ │
│ │ 敵人: 魔王級 Bug      │  │  │ 添加單元測試                       │ │
│ │ 複雜度: 12/15         │  │  │ 敵人: 中等 Bug (Lv.7)             │ │
│ │ 預計: 15-20 分鐘      │  │  │ HP: ███░░░░░░░░ 80/200    40%     │ │
│ └──────────────────────┘  │  │ ⏱️ 2m 10s | 💰 18 金幣             │ │
│                            │  │ [📋 詳情] [⏸️ 暫停] [❌ 取消]      │ │
│ 戰鬥在右側面板進行中...     │  └───────────────────────────────────┘ │
│ 你可以繼續對話或查看進度    │  ┌───────────────────────────────────┐ │
│                            │  │ + 開始新戰鬥 (1 / 3 已用)          │ │
│ > 你: 目前有哪些戰鬥？      │  └───────────────────────────────────┘ │
│                            │                                         │
│ 🤖 Claude:                 │  ⏳ 排隊中 (1)                          │
│ 📋 進行中的戰鬥:           │  ┌───────────────────────────────────┐ │
│ • #1: 重構認證系統 (40%)   │  │ 🔵 戰鬥 #3 (排隊)                 │ │
│ • #2: 添加單元測試 (40%)   │  │ 優化數據庫查詢                     │ │
│                            │  │ 等待中... 預計 3 分鐘後開始        │ │
│ > _                        │  │ [❌ 取消排隊]                      │ │
│                            │  └───────────────────────────────────┘ │
│                            ├─────────────────────────────────────────┤
│                            │ 📊 當前焦點戰鬥: #1 詳細資訊             │
│                            │ ┌───────────────────────────────────┐ │
│                            │ │ 🎯 任務: 重構認證系統              │ │
│                            │ │ 🐉 敵人: 魔王級 Bug (Lv.12)        │ │
│                            │ │ 📈 複雜度: 12/15                   │ │
│                            │ │                                   │ │
│                            │ │ HP: 200 / 500  ████░░░░░░  40%    │ │
│                            │ │                                   │ │
│                            │ │ ⏱️ 戰鬥時間: 5m 23s                │ │
│                            │ │ 🛠️ 工具使用: 12 次                 │ │
│                            │ │ 💰 消耗: 45 金幣                   │ │
│                            │ │ 📊 預計剩餘: 8m 15s                │ │
│                            │ │                                   │ │
│                            │ │ 📜 最近動作:                       │ │
│                            │ │ [15:32:50] ✏️ 修復 auth.ts         │ │
│                            │ │ [15:33:05] 🧪 重新執行測試         │ │
│                            │ │ [15:33:12] ✅ 測試通過 (5/5)       │ │
│                            │ │ [15:33:18] 📖 讀取 oauth.ts        │ │
│                            │ │                                   │ │
│                            │ │ [⏸️ 暫停] [🔄 重啟] [❌ 取消]      │ │
│                            │ └───────────────────────────────────┘ │
└────────────────────────────┴─────────────────────────────────────────┘
```

## 區塊劃分

### 區塊 1: 頂部狀態欄（全寬）
- **位置**: 固定頂部
- **內容**:
  - 遊戲標題
  - 玩家等級
  - 資源顯示（金幣、MP、HP）
- **寬度**: 100%

### 區塊 2: 左側主對話區（20% 寬度）
- **功能**:
  - 即時對話（Dialog Track）
  - 同步任務戰鬥顯示（Main Sync）
  - 用戶輸入
- **特點**:
  - 不被異步戰鬥阻塞
  - 可以正常對話和提問
  - 顯示戰鬥啟動通知

### 區塊 3: 中央戰鬥主視窗（50% 寬度）
- **功能**:
  - 顯示當前焦點戰鬥的詳細資訊
  - 完整的戰鬥日誌
  - 戰鬥操作按鈕
- **可切換**: 點擊右側卡片切換焦點戰鬥

### 區塊 4: 右上戰鬥列表（30% 寬度，上半）
- **功能**:
  - 顯示所有進行中的戰鬥卡片
  - 簡要狀態和進度
  - 快速操作按鈕
- **最多顯示**: 3 個並發戰鬥
- **高度**: 40% 視窗高度

### 區塊 5: 右下戰鬥詳情（30% 寬度，下半）
- **功能**:
  - 顯示選中戰鬥的詳細資訊
  - 敵人狀態
  - 最近動作記錄
  - 完整操作按鈕
- **高度**: 60% 視窗高度

## 組件清單

### 共用組件（引用）
- **狀態欄**: `04-components/status-displays.md`
- **進度條**: `04-components/progress-bars.md`
- **按鈕**: `04-components/buttons.md`

### 特有組件

#### 戰鬥卡片 (BattleCard)
```typescript
interface BattleCardProps {
  battle: {
    id: string;
    title: string;
    enemy: {
      name: string;
      level: number;
      hp: number;
      maxHp: number;
    };
    status: 'queued' | 'in_progress' | 'paused' | 'completing' | 'completed' | 'failed';
    progress: number;
    timeElapsed: number;
    costSpent: number;
  };
  isFocused: boolean;
  onFocus: () => void;
  onPause: () => void;
  onCancel: () => void;
}
```

**狀態顏色**:
```css
.battle-card {
  border: 3px solid;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s;
}

.battle-card.queued {
  border-color: #2196f3; /* 藍色 */
  background: linear-gradient(135deg, #1e3a5f, #2d5a88);
}

.battle-card.in_progress {
  border-color: #ff6b6b; /* 紅色 */
  background: linear-gradient(135deg, #4d1a1a, #6d2a2a);
  box-shadow: 0 0 15px rgba(255, 107, 107, 0.4);
}

.battle-card.paused {
  border-color: #ffd93d; /* 黃色 */
  background: linear-gradient(135deg, #4d3d1a, #6d5d2a);
}

.battle-card.completed {
  border-color: #51cf66; /* 綠色 */
  background: linear-gradient(135deg, #1a4d2e, #2a6d4e);
}

.battle-card.failed {
  border-color: #868e96; /* 灰色 */
  background: linear-gradient(135deg, #2a2a2a, #3a3a3a);
}

.battle-card.focused {
  border-width: 4px;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
  transform: scale(1.05);
}
```

#### 進度條（帶動畫）
```typescript
interface AnimatedProgressBarProps {
  value: number;
  max: number;
  animated: boolean;
  status: BattleStatus;
}
```

```css
.progress-bar.animated {
  position: relative;
  overflow: hidden;
}

.progress-bar.animated::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: progress-shine 2s infinite;
}

@keyframes progress-shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-bar.in_progress {
  animation: progress-pulse 2s infinite;
}

@keyframes progress-pulse {
  0%, 100% { box-shadow: 0 0 5px rgba(255, 107, 107, 0.5); }
  50% { box-shadow: 0 0 15px rgba(255, 107, 107, 0.8); }
}
```

#### 戰鬥詳情面板 (BattleDetailPanel)
```typescript
interface BattleDetailPanelProps {
  battle: BattleState;
  recentActions: Action[];
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onCancel: () => void;
}
```

**動作記錄格式**:
```typescript
interface ActionRecord {
  timestamp: string;
  icon: string;
  action: string;
  details?: string;
}

const ActionIcons = {
  read: '📖',
  write: '✏️',
  edit: '✍️',
  test: '🧪',
  bash: '⚙️',
  search: '🔍',
  success: '✅',
  error: '❌',
  warning: '⚠️'
};
```

#### 通知彈窗 (BattleNotification)
```typescript
interface BattleNotificationProps {
  type: 'started' | 'milestone' | 'completed' | 'failed' | 'queued';
  battle: {
    id: string;
    title: string;
  };
  message: string;
  duration?: number;
  onClose: () => void;
}
```

```css
.battle-notification {
  position: fixed;
  top: 80px;
  right: 20px;
  max-width: 400px;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: notification-slide-in 0.3s ease-out;
  z-index: 1000;
}

@keyframes notification-slide-in {
  from {
    transform: translateX(420px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.battle-notification.started {
  background: linear-gradient(135deg, #ff6b6b, #ff8787);
  border-left: 4px solid #ff5252;
}

.battle-notification.completed {
  background: linear-gradient(135deg, #51cf66, #69db7c);
  border-left: 4px solid #40c057;
}

.battle-notification.failed {
  background: linear-gradient(135deg, #868e96, #adb5bd);
  border-left: 4px solid #495057;
}
```

## 互動設計

### 鍵盤操作
- **Ctrl+1~3**: 切換焦點到戰鬥 #1~3
- **Ctrl+P**: 暫停當前焦點戰鬥
- **Ctrl+R**: 恢復當前焦點戰鬥
- **Ctrl+X**: 取消當前焦點戰鬥
- **Ctrl+N**: 開始新戰鬥
- **Ctrl+B**: 切換戰鬥列表顯示/隱藏
- **Tab**: 在對話和戰鬥面板間切換焦點
- **Esc**: 關閉詳情面板/通知

### 滑鼠操作
- **左鍵點擊戰鬥卡片**: 設為焦點戰鬥，更新中央視窗
- **右鍵點擊戰鬥卡片**: 顯示快速操作選單
- **懸停戰鬥卡片**: 顯示簡要提示
- **點擊操作按鈕**: 執行對應操作（暫停/取消等）
- **拖曳戰鬥卡片**: 調整戰鬥優先順序（如支援）

### 觸控操作
- **點擊卡片**: 設為焦點
- **長按卡片**: 顯示操作選單
- **左滑卡片**: 顯示快速操作（暫停/取消）
- **雙指縮放**: 調整面板大小

## 轉場設計

### 進入異步戰鬥模式
**時間軸**: 1.5s
```
0.0s  ├─ 識別複雜任務
0.1s  ├─ 畫面分裂動畫開始
      │   • 主對話區縮小到 20%
      │   • 右側戰鬥面板滑入
0.5s  ├─ 戰鬥卡片淡入
0.8s  ├─ 進度條開始動畫
1.0s  ├─ 戰鬥詳情面板載入
1.5s  └─ 動畫完成
```

**動畫 CSS**:
```css
@keyframes panel-split {
  0% {
    width: 100%;
  }
  100% {
    width: 20%;
  }
}

@keyframes battle-panel-slide-in {
  0% {
    transform: translateX(100%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}
```

### 戰鬥卡片進入
```css
@keyframes battle-card-enter {
  0% {
    transform: translateX(100%) scale(0.8);
    opacity: 0;
  }
  60% {
    transform: translateX(-10px) scale(1.05);
    opacity: 1;
  }
  100% {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
}
```

### 戰鬥完成通知
```css
@keyframes notification-bounce {
  0% {
    transform: translateX(420px);
  }
  50% {
    transform: translateX(-10px);
  }
  70% {
    transform: translateX(5px);
  }
  100% {
    transform: translateX(0);
  }
}
```

## 狀態變化

### 戰鬥狀態流轉
```
排隊中 (queued)
    ↓
進行中 (in_progress) ←→ 暫停 (paused)
    ↓
完成中 (completing)
    ↓
完成 (completed) / 失敗 (failed)
```

### 各狀態顯示

#### 排隊中 (queued)
```
┌─────────────────────────────┐
│ 🔵 戰鬥 #3 (排隊)           │
│ 優化數據庫查詢               │
│ ⏳ 等待中...                │
│ 預計 3 分鐘後開始            │
│ [❌ 取消排隊]               │
└─────────────────────────────┘
```

#### 進行中 (in_progress)
```
┌─────────────────────────────┐
│ 🔴 戰鬥 #1  [焦點]          │
│ 重構認證系統                 │
│ HP: ████████░░░░ 40%        │
│ ⏱️ 5m 23s | 💰 45 金幣      │
│ [⏸️] [❌]                   │
└─────────────────────────────┘
```

**動畫**:
- 進度條脈動
- 邊框發光
- 時間倒數

#### 暫停 (paused)
```
┌─────────────────────────────┐
│ 🟡 戰鬥 #2  [已暫停]        │
│ 添加單元測試                 │
│ HP: ███░░░░░░░░ 40%         │
│ ⏸️ 已暫停於 5m 23s          │
│ [▶️ 恢復] [❌ 取消]          │
└─────────────────────────────┘
```

**樣式**:
- 灰度濾鏡 50%
- 進度條停止動畫

#### 完成中 (completing)
```
┌─────────────────────────────┐
│ 🟢 戰鬥 #1  [收尾中]        │
│ 重構認證系統                 │
│ HP: ░░░░░░░░░░░ 0%          │
│ ✨ 收尾工作中...             │
│ [請稍候...]                 │
└─────────────────────────────┘
```

**動畫**:
- 閃光效果
- 旋轉載入圖標

#### 完成 (completed)
```
┌─────────────────────────────┐
│ ✅ 戰鬥 #1  [已完成]        │
│ 重構認證系統                 │
│ 🎉 勝利！                   │
│ 💰 +150 金幣 | ⭐ +500 EXP  │
│ [查看詳情] [關閉]            │
└─────────────────────────────┘
```

**動畫**:
- 金色光暈
- 慶祝粒子效果
- 3 秒後自動淡出

#### 失敗 (failed)
```
┌─────────────────────────────┐
│ ❌ 戰鬥 #2  [失敗]          │
│ 添加單元測試                 │
│ 💔 失敗: 測試未通過 (3/10)  │
│ [🔄 重試] [📋 日誌] [關閉]  │
└─────────────────────────────┘
```

**樣式**:
- 紅色邊框
- 灰度濾鏡

### 達到最大並發數
```
┌─────────────────────────────┐
│ ⚠️ 已達到最大並發數 (3/3)   │
│ 新戰鬥將自動排隊等待         │
│ • 戰鬥 #1: 40% 完成          │
│ • 戰鬥 #2: 40% 完成          │
│ • 戰鬥 #3: 10% 完成          │
└─────────────────────────────┘
```

## 響應式設計

### 桌面 (1440px+)
```
┌──────────────────────────────────────────────────┐
│  對話 20%    │    主視窗 50%    │  列表 30%     │
│             │                 │  ├─ 戰鬥列表   │
│             │  [焦點戰鬥]      │  └─ 詳情面板   │
└──────────────────────────────────────────────────┘
```

### 平板 (1024-1439px)
```
┌──────────────────────────────────────┐
│  對話 30%    │    主視窗 70%        │
│             │                       │
│             │  [焦點戰鬥]            │
│             │                       │
│             │  [戰鬥列表: 摺疊]      │
│             │  [點擊展開]            │
└──────────────────────────────────────┘
```

### 平板 (768-1023px)
```
┌────────────────────────────┐
│  [主視窗: 焦點戰鬥]         │
│                            │
│  ━━━━━━━━━━━━━━━━━━━━    │
│  [對話區: 可切換]           │
│  [戰鬥列表: 底部抽屜]       │
│  ▲ 向上滑動查看             │
└────────────────────────────┘
```

### 手機 (<768px)
```
┌─────────────────┐
│  [Tab 切換]      │
│  [對話][戰鬥]    │
│                 │
│  當前顯示區域    │
│                 │
│  [戰鬥列表]      │
│  (底部抽屜)      │
│  ▲ 向上滑動      │
└─────────────────┘
```

**移動端優化**:
- Tab 切換對話/戰鬥視圖
- 底部抽屜顯示戰鬥列表
- 卡片簡化顯示，只顯示關鍵資訊
- 左滑卡片顯示操作按鈕

## 無障礙設計

### ARIA 標籤
```html
<div role="main" aria-label="異步戰鬥介面">

  <!-- 對話區 -->
  <section
    role="log"
    aria-live="polite"
    aria-label="對話記錄"
    class="dialog-track"
  >
    <!-- 對話內容 -->
  </section>

  <!-- 戰鬥列表 -->
  <section
    role="region"
    aria-label="進行中的戰鬥列表"
    class="battle-list"
  >
    <h2>進行中的戰鬥 (2/3)</h2>

    <article
      role="article"
      aria-label="戰鬥 #1: 重構認證系統"
      aria-live="polite"
      class="battle-card in_progress"
      tabindex="0"
    >
      <h3>戰鬥 #1</h3>
      <p>重構認證系統</p>
      <div
        role="progressbar"
        aria-valuenow="40"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="戰鬥進度 40%"
      >
        40%
      </div>
    </article>

  </section>

  <!-- 戰鬥詳情 -->
  <section
    role="complementary"
    aria-label="戰鬥詳細資訊"
    class="battle-detail"
  >
    <!-- 詳情內容 -->
  </section>

</div>
```

### 鍵盤導航
**Tab 順序**:
```
1. 對話輸入框
2. 戰鬥卡片 #1
3. 戰鬥卡片 #2
4. 戰鬥卡片 #3
5. 新戰鬥按鈕
6. 詳情面板操作按鈕
```

**快捷鍵提示**:
```
按 Ctrl+H 查看快捷鍵列表:
┌──────────────────────────────┐
│ 快捷鍵說明                    │
├──────────────────────────────┤
│ Ctrl+1~3  切換焦點戰鬥        │
│ Ctrl+P    暫停當前戰鬥        │
│ Ctrl+R    恢復當前戰鬥        │
│ Ctrl+X    取消當前戰鬥        │
│ Ctrl+N    開始新戰鬥          │
│ Ctrl+B    切換戰鬥面板        │
│ Tab       切換焦點            │
│ Esc       關閉面板/通知       │
└──────────────────────────────┘
```

### 螢幕閱讀器
- 戰鬥狀態變化時通知
- 進度更新每 10% 通知一次
- 完成/失敗時優先通知
- 使用 `aria-live="assertive"` 對於重要事件

## 技術規格

### WebSocket 事件處理

```typescript
interface BattleEvent {
  type: 'battle:created' | 'battle:started' | 'battle:progress' |
        'battle:tool_used' | 'battle:paused' | 'battle:resumed' |
        'battle:completed' | 'battle:failed' | 'queue:added' | 'queue:started';
  battleId: string;
  data: any;
  timestamp: number;
}

class BattleWebSocketManager {
  private ws: WebSocket;
  private eventHandlers: Map<string, Function[]> = new Map();

  connect(): void {
    this.ws = new WebSocket('ws://localhost:3000/battles');

    this.ws.onmessage = (event) => {
      const battleEvent: BattleEvent = JSON.parse(event.data);
      this.handleEvent(battleEvent);
    };
  }

  on(eventType: string, handler: Function): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  private handleEvent(event: BattleEvent): void {
    const handlers = this.eventHandlers.get(event.type) || [];
    handlers.forEach(handler => handler(event));

    // UI 更新
    this.updateUI(event);
  }

  private updateUI(event: BattleEvent): void {
    switch (event.type) {
      case 'battle:progress':
        this.updateProgress(event.battleId, event.data);
        break;
      case 'battle:completed':
        this.showCompletionNotification(event.battleId);
        break;
      case 'battle:failed':
        this.showFailureNotification(event.battleId);
        break;
      // ... 其他事件
    }
  }
}
```

### 狀態管理

```typescript
interface AsyncBattleState {
  battles: Map<string, BattleInstance>;
  focusedBattleId: string | null;
  maxConcurrent: number;
  queue: QueuedBattle[];
}

interface BattleInstance {
  id: string;
  title: string;
  status: BattleStatus;
  progress: number;
  enemy: Enemy;
  startTime: number;
  timeElapsed: number;
  costSpent: number;
  recentActions: ActionRecord[];
}

// Zustand Store
const useAsyncBattleStore = create<AsyncBattleState>((set, get) => ({
  battles: new Map(),
  focusedBattleId: null,
  maxConcurrent: 3,
  queue: [],

  // Actions
  createBattle: (battle: BattleInstance) => {
    const { battles, maxConcurrent } = get();
    if (battles.size >= maxConcurrent) {
      // 加入排隊
      set(state => ({
        queue: [...state.queue, battle]
      }));
    } else {
      // 直接開始
      battles.set(battle.id, battle);
      set({ battles: new Map(battles) });
    }
  },

  updateBattle: (battleId: string, updates: Partial<BattleInstance>) => {
    const { battles } = get();
    const battle = battles.get(battleId);
    if (battle) {
      battles.set(battleId, { ...battle, ...updates });
      set({ battles: new Map(battles) });
    }
  },

  setFocused: (battleId: string) => {
    set({ focusedBattleId: battleId });
  },

  completeBattle: (battleId: string) => {
    const { battles, queue } = get();
    battles.delete(battleId);

    // 從排隊中取出下一個
    if (queue.length > 0) {
      const next = queue[0];
      battles.set(next.id, next);
      set({
        battles: new Map(battles),
        queue: queue.slice(1)
      });
    } else {
      set({ battles: new Map(battles) });
    }
  }
}));
```

### 效能優化

```typescript
// 虛擬滾動（戰鬥列表）
import { useVirtualizer } from '@tanstack/react-virtual';

function BattleList({ battles }: { battles: BattleInstance[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: battles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // 每個卡片高度
    overscan: 2
  });

  return (
    <div ref={parentRef} style={{ height: '100%', overflow: 'auto' }}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            <BattleCard battle={battles[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 相關文檔

### 設計系統
- `01-design-system/colors.md` - 狀態顏色規範
- `01-design-system/animations.md` - 動畫設計
- `01-design-system/layout.md` - 多面板佈局

### 組件庫
- `04-components/cards.md` - 卡片組件
- `04-components/progress-bars.md` - 進度條
- `04-components/notifications.md` - 通知組件

### 相關畫面
- `battle-main.md` - 單線戰鬥畫面
- `skill-selection.md` - 技能選擇
- `companion-panel.md` - 夥伴面板

### 系統文檔
- `docs/design/async-battle-system/core-logic.md` - 並發戰鬥邏輯
- `docs/design/async-battle-system/queue-management.md` - 排隊管理
- `docs/design/async-battle-system/websocket-protocol.md` - WebSocket 協議

---

**版本**: v1.0
**創建日期**: 2026-02-05
**最後更新**: 2026-02-05
**狀態**: ✅ 完成
