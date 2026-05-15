# Tasks: UI Primitive Extraction

## 0. Baseline

- [x] 0.1 執行 `pnpm test`，記錄通過數作為 baseline（預期：238 files, 2131 tests）

---

## 1. StatusDot（最獨立，先做）

- [x] 1.1 新增 `components/ui/StatusDot.tsx`（props: `color`, `pulse`, `size`）
- [x] 1.2 `TopbarLiveSessions.tsx` — 將 `DOT_CLASS` mapping 改用 `<StatusDot>`
- [x] 1.3 `FilterPopover.tsx:46` — 將 colored dot 改用 `<StatusDot>`
- [x] 1.4 `TabBar.tsx:97` — 將 status dot 改用 `<StatusDot>`
- [x] 1.5 `WorktreeRow.tsx:105` — 將 animate-pulse success dot 改用 `<StatusDot pulse>`
- [x] 1.6 加入 `ui/index.ts` export（若有 barrel）
- [x] 1.7 `pnpm test` 確認 green

## 2. InlineCode

- [x] 2.1 新增 `components/ui/InlineCode.tsx`（`<code className="font-mono bg-surface px-1 rounded text-xs">`）
- [x] 2.2 `ManageMcpDialog.tsx:109` — `<code>` → `<InlineCode>`
- [x] 2.3 掃描其他 `<code className=` 是否也適用，逐一替換
- [x] 2.4 `pnpm test` 確認 green

## 3. SectionLabel

- [x] 3.1 新增 `components/ui/SectionLabel.tsx`（包裝 `section-label` CSS utility class，支援 `as` prop）
- [x] 3.2 `BranchPopover.tsx:118` — 手寫 `font-semibold uppercase tracking-wider` → `<SectionLabel>`
- [x] 3.3 `TopScopeSwitcher.tsx:106,122` — 同上
- [x] 3.4 `ManageMcpDialog.tsx:142` — 同上
- [x] 3.5 確認 BranchSection、GitPane、SpecPane、ProjectTree 已用 `section-label` class 的地方不需改
- [x] 3.6 `pnpm test` 確認 green

## 4. GhostAddButton

- [x] 4.1 新增 `components/ui/GhostAddButton.tsx`（`border-dashed border-border hover:border-accent text-text-muted hover:text-text text-xs rounded`）
- [x] 4.2 `ProjectRow.tsx:108` — raw button → `<GhostAddButton>`
- [x] 4.3 `ProjectTree.tsx:50` — raw button → `<GhostAddButton>`
- [x] 4.4 `WorktreeChildList.tsx:185` — raw button → `<GhostAddButton>`
- [x] 4.5 `pnpm test` 確認 green

## 5. Badge

- [x] 5.1 新增 `components/ui/Badge.tsx`（props: `variant`, `mono`, `size`, `border`，variant token 對應見 design.md）
- [x] 5.2 `SystemBlocks.tsx:158` — `px-1.5 py-0.5 rounded bg-accent/20 text-accent text-xs font-mono` → `<Badge variant="accent" mono>`
- [x] 5.3 `TaskBadge.tsx:46` — 同上
- [x] 5.4 `ManagePluginsDialog.tsx:91` — tab count badge → `<Badge>`
- [x] 5.5 `SpecPane.tsx:123,133,142` — spec status badge → `<Badge variant="success|muted|danger">`
- [x] 5.6 `WorktreeRow.tsx:105` — running badge → `<Badge variant="success">` 並保留 pulse dot（與 StatusDot 組合）
- [x] 5.7 `TriStateIndicator.tsx` 的 `TOGGLE_PILL_BASE` — 評估是否改用 Badge（注意它有 `border` 且外觀與 ChoicePills 共用，請確認後決定）
- [x] 5.8 `ChoicePills.tsx` — 評估是否改用 Badge（若改，需確認 interactive state 正確）
- [x] 5.9 `pnpm test` 確認 green

## 6. StatusBadge

- [x] 6.1 新增 `components/ui/StatusBadge.tsx`，內建 MCP status → label/class 的 mapping（合併 `STATUS_CONFIG` 和 `MCP_STATUS_BADGE`）
- [x] 6.2 `ManageMcpDialog.tsx:81` — 用 `<StatusBadge status={status}>`
- [x] 6.3 `McpServerRow.tsx:57-62` — 刪除 `MCP_STATUS_BADGE`，改用 `<StatusBadge>`
- [x] 6.4 `pnpm test` 確認 green

## 7. MenuItem + MenuContent

