# Notifications Screen - 通知系統畫面

**分類**: Event & Modal Screens
**類型**: Toast Notification System
**優先級**: Medium
**最後更新**: 2026-02-05

---

## 概述

通知系統是一個非阻塞式的訊息提示系統，用於向使用者傳遞即時資訊、狀態更新和事件通知。通知以 Toast 形式出現在螢幕角落，不會打斷使用者的工作流程，並在一定時間後自動消失。

### 通知類型

- **Success (成功)**: 操作成功完成
- **Info (資訊)**: 一般資訊通知
- **Warning (警告)**: 需要注意的事項
- **Error (錯誤)**: 操作失敗或錯誤
- **Quest (任務)**: 新任務可用
- **Companion (夥伴)**: Agent 或夥伴相關動作
- **Battle (戰鬥)**: 戰鬥相關更新
- **System (系統)**: 系統訊息

---

## ASCII 佈局設計

### Success 通知

```
┌─────────────────────────────────────────────┐
│  ✅ 成功！                        [X]      │
│  ─────────────────────────────────────────  │
│  檔案已成功儲存                             │
│  auth.ts                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━ 3s                │
└─────────────────────────────────────────────┘
   (右上角，綠色邊框，3秒後淡出)
```

### Info 通知

```
┌─────────────────────────────────────────────┐
│  ℹ️ 提示                          [X]      │
│  ─────────────────────────────────────────  │
│  已切換到 feature/oauth 分支                │
│  ━━━━━━━━━━━━━━━━━━━━━━ 3s                │
└─────────────────────────────────────────────┘
   (右上角，藍色邊框，3秒後淡出)
```

### Warning 通知

```
┌─────────────────────────────────────────────┐
│  ⚠️ 警告                          [X]      │
│  ─────────────────────────────────────────  │
│  檔案即將達到大小限制                       │
│  auth.ts (4.8 MB / 5 MB)                   │
│  ━━━━━━━━━━━━━━━━━━━━━━ 5s                │
└─────────────────────────────────────────────┘
   (右上角，黃色邊框，5秒後淡出)
```

### Error 通知

```
┌─────────────────────────────────────────────┐
│  ❌ 錯誤                          [X]      │
│  ─────────────────────────────────────────  │
│  無法儲存檔案                               │
│  權限不足                                   │
│  [重試] [查看詳情]                          │
│  ━━━━━━━━━━━━━━━━━━━━━━ 10s               │
└─────────────────────────────────────────────┘
   (右上角，紅色邊框，10秒後淡出或手動關閉)
```

### Quest 通知

```
┌─────────────────────────────────────────────┐
│  🎯 新任務！                      [X]      │
│  ─────────────────────────────────────────  │
│  重構認證系統                               │
│  獎勵: 💰 500 金幣  |  ⭐ 1000 經驗值      │
│  [查看] [接受]                              │
│  ━━━━━━━━━━━━━━━━━━━━━━ ∞                 │
└─────────────────────────────────────────────┘
   (右上角，紫色邊框，不自動關閉)
```

### Companion 通知

```
┌─────────────────────────────────────────────┐
│  🤝 夥伴動作                      [X]      │
│  ─────────────────────────────────────────  │
│  🤖 Code Reviewer 完成了測試                │
│  所有測試通過 ✓                             │
│  [查看報告]                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━ 5s                │
└─────────────────────────────────────────────┘
   (右上角，青色邊框，5秒後淡出)
```

### Battle 通知

```
┌─────────────────────────────────────────────┐
│  ⚔️ 戰鬥完成                      [X]      │
│  ─────────────────────────────────────────  │
│  戰鬥 #1 勝利！                             │
│  重構認證系統                               │
│  獲得: 💰 150 金幣  |  ⭐ 500 經驗值        │
│  [查看詳情]                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━ 7s                │
└─────────────────────────────────────────────┘
   (右上角，橙色邊框，7秒後淡出)
```

### 通知堆疊（多個通知）

