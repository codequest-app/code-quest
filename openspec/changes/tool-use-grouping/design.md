## Context

目前 `CollapsibleTimeline` 用 `splitTimelineRuns` 把**連續** tool_use (≥2) 折成 "Explored N" group，其餘為 solo row。這導致：
- 單個 tool_use 不被折疊，視覺上跟多個 tool 不一致
- Thinking 夾在中間時群組被切斷，出現多個小 group
- Group label 只顯示 count，看不出用了哪些有語意的工具（Skill、Task）

## Goals / Non-Goals

**Goals:**
- Thinking 永遠外露，作進度指示器
- 所有 tool_use（含單個）統一收進 group
- Group collapsed 狀態顯示語意 chips（type+count / skill 名稱 / task description）
- Group 內有 error 時 chip 標紅
- SubagentChildren 內部複用相同 grouping 邏輯

**Non-Goals:**
- 不改變個別 tool block 的展開內容（CollapsibleBlock 維持原樣）
- 不處理 subagent 生命週期狀態（屬於 subagent-visibility change）

## Decisions

### 1. Grouping 邊界：thinking/text 切割，而非連續性

**決定**：`splitTimelineRuns` 改為「thinking 和 text 是邊界，tool_use 全部 group」。

```
Before: [tool, tool, thinking, tool] → [group(2), solo(thinking), solo(tool)]
After:  [tool, tool, thinking, tool] → [group(2), solo(thinking), group(1)]
```

**理由**：使用者在意的是 thinking（進度）和 text（結果），tool_use 不管幾個都是「過程」。連續性是實作偶然，不是語意邊界。

**捨棄**：維持連續性 grouping + 降低 threshold 為 1 — 這樣 thinking 夾在中間還是會切斷 group，問題未解。

### 2. Chip 顯示規則依工具語意分類

**決定**：
- 一般工具（Read/Bash/Write/Edit/Grep/Glob/Mcp 等）→ `<ToolName> ×N`，合併相同類型
- `Skill` → `/<skill-name>`（從 input.skill 取名稱）
- `Task` / `Agent` → 顯示 description（從對應 task_started meta 取得）
- 無法識別的工具 → fallback 為 `<name> ×N`

**理由**：Skill 和 Task 有具體名稱，比 count 更有資訊量。一般工具數量比名稱重要。

### 3. Group 複用：抽出 `ToolGroupSummary` 元件

**決定**：將 chips 渲染邏輯抽成獨立元件 `ToolGroupSummary`，供 `CollapsibleTimeline`（主 timeline）和 `SubagentChildren`（subagent 內部）共用。

**理由**：避免 subagent-visibility change 重複實作相同邏輯。

### 4. Error 標示：chip 層級，而非 group 層級

**決定**：有 error 的 tool 對應的 chip 標紅（例如 `Bash ×1` 標紅），而非整個 group 標紅。

**理由**：使用者需要知道哪類工具出錯，整個 group 標紅資訊量不足。若 group 全部 error 才整體標紅。

## Risks / Trade-offs

- [Task description 來源] task_started meta 可能尚未到達時 tool_use 已顯示 → 先顯示 "Agent"，meta 到後更新
  Mitigation：Task tool block 本來就是 streaming 狀態，顯示 fallback label 可接受

- [Grouping 邊界改變] 現有測試若依賴 "Explored N" label 會失敗
  Mitigation：更新 `tool-group-rules.test.ts`，label 改為驗 chip 內容

## Migration Plan

1. 更新 `splitTimelineRuns` 邏輯與測試
2. 更新 `ExploredGroup` → 改為 chip 顯示，加入 `ToolGroupSummary`
3. `SubagentChildren` 改用 `CollapsibleTimeline`（複用 grouping）
4. 更新 `story-fixtures.ts`，新增含 thinking/Skill/Task 的序列
5. 新增 / 更新 Storybook stories
