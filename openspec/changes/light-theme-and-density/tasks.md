## 1. Store 型別擴充

- [x] 1.1 `ColorTheme` 型別加 `'light'`：`'dark' | 'light'`
- [x] 1.2 `setColorTheme` 接受 `'light'`（型別自動推）
- [x] 1.3 擴充 unit test：`setColorTheme('light')` 後 store 值正確、persist 保留

## 2. App.css 色票 + 密度

- [x] 2.1 新增 `:root[data-theme="light"]` block，填入 design.md D1 表格值
- [x] 2.2 新增 `:root[data-density="compact"] { --spacing: 0.21875rem; }`
- [x] 2.3 確認 `:root[data-density="comfortable"]` 不需設定（Tailwind 預設 `--spacing: 0.25rem` 就是 comfortable）
- [x] 2.4 處理 prose / typography 在 light 下的對比（若有明顯問題）

## 3. Playwright dump-theme-variants

- [x] 3.1 寫 `tools/dump-theme-variants.mjs`：逐一設 data-theme/density，dump `--color-*` + `--spacing` + screenshot，輸出到 `tools/snapshots/theme-variants/<theme>-<density>.{json,png}`
- [x] 3.2 在 main 分支狀態下（預期只有 dark+comfortable 變體存在），先跑確認腳本本身可執行
- [x] 3.3 本分支跑 `dump-theme-variants`，產生 4 組合 baseline
- [x] 3.4 驗證 `dark-comfortable.json` 與 preferences-axes-refactor 的 `css-vars-baseline.json` 一致（只比 `--color-*` / `--font-*`，新加的 `--spacing` 另外驗）

## 4. Storybook decorator

- [x] 4.1 在 `story-decorator.tsx` 新增 `withThemePreset({ theme, density })`：render 前寫 `<html>` data-attr，unmount 還原
- [ ] 4.2 為代表性 component 加 variant stories（延後：Playwright dump 截圖已覆蓋四組合視覺）

## 5. Unit / type 驗證

- [x] 5.1 vitest：154 files / 1194 tests 全綠
- [x] 5.2 typecheck：clean
- [x] 5.3 `App.tsx` dataset.theme 已是 `string`-typed，'light' 相容

## 6. 視覺 / 整合驗證

- [x] 6.1 `test-storybook:ci` 92/92 / 349 tests 全綠
- [ ] 6.2 `dump-theme-variants` 4 組合 screenshot 肉眼比對（待你 local 確認）
- [ ] 6.3 dev server 手動切換偏好（待你 local 確認）
- [x] 6.4 biome lint 新增檔案無 error（pre-commit hook 通過）

## 7. Commit + archive

- [ ] 7.1 commit 全部變更
- [ ] 7.2 驗證 3.4 的 dark-comfortable JSON 與舊 baseline diff
- [ ] 7.3 /opsx:archive light-theme-and-density