```
┌─────────────────────────────────────────────┐
│  ✅ 成功！                        [X]      │
│  ─────────────────────────────────────────  │
│  檔案已儲存: config.json                    │
│  ━━━━━━━━━━━━━━━━━━━━━━ 2s                │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  ℹ️ 提示                          [X]      │
│  ─────────────────────────────────────────  │
│  Git push 完成                              │
│  ━━━━━━━━━━━━━━━━━━━━━━ 3s                │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  ⚔️ 戰鬥更新                      [X]      │
│  ─────────────────────────────────────────  │
│  戰鬥 #1 進度: 50%                          │
│  ━━━━━━━━━━━━━━━━━━━━━━ 4s                │
└─────────────────────────────────────────────┘
   (最多顯示 3 個，從上到下排列，間隔 8px)
```

### 通知歷史面板

```
┌───────────────────────────────────────────────────────────────────┐
│  🔔 通知歷史                                        [全部清除] [X] │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  篩選: [全部] [成功] [錯誤] [任務] [戰鬥]                         │
│                                                                   │
│  今天                                                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ✅ 檔案已儲存: auth.ts                   15:45          │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ⚔️ 戰鬥 #1 勝利！                        15:32          │    │
│  │ 獲得: 💰 150 金幣  |  ⭐ 500 經驗值                     │    │
│  │ [查看詳情]                                              │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ℹ️ 已切換到 feature/oauth 分支           15:20          │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ❌ 無法儲存檔案: 權限不足                 15:15          │    │
│  │ [重試]                                                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  昨天                                                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🎯 新任務: 重構認證系統                   10:30          │    │
│  │ 獎勵: 💰 500 金幣  |  ⭐ 1000 經驗值                    │    │
│  │ [查看]                                                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ✅ 所有測試通過                           09:15          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                   │
│  顯示 6 / 45 則通知                           [載入更多]         │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
   (右側滑入面板，寬度 400px)
```

### 不同位置的通知

```
┌────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────┐                               │
│  │ 🎉 重要！                  │  ← 頂部中央（重要通知）        │
│  │ 達到 25 級里程碑！          │                               │
│  │ [查看獎勵]                  │                               │
│  └─────────────────────────────┘                               │
│                                                                │
│                           ┌───────────────────────────┐        │
│                           │ ✅ 儲存成功              │        │
│                           │ config.json              │        │
│                           └───────────────────────────┘        │
│                                            ↑                   │
│                                    右上角（預設位置）          │
│                                                                │
│                                                                │
│                                                                │
│                                                                │
│                                                                │
│                                  ┌───────────────────────┐    │
│                                  │ ℹ️ 提示               │    │
│                                  │ 操作已佇列            │    │
│                                  └───────────────────────┘    │
│                                           ↑                    │
│                                   右下角（低優先級）           │
└────────────────────────────────────────────────────────────────┘
```

---

## 組件規格

### Notification Data

```typescript
enum NotificationType {
  Success = 'success',       // 綠色
  Info = 'info',            // 藍色
  Warning = 'warning',      // 黃色
  Error = 'error',          // 紅色
  Quest = 'quest',          // 紫色
  Companion = 'companion',  // 青色
  Battle = 'battle',        // 橙色
  System = 'system'         // 灰色
}

enum NotificationPosition {
  TopRight = 'top-right',       // 預設
  TopCenter = 'top-center',     // 重要
  BottomRight = 'bottom-right', // 低優先級
  BottomLeft = 'bottom-left'    // 備用
}

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  duration?: number;          // 自動關閉時間（毫秒），undefined 表示不自動關閉
  position?: NotificationPosition;
  icon?: string;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
  persistent?: boolean;       // 是否持久化（不自動關閉）
  priority?: number;          // 優先級（影響堆疊順序）
}

interface NotificationAction {
  id: string;
  label: string;
  handler: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}
```

### Notification Timings

```typescript
const NOTIFICATION_DURATIONS = {
  success: 3000,   // 3秒
  info: 3000,      // 3秒
  warning: 5000,   // 5秒
  error: 10000,    // 10秒
  quest: Infinity, // 不自動關閉
  companion: 5000, // 5秒
  battle: 7000,    // 7秒
  system: 4000     // 4秒
};

function getDefaultDuration(type: NotificationType): number {
  return NOTIFICATION_DURATIONS[type];
}
```

