# Orchestrator UI Redesign — Requirements

## 核心概念

### 問題陳述

現有 Orchestrator UI 存在嚴重的佈局與體驗問題：

1. **空間浪費**：Coordinator Chat 在 Synthesize 之前完全空白，卻佔了最多空間（flex: 1）
2. **Worker 不可見**：Worker 只顯示 120 字元預覽，無法觀察即時串流輸出
3. **流程不直覺**：使用者不清楚當前所處階段，不知道下一步該做什麼
4. **佈局靜態**：不論 Orchestrator 處於哪個階段，佈局始終相同
5. **缺乏操作回饋**：Dispatch 後沒有視覺進度，Worker 串流無即時呈現

### 解決方案：Phase-Driven Adaptive Layout

UI 隨 Orchestrator 的 **當前階段** 動態調整佈局，將最重要的內容放在最大的區域：

```
Phase         主角區域              次要區域
─────         ────────              ────────
idle          TaskPlanner (全螢幕)   無
dispatching   過渡動畫               無
workers-run   WorkerGrid (全螢幕)    進度條
workers-done  WorkerGrid + CTA       Synthesize 按鈕
synthesizing  Coordinator (左)       Worker 摘要 (右)
complete      最終結果 + Stats        Worker 摘要 (右)
```

## 設計原則

### 1. 階段即佈局（Phase = Layout）

每個 Orchestrator 階段對應一種最佳佈局。使用者不需要自行理解狀態轉移——UI 自動引導。

### 2. Worker 是主角

Orchestrator 的核心價值是平行執行多個 AI 任務。Worker 的即時輸出應該是最大、最明顯的區域，而非 120 字元小卡片。

### 3. Coordinator 延遲出場

Coordinator 只在 Synthesize 階段才需要空間。在此之前，它不應佔用任何畫面。

### 4. 漸進式揭露（Progressive Disclosure）

- idle：只顯示任務規劃
- running：只顯示 Worker 面板
- synthesizing：顯示彙整 + Worker 參考
- 不一次顯示所有元素

### 5. 即時回饋

Worker 串流輸出應即時可見。使用者應能同時觀察所有 Worker 的進度。

---

## Orchestrator 生命週期

### 狀態機

```
                    ┌──────────────────────────────────────────────┐
                    │                                              │
  ┌──────┐  dispatch()  ┌──────────────┐   all started   ┌─────────────────┐
  │ idle │ ────────────→│ dispatching  │ ──────────────→ │ workers-running │
  └──────┘              └──────────────┘                  └────────┬────────┘
                                                                   │
                                                           all workers done
                                                                   │
  ┌──────────┐  synth   ┌──────────────┐                          ▼
  │ complete │←──done── │ synthesizing │ ←── synthesize() ── ┌──────────────────┐
  └──────────┘          └──────────────┘                     │ workers-complete │
                                                              └──────────────────┘
                               │
                       abort() at any stage
                               │
                               ▼
                          ┌─────────┐
                          │  error  │
                          └─────────┘
```

### 資料流

```
  使用者                         Client                          Server
  ─────                         ──────                          ──────
    │                              │                               │
    │  1. 建立 Orchestrator         │  orchestrator:create          │
    │ ────────────────────────────→│──────────────────────────────→│
    │                              │  orchestrator:created          │
    │                              │←──────────────────────────────│
    │                              │                               │
    │  2. Dispatch Tasks           │  orchestrator:dispatch         │
    │ ────────────────────────────→│──────────────────────────────→│
    │                              │  orchestrator:dispatched       │
    │                              │←──────────────────────────────│
    │                              │                               │
    │  3. Workers 平行執行          │  orchestrator:worker-event ×N │
    │     即時串流輸出              │←──────────────────────────────│
    │                              │  orchestrator:worker-complete  │
    │                              │←──────────────────────────────│
    │                              │  orchestrator:all-complete     │
    │                              │←──────────────────────────────│
    │                              │                               │
    │  4. Synthesize               │  orchestrator:synthesize       │
    │ ────────────────────────────→│──────────────────────────────→│
    │     Coordinator 串流          │  chat:event (coordinator)     │
    │                              │←──────────────────────────────│
    │                              │  chat:complete                 │
    │                              │←──────────────────────────────│
    │                              │                               │
    │  5. 完成                      │  orchestrator:status=complete │
    │                              │←──────────────────────────────│
```

