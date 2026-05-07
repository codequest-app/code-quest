## 1. Type Extensions

- [x] 1.1 `ToolUseMeta` 新增欄位：`taskStatus`、`taskType`、`lastToolName`、`taskSummary`

## 2. System Event Handlers

- [x] 2.1 更新 `onTaskStarted`：額外更新對應 tool_use 的 `meta.taskType` 和 `meta.taskStatus = 'running'`
- [x] 2.2 新增 `onTaskProgress` handler：更新 tool_use `meta.taskStatus`、`meta.lastToolName`
- [x] 2.3 新增 `onTaskNotification` handler：更新 tool_use `meta.taskStatus`、`meta.taskSummary`
- [x] 2.4 `systemHandlerOn` 加入 `task_progress` 和 `task_notification`
- [x] 2.5 Handler unit tests：直接測試 handler 函式的 state 轉換（onTaskStarted、onTaskProgress、onTaskNotification）

## 3. ToolUseBlock — Task Status Badge

- [x] 3.1 `ToolUseBlock` Task/Agent header 加入狀態 badge（running / done / failed）
- [x] 3.2 Running 狀態顯示 `meta.lastToolName`（有則顯示，無則省略）
- [x] 3.3 Done 狀態顯示 `meta.taskSummary`（有則顯示，無則省略）
- [x] 3.4 `taskType` local_agent vs subagent 區分 icon/label

## 4. Stories & Scenarios

- [x] 4.1 `ToolUseBlock.stories.tsx`：新增 `TaskRunning`、`TaskDone`、`TaskFailed` stories（直接傳入含 taskStatus meta 的 message）
- [x] 4.2 `ChatPanel.stories.tsx`：新增 `SubagentRunning`、`SubagentDone` scenario stories，用靜態 fixture messages（含 taskStatus meta）

## 5. subagent_type 顯示

- [x] 5.1 `ToolUseBlock` Task/Agent header 加入 `subagent_type` badge（來自 `meta.input.subagent_type`）
- [x] 5.2 更新 `makeSubagentRunning` / `makeSubagentDone` story fixtures：input 加入 `subagent_type`
- [x] 5.3 `ToolUseBlock.stories.tsx`：更新 `TaskRunning`、`TaskDone` stories 以顯示 subagent_type

## 6. model 欄位流過 pipeline

- [x] 6.1 `toolUseBlockSchema`（shared）新增 `model?: string`
- [x] 6.2 `toolUseMetaSchema`（shared）新增 `model?: string`
- [x] 6.3 `transformAssistant`：把 `message.model` 注入每個 tool_use block
- [x] 6.4 `applyToolUseBlock`（streaming.ts）：把 `block.model` 存入 `meta.model`
- [x] 6.5 `SubagentChildren`：新增 `model?: string` prop，header 顯示 model
- [x] 6.6 `CollapsibleTimeline` / `MessageNodeList`：把 `node.message.meta.model` 傳給 `SubagentChildren`
- [x] 6.7 更新 `makeSubagentRunning` / `makeSubagentDone` story fixtures：meta 加入 `model`
- [x] 6.8 TDD：`MessageList.test.tsx` 新增 integration test 驗 model 顯示

## 7. task_notification usage 進入 toolUseMeta

- [x] 7.1 `toolUseMetaSchema`（shared）新增 `taskUsage?: Record<string, unknown>`
- [x] 7.2 `onTaskNotification` handler：把 `usage` 存入 `meta.taskUsage`
- [x] 7.3 `TaskStatusBadge` Done 狀態顯示 token count（來自 `taskUsage`）
- [x] 7.4 更新 `makeSubagentDone` story fixtures：meta 加入 `taskUsage`
- [x] 7.5 TDD：`MessageList.test.tsx` 新增 integration test 驗 usage 顯示