### Notification Colors

```css
/* 通知類型顏色方案 */
.notification-success {
  border-left: 4px solid #4CAF50;
  background: linear-gradient(to right, rgba(76, 175, 80, 0.1), transparent);
}

.notification-info {
  border-left: 4px solid #2196F3;
  background: linear-gradient(to right, rgba(33, 150, 243, 0.1), transparent);
}

.notification-warning {
  border-left: 4px solid #FFC107;
  background: linear-gradient(to right, rgba(255, 193, 7, 0.1), transparent);
}

.notification-error {
  border-left: 4px solid #F44336;
  background: linear-gradient(to right, rgba(244, 67, 54, 0.1), transparent);
}

.notification-quest {
  border-left: 4px solid #9C27B0;
  background: linear-gradient(to right, rgba(156, 39, 176, 0.1), transparent);
}

.notification-companion {
  border-left: 4px solid #00BCD4;
  background: linear-gradient(to right, rgba(0, 188, 212, 0.1), transparent);
}

.notification-battle {
  border-left: 4px solid #FF9800;
  background: linear-gradient(to right, rgba(255, 152, 0, 0.1), transparent);
}

.notification-system {
  border-left: 4px solid #607D8B;
  background: linear-gradient(to right, rgba(96, 125, 139, 0.1), transparent);
}
```

---

## 狀態管理

### Notification Queue

```typescript
class NotificationQueue {
  private notifications: Notification[] = [];
  private maxVisible: number = 3;
  private visibleNotifications: Notification[] = [];

  add(notification: Notification) {
    // 分配唯一 ID
    notification.id = generateId();

    // 設定預設時長
    if (notification.duration === undefined) {
      notification.duration = getDefaultDuration(notification.type);
    }

    // 加入佇列（依優先級排序）
    this.notifications.push(notification);
    this.notifications.sort((a, b) =>
      (b.priority || 0) - (a.priority || 0)
    );

    // 顯示通知
    this.showNext();
  }

  private showNext() {
    // 如果已達最大顯示數量，不顯示新通知
    if (this.visibleNotifications.length >= this.maxVisible) {
      return;
    }

    // 取出下一個通知
    const next = this.notifications.shift();
    if (!next) return;

    // 顯示通知
    this.visibleNotifications.push(next);
    this.renderNotification(next);

    // 設定自動關閉
    if (next.duration !== Infinity && !next.persistent) {
      setTimeout(() => {
        this.remove(next.id);
      }, next.duration);
    }
  }

  remove(id: string) {
    // 從可見通知中移除
    const index = this.visibleNotifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.visibleNotifications.splice(index, 1);

      // 顯示下一個通知
      this.showNext();
    }
  }

  clear() {
    this.visibleNotifications.forEach(n => this.remove(n.id));
    this.notifications = [];
  }
}
```

### Notification History

```typescript
interface NotificationHistory {
  notifications: Notification[];
  maxHistory: number;
  filters: NotificationType[];
}

class NotificationHistoryManager {
  private history: Notification[] = [];
  private maxHistory: number = 100;

  add(notification: Notification) {
    // 加入歷史記錄
    this.history.unshift(notification);

    // 限制歷史記錄數量
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(0, this.maxHistory);
    }

    // 持久化到 localStorage
    this.save();
  }

  getFiltered(filters: NotificationType[]): Notification[] {
    if (filters.length === 0) {
      return this.history;
    }

    return this.history.filter(n => filters.includes(n.type));
  }

  clear() {
    this.history = [];
    this.save();
  }

  private save() {
    localStorage.setItem('notification-history', JSON.stringify(this.history));
  }

  private load() {
    const saved = localStorage.getItem('notification-history');
    if (saved) {
      this.history = JSON.parse(saved);
    }
  }
}
```

---

## 互動設計

### 鍵盤操作

