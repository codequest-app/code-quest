# Error Handling Screen - 錯誤處理畫面

**分類**: Event & Modal Screens
**類型**: Error & Warning Modal
**優先級**: Critical
**最後更新**: 2026-02-05

---

## 概述

錯誤處理畫面是當系統發生錯誤、工具執行失敗或遇到異常情況時顯示的模態視窗。在 RPG 化設計中，錯誤被轉化為「技能反噬」或「魔法失控」，以遊戲化的方式呈現技術問題。

### 錯誤來源

- **API 錯誤**: 外部 API 調用失敗
- **工具錯誤**: 工具執行異常（Read、Write、Bash 等）
- **系統錯誤**: 記憶體不足、權限錯誤等
- **編譯錯誤**: 代碼語法錯誤
- **網路錯誤**: 連線超時、DNS 失敗
- **驗證錯誤**: 輸入驗證失敗

---

## ASCII 佈局設計

### 一般錯誤（Error 級別）

```
┌────────────────────────────────────────────────────────────────────────┐
│                      【戰鬥畫面 - 50% 不透明度】                         │
│                                                                        │
│    ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    │
│    ┃  ⚠️ 技能反噬！                            [ESC] 關閉 ┃    │
│    ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫    │
│    ┃                                                              ┃    │
│    ┃  💔 施法失敗，魔法反彈造成傷害！                             ┃    │
│    ┃                                                              ┃    │
│    ┃  ╔═══════════════════════════════════════════════════════╗  ┃    │
│    ┃  ║  🔥 錯誤詳情                                          ║  ┃    │
│    ┃  ╠═══════════════════════════════════════════════════════╣  ┃    │
│    ┃  ║                                                       ║  ┃    │
│    ┃  ║  錯誤類型: Tool Execution Error                      ║  ┃    │
│    ┃  ║  發生時間: 2026-02-05 15:32:45                       ║  ┃    │
│    ┃  ║                                                       ║  ┃    │
│    ┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃    │
│    ┃  ║  │ 錯誤訊息:                                      │ ║  ┃    │
│    ┃  ║  │ ────────────────────────────────────────────  │ ║  ┃    │
│    ┃  ║  │ Failed to read file: auth.ts                  │ ║  ┃    │
│    ┃  ║  │ Error: ENOENT: no such file or directory      │ ║  ┃    │
│    ┃  ║  │                                                │ ║  ┃    │
│    ┃  ║  │ 檔案路徑:                                      │ ║  ┃    │
│    ┃  ║  │ /src/services/auth.ts                         │ ║  ┃    │
│    ┃  ║  └────────────────────────────────────────────────┘ ║  ┃    │
│    ┃  ║                                                       ║  ┃    │
│    ┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃    │
│    ┃  ║  │ 💔 反噬傷害: -15 HP                           │ ║  ┃    │
│    ┃  ║  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ ║  ┃    │
│    ┃  ║  │ 當前 HP: 85 → 70                              │ ║  ┃    │
│    ┃  ║  │ ████████████████░░░░ 70/100                   │ ║  ┃    │
│    ┃  ║  └────────────────────────────────────────────────┘ ║  ┃    │
│    ┃  ║                                                       ║  ┃    │
│    ┃  ║  ► 展開堆棧追蹤                                      ║  ┃    │
│    ┃  ║                                                       ║  ┃    │
│    ┃  ╚═══════════════════════════════════════════════════════╝  ┃    │
│    ┃                                                              ┃    │
│    ┃  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       ┃    │
│    ┃  │ [🔄] 重試     │ │ [📋] 查看日誌 │ │ [❌] 取消     │       ┃    │
│    ┃  │    -5 MP     │ │              │ │              │       ┃    │
│    ┃  └──────────────┘ └──────────────┘ └──────────────┘       ┃    │
│    ┃                                                              ┃    │
│    ┃  ┌────────────────────────────────────────────────────┐    ┃    │
│    ┃  │ [📋 複製錯誤訊息]  [🐛 回報問題]                   │    ┃    │
│    ┃  └────────────────────────────────────────────────────┘    ┃    │
│    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 致命錯誤（Fatal 級別）

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🔴 魔法失控 - 致命錯誤！                  [ESC] 關閉 ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                              ┃
┃  💀 致命魔法事故！系統需要重新啟動...                        ┃
┃                                                              ┃
┃  ╔═══════════════════════════════════════════════════════╗  ┃
┃  ║  💀 致命錯誤                                          ║  ┃
┃  ╠═══════════════════════════════════════════════════════╣  ┃
┃  ║                                                       ║  ┃
┃  ║  錯誤類型: System Fatal Error                        ║  ┃
┃  ║  嚴重程度: 🔴🔴🔴 致命                               ║  ┃
┃  ║                                                       ║  ┃
┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃
┃  ║  │ 錯誤訊息:                                      │ ║  ┃
┃  ║  │ ────────────────────────────────────────────  │ ║  ┃
┃  ║  │ Unhandled Exception: Out of Memory            │ ║  ┃
┃  ║  │                                                │ ║  ┃
┃  ║  │ The application has run out of available      │ ║  ┃
┃  ║  │ memory and cannot continue.                   │ ║  ┃
┃  ║  │                                                │ ║  ┃
┃  ║  │ Memory Usage: 15.8 GB / 16.0 GB (99%)         │ ║  ┃
┃  ║  └────────────────────────────────────────────────┘ ║  ┃
┃  ║                                                       ║  ┃
┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃
┃  ║  │ 💀 生命值歸零！                               │ ║  ┃
┃  ║  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ ║  ┃
┃  ║  │ HP: 70 → 0                                    │ ║  ┃
┃  ║  │ ░░░░░░░░░░░░░░░░░░░░ 0/100                   │ ║  ┃
┃  ║  │                                                │ ║  ┃
┃  ║  │ ⚠️ 系統需要重新啟動                          │ ║  ┃
┃  ║  └────────────────────────────────────────────────┘ ║  ┃
┃  ║                                                       ║  ┃
┃  ║  已自動保存進度到：                                  ║  ┃
┃  ║  ~/.cc-office/autosave/session-20260205-153245       ║  ┃
┃  ║                                                       ║  ┃
┃  ╚═══════════════════════════════════════════════════════╝  ┃
┃                                                              ┃
┃  ┌───────────────────┐  ┌───────────────────┐              ┃
┃  │ [🔄] 重新啟動      │  │ [📋] 查看崩潰日誌  │              ┃
┃  └───────────────────┘  └───────────────────┘              ┃
┃                                                              ┃
┃  ┌────────────────────────────────────────────────────┐    ┃
┃  │ [📋 複製錯誤訊息]  [🐛 回報崩潰]                   │    ┃
┃  └────────────────────────────────────────────────────┘    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### 警告（Warning 級別）

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🟡 魔法不穩定                            [ESC] 關閉 ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                              ┃
┃  ⚡ 魔法波動偵測！建議謹慎處理...                            ┃
┃                                                              ┃
┃  ╔═══════════════════════════════════════════════════════╗  ┃
┃  ║  ⚡ 警告訊息                                          ║  ┃
┃  ╠═══════════════════════════════════════════════════════╣  ┃
┃  ║                                                       ║  ┃
┃  ║  警告類型: Deprecated API Usage                      ║  ┃
┃  ║  嚴重程度: 🟡 中等                                   ║  ┃
┃  ║                                                       ║  ┃
┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃
┃  ║  │ 警告內容:                                      │ ║  ┃
┃  ║  │ ────────────────────────────────────────────  │ ║  ┃
┃  ║  │ Using deprecated method: getUserById()        │ ║  ┃
┃  ║  │                                                │ ║  ┃
┃  ║  │ This method will be removed in version 3.0    │ ║  ┃
┃  ║  │ Please use: getUserByIdentifier() instead     │ ║  ┃
┃  ║  │                                                │ ║  ┃
┃  ║  │ 檔案: src/services/user.service.ts            │ ║  ┃
┃  ║  │ 行號: 42                                       │ ║  ┃
┃  ║  └────────────────────────────────────────────────┘ ║  ┃
┃  ║                                                       ║  ┃
┃  ║  💡 建議修正:                                        ║  ┃
┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃
┃  ║  │ - getUserById(id)                              │ ║  ┃
┃  ║  │ + getUserByIdentifier(id)                      │ ║  ┃
┃  ║  └────────────────────────────────────────────────┘ ║  ┃
┃  ║                                                       ║  ┃
┃  ╚═══════════════════════════════════════════════════════╝  ┃
┃                                                              ┃
┃  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       ┃
┃  │ [✅] 繼續執行 │ │ [🔧] 立即修正 │ │ [❌] 取消     │       ┃
┃  └──────────────┘ └──────────────┘ └──────────────┘       ┃
┃                                                              ┃
┃  [ ] 不再顯示此警告                                         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### 資訊（Info 級別）

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ℹ️ 魔法提示                              [ESC] 關閉 ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                              ┃
┃  📘 有用的資訊供你參考...                                    ┃
┃                                                              ┃
┃  ╔═══════════════════════════════════════════════════════╗  ┃
┃  ║  📘 資訊通知                                          ║  ┃
┃  ╠═══════════════════════════════════════════════════════╣  ┃
┃  ║                                                       ║  ┃
┃  ║  訊息類型: Performance Hint                          ║  ┃
┃  ║                                                       ║  ┃
┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃
┃  ║  │ 效能提示:                                      │ ║  ┃
┃  ║  │ ────────────────────────────────────────────  │ ║  ┃
┃  ║  │ 偵測到大型檔案處理 (2.5 MB)                   │ ║  ┃
┃  ║  │                                                │ ║  ┃
┃  ║  │ 建議使用串流處理以提升效能：                   │ ║  ┃
┃  ║  │ • 減少記憶體使用                               │ ║  ┃
┃  ║  │ • 加快處理速度                                 │ ║  ┃
┃  ║  │ • 避免系統卡頓                                 │ ║  ┃
┃  ║  └────────────────────────────────────────────────┘ ║  ┃
┃  ║                                                       ║  ┃
┃  ║  📖 相關文檔:                                        ║  ┃
┃  ║  docs/best-practices/file-handling.md                ║  ┃
┃  ║                                                       ║  ┃
┃  ╚═══════════════════════════════════════════════════════╝  ┃
┃                                                              ┃
┃  ┌──────────────┐ ┌──────────────┐                         ┃
┃  │ [✅] 知道了   │ │ [📖] 查看文檔 │                         ┃
┃  └──────────────┘ └──────────────┘                         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### 展開的堆棧追蹤

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ⚠️ 技能反噬！                            [ESC] 關閉 ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                              ┃
┃  ╔═══════════════════════════════════════════════════════╗  ┃
┃  ║  🔥 錯誤詳情                                          ║  ┃
┃  ╠═══════════════════════════════════════════════════════╣  ┃
┃  ║                                                       ║  ┃
┃  ║  錯誤類型: TypeError                                 ║  ┃
┃  ║  發生時間: 2026-02-05 15:32:45                       ║  ┃
┃  ║                                                       ║  ┃
┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃
┃  ║  │ 錯誤訊息:                                      │ ║  ┃
┃  ║  │ ────────────────────────────────────────────  │ ║  ┃
┃  ║  │ Cannot read property 'name' of undefined      │ ║  ┃
┃  ║  │                                                │ ║  ┃
┃  ║  │ at UserService.getUserName (user.service.ts:  │ ║  ┃
┃  ║  │ 42:18)                                         │ ║  ┃
┃  ║  └────────────────────────────────────────────────┘ ║  ┃
┃  ║                                                       ║  ┃
┃  ║  ▼ 堆棧追蹤 (點擊收合)                               ║  ┃
┃  ║  ┌────────────────────────────────────────────────┐ ║  ┃
┃  ║  │ at UserService.getUserName                     │ ║  ┃
┃  ║  │   (src/services/user.service.ts:42:18)         │ ║  ┃
┃  ║  │                                                │ ║  ┃
┃  ║  │ at AuthController.login                        │ ║  ┃
┃  ║  │   (src/controllers/auth.controller.ts:28:35)   │ ║  ┃
┃  ║  │                                                │ ║  ┃
┃  ║  │ at Layer.handle [as handle_request]           │ ║  ┃
┃  ║  │   (node_modules/express/lib/router/layer.js:   │ ║  ┃
┃  ║  │   95:5)                                        │ ║  ┃
┃  ║  │                                                │ ║  ┃
┃  ║  │ at next                                        │ ║  ┃
┃  ║  │   (node_modules/express/lib/router/route.js:   │ ║  ┃
┃  ║  │   144:13)                                      │ ║  ┃
┃  ║  │                                                │ ║  ┃
┃  ║  │ [📋 複製完整堆棧]                              │ ║  ┃
┃  ║  └────────────────────────────────────────────────┘ ║  ┃
┃  ║                                                       ║  ┃
┃  ╚═══════════════════════════════════════════════════════╝  ┃
┃                                                              ┃
┃  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       ┃
┃  │ [🔄] 重試     │ │ [📋] 查看日誌 │ │ [❌] 取消     │       ┃
┃  └──────────────┘ └──────────────┘ └──────────────┘       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 組件規格

### Error Modal

【參考：04-components/modal.md】

**屬性**:
- 背景遮罩: 50% 不透明黑色
- 焦點陷阱: 啟用
- ESC 關閉: 啟用
- 點擊外部關閉: 根據嚴重程度（Fatal 禁用，其他啟用）
- Z-index: 2500（高於一般 modal）

### Error Severity Levels

```typescript
enum ErrorSeverity {
  Info = 'info',       // 藍色，資訊性訊息
  Warning = 'warning', // 黃色，警告但可繼續
  Error = 'error',     // 橙色，錯誤需處理
  Fatal = 'fatal'      // 紅色，致命錯誤需重啟
}

