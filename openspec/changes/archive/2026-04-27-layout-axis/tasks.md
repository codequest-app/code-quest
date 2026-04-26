> **STATUS: REVERTED** — implementation was completed then reverted per user decision. The `layout: 'a' | 'b'` axis proved the pipeline works but the visual design remained out of scope and the feature is not needed at this time. Proposal/design kept for reference.

## 1. Feature factory

- [~] 1.1 寫 `features/layout/__tests__/layout-feature.test.ts`（TDD）
- [~] 1.2 實作 `features/layout/layout-feature.ts` via `createChoiceFeature`
- [~] 1.3 新增 `layout-feature.stories.tsx`（A / B 兩個 story）

## 2. CSS + App sync

- [~] 2.1 App.css：新增 `:root[data-layout="a"]` / `:root[data-layout="b"]` blocks（定義 `--sidebar-width` 等 vars）
- [~] 2.2 App.tsx：把 `layout` 同步到 `document.documentElement.dataset.layout`
- [~] 2.3 WorkspaceLayout 或相關 component 改用 CSS var 控制寬度（若目前是寫死 `w-[16rem]` 之類）
- [~] 2.4 App test 驗證 `<html data-layout="...">` 正確

## 3. UI 入口

- [~] 3.1 CommandPalette.tsx：註冊 layout feature
- [~] 3.2 SettingsDialog.tsx：新增 Layout radio group
- [~] 3.3 SettingsDialog test：click radio → store update
- [~] 3.4 Storybook：SettingsDialog 加 theme × layout 四變體（或至少 2 variant）

## 4. 驗證

- [~] 4.1 vitest + typecheck clean
- [~] 4.2 test-storybook:ci 全綠
- [~] 4.3 手動切換 a/b 肉眼可辨
- [~] 4.4 tools/dump-theme-variants.mjs 擴成 8 組合（theme × density × layout）
- [~] 4.5 commit + archive
