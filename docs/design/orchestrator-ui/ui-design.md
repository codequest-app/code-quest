# Orchestrator UI Redesign — UI Design

## 設計概覽

核心理念：**Phase-Driven Adaptive Layout** — UI 隨 Orchestrator 階段自動切換最佳佈局。

```
┌────────────────────────────────────────────────┐
│ OrchestratorPage                               │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │ PhaseHeader: 顯示目前階段 + 進度         │  │
│  ├──────────────────────────────────────────┤  │
│  │                                          │  │
│  │  Phase 決定顯示哪個 Layout：              │  │
│  │                                          │  │
│  │  idle          → <TaskPlanner />         │  │
│  │  dispatching   → <DispatchingOverlay />  │  │
│  │  workers-*     → <WorkerGrid />          │  │
│  │  synthesizing  → <SynthesisView />       │  │
│  │  complete      → <SynthesisView />       │  │
│  │  error         → <ErrorView />           │  │
│  │                                          │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

---

## Phase 1: idle — TaskPlanner

全螢幕任務規劃介面。簡潔、聚焦。

```
┌──────────────────────────────────────────────────────────┐
│  ● idle                                                   │
├──────────────────────────────────────────────────────────┤
│                                                           │
│   Plan Your Tasks                                         │
│                                                           │
│   ┌────────────────────────────────────────────────────┐  │
│   │                                                    │  │
│   │  1  ┌──────────────────────────────┐ ┌──────────┐  │  │
│   │     │ Write unit tests for parser  │ │ Claude ▾ │  │  │
│   │     └──────────────────────────────┘ └──────────┘  │  │
│   │                                                    │  │
│   │  2  ┌──────────────────────────────┐ ┌──────────┐  │  │
│   │     │ Write API documentation      │ │ Gemini ▾ │  │  │
│   │     └──────────────────────────────┘ └──────────┘  │  │
│   │                                                    │  │
│   │  3  ┌──────────────────────────────┐ ┌──────────┐  │  │
│   │     │ Refactor error handling      │ │ Claude ▾ │  │  │
│   │     └──────────────────────────────┘ └──────────┘  │  │
│   │                                                    │  │
│   │  [+ Add Task]                                      │  │
│   │                                                    │  │
│   └────────────────────────────────────────────────────┘  │
│                                                           │
│                            ┌──────────────────────────┐   │
│                            │  ▶ Dispatch 3 Tasks      │   │
│                            └──────────────────────────┘   │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**設計要點**：
- 任務列表居中，寬度 max 640px
- 每行：序號 + description input + provider select + 刪除按鈕（hover 顯示）
- Dispatch 按鈕顯示任務數量，強調 CTA
- 空任務不計入 Dispatch 數量

---

## Phase 2: dispatching — 過渡狀態

短暫的過渡，通常 < 1 秒。

