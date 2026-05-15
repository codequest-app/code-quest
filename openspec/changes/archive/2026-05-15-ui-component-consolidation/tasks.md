## 1. FloatingCard（`components/chat/ui/`）

- [x] 1.1 新增 `components/chat/ui/FloatingCard.tsx`（`bg-surface border border-border rounded-lg shadow-floating p-3`，`as` prop，`HTMLAttributes<HTMLElement>` spread，`React.JSX.Element` 回傳型別）
- [x] 1.2 `PermissionModePicker.tsx` — popover 外框 div → `<FloatingCard className="z-modal w-80 max-w-[calc(100vw-2rem)] py-1 px-0">`
- [x] 1.3 `AttachMenu.tsx` — menu 外框 div → `<FloatingCard className="z-modal min-w-50 overflow-hidden px-0 py-1">`
- [x] 1.4 `MessageActionsMenu.tsx` — dropdown 外框 div → `<FloatingCard className="z-popover min-w-50 flex flex-col px-0 py-1">`
- [x] 1.5 `PlanReviewBanner.tsx` — banner card div → `<FloatingCard className="overflow-hidden mb-1.5 px-2 py-2">`
- [x] 1.6 `HookCallbackCard.tsx` — card 外框 div → `<FloatingCard className="px-4 py-3">`
- [x] 1.7 `ToolPermissionCard.tsx` — card 外框 div → `<FloatingCard className="overflow-hidden mb-1.5 px-2 py-2 outline-none focus-within:border-accent/50">`
- [x] 1.8 `pnpm test` 確認 green

## 2. TextField（`components/ui/`）

- [x] 2.1 新增 `components/ui/TextField.tsx`（`as` prop `'input'|'textarea'`，`mono` prop，`size` prop `'sm'|'md'`，`React.JSX.Element` 回傳型別）
- [x] 2.2 `AuthDialog.tsx` — username/password input → `<TextField>`
- [x] 2.3 `InitOptionsDialog.tsx` — textarea 欄位 → `<TextField as="textarea" mono>`，刪除 `LABEL_CLASS`、`TEXTAREA_LG`、`TEXTAREA_SM` 常數
- [x] 2.4 `MarketplaceSection.tsx` — config path input → `<TextField>`
- [x] 2.5 `McpServerRow.tsx` — mono input → `<TextField mono size="sm">`
- [x] 2.6 `NewChangeDialog.tsx` — change name input → `<TextField mono>`
- [x] 2.7 `NewEntryDialog.tsx` — file name input → `<TextField mono>`
- [x] 2.8 `FileTreeRow.tsx` — inline rename input → `<TextField size="sm" mono>`
- [x] 2.9 `pnpm test` 確認 green

## 3. GroupHeader（`components/ui/`）

- [x] 3.1 新增 `components/ui/GroupHeader.tsx`（`section-label px-1 pt-2 pb-1 first:pt-0`，`React.JSX.Element` 回傳型別）
- [x] 3.2 `ProjectList.tsx` — 兩處 group header div → `<GroupHeader>`
- [x] 3.3 `ProjectTree.tsx` — 刪除 inline `GroupHeader` function，改用 import
- [x] 3.4 `InstalledPluginList.tsx` — 刪除 inline `SectionHeader` function，改用 `<GroupHeader>`
- [x] 3.5 `pnpm test` 確認 green

## 4. 已有 primitive 未採用的清理

- [x] 4.1 `InstalledPluginList.tsx` — 刪除 inline `StatusDot` function，改用 `import { StatusDot } from '../ui/StatusDot.tsx'`
- [x] 4.2 `BranchSection.tsx` — `<h4 className="section-label m-0">` → `<SectionLabel as="h4" className="m-0">`
- [x] 4.3 `SpecPane.tsx` — `<h3 className="section-label ...">` → `<SectionLabel as="h3">`
- [x] 4.4 `ProjectList.tsx` — 手刻 add-project button → `<GhostAddButton>`
- [x] 4.5 `LiveSessionPopover.tsx` — raw `<button>` → `<Button size="xs" variant="...">`
- [x] 4.6 `FilterPopover.tsx` — raw filter buttons → `<Button size="xs">`
- [x] 4.7 `pnpm test` 確認 green

## 5. 最終確認

- [x] 5.1 `pnpm biome check --write` 修正 import order
- [x] 5.2 `pnpm test` 最終確認全 green
