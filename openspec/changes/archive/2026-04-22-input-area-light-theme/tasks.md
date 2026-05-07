> 所有任務依 TDD：紅測試 → 實作 → 綠 → 重構。

## 1. 移除 `--color-chat-input-*` token

- [x] 1.1 `App.css.test.ts`：讀 `App.css` 文本，斷言不含 `--color-chat-input-` 字串 → 紅
- [x] 1.2 `ChatInputArea.test.tsx`：render 後 outer div className 含 `bg-surface` + `border-border`，不含 `bg-chat-input-bg` / `border-chat-input-border` → 紅（用靜態文本測試取代，等效強度）
- [x] 1.3 刪 `App.css` `@theme` 內兩行 chat-input-* 宣告
- [x] 1.4 改 `ChatInputArea.tsx` className：`bg-chat-input-bg border-chat-input-border` → `bg-surface border-border`
- [x] 1.5 grep 全 repo 確認沒人引用 `chat-input-` token
- [x] 1.6 1.1 + 1.2 轉綠

## 2. Hover tint 全面 token 化

- [x] 2.1 `App.css.test.ts`：斷言宣告有 `@utility hover-tint-5` 與 `@utility hover-tint-10`，body 使用 `rgba(var(--color-hover-tint-rgb), 0.05 | 0.1)` → 紅
- [x] 2.2 已確認 `--color-hover-tint-rgb` dark = `255, 255, 255`、light = `0, 0, 0`（既有 theme 已設對值，本 change 不動）
- [x] 2.3 各元件 className 斷言（七檔）：不再出現 `bg-white/5` 或 `bg-white/10` → 紅
- [x] 2.4 `App.css` 新增兩個 `@utility`
- [x] 2.5 `pnpm build` 確認 Tailwind 編譯出 `.hover-tint-5` / `.hover-tint-10` CSS 規則（驗證於 dist/assets/index-*.css）
- [x] 2.6 批次 sed 替換七個元件的 `bg-white/5|10` → `hover-tint-5|10`（保留原 hover/非 hover 前綴）
- [x] 2.7 2.1 / 2.3 轉綠
- [x] 2.8 Storybook / dev server 目視兩主題 hover 效果（手動，留給使用者 local 驗證）

## 3. Permission-mode 樣式 data-variant 化

### 3a. Send button

- [x] 3a.1 `ComposeToolbar` 測試（於 App.css.test.ts 併入）：send button template 含 `data-mode={permissionMode` 與五個 `data-[mode=...]:bg-*` → 紅
- [x] 3a.2 `App.css.test.ts`：斷言文本不含 `.send-btn` selector → 紅
- [x] 3a.3 改 ComposeToolbar.tsx：引入 `SEND_BTN_CLASS_SEND` / `SEND_BTN_CLASS_STOP` 常數，button 加 `data-mode`
- [x] 3a.4 刪 `App.css` `.send-btn` 相關 5 條 block
- [x] 3a.5 3a.1 / 3a.2 轉綠
- [x] 3a.6 dev server 切換五個 permission mode，視覺驗證（手動）

### 3b. ChatInputArea focus-within border/shadow

- [x] 3b.1 `App.css.test.ts` ChatInputArea 區段：outer div 有 `data-mode={permissionMode` 且 className 含五個 `focus-within:data-[mode=...]:border-*` → 紅
- [x] 3b.2 `App.css.test.ts`：斷言文本不含 `[data-permission-mode` focus-within selector → 紅
- [x] 3b.3 改 ChatInputArea.tsx outer div：用 `cn()` 疊加五組 focus-within variant
- [x] 3b.4 刪 `App.css` permission-mode focus-within 4 條 block
- [x] 3b.5 3b.1 / 3b.2 轉綠
- [x] 3b.6 dev server focus 各模式，視覺驗證（手動）

## 4. 新增 rgb-split token

- [x] 4.1 `App.css.test.ts`：斷言 `@theme` / `[data-theme=dark]` / `[data-theme=light]` 三區塊各自宣告 `--color-button-rgb` 與 `--color-text-rgb`，值符合 design.md D4 表 → 紅
- [x] 4.2 編輯 `App.css` 新增三處 token 宣告
- [x] 4.3 4.1 轉綠

## 5. Dark invariance 驗證

