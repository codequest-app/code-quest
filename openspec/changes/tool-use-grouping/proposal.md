## Why

目前 tool_use 的呈現方式讓使用者看到一大堆 Read/Bash block，視覺噪音高。真正有意義的是 thinking（進度指示）和 text（最終回答），中間的 tool_use 都是「需要時才看」的過程細節。

## What Changes

重新設計 tool_use 的分組邏輯：

- **Thinking** 永遠外露，作為進度指示器
- **Tool use（任意數量，含單個）** 統一收進「過程」group
- Group collapsed 狀態顯示摘要 chips，規則如下：
  - 一般工具 (Read/Bash/Write/Edit/Grep/Glob) → 類型 + count：`Read ×3  Bash ×1`
  - Skill → 顯示 skill 名稱：`/zod-validation`
  - Task (Agent) → 顯示 description（來自 task_started）
  - hook → 顯示 hook 名稱
- Group 內有 error → 對應 chip 標紅
- 點擊展開後顯示每個 tool 的 CollapsibleBlock

```
[user message]
[thinking: 我來看看...]
● Read ×3  Bash ×1  /zod-validation  ›     ← collapsed
[thinking: 找到問題了...]
● Read ×1  ›
[text: 最終回答]
```

## Capabilities

### New Capabilities
- `tool-use-grouping`: Tool use messages 統一 group，摘要 chips 依工具語意顯示（一般工具 type+count、Skill 顯示名稱、Task 顯示 description）

### Modified Capabilities
- (none)

## Testing Strategy

**Unit tests (vitest)**
- `tool-group-rules.ts`：純函式，直接測輸入輸出
  - thinking 切斷 group（thinking 外露，tool_use 各自成 group）
  - text 切斷 group
  - 單個 tool_use 也形成 group（threshold 從 2 改為 1）
  - Skill chip 顯示 skill 名稱（`/zod-validation`）
  - group 內有 error → hasError = true

**Storybook — component 層 (`CollapsibleTimeline.stories`)**
- `story-fixtures.ts` 新增含 thinking / Skill / Task 的 message 序列
- Stories：`WithThinkingBreaks`、`WithSkillInvocation`、`WithError`

**Storybook — scenario 層 (`ChatPanel.stories`)**
- `HeavyToolUse`：完整對話含大量 Read/Bash，驗視覺壓力是否改善
- 使用 `story-fixtures.ts` 的 message 序列，不手刻 tool_result 細節

## Impact

- `src/utils/tool-group-rules.ts` — 重寫 splitTimelineRuns，改為按 thinking/text 邊界切割，而非連續性
- `src/components/chat/conversation/CollapsibleTimeline.tsx` — ExploredGroup 改為工具摘要 chip 顯示
- `src/components/chat/conversation/SubagentChildren.tsx` — 內部也改用新的 grouping 邏輯
- `src/test/story-fixtures.ts` — 新增含 thinking / Skill / Task 的 message 序列