---

## 功能需求

### FR-1: 任務規劃（Phase: idle）

- **FR-1.1**: 使用者可新增/刪除多個任務（description + provider 選擇）
- **FR-1.2**: 至少需要 1 個非空任務才能 Dispatch
- **FR-1.3**: 表單佔據全螢幕空間，提供充足的輸入區域
- **FR-1.4**: 清楚顯示目前任務數量和 Dispatch 按鈕

### FR-2: Worker 即時監控（Phase: workers-running）

- **FR-2.1**: 每個 Worker 有獨立的面板顯示完整串流輸出
- **FR-2.2**: Worker 面板自動分割畫面（2 個上下分、3 個 2+1、4 個 2×2）
- **FR-2.3**: 面板可拖拽調整大小
- **FR-2.4**: 每個面板標題顯示：Worker 編號、Provider、Task 摘要、狀態圖示
- **FR-2.5**: 整體進度指示器（e.g. "2/3 Workers Complete"）
- **FR-2.6**: Abort All 按鈕

### FR-3: Worker 結果檢視（Phase: workers-complete）

- **FR-3.1**: 所有 Worker 面板顯示完整結果
- **FR-3.2**: 完成的 Worker 顯示 Stats（cost、duration、tokens）
- **FR-3.3**: 失敗的 Worker 顯示錯誤訊息，視覺上與成功區分
- **FR-3.4**: 顯示明顯的 "Synthesize Results" CTA 按鈕

### FR-4: 彙整結果（Phase: synthesizing / complete）

- **FR-4.1**: Coordinator 輸出佔主要區域（左側或上方）
- **FR-4.2**: Worker 結果摘要列表在側邊作為參考
- **FR-4.3**: Coordinator 串流以 Markdown 即時渲染
- **FR-4.4**: 完成後顯示彙總 Stats（總 cost、總 duration）

### FR-5: 全域操作

- **FR-5.1**: 任何運行中階段都可 Abort
- **FR-5.2**: Error 狀態顯示清楚的錯誤訊息和重試選項
- **FR-5.3**: 頂部顯示目前 Phase 的文字指示

---

## 非功能需求

### NFR-1: 效能

- Worker 串流渲染不超過 15 fps（避免 render thrashing）
- Socket event batching：100-200ms 間隔合併更新
- 4 個以上 Worker 同時串流時仍保持流暢

### NFR-2: 可存取性

- 所有互動元素有適當的 aria-label
- 鍵盤可操作（Tab 切換 Worker 面板、Enter 觸發 Dispatch）
- 螢幕閱讀器可理解目前 Phase

### NFR-3: 響應式

- 最小寬度 800px（桌面為主的工具）
- Worker 面板在窄螢幕時自動從並排改為堆疊

---

## 技術約束

### 不變的部分（Server 端不動）

- Socket.io event protocol 不變
- Orchestrator 狀態機不變
- Worker = ChatSession 的架構不變
- Coordinator 仍透過 `chat:event` / `chat:complete` 串流

### Client 端可以重寫的部分

- 所有 `components/OrchestratorPanel/` 下的元件
- `stores/orchestratorStore.ts` 的結構（interface 可調整）
- 新增依賴（shadcn/ui、react-resizable-panels 等）
- 可放棄現有 OrchestratorPanel 程式碼，完全重寫

### 保留的部分

- `hooks/useOrchestratorSocket.ts`：Socket 連接邏輯可複用
- `stores/orchestratorStore.ts`：核心 state shape 可保留，UI 相關 state 可增減
- xterm.js：已整合的 terminal 元件可用於 Worker 輸出