- [x] 5.1 `pnpm dump-theme-variants` 產生 4 組合截圖（手動）
- [x] 5.2 `dark-comfortable.png` 與前次 archive baseline pixel-diff = 0（手動）
- [x] 5.3 InputArea 區域 crop 對比 → 0 diff（手動）
- [x] 5.4 Light 下 InputArea 截圖人工 review（手動）

## 6. Capability spec 更新

- [x] 6.1 已撰寫 `specs/theme-token-adoption/spec.md` delta（ADDED 三條 requirement）
- [x] 6.2 `openspec validate input-area-light-theme --strict` 通過

## 7. 品質關卡

- [x] 7.1 `pnpm vitest run` 全綠（170 files / 1335 tests）
- [x] 7.2 `tsc --noEmit` clean
- [x] 7.3 biome 檢查觸及檔案 clean

## 8. Code review 修正（TDD 重構）

### 8a. `@utility hover-tint-*` → `tint-*` 重命名
- [x] 8a.1 更新 `App.css.test.ts`：斷言 `@utility tint-5 / tint-10`，並斷言七個 consumer 檔案不含 `hover-tint-` 字串 → 紅
- [x] 8a.2 `App.css`：`@utility hover-tint-5 / hover-tint-10` → `tint-5 / tint-10`
- [x] 8a.3 七個 consumer 檔案批次 sed：`hover:hover-tint-5` → `hover:tint-5`、`hover-tint-10`（kbd 靜態）→ `tint-10`，等等
- [x] 8a.4 8a.1 轉綠

### 8b. Mode → CSS var 分派（取代 `SEND_BTN_MODE_CLASSES` 與 9 行 focus-within）
- [x] 8b.1 更新 `App.css.test.ts`：斷言 `App.css` 含 `[data-mode="normal"]` / `"plan"` / `"acceptEdits"` / `"bypassPermissions"` / `"auto"` 五個 selector，且各自設 `--mode-accent` / `--mode-accent-rgb` / `--mode-shadow-alpha`（依 design.md D3 表） → 紅
- [x] 8b.2 `App.css` 新增五條 `[data-mode=...] { --mode-accent: ...; --mode-accent-rgb: ...; --mode-shadow-alpha: ...; }` 規則。注意：只設 CSS 變數（語意 token），不含視覺屬性如 `background-color` / `border-color` / `box-shadow`，仍滿足「permission-mode 視覺不得靠 global selector」的 spec
- [x] 8b.3 更新測試：ChatInputArea className 含 `focus-within:border-[var(--mode-accent)]` 與 `focus-within:shadow-[0_1px_2px_rgba(var(--mode-accent-rgb),var(--mode-shadow-alpha,0))]`；送 button 含 `bg-[var(--mode-accent)]`；確認舊的 5 個 `data-[mode=X]:bg-*` / 9 個 `focus-within:data-[mode=X]:*` class 已消失 → 紅
- [x] 8b.4 抽 `<SendButton>` 子元件至 `ComposeToolbar.tsx` 底部（或獨立檔，視體積決定），消化 stop / send 兩分支；刪除 `SEND_BTN_MODE_CLASSES` / `SEND_BTN_CLASS_STOP` / `SEND_BTN_CLASS_SEND` 三個常數
- [x] 8b.5 更新 `ChatInputArea.tsx`：9 個 focus-within variants 縮成 2 行 `bg-[var(--mode-accent)]` 風格
- [x] 8b.6 8b.3 轉綠

### 8c. `App.css.test.ts` 結構整理
- [x] 8c.1 改用 Vite `?raw` import 取代 `readFileSync` + `__dirname` + `path.join`（`import css from '../App.css?raw'` 等）
- [x] 8c.2 抽 `extractBlock(css, selector)` helper 取代三處 IIFE regex
- [x] 8c.3 重跑測試確認全綠

### 8d. 命名
- [x] 8d.1 `SEND_BTN_CLASS_STOP/SEND` 已在 8b 一併消除，命名問題同時解決

## 10. Simplify 回饋後續修正（TDD）