| 按鍵 | 功能 |
|------|------|
| `N` | 開啟/關閉通知歷史面板 |
| `Esc` | 關閉通知歷史面板 |
| `Ctrl+N` | 清除所有可見通知 |
| `Ctrl+Shift+N` | 清除歷史記錄 |
| `↑` / `↓` | 在歷史面板中導航 |
| `Enter` | 執行通知動作（如果有） |

### 滑鼠操作

- **點擊通知**: 執行預設動作或關閉
- **點擊 [X]**: 關閉通知
- **點擊動作按鈕**: 執行對應動作
- **點擊通知圖標（右上角）**: 開啟歷史面板
- **懸停通知**: 暫停自動關閉倒數計時
- **向右滑動通知**: 關閉通知（滑動手勢）

### 觸控手勢

- **點擊通知**: 執行預設動作或關閉
- **向右滑動**: 關閉通知
- **向左滑動**: 顯示動作選單
- **長按通知**: 固定通知（不自動關閉）
- **下拉刷新**: 刷新通知歷史

---

## 動畫效果

### 入場動畫

【參考：01-design-system/animation-timing.md】

```typescript
// 從右側滑入
const slideInAnimation = {
  initial: {
    x: 400,
    opacity: 0,
    scale: 0.9
  },
  animate: {
    x: 0,
    opacity: 1,
    scale: 1
  },
  transition: {
    type: 'spring',
    damping: 25,
    stiffness: 300,
    duration: 0.3
  }
}
```

### 離場動畫

```typescript
// 向右滑出並淡出
const slideOutAnimation = {
  animate: {
    x: 400,
    opacity: 0,
    scale: 0.9
  },
  transition: {
    duration: 0.2,
    ease: 'easeIn'
  }
}
```

### 堆疊重排動畫

```typescript
// 當一個通知關閉時，其他通知平滑移動
const reorderAnimation = {
  layout: true,
  transition: {
    type: 'spring',
    damping: 25,
    stiffness: 400
  }
}
```

### 進度條動畫

```typescript
// 倒數計時進度條
const progressAnimation = {
  initial: { width: '100%' },
  animate: { width: '0%' },
  transition: {
    duration: notification.duration / 1000,
    ease: 'linear'
  }
}
```

### 懸停暫停效果

```typescript
// 懸停時暫停進度條
function handleMouseEnter(notification: Notification) {
  // 暫停進度條動畫
  pauseProgressAnimation(notification.id);
  // 暫停自動關閉計時器
  pauseAutoCloseTimer(notification.id);
}

function handleMouseLeave(notification: Notification) {
  // 恢復進度條動畫
  resumeProgressAnimation(notification.id);
  // 恢復自動關閉計時器
  resumeAutoCloseTimer(notification.id);
}
```

---

## 通知歷史面板

### Panel Structure

```typescript
interface NotificationHistoryPanel {
  isOpen: boolean;
  filters: NotificationType[];
  notifications: Notification[];
  currentPage: number;
  itemsPerPage: number;
}
```

### Panel Animations

```typescript
// 從右側滑入
const panelSlideIn = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  transition: {
    type: 'spring',
    damping: 30,
    stiffness: 300
  }
}
```

### Filter Behavior

```typescript
function filterNotifications(
  notifications: Notification[],
  filters: NotificationType[]
): Notification[] {
  if (filters.length === 0) {
    return notifications;
  }

  return notifications.filter(n => filters.includes(n.type));
}

// 切換篩選器
function toggleFilter(filter: NotificationType) {
  if (activeFilters.includes(filter)) {
    activeFilters = activeFilters.filter(f => f !== filter);
  } else {
    activeFilters.push(filter);
  }

  updateDisplay();
}
```

---

## 特殊通知行為

### 群組通知

```typescript
// 將相同類型的通知群組
interface GroupedNotification extends Notification {
  count: number;
  items: Notification[];
}

function groupNotifications(
  notifications: Notification[]
): GroupedNotification[] {
  const groups = new Map<string, Notification[]>();

  notifications.forEach(n => {
    const key = `${n.type}-${n.title}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(n);
  });

  return Array.from(groups.values()).map(items => ({
    ...items[0],
    count: items.length,
    items
  }));
}
```

**顯示範例**:
```
┌─────────────────────────────────────────────┐
│  ✅ 成功！(3)                     [X]      │
│  ─────────────────────────────────────────  │
│  3 個檔案已儲存                             │
│  [展開查看]                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━ 5s                │
└─────────────────────────────────────────────┘
```

### 進度通知

```typescript
interface ProgressNotification extends Notification {
  progress: number;      // 0-100
  total?: number;
  current?: number;
  status?: string;
}

