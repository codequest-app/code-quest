# Orchestrator UI v2 — Chat-First 重設計

## 問題

v1 的 idle 階段直接顯示空白 TaskPlanner 表單，但使用者在沒有任何討論的情況下不知道該填什麼任務。

Coordinator 的 ChatSession 在 Orchestrator 建立時就已存在，後端完全支持 idle 階段的對話，但前端沒有暴露這個能力。

## 業界參考

| 產品 | 模式 | 適合我們？ |
|------|------|-----------|
| Cursor 2.0 | Chat-First + Agent Sidebar | ⚠️ 核心概念對，但多 sidebar 不符合 DQ 單一聚焦 |
| OpenAI Codex | Task Queue + Review Queue | ❌ 沒有對話，直接填 prompt |
| CrewAI Studio | Visual Canvas + Chat | ❌ DAG 視覺化對我們過度設計 |

## 設計決策

採用 **Cursor Chat-First + DQ 單一聚焦的混合體**：

- 從 Cursor 借：idle 階段 = 對話（不是空白表單）
- 從 DQ 借：Phase = 全螢幕切換（不是 sidebar 導航）
- 保留 v1：workers-running / synthesizing / error 階段不變

---

## Phase 對照：v1 vs v2

```
Phase           v1 (現有)                      v2 (Chat-First)
─────           ─────────                      ───────────────
idle            TaskPlanner 全螢幕空白表單      Coordinator Chat 全螢幕
                                               底部 [Plan Tasks] 按鈕
idle+planning   (不存在)                       左右分割：Chat + TaskPlanner
dispatching     過渡動畫                        不變
workers-*       WorkerGrid                     不變
synthesizing    SynthesisView                  不變
complete        SynthesisView                  不變
error           ErrorView                      不變
```

**只改 idle 階段，其他不動。**

---

## idle 階段 UI 設計

### 狀態 A：對話中（預設）

```
┌─────────────────────────────────────────────────────────┐
│ ⚔ Orchestrator                  [Status: Planning]      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   Coordinator (全螢幕 ChatPanel)                         │
│                                                         │
│   You: "我想重構 auth 模組，同時補上測試"                   │
│                                                         │
│   Coordinator: "了解。我建議拆成三個任務：                  │
│     1. 抽取 AuthService — 獨立 service class             │
│     2. 加入 JWT 驗證 — middleware + token 管理            │
│     3. 撰寫測試套件 — unit + integration tests            │
│                                                         │
│     要我幫你出戰嗎？"                                      │
│                                                         │
│   ┌──────────────────────────────────────────────┐      │
│   │ [📋 Plan Tasks]                               │      │
│   └──────────────────────────────────────────────┘      │
│                                                         │
│   ┌──────────────────────────────────────────────┐      │
│   │ Message...                            [Send] │      │
│   └──────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

- 複用現有 `ChatPanel` 元件，傳入 `coordinatorId`
- 底部新增 `[Plan Tasks]` 按鈕，點擊後進入狀態 B
- 使用者也可以跳過對話，直接點 `[Plan Tasks]`

### 狀態 B：任務編輯（點 Plan Tasks 後）

```
┌─────────────────────────────────────────────────────────┐
│ ⚔ Orchestrator                  [Status: Planning]      │
├───────────────────────────┬─────────────────────────────┤
│                           │                             │
│  Coordinator Chat         │  Task Planner               │
│  (對話紀錄，可繼續聊)       │                             │
│                           │  1. [AuthService 重構] Claude│
│  You: "重構 auth..."       │  2. [JWT 驗證]       Gemini │
│                           │  3. [測試套件]       Claude │
│  Coordinator: "建議拆     │  [+ Add Task]               │
│   成三個任務..."            │                             │
│                           │                             │
│  ┌───────────────────┐    │  ┌───────────────────┐      │
│  │ Message... [Send] │    │  │ [⚔ Dispatch 3!]   │      │
│  └───────────────────┘    │  └───────────────────┘      │
│                           │                             │
│  [← Back to Chat]         │                             │
└───────────────────────────┴─────────────────────────────┘
```

- 使用 `react-resizable-panels` 左右分割（50/50）
- 左側：ChatPanel（可繼續對話）
- 右側：TaskPlanner（現有元件）
- 可點 `[← Back to Chat]` 回到狀態 A 全螢幕對話
- Dispatch 後進入 dispatching 階段（不變）

---

## 後端修改

### synthesize() — 保留對話上下文

**現況問題**：`synthesize()` 直接對 coordinator 送一個獨立的合成 prompt，忽略了 idle 階段的對話上下文。但因為 coordinator 是一個持久的 ChatSession，實際上 CLI 的 `--resume` 已經會帶上之前的對話紀錄。所以 `sendMessage()` 送出的合成 prompt 會自然地接續之前的對話。

**結論**：後端 `synthesize()` 不需要修改。coordinator 的對話歷史已經被 ChatSession 自動保留。

---

## 元件架構變更

```diff
 <OrchestratorPage orchestratorId={id}>
 │
 ├── <PhaseHeader status={status} workers={workers} onAbort={abort} />
 │
 ├── status === 'idle'
