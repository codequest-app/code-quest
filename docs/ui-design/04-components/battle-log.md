# 戰鬥日誌組件 (Battle Log Component)

**類別**: Battle Components
**版本**: v1.0
**最後更新**: 2026-02-05

---

## 組件概述

戰鬥日誌顯示戰鬥過程中的所有行動、傷害、效果和事件記錄。提供即時反饋和歷史回顧功能。

### 使用時機
- ✅ 戰鬥畫面主要組件
- ✅ 戰鬥回放
- ✅ 戰鬥統計
- ✅ 調試和測試

### 不使用時機
- ❌ 一般系統日誌（使用 system-log）
- ❌ 聊天訊息（使用 chat-log）

---

## 視覺示例

### 基本日誌
```
┌──────────────────────────────────────────────────┐
│ 【戰鬥日誌】                        [清空] [導出] │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                  │
│ [回合 1] 遭遇敵人: Bug 怪物 Lv.5!               │
│ [回合 1] 💡 提示: 弱點是 code-reviewer          │
│                                                  │
│ [回合 2] 你使用了 code-generator!               │
│ [回合 2] 💥 造成 120 傷害!                      │
│ [回合 2] ✨ 有效攻擊!                           │
│                                                  │
│ [回合 3] Bug 怪物 使用了 反擊!                  │
│ [回合 3] ⚡ 消耗 8 MP!                          │
│ [回合 3] 💔 你受到 25 傷害!                     │
│                                                  │
│ [回合 4] 你使用了 code-reviewer!                │
│ [回合 4] 💥 造成 180 傷害!                      │
│ [回合 4] ⭐ 弱點攻擊! 傷害加成 ×1.5!            │
│                                                  │
│ [回合 5] Bug 怪物 被擊敗!                       │
│ [回合 5] 🎉 戰鬥勝利!                           │
│ [回合 5] 💰 獲得 50 金幣                        │
│ [回合 5] ⭐ 獲得 100 EXP                        │
│                                                  │
│ ▼ 自動滾動到最新                                │
└──────────────────────────────────────────────────┘
```

### 緊湊模式
```
┌────────────────────────────────┐
│ [戰鬥日誌]              [▼]    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ [2] 你: code-gen → 120 傷害    │
│ [3] 敵: 反擊 → 你 -25 HP       │
│ [4] 你: code-rev → 180 ⭐      │
│ [5] 🎉 勝利! +50💰 +100⭐      │
└────────────────────────────────┘
```

---

## 屬性定義 (Props)

```typescript
interface BattleLogProps {
  // 日誌數據
  entries: BattleLogEntry[];
  maxEntries?: number;

  // 顯示模式
  variant?: 'full' | 'compact' | 'minimal';

  // 過濾
  filter?: LogFilter;
  showTimestamps?: boolean;
  showTurnNumbers?: boolean;
  showIcons?: boolean;

  // 功能
  autoScroll?: boolean;
  exportable?: boolean;
  clearable?: boolean;
  searchable?: boolean;

  // 動畫
  animateNewEntries?: boolean;
  typewriterEffect?: boolean;

  // 事件
  onEntryClick?: (entry: BattleLogEntry) => void;
  onClear?: () => void;
  onExport?: () => void;
}

interface BattleLogEntry {
  id: string;
  turn: number;
  timestamp: number;
  type: LogEntryType;
  actor: 'player' | 'enemy' | 'system';
  message: string;
  details?: LogDetails;
  color?: string;
  icon?: string;
  important?: boolean;
}

type LogEntryType =
  | 'encounter'      // 遭遇敵人
  | 'player_action'  // 玩家行動
  | 'enemy_action'   // 敵人行動
  | 'damage'         // 傷害
  | 'heal'           // 治療
  | 'buff'           // 增益
  | 'debuff'         // 減益
  | 'effect'         // 效果觸發
  | 'victory'        // 勝利
  | 'defeat'         // 失敗
  | 'system';        // 系統訊息

interface LogDetails {
  damage?: number;
  healing?: number;
  mpCost?: number;
  isWeakHit?: boolean;
  isCritical?: boolean;
  gold?: number;
  exp?: number;
}

interface LogFilter {
  types?: LogEntryType[];
  actors?: ('player' | 'enemy' | 'system')[];
  minTurn?: number;
  maxTurn?: number;
  searchQuery?: string;
}
```

