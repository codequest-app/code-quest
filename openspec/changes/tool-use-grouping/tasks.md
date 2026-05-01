## 1. Grouping Logic

- [x] 1.1 重寫 `splitTimelineRuns`：thinking/text 作為切割邊界，所有 tool_use 進 group（含單個）
- [x] 1.2 新增 `buildGroupChips(nodes: MessageNode[]): GroupChip[]` — 計算 group 的 chip 列表（type+count、Skill 名稱、Task description、error 標記）
- [x] 1.3 更新 `tool-group-rules.test.ts`：覆蓋新的邊界規則、chip 內容、error 標記

## 2. ToolGroupSummary Component

- [x] 2.1 建立 `ToolGroupSummary.tsx`：接收 `chips: GroupChip[]`，渲染 collapsed 狀態的 chip row
- [x] 2.2 Chip 樣式：一般工具為灰色，error 工具為紅色，Skill/Task 加底線或特殊色
- [x] 2.3 加入 expand/collapse chevron 控制

## 3. CollapsibleTimeline 更新

- [x] 3.1 將 `ExploredGroup` 改用 `ToolGroupSummary` 渲染 collapsed 狀態
- [x] 3.2 移除舊的 "Explored N" label 邏輯
- [x] 3.3 solo tool_use 也走 group path（不再有 solo tool_use row）

## 4. SubagentChildren 更新

- [x] 4.1 `SubagentChildren` 內部改用 `CollapsibleTimeline`，複用相同 grouping 邏輯

## 5. Fixtures & Stories

- [x] 5.1 `story-fixtures.ts` 新增 `makeHeavyToolUseConversation()`：含多個 thinking 切斷、Read/Bash、Skill tool_use 的序列
- [x] 5.2 `CollapsibleTimeline.stories.tsx`：新增 `WithThinkingBreaks`、`WithSkillInvocation`、`WithError` stories
- [x] 5.3 `ChatPanel.stories.tsx`：新增 `HeavyToolUse` scenario story