```
┌──────────────────────────────────────────────────────────┐
│  ● dispatching                                            │
├──────────────────────────────────────────────────────────┤
│                                                           │
│                                                           │
│                    ⟳ Dispatching...                       │
│                                                           │
│              Creating 3 worker sessions                   │
│                                                           │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Phase 3: workers-running — Worker 監控面板（核心畫面）

參考 tmux / terminal multiplexer 的分割面板思路。使用 `react-resizable-panels` 實現可拖拽分割。

### 2 Workers 佈局：上下分割

```
┌──────────────────────────────────────────────────────────┐
│  ⟳ Workers Running (0/2)                    [■ Abort]    │
├──────────────────────────────────────────────────────────┤
│  Worker 1 · Claude · ⟳ running                           │
│  Task: Write unit tests for parser                       │
│ ─────────────────────────────────────────────────────── │
│  describe('parser', () => {                              │
│    it('should parse claude output', () => {              │
│      const result = parseStream(input);                  │
│      expect(result).toEqual({                            │
│        type: 'text',█                                    │
│                                                          │
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ [drag handle] ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤
│  Worker 2 · Gemini · ⟳ running                           │
│  Task: Write API documentation                           │
│ ─────────────────────────────────────────────────────── │
│  # API Documentation                                     │
│                                                          │
│  ## Endpoints                                            │
│                                                          │
│  ### GET /api/terminals█                                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 3 Workers 佈局：2 + 1 分割

```
┌──────────────────────────────────────────────────────────┐
│  ⟳ Workers Running (1/3)                    [■ Abort]    │
├────────────────────────────┬─────────────────────────────┤
│  Worker 1 · Claude · ✓     │  Worker 2 · Gemini · ⟳      │
│  Task: Write tests         │  Task: Write docs            │
│ ──────────────────────── │ ──────────────────────────── │
│  describe('parser'...      │  # API Documentation         │
│  ✓ 完成                    │  ## Endpoints                │
│  $0.02 · 12s · 3.2k tok   │  ### GET /terminals█         │
│                            │                              │
├────────────────────────────┴─────────────────────────────┤
│  Worker 3 · Claude · ⟳                                    │
│  Task: Refactor error handling                            │
│ ─────────────────────────────────────────────────────── │
│  export class AppError extends Error {                    │
│    constructor(public readonly code: string,█             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 4 Workers 佈局：2×2 Grid

```
┌──────────────────────────────────────────────────────────┐
│  ⟳ Workers Running (0/4)                    [■ Abort]    │
├────────────────────────────┬─────────────────────────────┤
│  Worker 1 · Claude · ⟳     │  Worker 2 · Gemini · ⟳      │
│  Task: Write tests         │  Task: Write docs            │
│ ──────────────────────── │ ──────────────────────────── │
│  describe('parser'...      │  # API Documentation         │
│                            │  ## Endpoints█               │
│                            │                              │
├────────────────────────────┼─────────────────────────────┤
│  Worker 3 · Claude · ⟳     │  Worker 4 · Gemini · ⟳      │
│  Task: Refactor errors     │  Task: Add logging           │
│ ──────────────────────── │ ──────────────────────────── │
│  export class AppError...  │  import { logger }...        │
│                            │                              │
│                            │                              │
└──────────────────────────────────────────────────────────┘
```

### Worker 面板自動分割策略

| Workers 數量 | 佈局 | 說明 |
|:-----------:|:----:|:----:|
| 1 | 全螢幕 | 單一面板 |
| 2 | 上 / 下 | 水平分割 |
| 3 | (上左 + 上右) / 下 | 上方 2 格 + 下方全寬 |
| 4 | 2 × 2 | Grid |
| 5+ | 2 × N | Grid，可捲動 |

### Worker 面板 Header 設計

```
┌──────────────────────────────────────────────────────┐
│  [⟳] Worker 1 · Claude                    $0.02 12s │
│  Task: Write unit tests for parser module            │
├──────────────────────────────────────────────────────┤
│  （串流輸出區域）                                      │
```

狀態圖示：
- `⏳` pending（灰色）
- `⟳` running（藍色，可加 spin 動畫）
- `✓` complete（綠色）
- `✗` error（紅色）

---

## Phase 4: workers-complete — 結果 + Synthesize CTA

Worker 面板保持不變，但加上 Synthesize 呼叫行動：

```
┌──────────────────────────────────────────────────────────┐
│  ✓ All Workers Complete (3/3)                             │
├────────────────────────────┬─────────────────────────────┤
│  Worker 1 · Claude · ✓     │  Worker 2 · Gemini · ✓      │
│  ...完整結果...             │  ...完整結果...              │
├────────────────────────────┴─────────────────────────────┤
│  Worker 3 · Claude · ✓                                    │
│  ...完整結果...                                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   Total: $0.06 · 45s · 12.8k tokens                     │
│                                                          │
│                ┌───────────────────────────────┐          │
│                │  ✦ Synthesize Results          │          │
│                └───────────────────────────────┘          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Phase 5: synthesizing / complete — 彙整結果

佈局切換為左右分割：左側 Coordinator 串流（主角），右側 Worker 摘要（參考）。

```
┌──────────────────────────────────────────────────────────┐
│  ✦ Synthesizing Results...                                │
├──────────────────────────────────────┬───────────────────┤
│  Coordinator                         │  Workers          │
│ ──────────────────────────────────── │ ──────────────── │
│                                      │                   │
│  ## 綜合報告                          │  ✓ W1: 寫測試     │
│                                      │    Claude         │
│  三個任務均已完成：                    │    $0.02 · 12s    │
│                                      │                   │
│  1. **單元測試**：新增 23 個測試案例， │  ✓ W2: 寫文件     │
│     覆蓋率達 85%                      │    Gemini         │
│                                      │    $0.01 · 18s    │
│  2. **API 文件**：完成 5 個 endpoint  │                   │
│     的 OpenAPI spec                   │  ✓ W3: 重構       │
│                                      │    Claude         │
│  3. **Error Handling**：統一使用█     │    $0.03 · 45s    │
│                                      │                   │
│                                      │ ──────────────── │
│                                      │  Total: $0.06    │
│                                      │  Duration: 45s   │
│                                      │                   │
│                                      │  ┌─────────────┐ │
│                                      │  │ View Full    │ │
│                                      │  │ Results      │ │
│                                      │  └─────────────┘ │
├──────────────────────────────────────┴───────────────────┤
│  [可展開] Worker 完整結果                                  │
└──────────────────────────────────────────────────────────┘
```

**設計要點**：
- Coordinator 佔約 70% 寬度
- Worker 摘要側邊欄佔約 30%
- Worker 摘要可點擊展開完整結果（Modal 或展開面板）
- Coordinator 內容以 Markdown 渲染（react-markdown）
- Complete 階段與 Synthesizing 佈局相同，但 header 改為 "Complete"

---

## Phase 6: error — 錯誤狀態

```
┌──────────────────────────────────────────────────────────┐
│  ✗ Error                                                  │
├──────────────────────────────────────────────────────────┤
│                                                           │
│   ┌──────────────────────────────────────────────────┐    │
│   │  ⚠ Orchestration Failed                          │    │
│   │                                                  │    │
│   │  Worker 2 (Gemini) encountered an error:         │    │
│   │  "API rate limit exceeded"                       │    │
│   │                                                  │    │
│   │  ┌────────────┐  ┌──────────────────────┐        │    │
│   │  │ Retry      │  │ Back to Task Planner │        │    │
│   │  └────────────┘  └──────────────────────┘        │    │
│   └──────────────────────────────────────────────────┘    │
│                                                           │
│   Partial Results:                                        │
│   ✓ Worker 1: Write tests (complete, $0.02)              │
│   ✗ Worker 2: Write docs (error)                         │
│   ⟳ Worker 3: Refactor (aborted)                         │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## PhaseHeader 設計

頁面頂部固定的狀態指示器：

```
idle:             ● Plan Your Tasks
dispatching:      ⟳ Dispatching 3 tasks...
workers-running:  ⟳ Workers Running (1/3 complete)
workers-complete: ✓ All Workers Complete (3/3)
synthesizing:     ✦ Synthesizing Results...
complete:         ✦ Complete
error:            ✗ Error
```

進度條（workers-running 階段）：

```
┌──────────────────────────────────────────────────┐
│ ⟳ Workers Running                    2/3 complete │
│ ████████████████████████████░░░░░░░░░░░░░  67%   │
│                                      [■ Abort]   │
└──────────────────────────────────────────────────┘
```

---

## Worker 串流輸出的呈現方式

### 選項 A：xterm.js（Terminal 模式）

- 優點：支援 ANSI color、cursor movement、已有整合
- 缺點：對 Markdown / 純文字內容過度殺傷
- 適用：Worker 輸出包含 CLI 色彩控制碼

### 選項 B：Markdown + Auto-scroll（文字模式）

- 優點：更好的可讀性、支援 code block syntax highlighting
- 缺點：需要自行處理串流 Markdown 渲染
- 適用：Worker 輸出主要是結構化文字

### 建議：混合模式

- Worker 串流預設用 **純文字 + 自動捲動**（`<pre>` with auto-scroll）
- Coordinator Synthesize 用 **Markdown 渲染**（react-markdown）
- 未來可加 toggle 切換模式

---

## 色彩系統

基於現有深色主題延伸：

| 元素 | 色彩 | 用途 |
|------|------|------|
| Background | `#1e1e1e` | 頁面背景 |
| Panel | `#2d2d30` | Worker 面板、卡片 |
| Border | `#3e3e42` | 面板分隔線 |
| Text Primary | `#d4d4d4` | 主要文字 |
| Text Secondary | `#808080` | 次要文字 |
| Accent Blue | `#569cd6` | Running 狀態、連結 |
| Accent Green | `#4ec9b0` | Complete 狀態、成功 |
| Accent Red | `#f44747` | Error 狀態、失敗 |
| Accent Gold | `#dcdcaa` | Synthesize 主題色 |
| CTA Button | `#0e639c` | 主要按鈕 |

---

## 動畫與過渡

- Phase 切換：fade + slide 過渡（200ms）
- Worker 面板出現：stagger 動畫（每個面板延遲 50ms）
- Synthesize 按鈕：pulse 動畫吸引注意
- 串流文字：無動畫，直接 append（效能優先）
