## 1. 準備：確認 token 對應與 baseline 方法

- [x] 1.1 確認 `--color-surface-hover` 值在深色/淺色主題下等同 `rgba(white, 0.05)`，若不符則在 `App.css` 新增 `--color-hover-tint` token
  - 結論：`surface-hover` 是 solid color，語意不同。新增 `--color-hover-tint: rgba(var(--color-hover-tint-rgb), 0.05)` 至 `@theme`、dark block、light block。
- [x] 1.2 確認 `--color-selected-text` 在深色主題下為白色（badge 文字替換依賴此 token）
  - 結論：深色 `#ffffff`、淺色 `#1f1f1f`。語意正確，可替換。
- [x] 1.3 確認 `--mode-accent` 是否可用 Tailwind v4 utility `border-mode-accent` / `bg-mode-accent`；若不行，標注為「無法對齊」
  - 結論：`--mode-accent` 不在 `@theme`（App.css 明確說明），**無法用 Tailwind utility**。標注為「無法對齊」。

## 2. Baseline 建立規則（每批修改前執行）

- [x] 2.1 修改前執行 `pnpm test --reporter=verbose` 記錄目前 pass/fail 狀態作為 baseline
  - 結果：238 test files, 2131 tests 全通過
- [x] 2.2 對有 Storybook Story 的元件，列出 Story 名稱作為人工目視 baseline 清單
- [x] 2.3 對無 Story 且無 test 的元件，在本 tasks 對應 task 標注「需人工目視：dark + light 主題」

## 3. Shadow / Z-index / Overlay（影響最小，先修）

- [x] 3.1 `Dialog.tsx:56` `shadow-xl` → `shadow-floating`（有 Story：人工目視）
- [x] 3.2 `TopScopeSwitcher.tsx:80` `shadow-lg` → `shadow-floating`（有 Story：人工目視）
- [x] 3.3 `ModelPickerPopover.tsx:109` `shadow-lg` → `shadow-floating`（需人工目視）
- [x] 3.4 `MessageList.tsx:405` `shadow-lg` → `shadow-floating`（有 Story：人工目視）
- [x] 3.5 `ChatInputArea.tsx:61` `z-10` → `z-raised`（有 Story：人工目視）
- [x] 3.6 `ImagePreviewModal.tsx:27` `z-50` → `z-modal`、`bg-black/70` → `bg-overlay`（需人工目視）
- [x] 3.7 `WorkspaceLayout.tsx:133` `bg-black/40` → `bg-overlay`（需人工目視）
- [x] 3.8 `AccountUsageDialog.tsx:131` `bg-black/50` → `bg-overlay`（有 Story：人工目視）
- [x] 3.9 `ToolPermissionCard.tsx:171` `bg-black/10` → `bg-input-overlay`（有 Story：人工目視）

## 4. Danger / Error Color

- [x] 4.1 `SpeechInputButton.tsx:38,40` `bg-red-500` → `bg-danger`（有 Story：人工目視）
- [x] 4.2 `MermaidDiagram.tsx:56` `text-red-400` → `text-danger`（需人工目視）
- [x] 4.3 `CreateWorktreeDialog.tsx:139` `text-red-500` → `text-danger`（有 Story：人工目視）

## 5. Hover Tint（`bg-white/5` 系列，最多處）

- [x] 5.1 `TabBar.tsx:92,132,140` `hover:bg-white/5` → `hover:bg-hover-tint`（有 Story：人工目視）
- [x] 5.2 `WorkspaceTopbar.tsx:8` `hover:bg-white/5` → `hover:bg-hover-tint`（需人工目視）
- [x] 5.3 `NotificationToast.tsx:93` `bg-white/10` → `bg-hover-tint`、`hover:bg-white/20` → `hover:bg-surface-hover`（有 Story：人工目視）
- [x] 5.4 `ChatView.tsx:83` `hover:bg-white/5` → `hover:bg-hover-tint`（需人工目視）
- [x] 5.5 `MessageActionsMenu.tsx:24,41` `hover:bg-white/5`、`data-[highlighted]:bg-white/5` → `hover-tint`（需人工目視）
- [x] 5.6 `PlanReviewBanner.tsx:117` `bg-white/5` → `bg-hover-tint`（有 Story：人工目視）
- [x] 5.7 `SessionRow.tsx:96,97` `hover:bg-white/5`、`bg-white/5` → `hover-tint`（有 Story：人工目視）
- [x] 5.8 `OptionButton.tsx:23` `hover:bg-white/5` → `hover:bg-hover-tint`（有 Story：人工目視）
- [x] 5.9 `QuestionContent.tsx:63` `hover:bg-white/5` → `hover:bg-hover-tint`（有 Story：人工目視）
- [x] 5.10 `MarkdownContent.tsx:95` `hover:bg-white/[0.02]` → `hover:bg-hover-tint`（有 Story：人工目視）
- [x] 5.11 `FileTreeRow.tsx:80,129` `hover:bg-white/5`、`bg-white/5` → `hover-tint`（有 Story：人工目視）
- [x] 5.12 `GitPane.tsx:297` `hover:bg-white/5` → `hover:bg-hover-tint`（需人工目視）
- [x] 5.13 `FilterPopover.tsx:29,47,61,138` 各 white tint → `hover-tint` / `surface-hover` / `border-floating-border-subtle` / `text-text-faint`（有 Story：人工目視）
- [x] 5.14 `BranchPopover.tsx:148,149` `hover:bg-white/5`、`bg-white/5` → `hover-tint`（需人工目視）
- [x] 5.15 `SpecPane.tsx:106,107` `hover:bg-white/5` → `hover:bg-hover-tint`（需人工目視）
- [x] 5.16 `AccountUsageDialog.tsx:95` `bg-white/5` → `bg-hover-tint`（有 Story：人工目視）