// 更新進度
function updateProgress(id: string, progress: number) {
  const notification = findNotification(id);
  if (notification) {
    notification.progress = progress;
    renderNotification(notification);
  }
}
```

**顯示範例**:
```
┌─────────────────────────────────────────────┐
│  ⏳ 正在處理...                   [X]      │
│  ─────────────────────────────────────────  │
│  安裝依賴項                                 │
│  ████████████░░░░░░░░ 60%                  │
│  15 / 25 個套件                             │
│  ━━━━━━━━━━━━━━━━━━━━━━ ∞                 │
└─────────────────────────────────────────────┘
```

### 可擴展通知

```typescript
interface ExpandableNotification extends Notification {
  summary: string;       // 簡短摘要
  details: string;       // 詳細內容
  expanded: boolean;     // 是否展開
}
```

**摺疊狀態**:
```
┌─────────────────────────────────────────────┐
│  ℹ️ Git Push 完成                 [X]      │
│  ─────────────────────────────────────────  │
│  已推送 3 個 commits                        │
│  [展開詳情 ▼]                               │
│  ━━━━━━━━━━━━━━━━━━━━━━ 5s                │
└─────────────────────────────────────────────┘
```

**展開狀態**:
```
┌─────────────────────────────────────────────┐
│  ℹ️ Git Push 完成                 [X]      │
│  ─────────────────────────────────────────  │
│  已推送 3 個 commits                        │
│  [收合詳情 ▲]                               │
│                                             │
│  分支: feature/oauth                        │
│  Commits:                                   │
│  • feat: add OAuth client                   │
│  • fix: handle token refresh                │
│  • docs: update README                      │
│                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━ 10s               │
└─────────────────────────────────────────────┘
```

---

## 無障礙設計

### 螢幕閱讀器

```html
<div role="status" aria-live="polite" aria-atomic="true">
  <div class="notification notification-success">
    <h3>
      <span aria-label="成功通知">✅</span>
      成功！
    </h3>
    <p>檔案已成功儲存：auth.ts</p>

    <div role="progressbar"
         aria-valuenow="70"
         aria-valuemin="0"
         aria-valuemax="100"
         aria-label="自動關閉倒數計時">
      <div class="progress-bar" style="width: 70%"></div>
    </div>

    <button aria-label="關閉通知">
      <span aria-hidden="true">×</span>
    </button>
  </div>
</div>

<!-- 錯誤通知使用 alert role -->
<div role="alert" aria-live="assertive">
  <div class="notification notification-error">
    <h3>
      <span aria-label="錯誤通知">❌</span>
      錯誤
    </h3>
    <p>無法儲存檔案：權限不足</p>

    <nav aria-label="通知動作">
      <button>重試</button>
      <button>查看詳情</button>
    </nav>
  </div>
</div>
```

### 通知優先級與 aria-live

```typescript
function getAriaLive(type: NotificationType): 'polite' | 'assertive' | 'off' {
  switch (type) {
    case NotificationType.Error:
    case NotificationType.Warning:
      return 'assertive';  // 立即通知

    case NotificationType.Success:
    case NotificationType.Info:
    case NotificationType.Quest:
    case NotificationType.Companion:
    case NotificationType.Battle:
      return 'polite';     // 禮貌地通知

    default:
      return 'off';
  }
}
```

### 減少動畫

```typescript
// 尊重使用者的動畫偏好
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if (prefersReducedMotion) {
  // 簡化動畫
  notification.transition = {
    duration: 0.1,
    ease: 'linear'
  };

  // 移除彈跳效果
  notification.type = 'tween';
}
```

---

## 響應式設計

### 桌面版 (≥ 1024px)

```
通知寬度: 400px
最大可見數: 3 個
位置: 右上角
間距: 16px
歷史面板: 400px 寬
```

### 平板版 (768px - 1023px)

```
通知寬度: 350px
最大可見數: 3 個
位置: 右上角
間距: 12px
歷史面板: 350px 寬
```

### 手機版 (< 768px)

```
通知寬度: 95vw
最大可見數: 2 個
位置: 頂部中央
間距: 8px
歷史面板: 全螢幕
通知高度: 自動（最小 80px）
字體大小: 16px（比桌面版大）
```

---

## 實作注意事項

### 性能優化

```typescript
// 使用虛擬滾動處理大量歷史記錄
import { VirtualScroller } from 'virtual-scroller';

