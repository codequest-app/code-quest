## Context

`light-theme-and-density` 讓 `:root[data-theme="light"]` 覆寫所有通用 semantic token。但 `ChatInputArea` 與其內部元件仍有三類漏洞 —（1）專屬 token 沒 light 覆寫（2）多處 `bg-white/*` 硬編碼（3）permission-mode 樣式靠 `App.css` global selector + 寫死 rgb。本 change 一次收斂。

```
問題 1：冗餘 token                                問題 2：hover tint 硬編碼
@theme {                                         IconButton, PermissionModePicker,
  --color-chat-input-bg ← 與 surface 等值          AddButton, ReviewUpsellBanner,
  --color-chat-input-border ← 與 border 等值       MentionDropdown, CommandMenu,
}  [data-theme="light"] 缺覆寫 → dark 外觀         ModelPickerPopover
                                                 全部 `bg-white/5` 或 `bg-white/10`
問題 3：permission-mode global CSS
App.css .send-btn + focus-within → 5 條 mode 規則，其中三條 rgba 寫死
```

## Goals / Non-Goals

**Goals**
- InputArea 所有 runtime color 經 CSS var / Tailwind token 取得，`data-theme` 切換時全跟
- 刪除冗餘 token 與 global CSS（`.send-btn` + permission-mode focus-within）
- Dark theme byte-identical（computed style diff = 0 於 InputArea 區域）
- 以 vitest 鎖定主題切換與 permission-mode 切換的 computed color 行為，TDD

**Non-Goals**
- 不改非 InputArea 元件（除非它們共用的 `IconButton`／其他 UI primitive 需一併修）
- 不修 `acceptEdits` 模式 dark 白字對比 bug（另開 change）
- 不支援 VS Code webview 色票繼承

## Decisions

### D1. 移除 `--color-chat-input-*` token

對照：dark 下 `chat-input-bg` = `#252526` = `--color-surface`；`chat-input-border` = `#3e3e42` = `--color-border`。兩組完全等價。

改法：class `bg-chat-input-bg border-chat-input-border` → `bg-surface border-border`；`@theme` 區塊刪 2 行。dark byte-identical。

### D2. Hover tint utility

首選：`App.css` 新增兩個 `@utility`：

```css
@utility hover-tint-5 {
  background-color: rgba(var(--color-hover-tint-rgb), 0.05);
}
@utility hover-tint-10 {
  background-color: rgba(var(--color-hover-tint-rgb), 0.10);
}
```

使用：`hover:hover-tint-5` / `hover:hover-tint-10`。

為什麼用 utility 而非 arbitrary value？
- 語意明確、可 grep
- 使用點多（6+ 檔案），utility 能減少字串重複
- 避免 Tailwind 對 `hover:bg-[rgba(var(--x),0.05)]` 的 JIT 解析疑慮（已知邊緣案）

替代（若 `@utility` 與 `hover:` variant 組合在 Tailwind v4 有問題）：直接用 arbitrary value `hover:bg-[rgba(var(--color-hover-tint-rgb),0.05)]`。task 2.1 紅綠階段決定。

Dark 不變驗證：`--color-hover-tint-rgb` dark = `255,255,255`，展開 = `rgba(255,255,255,0.05)` = 舊 `bg-white/5` 值完全相同。

### D3. Permission-mode 樣式 data-variant 化

**Button bg** — ComposeToolbar send button 加 `data-mode={permissionMode}`，className 用 Tailwind v4 `data-[mode=...]:` 變體：

```tsx
<button
  data-mode={permissionMode ?? 'normal'}
  className={cn(
    'send-btn-base',  // 純形狀 class (w-6 h-6 ...)，不含色
    'data-[mode=normal]:bg-[--color-claude-clay-orange]',
    'data-[mode=acceptEdits]:bg-[--color-text]',
    'data-[mode=plan]:bg-[--color-button]',
    'data-[mode=bypassPermissions]:bg-[--color-danger]',
    'data-[mode=auto]:bg-[--color-danger]',
  )}
>
```

**Focus-within border + shadow** — 現在在 ChatInputArea outer div 的 `[data-permission-mode="..."]:focus-within` 選擇器。改為同一 div 帶 `data-mode`，Tailwind variant 組合：

```tsx
<div
  data-mode={permissionMode ?? 'normal'}
  className={cn(
    'rounded-xl bg-surface border border-border ...',
    'focus-within:data-[mode=normal]:border-accent',
    'focus-within:data-[mode=normal]:shadow-[0_1px_2px_rgba(var(--color-accent-rgb),0.2)]',
    'focus-within:data-[mode=plan]:border-button',
    'focus-within:data-[mode=plan]:shadow-[0_1px_2px_rgba(var(--color-button-rgb),0.2)]',
    'focus-within:data-[mode=acceptEdits]:border-text',
    'focus-within:data-[mode=acceptEdits]:shadow-[0_1px_2px_rgba(var(--color-text-rgb),0.1)]',
    'focus-within:data-[mode=bypassPermissions]:border-danger',
    'focus-within:data-[mode=auto]:border-danger',
  )}
>
```

