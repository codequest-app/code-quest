## Why

當 Claude 啟動 subagent (Task tool) 時，使用者完全看不到：
- Subagent 是否還在執行
- Subagent 現在在做什麼（last_tool_name）
- Subagent 完成了沒有、結果摘要是什麼

原因是 `task_progress` 和 `task_notification` 這兩個 system events 目前沒有 client handler，被丟棄了。

## What Changes

讓 Task tool block 的 header 承載 subagent 生命週期狀態：

```
執行中：
[Task: "分析 protocol.md"] ▶ Running · Bash
                           ↑ task_progress.last_tool_name

完成：
[Task: "分析 protocol.md"] ✓ Done · 找到 3 個問題
                           ↑ task_notification.summary

失敗：
[Task: "分析 protocol.md"] ✗ Failed
```

展開後內部用跟主 timeline 相同的 grouping 邏輯（依賴 tool-use-grouping）。

subagent 有兩種類型需要區分：
- `local_agent`：本地 agent（在同一 process）
- `subagent`：雲端 subagent

## Capabilities

### New Capabilities
- `subagent-visibility`: Task tool block 顯示 subagent 生命週期狀態（running/done/failed + 進度/摘要）

### Modified Capabilities
- (none)

## Testing Strategy

**Unit tests (vitest)**
- system handler：用 fakeSummoner 播 `task-progress.jsonl` / `task-notification.jsonl` fixture，
  驗 tool_use meta（taskStatus、lastToolName、taskSummary）被正確更新

**Storybook — component 層 (`ToolUseBlock.stories`)**
- Stories：`TaskRunning`、`TaskDone`、`TaskFailed`
- 直接傳入含 taskStatus meta 的 message，不需要 fakeSummoner

**Storybook — scenario 層 (`ChatPanel.stories`)**
- `SubagentRunning`、`SubagentDone`：用 fakeSummoner replay 組合 fixture jsonl
  （`task-started.jsonl` + `task-progress.jsonl` + `task-notification.jsonl` + subagent messages）
- Fixture 已去識別化，可直接使用 `__fixtures__/claude/real/`

## Impact

- 依賴 `tool-use-grouping` change（SubagentChildren 內部用相同 grouping）
- `apps/web/src/contexts/channel/handlers/system.ts` — 新增 `task_progress`、`task_notification` handler，更新對應 tool_use meta
- `apps/summoner/src/claude/schemas.ts` — 已有 schema，確認完整
- `apps/web/src/types/ui.ts` — ToolUseMeta 新增 taskStatus、taskSummary、lastToolName 欄位
- `apps/web/src/components/chat/tool-use/message-blocks/ToolUseBlock.tsx` — Task tool block header 顯示狀態
- `apps/web/src/components/chat/conversation/SubagentChildren.tsx` — 改用 CollapsibleTimeline（依賴 tool-use-grouping）