## 6. Badge Text Color（`text-white` / `text-black`）

- [x] 6.1 `ManageMcpDialog.tsx:64-69` badge `text-white` → `text-selected-text`、`text-black` → `text-bg`（有 Story：人工目視）
- [x] 6.2 `McpServerRow.tsx:8-12` 同上（有 Story：人工目視）
- [x] 6.3 `ManagePluginsDialog.tsx:91` `text-white` → `text-selected-text`（有 Story：人工目視）
- [x] 6.4 `RewindDialog.tsx:48` `text-white` → `text-selected-text`（有 Story：人工目視）
- [x] 6.5 `RewindConfirmDialog.tsx:88` `text-white` → `text-selected-text`（有 Story：人工目視）
- [x] 6.6 `LiveSessionPopover.tsx:58` `text-white` → `text-selected-text`（需人工目視）

## 7. 其他 Arbitrary

- [x] 7.1 `ChatView.tsx:65` `text-muted-foreground` → `text-text-muted`（需人工目視）
- [x] 7.2 `PlanCommentPopover.tsx:97` `bg-bg-secondary` → `bg-surface`、`:114` `border-white/10` → `border-floating-border-subtle`（有 Story：人工目視）
- [x] 7.3 `EffortSwitch.tsx:120` `ring-black/20` → `ring-border/20`；`bg-white` thumb **設計意圖保留**（有 Story：人工目視）
- [x] 7.4 `ToggleSwitch.tsx:9` `bg-white/20` → `bg-hover-tint`；`bg-white` thumb **設計意圖保留**（有 Story：人工目視）
- [x] 7.5 `RawEventFilterBar.tsx` arbitrary `rgba(...)` → opacity modifier（`bg-accent/[0.06]`、`text-accent/60`）或就近 token（`text-text-faint`、`border-border/20`）
- [x] 7.6 `SideQuestionDialog.tsx:32,36` `mt-[15vh]`、`max-h-[55vh]` → **viewport-relative arbitrary，合法保留，不改**
- [x] 7.7 `ChatInputArea.tsx:52,53` / `ComposeToolbar.tsx:49` `--mode-accent` → **無法對齊**（`--mode-accent` 不在 `@theme`，必須用 `bg-[var(--mode-accent)]`）

## 8. 驗證與回報

- [x] 8.1 執行 `pnpm test` 確認所有測試通過 — **238 files, 2131 tests ✓**
  - SessionRow.test.tsx 斷言從 `bg-white/5` 更新為 `bg-hover-tint`
- [x] 8.2 TypeScript 型別檢查通過（pre-commit hook）
- [x] 8.3 Biome lint 無新增違規（pre-commit hook）
- [x] 8.4 整理「無法對齊」清單 → 見下方報告
- [x] 8.5 整理「需人工目視」清單 → 見下方報告

---

## 9. Token 命名慣例修正（App.css）

第二輪全量審查後發現命名不一致：

- [x] 9.1 修正 typo：`text-warn` 在程式碼中廣泛使用，但 App.css 定義的是 `--color-warning` → **保留 `--color-warning`**，在 App.css 新增 `--color-warn: var(--color-warning)` alias，讓兩種寫法均可用（影響範圍廣，不強制改所有 consumer）
- [x] 9.2 `--color-input-bg` → 新增 `--color-input: var(--color-input-bg)` alias，讓 `bg-input` 成為正式 utility（目前有元件寫 `bg-input` 但 token 叫 `bg-input-bg`）
- [x] 9.3 新增 `--color-info` token（`#3b82f6` dark / `#2563eb` light），供 `text-info` / `bg-info` 使用
- [x] 9.4 `--color-text-muted` 等 text-prefixed token → 新增不帶前綴的 alias：
  - `--color-muted: var(--color-text-muted)`（→ `text-muted` utility）
  - `--color-dim: var(--color-text-dim)`
  - `--color-faint: var(--color-text-faint)`
  - `--color-subtle: var(--color-text-subtle)`
  - `--color-bright: var(--color-text-bright)`
  - **舊名保留**（backward compat），新程式碼用短名

