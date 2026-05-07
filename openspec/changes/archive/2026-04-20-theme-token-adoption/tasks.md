## 1. 盤點：找出所有寫死 hex / rgb

- [x] 1.1 寫 `tools/lint-hardcoded-colors.mjs`（掃 `apps/web/src/**/*.tsx` inline style 的 color literal；allow-list: `transparent`, `currentColor`, `var(...)`-wrapped, `url(...)`）
- [x] 1.2 執行現況 scan，產出初始 hit list（預期：CommandPalette / PaletteMessageList 為大宗）
- [x] 1.3 把 hit list 歸類：「需新增 token」vs「用現有 token」vs「allow-list 例外」

## 2. Design token 擴充

- [x] 2.1 在 `App.css` 的 `:root[data-theme="dark"]` 區塊新增 `--color-overlay` / `--color-floating-bg-from` / `--color-floating-bg-to` / `--color-floating-border` / `--color-floating-shadow` / `--color-row-active-bg` / `--color-row-active-border` / `--color-accent-glow`（值從 task 1 的 dark 現值複製）
- [x] 2.2 在 `:root[data-theme="light"]` 區塊為同樣 token 選 light palette 值（參考 design.md D5）
- [x] 2.3 Tailwind v4 `@theme` 暴露對應 utility（可 utility 化的）
- [~] 2.4 Playwright CSS vars dump：確認新 token 在 dark 下 computed value 跟 task 1 原寫死值完全一致（光暗切換才是唯一差異）

## 3. 替換 consumer

- [x] 3.1 CommandPalette.tsx：所有 inline style hex 改成 token 或 Tailwind class
- [x] 3.2 PaletteMessageList.tsx：同上
- [x] 3.3 grep 掃其他仍 hit lint 的檔案，逐一修
- [x] 3.4 lint-hardcoded-colors 跑 0 hit

## 4. Playwright floating snapshot

- [~] 4.1 `tools/dump-theme-variants.mjs` 加 `--with-floating` flag：打開一個 minimum fixture（CommandPalette 開啟狀態），再截圖 + dump computed style
- [~] 4.2 在 main 分支跑 baseline（dark + comfortable + floating），存 `tools/snapshots/theme-variants/dark-comfortable-floating.{json,png}`
- [~] 4.3 本分支跑四組合（+ floating），產 baseline
- [~] 4.4 dark-comfortable-floating diff：dark 與修改前視覺一致（token 值沒動）

## 5. Storybook Light variants

- [x] 5.1 CommandPalette.stories.tsx Light variant 改為實際 assert floating background 非 dark palette（play function）
- [x] 5.2 SettingsDialog.stories.tsx 補 Light variant 對照
- [x] 5.3 PaletteMessageList.stories.tsx 補 Light variant
- [x] 5.4 AlertBanner.stories.tsx 補 Light variant（warning / error 在 light 下對比）
- [x] 5.5 FeatureRow.stories.tsx 補 Light variant（group + flat 兩種）
- [x] 5.6 test-storybook:ci 全綠

## 6. 驗證

- [x] 6.1 vitest + typecheck + biome clean
- [x] 6.2 lint-hardcoded-colors 0 hit
- [x] 6.3 test-storybook:ci 全綠
- [~] 6.4 DEFERRED: dump-theme-variants + floating 4 組合成功，dark-comfortable baseline 無 diff
- [x] 6.5 手動：dev server 切換 dark↔light，CommandPalette / SettingsDialog 都正確響應
- [x] 6.6 commit + archive
