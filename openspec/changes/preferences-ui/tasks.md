## 1. Phase A — color-theme feature

- [x] 1.1 寫 `features/color-theme/__tests__/color-theme-feature.test.ts`（TDD）：execute 循環切 dark/light；trailing 顯示當前值
- [x] 1.2 實作 `features/color-theme/color-theme-feature.tsx` 直到 1.1 綠
- [x] 1.3 在 `CommandMenu.tsx` import 與註冊（`Settings` section, order 10）
- [x] 1.4 新增 `color-theme-feature.stories.tsx`

## 2. Phase A — density feature

- [x] 2.1 寫 `features/density/__tests__/density-feature.test.ts`
- [x] 2.2 實作 `features/density/density-feature.tsx`
- [x] 2.3 在 `CommandMenu.tsx` 註冊（order 11）
- [x] 2.4 新增 story

## 3. Phase A — open-settings feature

- [x] 3.1 寫 `features/open-settings/__tests__/open-settings-feature.test.ts`（execute 呼叫 onOpen callback）
- [x] 3.2 實作 `features/open-settings/open-settings-feature.ts`
- [x] 3.3 skipped story (callback-only, no visual trailing per instructions)

## 4. Phase B — SettingsDialog

- [x] 4.1 寫 `components/SettingsDialog.stories.tsx`（Closed / Open 兩個 variant）
- [x] 4.2 寫 `components/__tests__/SettingsDialog.test.tsx`（radio click → store update）
- [x] 4.3 實作 `components/SettingsDialog.tsx`（Radix Dialog + 3 個 radio group + live-save + Close 按鈕）
- [x] 4.4 確認 test/story 全通

## 5. Phase B — ActivityBar gear

- [x] 5.1 在 `ActivityBar.tsx` 新增 gear icon 按鈕（`mt-auto` 貼底）與 onClick
- [x] 5.2 在 `WorkspaceLayout.tsx` 持有 `settingsOpen` state，接 ActivityBar 與 SettingsDialog；以 `openSettingsSignal` 讓 CommandMenu 可觸發開啟
- [x] 5.3 open-settings feature 在 `CommandMenu.tsx` 註冊時傳入 `openSettingsSignal.setOpen(true)`
- [x] 5.4 更新 `ActivityBar.stories.tsx` 加 `WithSettingsGear` variant

## 6. 整合驗證

- [x] 6.1 `pnpm -C packages/client test` 全綠（1211 passed, was 1194）
- [x] 6.2 `pnpm -C packages/client` typecheck clean
- [x] 6.3 `pnpm -C packages/client test-storybook:ci` 95 suites / 356 tests 綠
- [x] 6.4 biome lint clean（僅剩 2 infos）
- [ ] 6.5 手動 smoke（留給 reviewer）
- [ ] 6.6 commit + `/opsx:archive preferences-ui`（reviewer 自行處理）