## 10. 補齊 hover:bg-white/5（第二輪審查新增）

- [x] 10.1 `TopbarLiveSessions.tsx` `hover:bg-white/5` → `hover:bg-hover-tint`
- [x] 10.2 `AddProjectDialog.tsx` `hover:bg-white/5` → `hover:bg-hover-tint`
- [x] 10.3 `BranchPopover.tsx`（第二處）`hover:bg-white/5` → `hover:bg-hover-tint`
- [x] 10.4 `ProjectCard.tsx` `hover:bg-white/5` → `hover:bg-hover-tint`
- [x] 10.5 `TopScopeSwitcher.tsx` `hover:bg-white/5` → `hover:bg-hover-tint`
- [x] 10.6 `WorktreeRow.tsx` `hover:bg-white/5` → `hover:bg-hover-tint`
- [x] 10.7 `ManageMcpDialog.tsx` `hover:bg-white/5` → `hover:bg-hover-tint`
- [x] 10.8 `McpServerRow.tsx` `hover:bg-white/5` → `hover:bg-hover-tint`
- [x] 10.9 `SettingsDialog.tsx` `hover:bg-white/5` → `hover:bg-hover-tint`
- [x] 10.10 `TaskChecklist.tsx` `hover:bg-white/5` → `hover:bg-hover-tint`
- [x] 10.11 `RewindConfirmDialog.tsx` `hover:bg-white/5` → `hover:bg-hover-tint`
- [x] 10.12 `RewindDialog.tsx` `hover:bg-white/5` → `hover:bg-hover-tint`
- [x] 10.13 `TabBar.tsx`（剩餘處）`hover:bg-white/5` → `hover:bg-hover-tint`
- [x] 10.14 `HeaderBar.tsx` `hover:bg-white/5` → `hover:bg-hover-tint`

## 11. 補齊 shadow-lg / shadow-xl（第二輪審查新增）

- [x] 11.1 `NotificationToast.tsx` `shadow-lg` → `shadow-floating`
- [x] 11.2 `AttachMenu.tsx` `shadow-lg` → `shadow-floating`
- [x] 11.3 `PermissionModePicker.tsx` `shadow-lg` → `shadow-floating`
- [x] 11.4 `CommandMenu.tsx` `shadow-lg` → `shadow-floating`
- [x] 11.5 `HookCallbackCard.tsx` `shadow-lg` → `shadow-floating`
- [x] 11.6 `PlanCommentPopover.tsx` `shadow-xl` → `shadow-floating`

## 12. text-white 按鈕文字補齊

- [x] 12.1 `ModifiedFilesPanel.tsx` button `text-white` → `text-selected-text`
- [x] 12.2 `PlanReviewBanner.tsx` button `text-white` → `text-selected-text`
- [x] 12.3 `OptionButton.tsx` `text-white` → `text-selected-text`
- [x] 12.4 `QuestionContent.tsx` `text-white` → `text-selected-text`
- [x] 12.5 `ToolPermissionCard.tsx` badge `text-white` → `text-selected-text`

## 13. 錯誤 token 名稱修正

- [x] 13.1 `InstalledPluginList.tsx` `bg-input` → `bg-input-bg`（完成 9.2 alias 後可改回 `bg-input`）
- [x] 13.2 `MarketplaceSection.tsx` `bg-input` → `bg-input-bg`（同上）
- [x] 13.3 `ManageMcpDialog.tsx` `bg-bg-secondary` → `bg-surface`
- [x] 13.4 `ToolUseBlock.tsx` `bg-danger/10` → `bg-danger-bg`

## 14. text-warn typo（六個檔案）

完成 9.1 alias 後以下無需再改，但若要清理仍列出：

- [x] 14.1 `FilePreviewModal.tsx` `text-warn` — 完成 9.1 後合法，標記確認
- [x] 14.2 `NewEntryDialog.tsx` `text-warn` — 同上
- [x] 14.3 `DiffModal.tsx` `text-warn` — 同上
- [x] 14.4 `RenameWorktreeDialog.tsx` `text-warn` — 同上
- [x] 14.5 `NewChangeDialog.tsx` `text-warn` — 同上
- [x] 14.6 `SpecModal.tsx` `text-warn` — 同上

## 15. 其他遺漏

- [x] 15.1 `GitPane.tsx` `text-info` — 完成 9.3 新增 `--color-info` token 後合法，標記確認
- [x] 15.2 `ManageMcpDialog.tsx` `bg-text-muted/10` → `bg-muted/10`（完成 9.4 alias 後可用）

## 16. 最終驗證

- [x] 16.1 執行 `pnpm test` 確認全部測試通過
- [x] 16.2 TypeScript 型別檢查通過
- [x] 16.3 Biome lint 無新增違規
