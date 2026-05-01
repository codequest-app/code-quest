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
