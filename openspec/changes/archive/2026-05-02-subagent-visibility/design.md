## Context

CLI 執行 Task tool 時會發出三種 system events：
- `task_started`：subagent 啟動，含 task_type（`local_agent` / `subagent`）、description、tool_use_id
- `task_progress`：subagent 進行中，含 last_tool_name、usage
- `task_notification`：subagent 完成，含 status（completed/failed）、summary、usage

目前 client 只處理了 `task_started`（轉成 `task_started` message 型別顯示），`task_progress` 和 `task_notification` 完全沒有 handler，被丟棄。

Subagent 的訊息（`parent_tool_use_id` 非 null）已正確 nested 到對應 Task tool_use 的 children，由 `SubagentChildren` 渲染。但 `SubagentChildren` 內部用 `MessageNodeList` 而非 `CollapsibleTimeline`，所以 subagent 內部的 tool_use 不會被 group（此問題由 tool-use-grouping 一併解決）。

## Goals / Non-Goals

**Goals:**
- Task tool block header 顯示 subagent 生命週期狀態（running / done / failed）
- Running 時顯示 last_tool_name（來自 task_progress）
- Done 時顯示 summary（來自 task_notification）
- 區分 local_agent 和 subagent 類型（不同 icon/label）
- 依賴 tool-use-grouping：SubagentChildren 改用 CollapsibleTimeline

**Non-Goals:**
- 不顯示 token usage / cost（屬於另一個可見性功能）
- 不處理 task_updated（暫不處理）

## Decisions

### 1. task_progress / task_notification 更新 tool_use meta，而非新增 message

**決定**：新增 `task_progress` 和 `task_notification` handler，找到對應的 tool_use message（透過 tool_use_id），更新其 meta：
```ts
meta.taskStatus: 'running' | 'completed' | 'failed'
meta.lastToolName: string    // task_progress
meta.taskSummary: string     // task_notification
meta.taskType: 'local_agent' | 'subagent'  // task_started
```

**理由**：Task 狀態是 tool_use 的屬性，不是獨立訊息。放在 meta 讓 ToolUseBlock 直接讀取，不需要跨 component 查找。

**捨棄**：新增獨立的 task_status message → 需要 ToolUseBlock 從 sibling messages 反查，複雜度高。

### 2. ToolUseBlock 的 Task header 顯示狀態 badge

**決定**：`ToolUseBlock` 的 Task/Agent tool 在 header 加入狀態 badge：
```
[▶] Task  "分析 protocol.md"  ● Running · Bash
[▶] Task  "分析 protocol.md"  ✓ Done · 找到 3 個問題
[▶] Task  "分析 protocol.md"  ✗ Failed
```
Badge 依 `meta.taskStatus` 決定樣式和文字。

### 3. task_started 的 task_type 存進 tool_use meta

**決定**：`onTaskStarted` handler 除了現有的行為，也更新對應 tool_use 的 meta.taskType，讓 ToolUseBlock 可以用不同 icon 區分 local_agent 和 subagent。

### 4. SubagentChildren 改用 CollapsibleTimeline（依賴 tool-use-grouping）

**決定**：`SubagentChildren` 內部將 `MessageNodeList` 換成 `CollapsibleTimeline`，讓 subagent 內部的 tool_use 也享有 grouping 邏輯。

**注意**：此任務在 tool-use-grouping 的 task 4.1 已列出，兩個 change 不重複實作。

## Risks / Trade-offs

- [Event 順序] task_progress 可能在 tool_use 的 message 尚未建立前到達
  Mitigation：handler 找不到對應 tool_use 時靜默忽略，progress 到後再更新

- [task_started 重複職責] 目前 task_started 同時新增一個 system message 又更新 tool_use meta
  Mitigation：維持現有 system message 行為不變，只額外更新 tool_use meta

## Migration Plan

1. 擴充 `ToolUseMeta` type（新增 taskStatus、taskType、lastToolName、taskSummary）
2. 更新 `onTaskStarted` handler：額外更新 tool_use meta.taskType
3. 新增 `onTaskProgress` handler：更新 tool_use meta.taskStatus + lastToolName
4. 新增 `onTaskNotification` handler：更新 tool_use meta.taskStatus + taskSummary
5. `ToolUseBlock` Task header 加入狀態 badge
6. 新增 Storybook stories（ToolUseBlock + ChatPanel scenario）