---

## 類型顏色編碼

【參考：01-design-system/colors-and-typography.md】

```typescript
const logTypeColors = {
  encounter: '#FFD700',      // 金色 - 遭遇
  player_action: '#4caf50',  // 綠色 - 玩家行動
  enemy_action: '#f44336',   // 紅色 - 敵人行動
  damage: '#ff9800',         // 橙色 - 傷害
  heal: '#00ff00',           // 亮綠 - 治療
  buff: '#2196f3',           // 藍色 - 增益
  debuff: '#9c27b0',         // 紫色 - 減益
  effect: '#00bcd4',         // 青色 - 效果
  victory: '#4caf50',        // 綠色 - 勝利
  defeat: '#757575',         // 灰色 - 失敗
  system: '#b8b8b8',         // 淺灰 - 系統
};
```

---

## 動畫規格

【參考：01-design-system/animation-timing.md】

### 新條目淡入
```css
@keyframes log-entry-fadein {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.log-entry.new {
  animation: log-entry-fadein 300ms ease-out;
}
```

### 重要訊息閃爍
```css
@keyframes log-entry-highlight {
  0%, 100% {
    background: transparent;
  }
  50% {
    background: rgba(255, 215, 0, 0.3);
  }
}

.log-entry.important {
  animation: log-entry-highlight 500ms ease-out 3;
}
```

### 打字機效果
```typescript
function typewriterEffect(text: string, element: HTMLElement, speed = 20) {
  let index = 0;
  element.textContent = '';

  const interval = setInterval(() => {
    if (index < text.length) {
      element.textContent += text[index];
      index++;
    } else {
      clearInterval(interval);
    }
  }, speed);

  return interval;
}
```

---

## 使用範例

### React 範例
```tsx
import { BattleLog } from '@/components/battle/battle-log';

function BattleScreen() {
  const [logEntries, setLogEntries] = useState<BattleLogEntry[]>([]);

  const addLogEntry = (entry: BattleLogEntry) => {
    setLogEntries(prev => [...prev, entry]);

    // 播放音效
    if (entry.type === 'damage') {
      playSound('damage.wav');
    }
  };

  const handleClearLog = () => {
    if (confirm('確定清空戰鬥日誌？')) {
      setLogEntries([]);
    }
  };

  const handleExportLog = () => {
    const logText = logEntries
      .map(e => `[回合 ${e.turn}] ${e.message}`)
      .join('\n');

    downloadTextFile('battle-log.txt', logText);
  };

  return (
    <div className="battle-screen">
      <BattleLog
        entries={logEntries}
        maxEntries={50}
        variant="full"
        autoScroll={true}
        exportable={true}
        clearable={true}
        animateNewEntries={true}
        showTurnNumbers={true}
        showIcons={true}
        onClear={handleClearLog}
        onExport={handleExportLog}
      />
    </div>
  );
}
```

### 添加日誌條目範例
```typescript
// 玩家攻擊
addLogEntry({
  id: uuid(),
  turn: currentTurn,
  timestamp: Date.now(),
  type: 'player_action',
  actor: 'player',
  message: '你使用了 code-generator!',
  icon: '⚔️',
  color: '#4caf50',
});

// 傷害
addLogEntry({
  id: uuid(),
  turn: currentTurn,
  timestamp: Date.now(),
  type: 'damage',
  actor: 'player',
  message: '造成 120 傷害!',
  details: {
    damage: 120,
    isWeakHit: false,
    isCritical: false,
  },
  icon: '💥',
  color: '#ff9800',
});

// 弱點攻擊
addLogEntry({
  id: uuid(),
  turn: currentTurn,
  timestamp: Date.now(),
  type: 'damage',
  actor: 'player',
  message: '⭐ 弱點攻擊! 傷害加成 ×1.5!',
  details: {
    damage: 180,
    isWeakHit: true,
  },
  icon: '⭐',
  color: '#FFD700',
  important: true,
});

// 勝利
addLogEntry({
  id: uuid(),
  turn: currentTurn,
  timestamp: Date.now(),
  type: 'victory',
  actor: 'system',
  message: '🎉 戰鬥勝利!',
  details: {
    gold: 50,
    exp: 100,
  },
  icon: '🎉',
  color: '#4caf50',
  important: true,
});
```

