## 1. Type Extensions

- [ ] 1.1 `ToolUseMeta` 新增欄位：`taskStatus`、`taskType`、`lastToolName`、`taskSummary`

## 2. System Event Handlers

- [ ] 2.1 更新 `onTaskStarted`：額外更新對應 tool_use 的 `meta.taskType` 和 `meta.taskStatus = 'running'`
- [ ] 2.2 新增 `onTaskProgress` handler：更新 tool_use `meta.taskStatus`、`meta.lastToolName`
- [ ] 2.3 新增 `onTaskNotification` handler：更新 tool_use `meta.taskStatus`、`meta.taskSummary`
- [ ] 2.4 `systemHandlerOn` 加入 `task_progress` 和 `task_notification`
- [ ] 2.5 Handler unit tests：用 fakeSummoner replay `task-progress.jsonl` / `task-notification.jsonl` fixture，驗 tool_use meta 更新正確

## 3. ToolUseBlock — Task Status Badge

- [ ] 3.1 `ToolUseBlock` Task/Agent header 加入狀態 badge（running / done / failed）
- [ ] 3.2 Running 狀態顯示 `meta.lastToolName`（有則顯示，無則省略）
- [ ] 3.3 Done 狀態顯示 `meta.taskSummary`（有則顯示，無則省略）
- [ ] 3.4 `taskType` local_agent vs subagent 區分 icon/label

## 4. Stories & Scenarios

- [ ] 4.1 `ToolUseBlock.stories.tsx`：新增 `TaskRunning`、`TaskDone`、`TaskFailed` stories（直接傳入含 taskStatus meta 的 message）
- [ ] 4.2 `ChatPanel.stories.tsx`：新增 `SubagentRunning`、`SubagentDone` scenario stories，用 fakeSummoner replay 組合 fixture（`task-started.jsonl` + `task-progress.jsonl` + `task-notification.jsonl` + subagent messages）