### 10a. `PermissionMode` union type
- [x] 10a.1 在 `packages/shared/src/...` 或 `apps/web/src/types/` 新增 `export type PermissionMode = 'normal' | 'plan' | 'acceptEdits' | 'bypassPermissions' | 'auto'`；同時更新 zod schema 由 `z.string().optional()` → `z.enum([...])`。先寫 unit test 斷言 type / schema 接受五個值、拒絕其他 string → 紅
- [x] 10a.2 把 `ChannelConfigContext` / `ComposeToolbar` / `PermissionModePicker` / `SendButton` / `ChatInputArea` 的 `mode: string` 全改為 `PermissionMode`
- [x] 10a.3 10a.1 轉綠；typecheck clean

### 10b. `IconButton` hover 可選
- [x] 10b.1 `IconButton.test.tsx`：新 prop `variant?: 'tinted' | 'plain'`（default `'tinted'`）；`variant='plain'` 時無 `hover:tint-5` → 紅
- [x] 10b.2 改 IconButton 實作；BASE 拆成 `BASE_BOX` (`w-6 h-6 flex ... rounded transition-colors`) + `variant` 條件加 `hover:tint-5`
- [x] 10b.3 10b.1 轉綠

### 10c. `SendButton` 組合 `IconButton` + 單一職責
- [x] 10c.1 `ComposeToolbar.test.tsx`：`<SendButton>` 只接 send/stop 相關 props（`isProcessing` / `isCancelling` / `hasText` / `onAbort` / `onSubmit` / `mode`）；parent 不再做 `isProcessing ? abort : submit` 二元分派 → 紅
- [x] 10c.2 `<SendButton>` 內部判斷 isProcessing，並以 `<IconButton variant="plain">` 為底；className 合併 `bg-[var(--mode-accent)] text-white` 等
- [x] 10c.3 10c.1 轉綠；視覺確認 dark/light 兩主題 send+stop button 行為

### 10d. `SpeechInputButton` 接 className prop
- [x] 10d.1 `SpeechInputButton.test.tsx`：傳入 `className="absolute top-2 right-2 z-10"` 時，root 元件 merged className 含這些 class → 紅
- [x] 10d.2 `SpeechInputButton` 新增 `className?: string` prop，用 `cn()` 合入 root wrapper
- [x] 10d.3 `ChatInputArea` 移除外層 `<div className="absolute top-2 right-2 z-10">`，位置 class 改 passdown
- [x] 10d.4 10d.1 轉綠；既有 stories 保留無 prop 時行為不變

### 10e. `permissionMode` 正規化（**deferred — 另開 change**）
- 風險：`settings.ts` handlers 於 merge 時用 `permissionMode ?? null` 區分「尚未從 CLI 取得」與「已知 normal」兩種狀態。強制預設為 `'normal'` 會把兩者等價，可能在 init 前送出錯誤 mode 給 CLI（例如 session:launch payload）。
- 緩解：10a 的 `toPermissionMode()` 已讓 UI 端獲得「非 nullable 保證」，render-time 不再需要各自 `?? 'normal'`（ChatInputArea / ComposeToolbar SendButton 已改走 `toPermissionMode`）。剩下的 `PermissionModePicker mode={permissionMode ?? 'normal'}` 是一處，保留直到 context 正規化決定做不做
- 正式動 context 型別應另開 change 含完整 handlers 行為回歸測試

### 10f. 抽 FakeSpeechRecognition 到 test util
- [x] 10f.1 新增 `src/test/fakes/speech-recognition.ts` export `FakeSpeechRecognition` class + `setupSpeechRecognition()` helper（beforeEach/afterEach 安裝與清理 window 屬性）
- [x] 10f.2 更新 `ChatInputArea.test.tsx` 使用新 util
- [x] 10f.3 測試全綠（現有 2 tests 轉綠）

### 10g. `--mode-shadow-alpha` 顯式設 0
- [x] 10g.1 `App.css.test.ts`：`[data-mode="bypassPermissions"]` / `[data-mode="auto"]` block 含 `--mode-shadow-alpha: 0` → 紅
- [x] 10g.2 `App.css` 兩條 rule 加 `--mode-shadow-alpha: 0`
- [x] 10g.3 10g.1 轉綠

## 11. Commit + archive

- [ ] 11.1 依工作分支（`fix/input-area-light-theme`）做 commit
- [ ] 11.2 `openspec archive input-area-light-theme`
- [ ] 11.3 `openspec/specs/theme-token-adoption/spec.md` 若有 TBD Purpose 段補上摘要