---

## 無障礙支援

```html
<section
  role="log"
  aria-label="戰鬥日誌"
  aria-live="polite"
  class="battle-log"
>
  <header class="battle-log-header">
    <h2 id="log-title">戰鬥日誌</h2>
    <div class="battle-log-actions">
      <button
        aria-label="清空日誌"
        onClick={handleClear}
      >
        清空
      </button>
      <button
        aria-label="導出日誌"
        onClick={handleExport}
      >
        導出
      </button>
    </div>
  </header>

  <div
    class="battle-log-entries"
    role="list"
  >
    {entries.map(entry => (
      <div
        key={entry.id}
        role="listitem"
        class="log-entry"
        data-type={entry.type}
        aria-label={`回合 ${entry.turn}, ${entry.message}`}
      >
        <span class="log-turn" aria-label="回合">[回合 {entry.turn}]</span>
        <span class="log-icon" aria-hidden="true">{entry.icon}</span>
        <span class="log-message">{entry.message}</span>
      </div>
    ))}
  </div>
</section>
```

---

## 自動滾動實現

```typescript
function AutoScrollLog({ entries }: { entries: BattleLogEntry[] }) {
  const logRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && logRef.current) {
      // 滾動到底部
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [entries, autoScroll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop === clientHeight;

    // 如果用戶向上滾動，禁用自動滾動
    if (!isAtBottom) {
      setAutoScroll(false);
    }
  };

  return (
    <div
      ref={logRef}
      className="battle-log-entries"
      onScroll={handleScroll}
    >
      {entries.map(entry => (
        <LogEntry key={entry.id} entry={entry} />
      ))}

      {!autoScroll && (
        <button
          className="scroll-to-bottom"
          onClick={() => setAutoScroll(true)}
          aria-label="滾動到最新"
        >
          ▼ 最新
        </button>
      )}
    </div>
  );
}
```

---

## 過濾功能

```typescript
function FilteredLog() {
  const [filter, setFilter] = useState<LogFilter>({});

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // 類型過濾
      if (filter.types && !filter.types.includes(entry.type)) {
        return false;
      }

      // 角色過濾
      if (filter.actors && !filter.actors.includes(entry.actor)) {
        return false;
      }

      // 回合過濾
      if (filter.minTurn && entry.turn < filter.minTurn) {
        return false;
      }
      if (filter.maxTurn && entry.turn > filter.maxTurn) {
        return false;
      }

      // 搜尋過濾
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        return entry.message.toLowerCase().includes(query);
      }

      return true;
    });
  }, [entries, filter]);

  return (
    <div>
      <LogFilterControls
        filter={filter}
        onChange={setFilter}
      />
      <BattleLog entries={filteredEntries} />
    </div>
  );
}
```

---

## 導出功能

```typescript
function exportLog(entries: BattleLogEntry[], format: 'txt' | 'json' | 'csv') {
  switch (format) {
    case 'txt':
      const text = entries
        .map(e => `[回合 ${e.turn}] ${e.message}`)
        .join('\n');
      downloadTextFile('battle-log.txt', text);
      break;

    case 'json':
      const json = JSON.stringify(entries, null, 2);
      downloadTextFile('battle-log.json', json);
      break;

    case 'csv':
      const csv = [
        'Turn,Type,Actor,Message',
        ...entries.map(e =>
          `${e.turn},"${e.type}","${e.actor}","${e.message}"`
        ),
      ].join('\n');
      downloadTextFile('battle-log.csv', csv);
      break;
  }
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## 相關組件

- 【參考：04-components/damage-number.md】- 傷害數字
- 【參考：04-components/toast.md】- 浮動通知

---

**版本**: v1.0
**創建日期**: 2026-02-05
**狀態**: ✅ 完成
