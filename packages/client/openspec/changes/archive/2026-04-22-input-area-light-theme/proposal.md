## Why

`light-theme-and-density` 補齊了 light palette，但 `ChatInputArea` 與其內部元件在切到 light 時仍殘留 dark 外觀。掃描後發現三層相關問題：

1. **冗餘專屬 token**：`--color-chat-input-bg` / `--color-chat-input-border` 只在 `@theme`（dark 預設）+ `[data-theme="dark"]` 有定義，`[data-theme="light"]` 缺漏；且在 dark 下兩者 = `--color-surface` / `--color-border`，屬於多餘別名。
2. **Hover tint 硬編碼**：`bg-white/5` / `bg-white/10` 分佈於 `IconButton` 與 InputArea 內多個元件，light 底下幾乎看不到。`--color-hover-tint-rgb` token 已存在兩主題覆寫，只差接線。
3. **Permission-mode 視覺樣式混合 global CSS 與硬編碼 rgb**：`.send-btn` + `[data-permission-mode="..."]:focus-within` 在 `App.css` 以 global selector 實作，其中三條 box-shadow 寫死 rgb (`217,119,87` / `0,127,212` / `204,204,204`)，沒跟 token 連動。

## What Changes

### T1 — 移除 `chat-input-*` 冗餘 token
- 刪除 `@theme` 的 `--color-chat-input-bg` / `--color-chat-input-border`
- `ChatInputArea` 外層 className：`bg-chat-input-bg border-chat-input-border` → `bg-surface border-border`

### T2 — Hover tint 全面 token 化
- 新增 `@utility hover-tint-5` / `hover-tint-10`（或等效 arbitrary value），背景值 = `rgba(var(--color-hover-tint-rgb), 0.05 | 0.10)`
- 改寫點（掃描完整）：
  - `IconButton.tsx`: `hover:bg-white/5` → hover-tint-5
  - `PermissionModePicker.tsx`: `bg-white/10`, `bg-white/5`
  - `AddButton.tsx`: `bg-white/5`
  - `ReviewUpsellBanner.tsx`: `bg-white/10`
  - `MentionDropdown.tsx`: `bg-white/10`, `bg-white/5`
  - `CommandMenu.tsx`: `bg-white/10`
  - `ModelPickerPopover.tsx`: `bg-white/10`

### T3 — Permission-mode 樣式搬離 global CSS
- 刪除 `App.css` 中所有 `.send-btn` + `[data-permission-mode]:focus-within` 規則（約 40 行）
- ComposeToolbar 的 send button 改用 Tailwind `data-[mode=<x>]:bg-*` 變體（button 自帶 `data-mode={permissionMode}`）
- ChatInputArea outer div 的 focus-within border / shadow 改用 `focus-within:data-[mode=<x>]:border-* / shadow-*` 組合
- 新增三個 rgb-split token（兩主題各一份）以支援 shadow 表達：
  - `--color-accent-rgb`（已存在，dark/light 各一）
  - `--color-button-rgb` ← **新增**
  - `--color-text-rgb` ← **新增**

### T4 — 不變部分，以測試鎖定
- `data-theme="dark"` 下所有 InputArea 相關 computed color 與改動前 byte-identical（bg / border / hover overlay rgb / focus shadow rgb 全部）
- `text-white` 用於橘/藍/紅強色背景上的前景（send/stop button、modal active pill 等）保留 — 對比兩主題都足夠
- `bg-red-500` 錄音指示保留

### Out of scope
- `.send-btn` 在 `acceptEdits` 模式 dark 下的白字對比 bug（另開 follow-up）
- VS Code webview 整合機制（原本 `var(--vscode-*)` fallback 不再保留，已跟使用者確認）

## Capabilities

### Modified Capabilities
- `theme-token-adoption`: 新增「InputArea tokens 隨 data-theme 切換」、「避免單一區塊冗餘 token 別名」、「permission-mode 視覺不得依賴 global CSS selector」三條 requirement

## Impact

- 修改：
  - `packages/client/src/App.css`（刪 chat-input-* token、刪 `.send-btn` + permission-mode focus-within 規則、新增 rgb token、新增 hover-tint utilities）
  - `packages/client/src/components/ChatInputArea.tsx`
  - `packages/client/src/components/ComposeToolbar.tsx`（send button data-mode + Tailwind variants）
  - `packages/client/src/components/ui/IconButton.tsx`
  - `PermissionModePicker.tsx` / `AddButton.tsx` / `ReviewUpsellBanner.tsx` / `MentionDropdown.tsx` / `command-menu/CommandMenu.tsx` / `ModelPickerPopover.tsx`（hover tint class 替換）
- 新增測試：
  - `ChatInputArea.theme.test.tsx`（bg/border/focus-shadow 隨 theme/mode 切換）
  - `IconButton.theme.test.tsx`（hover overlay rgb 隨 theme）
  - `tools/` 或 vitest 的 CSS 解析測試（rgb token 替代完成、no `.send-btn` rule）
- 風險：
  - Tailwind v4 `data-[mode=...]` variant 在 JIT 下展開，需確認類別完整覆蓋五個 permission mode；由測試 + 目視 dev server 驗證
  - jsdom 對 CSS var 解析能力可能不足以驗證 computed color，fallback 在 design.md D5
  - VS Code webview 嵌入模式下顏色不再跟宿主（已接受）