-│   └── <TaskPlanner onDispatch={dispatch} />
+│   └── <PlanningView
+│         coordinatorId={coordinatorId}
+│         onSend={onSendCoordinator}
+│         onAbort={onAbortCoordinator}
+│         onDispatch={dispatch}
+│       />
+│       ├── showPlanner === false (預設)
+│       │   └── <ChatPanel sessionId={coordinatorId} />
+│       │       底部 [Plan Tasks] 按鈕
+│       │
+│       └── showPlanner === true
+│           ├── <ResizablePanelGroup horizontal>
+│           │   ├── <ChatPanel sessionId={coordinatorId} />
+│           │   └── <TaskPlanner onDispatch={dispatch} />
+│           └── [← Back to Chat]
 │
 ├── status === 'dispatching'      ← 不變
 ├── status === 'workers-*'        ← 不變
 ├── status === 'synthesizing/complete' ← 不變
 └── status === 'error'            ← 不變
```

---

## 修改檔案總覽

| 檔案 | 動作 | 說明 |
|------|------|------|
| `PlanningView.tsx` | **新增** | idle 階段容器：Chat + TaskPlanner 分割 |
| `PlanningView.test.tsx` | **新增** | 測試 Chat → Plan Tasks 切換 |
| `OrchestratorPage.tsx` | **修改** | idle 階段從 TaskPlanner 換成 PlanningView |
| `OrchestratorPage.test.tsx` | **修改** | 更新 idle 階段的測試 |
| `orchestrator.css` | **修改** | 新增 PlanningView 樣式 |
| `PhaseHeader.tsx` | **修改** | idle 狀態文字從 "Plan Your Tasks" 改為 "Planning" |

**不動的檔案**：TaskPlanner、WorkerGrid、WorkerPane、SynthesisView、CoordinatorPanel、ErrorView、StreamOutput、後端所有檔案。

---

## 資料流（v2 新增的部分）

```
  使用者                         Client                          Server
  ─────                         ──────                          ──────
    │                              │                               │
    │  1. 建立 Orchestrator         │  orchestrator:create          │
    │ ────────────────────────────→│──────────────────────────────→│
    │                              │  orchestrator:created          │
    │                              │←──────────────────────────────│
    │                              │                               │
    │  ★ 新增：跟 Coordinator 對話  │  chat:send (coordinatorId)    │
    │ ────────────────────────────→│──────────────────────────────→│
    │     Coordinator 回覆串流      │  chat:event (coordinatorId)   │
    │                              │←──────────────────────────────│
    │     (可多輪對話)               │                               │
    │                              │                               │
    │  2. 點 Plan Tasks            │  (純前端 state 切換)           │
    │  3. 編輯/確認任務             │  (純前端)                     │
    │  4. Dispatch                 │  orchestrator:dispatch         │
    │ ────────────────────────────→│──────────────────────────────→│
    │                              │                               │
    │  (後續流程不變)                │                               │
```

---

## 驗證計畫

```bash
# 1. 型別檢查
pnpm --filter client exec tsc --noEmit

# 2. 單元測試
pnpm --filter client exec vitest run

# 3. Lint
pnpm biome check packages/client/

# 4. 手動測試
# - 建立 Orchestrator → 應顯示 Coordinator Chat
# - 跟 Coordinator 對話 → 應正常串流回覆
# - 點 Plan Tasks → 應顯示左右分割
# - 填入任務 → Dispatch → 應正常進入 workers-running
# - Synthesize → Coordinator 應能接續之前的對話上下文
```