- [x] 7.1 新增 `components/ui/MenuItem.tsx`（props: `variant="default|danger"`, `as`, `className`）
- [x] 7.2 新增 `components/ui/MenuContent.tsx`（props: `minWidth`, `className`，渲染 `bg-surface border border-border rounded shadow-floating z-modal`）
- [x] 7.3 `context-menu-styles.ts` — `MENU_ITEM_CLASS` / `DANGER_MENU_ITEM_CLASS` / `MENU_CONTENT_CLASS` → re-export from new components
- [x] 7.4 `BranchPopover.tsx:165,186` — 手寫 row → `<MenuItem>`
- [-] 7.5 `BranchPopover.tsx:51` — content wrapper 是 Radix Popover.Content，無需替換
- [x] 7.6 `TopScopeSwitcher.tsx` menu rows → `<MenuItem>`
- [-] 7.7 `TopScopeSwitcher.tsx:80` content wrapper 是 Radix Popover.Content，無需替換
- [-] 7.8 `ModelPickerPopover.tsx` — 外觀不同，保留
- [x] 7.9 `MessageActionsMenu.tsx:41` → `<MenuItem as={DropdownMenu.Item}>`
- [-] 7.10 `compose/AttachMenu.tsx:73` — 有 icon 且 py-2，保留
- [x] 7.11 `pnpm test` 確認 green

## 8. DialogFooter

- [x] 8.1 新增 `components/ui/DialogFooter.tsx`（props: `variant="inline|bleed"`, `align="end|start|between"`）
- [x] 8.2 `NewChangeDialog.tsx` → `<DialogFooter>`
- [x] 8.3 `ArchiveChangeDialog.tsx` → `<DialogFooter>`
- [-] 8.4 `DiffModal.tsx` — 無符合 footer pattern，跳過
- [-] 8.5 `FilePreviewModal.tsx` — 無符合 footer pattern，跳過
- [-] 8.6 `SpecModal.tsx` — 無符合 footer pattern，跳過
- [x] 8.7 `AddProjectDialog.tsx` → `<DialogFooter variant="bleed">`
- [x] 8.8 `CreateWorktreeDialog.tsx` → `<DialogFooter variant="bleed">`
- [x] 8.9 `RenameWorktreeDialog`, `ArchiveWorktreeConfirmDialog`, `DeleteEntryConfirmDialog`, `NewEntryDialog` → `<DialogFooter>`
- [x] 8.10 `pnpm test` 確認 green

## 9. SurfaceCard

- [x] 9.1 新增 `components/ui/SurfaceCard.tsx`（props: `as`, `className`，渲染 `bg-surface border border-border rounded p-3`）
- [x] 9.2 `ManageMcpDialog.tsx` → `<SurfaceCard>`（3 處）
- [x] 9.3 `InstalledPluginList.tsx` → `<SurfaceCard>`（2 處）
- [x] 9.4 `MarketplaceSection.tsx` → `<SurfaceCard>`
- [x] 9.5 `pnpm test` 確認 green

## 10. IconButton 收編

這批是「沒用 IconButton 但應該用」的地方，順手收編：

- [x] 10.1 `ResumeButton.tsx` — `<button className={HDR_BTN}>` → `<IconButton>` + 刪 `HDR_BTN` 常數
- [x] 10.2 `session/RawEventPanel.tsx` — 4 個 `<button className={ICON_BTN}>` → `<IconButton>` + 刪 `ICON_BTN` 常數
- [x] 10.3 `session/SessionRow.tsx` — icon button → `<IconButton>`
- [x] 10.4 `TabBar.tsx` — New Tab / History button → `<IconButton>`
- [x] 10.5 `pnpm test` 確認 green

## 11. 最終清理

- [x] 11.1 `context-menu-styles.ts` 已無直接引用，刪除檔案
- [x] 11.2 `WorkspaceTopbar.tsx` 的 `ACTION_CLASS` 改名為 `topbarBtnClass`（3 處使用，合理保留）
- [x] 11.3 `NodeContent.tsx` 的 `JSON_VIEWER_CLASS` → 改用 `CODE_BLOCK_CLASS`（加 font-mono，語義更正確）
- [x] 11.4 全域掃描剩餘 `*_CLASS`：全為同檔案內 Record lookup，有明確保留理由
- [x] 11.5 最終 `pnpm test` — 238 files, 2131 tests 全通過 ✓
- [x] 11.6 Biome lint + format — `biome check --write` 修正 import order 及格式，無新增違規 ✓