interface ErrorDetails {
  severity: ErrorSeverity;
  type: string;              // 錯誤類型
  message: string;           // 錯誤訊息
  timestamp: Date;           // 發生時間
  file?: string;             // 相關檔案
  line?: number;             // 行號
  stackTrace?: string;       // 堆棧追蹤
  suggestion?: string;       // 修正建議
  documentation?: string;    // 相關文檔連結
  hpDamage?: number;         // HP 傷害（RPG 化）
}
```

### Severity Color Scheme

```css
/* 嚴重程度顏色 */
.severity-info {
  border-top: 4px solid #2196F3;  /* 藍色 */
  --icon: 'ℹ️';
}

.severity-warning {
  border-top: 4px solid #FFC107;  /* 黃色 */
  --icon: '🟡';
}

.severity-error {
  border-top: 4px solid #FF9800;  /* 橙色 */
  --icon: '⚠️';
}

.severity-fatal {
  border-top: 4px solid #F44336;  /* 紅色 */
  --icon: '🔴';
  animation: pulse-red 1s infinite;
}

@keyframes pulse-red {
  0%, 100% { border-top-color: #F44336; }
  50% { border-top-color: #D32F2F; }
}
```

### HP Damage Display

【參考：04-components/progress-bar.md】

```typescript
// HP 傷害計算
function calculateHPDamage(severity: ErrorSeverity): number {
  const damageMap = {
    info: 0,      // 資訊不造成傷害
    warning: 5,   // 警告造成 5 HP 傷害
    error: 15,    // 錯誤造成 15 HP 傷害
    fatal: 100    // 致命錯誤直接清空 HP
  };
  return damageMap[severity];
}
```

### Stack Trace Component

```typescript
interface StackTraceProps {
  trace: string;
  expanded: boolean;
  onToggle: () => void;
}

// 堆棧追蹤解析
function parseStackTrace(trace: string): StackFrame[] {
  // 解析堆棧追蹤字串
  // 提取檔案路徑、行號、函數名稱
  return frames;
}
```

---

## 狀態管理

### Error State

```typescript
interface ErrorState {
  isActive: boolean;
  error: ErrorDetails;
  stackExpanded: boolean;
  canRetry: boolean;
  retryCount: number;
  maxRetries: number;
}
```

### Error Queue

```typescript
// 錯誤佇列管理
class ErrorQueue {
  private queue: ErrorDetails[] = [];
  private displaying: ErrorDetails | null = null;

  enqueue(error: ErrorDetails) {
    // 相同錯誤去重
    if (!this.isDuplicate(error)) {
      this.queue.push(error);
      this.displayNext();
    }
  }

  displayNext() {
    if (!this.displaying && this.queue.length > 0) {
      this.displaying = this.queue.shift();
      // 顯示錯誤 modal
    }
  }
}
```

### Auto-recovery

```typescript
// 自動恢復機制
interface RecoveryStrategy {
  canRecover: boolean;
  recoveryAction: () => Promise<void>;
  fallbackAction?: () => Promise<void>;
}

async function attemptRecovery(error: ErrorDetails): Promise<boolean> {
  const strategy = getRecoveryStrategy(error);

  if (strategy.canRecover) {
    try {
      await strategy.recoveryAction();
      return true;
    } catch {
      if (strategy.fallbackAction) {
        await strategy.fallbackAction();
      }
    }
  }

  return false;
}
```

---

## 互動設計

### 鍵盤操作

| 按鍵 | 功能 |
|------|------|
| `Enter` | 執行主要動作（重試） |
| `Esc` | 關閉錯誤 modal |
| `Ctrl+C` | 複製錯誤訊息到剪貼簿 |
| `Ctrl+L` | 查看完整日誌 |
| `Ctrl+R` | 重試操作 |
| `Space` | 展開/收合堆棧追蹤 |
| `Tab` | 在按鈕間切換焦點 |

### 滑鼠操作

- **點擊「展開堆棧追蹤」**: 展開/收合詳細資訊
- **點擊「複製錯誤訊息」**: 複製到剪貼簿並顯示提示
- **點擊「重試」**: 重新執行失敗的操作
- **點擊「查看日誌」**: 開啟日誌檔案
- **點擊「回報問題」**: 開啟 GitHub Issues 頁面

### 觸控手勢

- **點擊任意按鈕**: 執行對應動作
- **長按錯誤訊息**: 顯示複製選單
- **向下滑動**: 關閉 modal（非 Fatal 級別）

---

## 動畫效果

### 入場動畫

【參考：01-design-system/animation-timing.md】

```
0.0s  ├─ 背景遮罩淡入 (300ms)
0.1s  ├─ Modal 震動進入 (shake, 400ms)
0.3s  ├─ 錯誤圖標脈衝 (pulse, 300ms)
0.4s  ├─ 錯誤內容淡入 (200ms)
0.5s  ├─ HP 傷害動畫 (500ms)
0.8s  └─ 按鈕滑入 (200ms)
```

### HP 傷害動畫

```typescript
// HP 條閃爍紅色並減少
const hpDamageAnimation = {
  // 閃爍效果
  flash: {
    backgroundColor: ['#4CAF50', '#F44336', '#4CAF50'],
    duration: 300,
    times: [0, 0.5, 1]
  },
  // HP 條減少
  decrease: {
    width: `${(currentHP - damage) / maxHP * 100}%`,
    duration: 500,
    ease: 'easeOut'
  }
}
```

### 震動效果（嚴重錯誤）

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.error-modal.severe {
  animation: shake 0.5s;
}
```

### 堆棧追蹤展開/收合

```typescript
const stackTraceAnimation = {
  expand: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  collapse: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' }
  }
}
```

---

## 戰鬥畫面整合

### 錯誤觸發時

```
戰鬥畫面:
- 暫停戰鬥動畫
- 顯示紅色閃光效果（嚴重錯誤）
- 玩家角色顯示「受傷」動畫
- HP 條減少（帶閃爍效果）
- 顯示「-X HP」飄字動畫
- 背景音樂降低音量
- 播放「受傷」音效
```

### 錯誤關閉後

**重試**:
```
戰鬥畫面:
- 恢復戰鬥動畫
- 玩家使用「治癒術」（花費 5 MP）
- 重新執行之前的操作
- 戰鬥日誌更新：「使用治癒術重試！」
```

**取消**:
```
戰鬥畫面:
- 取消當前行動
- 返回行動選單
- 戰鬥日誌更新：「放棄當前操作」
- HP 保持在受傷狀態
```

**致命錯誤**:
```
戰鬥畫面:
- HP 歸零
- 顯示「戰敗」動畫
- 自動保存進度
- 提示重新啟動
```

---

## 無障礙設計

### 螢幕閱讀器

```html
<div role="alertdialog"
     aria-labelledby="error-title"
     aria-describedby="error-description"
     aria-modal="true">

  <h2 id="error-title">
    <span aria-label="錯誤嚴重程度：嚴重">⚠️</span>
    技能反噬
  </h2>

  <div id="error-description">
    <p>施法失敗，魔法反彈造成傷害</p>

    <section aria-label="錯誤詳情">
      <h3>錯誤類型：工具執行錯誤</h3>
      <p>Failed to read file: auth.ts</p>
      <p>Error: ENOENT: no such file or directory</p>
    </section>

    <section aria-label="生命值變化">
      <p>反噬傷害：減少 15 點生命值</p>
      <p>當前生命值：從 85 降至 70</p>
      <div role="progressbar"
           aria-valuenow="70"
           aria-valuemin="0"
           aria-valuemax="100"
           aria-label="生命值：70 / 100">
      </div>
    </section>
  </div>

  <nav aria-label="錯誤處理選項">
    <button aria-label="重試操作，消耗 5 點魔力">重試</button>
    <button aria-label="查看詳細日誌">查看日誌</button>
    <button aria-label="取消操作">取消</button>
  </nav>
</div>
```

### 錯誤嚴重程度語音提示

```typescript
const severityAnnouncements = {
  info: '資訊通知',
  warning: '警告訊息，請注意',
  error: '錯誤發生，需要處理',
  fatal: '致命錯誤，系統需要重新啟動'
};

function announceError(error: ErrorDetails) {
  const announcement = `
    ${severityAnnouncements[error.severity]}。
    ${error.type}。
    ${error.message}
  `;

  // 使用 aria-live 區域宣告
  ariaLiveRegion.textContent = announcement;
}
```

### 顏色對比

- 錯誤文字與背景對比度 ≥ 4.5:1
- 按鈕與背景對比度 ≥ 3:1
- 除了顏色外，還使用圖標和文字標籤區分嚴重程度

---

## 響應式設計

### 桌面版 (≥ 1024px)

```
Modal 寬度: 700px
堆棧追蹤: 完整顯示，可滾動
按鈕: 水平排列
字體大小: 16px
```

### 平板版 (768px - 1023px)

```
Modal 寬度: 85vw
堆棧追蹤: 摺疊顯示，點擊展開
按鈕間距: 增大
字體大小: 17px
```

### 手機版 (< 768px)

```
Modal 寬度: 95vw
Modal 高度: 最大 80vh
堆棧追蹤: 簡化顯示，僅顯示前 3 行
按鈕: 垂直堆疊
字體大小: 18px
錯誤訊息: 可水平滾動（避免超出）
```

---

## 實作注意事項

### 錯誤去重

```typescript
function isDuplicateError(
  error: ErrorDetails,
  existingErrors: ErrorDetails[]
): boolean {
  return existingErrors.some(existing =>
    existing.type === error.type &&
    existing.message === error.message &&
    (Date.now() - existing.timestamp.getTime()) < 5000 // 5秒內的相同錯誤
  );
}
```

### 錯誤日誌記錄

```typescript
interface ErrorLog {
  timestamp: Date;
  severity: ErrorSeverity;
  type: string;
  message: string;
  stackTrace?: string;
  context: {
    userAction: string;
    battleState: any;
    systemInfo: any;
  };
}

function logError(error: ErrorDetails, context: any) {
  const log: ErrorLog = {
    timestamp: new Date(),
    severity: error.severity,
    type: error.type,
    message: error.message,
    stackTrace: error.stackTrace,
    context
  };

  // 寫入日誌檔案
  writeToLogFile(log);

  // 上傳到錯誤追蹤服務（如 Sentry）
  if (error.severity === 'fatal' || error.severity === 'error') {
    uploadToErrorTracking(log);
  }
}
```

### 自動重試邏輯

```typescript
async function retryWithBackoff(
  operation: () => Promise<any>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<any> {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      attempt++;

      if (attempt >= maxRetries) {
        throw error;
      }

      // 指數退避
      const delay = initialDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
}
```

### 錯誤回報功能

```typescript
function generateErrorReport(error: ErrorDetails): string {
  return `
## 錯誤回報

**錯誤類型**: ${error.type}
**嚴重程度**: ${error.severity}
**發生時間**: ${error.timestamp.toISOString()}

### 錯誤訊息
\`\`\`
${error.message}
\`\`\`

### 堆棧追蹤
\`\`\`
${error.stackTrace || 'N/A'}
\`\`\`

### 系統資訊
- OS: ${navigator.platform}
- Browser: ${navigator.userAgent}
- Version: ${APP_VERSION}

### 相關檔案
${error.file ? `- ${error.file}:${error.line}` : 'N/A'}
  `.trim();
}

function reportError(error: ErrorDetails) {
  const report = generateErrorReport(error);
  const issueUrl = `https://github.com/your-repo/issues/new?body=${encodeURIComponent(report)}`;
  window.open(issueUrl, '_blank');
}
```

---

## 相關畫面連結

- **User Question**: `02-screens/events/user-question.md`
- **Permission Request**: `02-screens/events/permission-request.md`
- **Battle Log**: `02-screens/battle/battle-log.md`
- **Modal Component**: `04-components/modal.md`
- **Progress Bar**: `04-components/progress-bar.md`
- **Animation Timing**: `01-design-system/animation-timing.md`

---

## 設計決策記錄

### 為什麼錯誤要造成 HP 傷害？

將錯誤視為「技能反噬」增加了系統的遊戲化元素，讓錯誤處理變得更有趣，同時也提醒使用者錯誤的嚴重性。

### 為什麼 Fatal 錯誤不能點擊外部關閉？

致命錯誤需要使用者明確處理（重啟或查看日誌），防止忽略嚴重問題。

### 為什麼需要錯誤去重？

避免相同錯誤反覆彈出，降低使用者的干擾和煩躁感。

### 為什麼要顯示堆棧追蹤？

堆棧追蹤對開發者診斷問題至關重要，但預設收合以避免嚇到非技術使用者。

---

**最後更新**: 2026-02-05
**作者**: UI Design Team
**版本**: 1.0
