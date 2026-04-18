## 1. Phase 0 — Storybook baseline 前置

- [x] 1.1 跑 `pnpm -C packages/client build-storybook` 確認現有 60 個 stories build 通過
- [x] 1.2 修掉 build 失敗或明顯壞掉的既有 stories（擴 `withStoryApp`/`withStoryChannel` providers、修 9 個 broken play functions）
- [x] 1.3 安裝 `@storybook/test-runner` 並於 `packages/client/package.json` 加 `test-storybook` / `test-storybook:ci` scripts
- [x] 1.4 `.storybook/test-runner.ts` 設定 clipboard permission；a11y 以 `preview.ts` `a11y: { test: 'todo' }` 非 block（visual snapshot 延後至 baseline commit）
- [x] 1.5 `test-storybook:ci` 70/70 suites、284/284 tests 全綠

## 2. Phase 0 — 補齊 components stories（22 個，一檔一 commit）

- [x] 2.1 `ActionsTab.stories.tsx`
- [x] 2.2 `ActivityBar.stories.tsx`
- [x] 2.3 `AddProjectDialog.stories.tsx`
- [x] 2.4 `ChatInputArea.stories.tsx`
- [x] 2.5 `CollapsibleTimeline.stories.tsx`
- [x] 2.6 `CommandPalette.stories.tsx`
- [x] 2.7 `EditorArea.stories.tsx`
- [x] 2.8 `EmptyState.stories.tsx`
- [x] 2.9 `FileTree.stories.tsx`
- [x] 2.10 `FilterPopover.stories.tsx`
- [x] 2.11 `MessageNodeList.stories.tsx`
- [x] 2.12 `ProjectCard.stories.tsx`
- [x] 2.13 `ProjectContextMenu.stories.tsx`
- [x] 2.14 `ProjectList.stories.tsx`
- [x] 2.15 `QuestionContent.stories.tsx`
- [x] 2.16 `RawEventFilterBar.stories.tsx`
- [x] 2.17 `ResumeSessionsDialog.stories.tsx`
- [x] 2.18 `SessionDropdown.stories.tsx`
- [x] 2.19 `SideQuestionDialog.stories.tsx`
- [x] 2.20 `SubagentChildren.stories.tsx`
- [x] 2.21 `ToolbarDialogs.stories.tsx`
- [x] 2.22 `VisibilityGroupRow.stories.tsx`

## 3. Phase 0 — 補齊 features stories

- [x] 3.1 盤點結果：features 下只有 `AccountUsageDialog` 與 `RewindDialog` 兩個 UI 元件，皆已有 story；其餘 `*-feature.tsx` 皆為 MenuItemFeature factory 無獨立 UI
- [x] 3.2 無需新增

## 4. Phase 0 — Baseline commit

- [ ] 4.1 所有新 stories 跑 `test-storybook:ci` 綠燈
- [ ] 4.2 commit Storybook snapshot baseline 進本分支
- [ ] 4.3 （可選）在 `main` 分支同步建立 snapshot baseline，供之後 diff 對比

## 5. Phase 1 — CSS vars 拆解

- [ ] 5.1 在 `App.css` 新增 `:root[data-theme="dark"] { ... }`，把現行 `@theme` 區塊的 `--color-*` 值搬進去
- [ ] 5.2 新增 `:root[data-font="sm"|"md"|"lg"]` 定義 base font-size（md = 現值）
- [ ] 5.3 保留 `@theme` 中非顏色的設定（`--font-sans`、`--font-mono` 等）
- [ ] 5.4 建立 `tools/dump-css-vars.ts`（Playwright script），輸出 `<html>` 的 computed CSS vars JSON
- [ ] 5.5 在 `main` 分支執行並存 `tools/snapshots/css-vars-baseline.json`
- [ ] 5.6 在本分支執行並 diff 驗證完全相同

## 6. Phase 1 — Preferences store 擴充

- [ ] 6.1 於 `usePreferencesStore` 新增 `colorTheme` / `fontSize` / `density` / `layout` / `hiddenItems` 欄位與 setters
- [ ] 6.2 新增 `applyPreset(name)` helper 與 preset 定義
- [ ] 6.3 以 zustand `persist` `version` + `migrate` 處理舊 localStorage 資料，補入新欄位預設值
- [ ] 6.4 寫 unit test：預設值、setter、preset apply、migration

## 7. Phase 1 — App.tsx 套用

- [ ] 7.1 在 `App.tsx` 加 `useEffect`，從 store 讀取 `colorTheme` / `fontSize` / `density` 寫入 `document.documentElement.dataset`
- [ ] 7.2 訂閱 store 變動同步更新（store subscribe 或 selector + effect）
- [ ] 7.3 寫 component test：mount 後 `<html>` 有正確 data-attr；setter 觸發後同步

## 8. Phase 1 — 驗證

- [ ] 8.1 `pnpm -C packages/client test` 全綠
- [ ] 8.2 `pnpm -C packages/client typecheck` 全綠
- [ ] 8.3 `pnpm -C packages/client lint` 全綠
- [ ] 8.4 `pnpm -C packages/client test-storybook:ci` 全綠，無 visual diff
- [ ] 8.5 `tools/dump-css-vars.ts` 輸出與 baseline diff 為空
- [ ] 8.6 手動 smoke：`pnpm -C packages/client dev` 開起來，肉眼比對首頁、聊天畫面、各 dialog
