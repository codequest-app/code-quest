## 1. Task State 基礎

- [x] 1.1 `types/task.ts` — 定義 Task interface
- [x] 1.2 `types/chat.ts` — ChannelState 新增 `tasks: Map<string, Task>`
- [x] 1.3 `initialChannelState` 初始化 `tasks: new Map()`

## 2. Task Handler

- [x] 2.1 `handlers/task.ts` — `onTaskStarted`: 建 Task entry in Map
- [x] 2.2 `handlers/task.ts` — `onTaskProgress`: 更新 progressText / lastToolName（僅 local_agent 觸發）
- [x] 2.3 `handlers/task.ts` — `onTaskNotification`: 更新 status / summary / usage
- [x] 2.4 測試：local_bash 生命週期（started → notification，無 progress）
- [x] 2.5 測試：local_agent 生命週期（started → progress × N → notification）
- [x] 2.6 測試：failed / stopped status
- [x] 2.7 測試：無 toolUseId 不建 entry
- [x] 2.8 測試：無 status 的 notification 不更新

## 3. 接入主 Reducer（過渡期：雙寫 Map + block.meta）

- [x] 3.1 `system.ts` task handlers 同時呼叫 taskHandlerOn 寫 Map + 現有 patchToolUseMeta
- [x] 3.2 測試：既有 MessageList/ToolUseBlock tests 驗證 block.meta 仍正確
- [x] 3.3 `ChannelMessagesContext` — state value 暴露 `tasks`
- [x] 3.4 新增 `useTask(toolUseId)` hook

## 4. UI 支援 task prop（為未來遷移準備）

- [x] 4.1 `ToolUseBlock` 接受 optional `task` prop
- [x] 4.2 `TaskBadge` 可從 task prop 讀 status（優先於 block.meta）
- [x] 4.3 `TaskStatusBadge` 支援 `progressText`（local_agent progress detail）
- [x] 4.4 測試：ToolUseBlock with task prop 渲染正確（4 new tests）

## 5. 移除 block.meta 中 task 邏輯 ✅

透過 channel-zustand-migration：zustand store 為唯一 source of truth。
ToolUseBlock 直接從 store 讀 task（useChannelStore selector）。

- [x] 5.1 SpinnerVerb 從 taskStore 讀取 running task 的 progressText
- [x] 5.2 zustand store 取代 useState 為 single source of truth
- [x] 5.3 ToolUseBlock 用 useChannelStore(s => s.tasks.get(toolId)) 讀 task
- [x] 5.4 移除 patchToolUseMeta（函式已刪除）
- [x] 5.5 mergeToolResult 不再 patch block.meta.taskStatus
- [x] 5.6 tool_result auto-complete 移到 message handler（寫 state.tasks）

## 6. Event name 重構 + Server 抽離

Task 是獨立 domain，event name 不應掛在 `system:` prefix。
Server (summoner) 的 task transform 也應從 `transforms/system.ts` 抽出。

### Event rename

| 現在 | 改為 |
|---|---|
| `system:task_started` | `task:started` |
| `system:task_progress` | `task:progress` |
| `system:task_notification` | `task:notification` |

### 涉及的 packages

- `packages/shared/src/socket-events.ts` — event type 定義 + EVENTS 常數
- `packages/shared/src/schemas/system.ts` — payload schemas（搬到 `schemas/task.ts`）
- `apps/summoner/src/claude/transforms/system.ts` — handlers 抽到 `transforms/task.ts`
- `apps/summoner/src/claude/schemas.ts` — raw schema（task subtype）
- `apps/web/src/contexts/channel/handlers/handler-sets.ts` — event key mapping
- `apps/web/src/contexts/channel/handlers/system.ts` — task handler 引用

### Tasks

- [x] 6.1 `packages/shared` — 新增 `task:started/progress/notification` event types + EVENTS.task 常數
- [x] 6.2 `packages/shared` — 搬 task payload schemas 到 `schemas/task.ts`
- [x] 6.3 `apps/summoner` — 抽 `transforms/task.ts`，emit `task:*` events
- [x] 6.4 `apps/web` — handler-sets 註冊 `task:*`，移除 system.ts 中 task 委派
- [x] 6.5 移除舊 `system:task_*` event types（或保留為 alias 做 backward compat）
- [x] 6.6 測試：FakeSummoner segment builders emit 新 event name
- [x] 6.7 全部 tests green

## 7. Bash local_bash 呈現重構

local_bash task 的 ToolUseBlock 呈現問題：
- Title 顯示完整 command → 過長
- Done badge 在 header → 跟 timeline dot 重複
- IN/OUT 沒有 bash syntax highlight
- 沒看到 task_type

### Tasks

- [x] 7.1 BashToolBody IN 套 bash syntax highlight（CodeBlock language="bash"）
- [x] 7.2 BashToolBody OUT 套 bash syntax highlight（CodeBlock language="bash"）
- [x] 7.3 Bash header title：有 `input.description` 用它，否則 bashSummary 截短 command
- [x] 7.4 local_bash task 的 Done/Running badge 移除（交給 timeline dot）
- [x] 7.5 測試：radix-tab-conversation live + history 驗證新呈現
