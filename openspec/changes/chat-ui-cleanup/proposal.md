## Why

經過 `ui-primitive-extraction` 之後，`components/ui/` 已有完整的通用 primitive 庫，但 chat 區的元件尚未對齊：部分地方仍用手刻 className 代替現有的 `Badge`、`Button`；`McpStatusBadge` 誤放在 `ui/` 但綁定了 MCP domain 型別；以及少數 design token 違規（`border-border/50`、`bg-accent/[0.06]`）。這些問題讓 chat 區的元件維護難度高於必要。

## What Changes

- **搬移 `McpStatusBadge`**：從 `components/ui/McpStatusBadge.tsx` 搬到 `components/settings/McpStatusBadge.tsx`，更新所有 import
- **Badge 替換**：`ToolGroupSummary` 的 chip span、`NodeContent` 的 worktree/model badge → 改用現有 `<Badge>`
- **Button 替換**：`ModifiedFilesPanel` 的 `ACTION_BTN` 常數 → 改用現有 `<Button size="xs">`，刪除常數
- **TOOL_ICON_CLASS inline**：`ToolUseHeader` 的常數直接 inline，不需要抽元件
- **Token 修正**：`border-border/50` → 加 `--color-border-subtle` token；`bg-accent/[0.06|0.08]` → 改用標準 `bg-accent/10`
- **menu-components MenuItemRow**：評估是否改用 `<MenuItem>`

## Capabilities

### New Capabilities
- `border-subtle-token`: 在 `@theme` 新增 `--color-border-subtle` token，對應 `border-border` 50% 透明度，供 chat 分隔線使用

### Modified Capabilities

## Impact

- `components/ui/McpStatusBadge.tsx` → 搬移（會 break 現有 import，需全部更新）
- `components/chat/conversation/ToolGroupSummary.tsx`
- `components/chat/conversation/NodeContent.tsx`
- `components/chat/compose/ModifiedFilesPanel.tsx`
- `components/chat/tool-use/ToolUseHeader.tsx`
- `components/chat/compose/RawEventFilterBar.tsx`
- `components/chat/conversation/ThinkingBlock.tsx`
- `components/chat/compose/PermissionModePicker.tsx`
- `apps/web/src/App.css`（新增 token）