移除 App.css 的 `.send-btn` 5 條 block 與 permission-mode focus-within 4 條 block（共 ~40 行）。

### D4. 新增 rgb-split token

`--color-accent-rgb` 已存在。新增：

| Token | dark 值 | light 值 | 對應實色 |
|---|---|---|---|
| `--color-button-rgb` | `0, 120, 212` | `0, 90, 158` | dark `#0078d4`, light `#005a9e` |
| `--color-text-rgb` | `204, 204, 204` | `31, 31, 31` | dark `#cccccc`, light `#1f1f1f` |

兩個 token 都在 `@theme`（dark 預設）+ `[data-theme="dark"]` + `[data-theme="light"]` 三處同步宣告。

### D5. 測試策略（jsdom 限制的應對）

jsdom 對 `getComputedStyle` 解 CSS var **支援完整的 css-parse**，但對 Tailwind arbitrary class（e.g. `bg-[rgba(var(--x),0.5)]`）不展開，因為 jsdom 不跑 Tailwind。解法：

1. **對 CSS var 本身**：讀 `document.documentElement` 的 `getPropertyValue('--color-hover-tint-rgb')` → 斷言兩主題不同值。
2. **對元件 className**：斷言 className 包含預期的 utility / arbitrary value 字串。
3. **對 App.css 靜態內容**：vitest 讀 `App.css` 原始文本，regex 確認：
   - 沒有 `.send-btn` / `[data-permission-mode]:focus-within` selector
   - 沒有 `rgba(217, 119, 87, 0.2)` 等 hardcoded rgb 片段
   - 新 rgb token 三處都有宣告
4. **端對端**：`dump-theme-variants` 截圖比對（D6）。

放棄「直接測 computed background-color = '#f3f3f3'」這條路 — jsdom 無法執行 Tailwind pipeline。

### D6. Dark invariance 驗證

1. `pnpm dump-theme-variants` 產生 4 組合截圖
2. `dark-comfortable.png` 與 `light-theme-and-density` archive 時的 baseline pixel-diff = 0（非 InputArea 區域）
3. InputArea 區域在 dark 下截圖 crop 後與 baseline pixel-diff = 0
4. Light 下 InputArea 截圖人工 review

## TDD 順序

每個子項目都是「紅 → 綠 → 重構」循環：

1. **T1 chat-input-* token** — 寫 CSS 文本測試（App.css 不含 `--color-chat-input-`）→ 紅 → 刪 token + 改 className → 綠
2. **T2 hover-tint utility** — 寫測試（`--color-hover-tint-rgb` 兩主題值不同 + 六個元件 className 改為 `hover-tint-5/10`）→ 紅 → 新增 utility + 批次替換 → 綠
3. **T3a Button data-mode** — 寫測試（send button 有 `data-mode` attr 且 className 含五個 `data-[mode=...]:bg-*`）→ 紅 → 改 ComposeToolbar + 刪 `.send-btn` CSS → 綠
4. **T3b Focus shadow data-mode** — 寫測試（outer div 有 `data-mode` + 預期的 `focus-within:data-[mode=...]:shadow-[...]` class + App.css 不含 `[data-permission-mode]:focus-within`）→ 紅 → 改 ChatInputArea + 刪 CSS → 綠
5. **T4 rgb token** — 寫測試（`--color-button-rgb` / `--color-text-rgb` 兩主題值符合預期）→ 紅 → 新增 token → 綠
6. **Dark invariance** — dump-theme-variants 比對 baseline → 綠

## Risks

- **Tailwind v4 `data-[mode=...]` variant 組合** — 與 `focus-within:` / arbitrary value 嵌套時需確認展開正確，task 3.3 跑 storybook / dev server 肉眼驗證。若失敗，退到小型 CSS module 封裝 permission-mode 樣式（仍比 global selector 好）。
- **`@utility` 與 `hover:` 組合** — Tailwind v4 `@utility` 支援 variant prefix，task 2.3 驗證；失敗退到 arbitrary value。
- **dark byte-identical** — `--color-claude-clay-orange` 在 `[data-theme="dark"]` / `[data-theme="light"]` 都是 `#c6613f`，send button normal 模式改走這個 token 後 dark 值不變；但 `.send-btn` CSS 原本就用同一個 token，所以 byte-identical 成立。焦點 shadow 新/舊值展開後 rgb/alpha 一致（依 D4 表）。