class NotificationHistoryPanel {
  private scroller: VirtualScroller;

  render() {
    this.scroller = new VirtualScroller({
      items: this.notifications,
      itemHeight: 80,
      renderItem: (notification) => this.renderNotificationItem(notification)
    });
  }
}
```

### 防抖動

```typescript
// 防止短時間內大量通知
class NotificationThrottler {
  private lastNotificationTime = new Map<string, number>();
  private throttleDuration = 1000; // 1秒

  shouldShow(notification: Notification): boolean {
    const key = `${notification.type}-${notification.title}`;
    const lastTime = this.lastNotificationTime.get(key);
    const now = Date.now();

    if (lastTime && now - lastTime < this.throttleDuration) {
      return false;
    }

    this.lastNotificationTime.set(key, now);
    return true;
  }
}
```

### 通知去重

```typescript
function isDuplicateNotification(
  notification: Notification,
  visible: Notification[]
): boolean {
  return visible.some(v =>
    v.type === notification.type &&
    v.title === notification.title &&
    v.message === notification.message &&
    (Date.now() - v.timestamp.getTime()) < 5000 // 5秒內
  );
}
```

### 離線支援

```typescript
// 離線時儲存通知，上線後顯示
class OfflineNotificationQueue {
  private queue: Notification[] = [];

  add(notification: Notification) {
    if (!navigator.onLine) {
      this.queue.push(notification);
      this.saveToStorage();
    } else {
      showNotification(notification);
    }
  }

  flush() {
    if (navigator.onLine && this.queue.length > 0) {
      this.queue.forEach(n => showNotification(n));
      this.queue = [];
      this.clearStorage();
    }
  }

  private saveToStorage() {
    localStorage.setItem('offline-notifications', JSON.stringify(this.queue));
  }

  private clearStorage() {
    localStorage.removeItem('offline-notifications');
  }
}

// 監聽上線事件
window.addEventListener('online', () => {
  offlineQueue.flush();
});
```

---

## 相關畫面連結

- **Error Handling**: `02-screens/events/error-handling.md`
- **Level Up**: `02-screens/events/level-up.md`
- **Battle Victory**: `02-screens/battle/victory-screen.md`
- **Quest System**: `02-screens/exploration/quest-log.md`
- **Toast Component**: `04-components/toast.md`
- **Animation Timing**: `01-design-system/animation-timing.md`

---

## 設計決策記錄

### 為什麼使用非阻塞式通知？

非阻塞式通知不會打斷使用者的工作流程，允許使用者在收到通知的同時繼續操作，提升使用體驗。

### 為什麼限制最多 3 個可見通知？

超過 3 個通知會佔用過多螢幕空間並造成視覺混亂。額外的通知會排隊等待，確保介面整潔。

### 為什麼不同類型的通知有不同的持續時間？

錯誤通知需要更長時間讓使用者閱讀和處理，而成功通知可以快速消失。這樣的設計符合使用者的認知習慣。

### 為什麼需要通知歷史？

使用者可能錯過某些通知，歷史記錄讓他們可以回顧之前的訊息，避免重要資訊遺失。

### 為什麼懸停時暫停自動關閉？

當使用者懸停在通知上時，表示他們正在閱讀或考慮操作，暫停自動關閉給予足夠的時間。

---

**最後更新**: 2026-02-05
**作者**: UI Design Team
**版本**: 1.0
