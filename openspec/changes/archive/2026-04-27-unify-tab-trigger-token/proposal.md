## Why

四個元件（CreateWorktreeDialog、ManagePluginsDialog、SpecModal、RightPane）各自定義幾乎相同的 tab trigger 樣式（`border-b-2 border-transparent text-text-muted hover:text-text data-[state=active]:border-accent data-[state=active]:text-text`），只差 padding 和 font-size。重複的視覺 token 散落各處，改一處漏另一處。

## What Changes

- 在 `ui/_tokens.ts` 新增共用 tab trigger 視覺 token（只含 active indicator + 文字色切換）
- 四個 consumer 改用共用 token，各自補 padding / font-size
- 刪除 `worktree-dialog/TabButton.tsx`（SpecModal 遷移到 Radix Tabs 後無 consumer）

## Capabilities

### New Capabilities

- `unify-tab-trigger-token`: 統一 tab trigger 的視覺 token，從 `_tokens.ts` 輸出供 4 個 consumer 使用

### Modified Capabilities

_(none)_

## Impact

- **Files modified:** `ui/_tokens.ts`, `CreateWorktreeDialog.tsx`, `ManagePluginsDialog.tsx`, `RightPane.tsx`, `SpecModal.tsx`
- **Files deleted:** `worktree-dialog/TabButton.tsx`
- **排除：** CommandPalette（刻意不同風格）、TabBar（session tab strip）、QuestionContent（message bubble 內緊湊排版）
