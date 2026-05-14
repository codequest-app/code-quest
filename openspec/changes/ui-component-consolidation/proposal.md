## Why

掃描所有 domain 元件後發現三類系統性問題：
1. 跨檔案重複的 JSX pattern 沒有對應 primitive（TextField、FloatingCard、GroupHeader）
2. 已有 primitive（StatusDot、SectionLabel、GhostAddButton）但部分地方沒採用
3. 少數設計 token 缺口（dialog 高度、focus shadow、scrollbar utility）

這些問題讓 design token 難以統一維護，新元件加入時容易產生不一致的邊框、背景、陰影組合。

## What Changes

- **新增 `components/chat/ui/FloatingCard.tsx`**：`bg-surface border border-border rounded-lg shadow-floating` pattern，專給 chat 層的 popover/card 用
- **新增 `components/ui/TextField.tsx`**：統一 input/textarea 的邊框、背景、焦點樣式，取代目前 `bg-input`、`bg-input-bg`、`bg-code-block` 的混用
- **新增 `components/ui/GroupHeader.tsx`**：`section-label px-1 pt-2 pb-1` pattern，取代 ProjectList、ProjectTree、InstalledPluginList 各自內聯的定義
- **採用現有 primitive**：清理未用 StatusDot、SectionLabel、GhostAddButton、Button 的地方
- **設計 token 補齊**：App.css 新增 scrollbar-hide utility、dialog 高度 token

## Capabilities

### New Capabilities
- `chat-floating-card`: chat 層的 floating card primitive（`components/chat/ui/`）
- `text-field`: 統一的 input/textarea primitive
- `group-header`: section/group 標題 primitive

### Modified Capabilities

## Impact

- `components/chat/ui/FloatingCard.tsx`（新）
- `components/ui/TextField.tsx`（新）
- `components/ui/GroupHeader.tsx`（新）
- `components/chat/compose/PermissionModePicker.tsx`
- `components/chat/compose/AttachMenu.tsx`
- `components/chat/conversation/MessageActionsMenu.tsx`
- `components/chat/plan-review/PlanReviewBanner.tsx`
- `components/chat/tool-use/HookCallbackCard.tsx`
- `components/chat/tool-use/ToolPermissionCard.tsx`
- `components/settings/AuthDialog.tsx`
- `components/settings/InitOptionsDialog.tsx`
- `components/settings/MarketplaceSection.tsx`
- `components/settings/McpServerRow.tsx`
- `components/settings/InstalledPluginList.tsx`
- `components/spec/NewChangeDialog.tsx`
- `components/files/NewEntryDialog.tsx`
- `components/project/ProjectList.tsx`
- `components/project/ProjectTree.tsx`
- `apps/web/src/App.css`（新增 token/utility）
