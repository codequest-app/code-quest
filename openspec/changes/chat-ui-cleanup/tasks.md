## 1. McpStatusBadge 搬移

- [x] 1.1 將 `components/ui/McpStatusBadge.tsx` 搬到 `components/settings/McpStatusBadge.tsx`
- [x] 1.2 更新 `components/settings/ManageMcpDialog.tsx` import 路徑（`'../ui/McpStatusBadge.tsx'` → `'./McpStatusBadge.tsx'`）
- [x] 1.3 更新 `components/settings/McpServerRow.tsx` import 路徑（同上）
- [x] 1.4 `pnpm test` 確認 green

## 2. border-subtle-token 新增

- [x] 2.1 `App.css` `@theme` block 新增 `--color-border-subtle: color-mix(in srgb, var(--color-border) 50%, transparent)`
- [x] 2.2 Light theme block 確認是否需要覆寫（若 light border 已夠淡則跳過）
- [x] 2.3 `ThinkingBlock.tsx` — `border-border/50` → `border-border-subtle`
- [x] 2.4 `NodeContent.tsx` — `border-border/50` → `border-border-subtle`（2 處）
- [x] 2.5 `PermissionModePicker.tsx` — `border-border/50` → `border-border-subtle`

## 3. ToolGroupSummary chip → Badge

- [x] 3.1 `ToolGroupSummary.tsx` — import `Badge` from `'../renderers/primitives.tsx'`（或 `@/components/ui/Badge`）
- [x] 3.2 預設 chip span → `<Badge variant="muted" size="xs">`
- [x] 3.3 error chip → `<Badge variant="danger" size="xs">`
- [x] 3.4 確認視覺高度沒有跳動（`py-0.5` vs `py-px`），必要時加 `className` 覆寫
- [x] 3.5 `pnpm test` 確認 green

## 4. NodeContent badge → Badge

- [x] 4.1 `NodeContent.tsx:125` — worktree badge span → `<Badge size="xs">`
- [x] 4.2 `NodeContent.tsx:184` — model badge span → `<Badge size="xs">`
- [x] 4.3 `pnpm test` 確認 green

## 5. ModifiedFilesPanel ACTION_BTN → Button

- [x] 5.1 `ModifiedFilesPanel.tsx` — 刪除 `ACTION_BTN` 常數
- [x] 5.2 Accept 按鈕 → `<Button variant="primary" size="xs" onClick={...}>Accept</Button>`
- [x] 5.3 Rewind 按鈕 → `<Button variant="secondary" size="xs" onClick={...}>Rewind</Button>`
- [x] 5.4 確認 import Button（若尚未 import）
- [x] 5.5 `pnpm test` 確認 green

## 6. 雜項清理

- [x] 6.1 `ToolUseHeader.tsx` — `TOOL_ICON_CLASS` 常數 inline（直接把 `className={TOOL_ICON_CLASS}` 改為 `className="w-4 h-4 shrink-0"`，刪除常數宣告）
- [x] 6.2 `RawEventFilterBar.tsx:67` — `bg-accent/[0.08]` → `bg-accent/10`
- [x] 6.3 `RawEventFilterBar.tsx:75` — `bg-accent/[0.06]` → `bg-accent/10`
- [x] 6.4 `pnpm test` 最終確認 green
