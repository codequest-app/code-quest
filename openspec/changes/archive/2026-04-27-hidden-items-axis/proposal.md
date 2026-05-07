## Why

`preferences-axes-refactor` Phase 1 預留了 `hiddenItems: string[]` 欄位和 setter，設計文件說未來用來讓使用者隱藏某些 UI 項目（filter rows、onboarding tips、banners 等），但從 Phase 1 merge 到現在完全沒人讀寫這個欄位。它是 dead store field，跟 `layout` 同樣處於「預留但未實作」狀態。本 change 把這條軸補齊。

## What Changes

- 明確定義 `hiddenItems` 的語意：它是一組 **string ID**，每個 ID 對應一個可隱藏的 UI 片段（例：`'raw-panel'`、`'onboarding-tip-resume'`、`'banner-review-upsell'`）
- 提供 `useIsHidden(id)` hook + `useToggleHidden(id)` hook（或直接用 store selector）
- 第一批 consumer：
  - **ReviewUpsellBanner**：目前用獨立 `isReviewUpsellDismissed`，改遷移到 `hiddenItems` 內（舊 flag 先保留，migrate 搬過去後 deprecate）
  - **OnboardingOverlay**：目前用 `isOnboardingDismissed`，同樣遷移
- 新增 **CommandPalette feature**：`"Reset dismissed items"` — 清空 `hiddenItems` 讓所有 dismissed items 重新顯示（debug / 誤按復原用）
- SettingsDialog 新增「Show dismissed items」按鈕（同上 reset 語意）

不新增 UI 讓使用者主動 hide 東西 — 各 caller 自己決定何時 push 到 hiddenItems（通常是「dismiss」按鈕）。

## Capabilities

### Modified Capabilities

- `user-preferences`: `hiddenItems` 實際使用（之前只儲存）；`isOnboardingDismissed` / `isReviewUpsellDismissed` 改為 derived value from `hiddenItems`
- `preferences-ui`: CommandPalette + SettingsDialog 新增「reset dismissed」入口

## Impact

- 新增：
  - `apps/web/src/features/reset-dismissed/reset-dismissed-feature.ts` + test + story
  - `apps/web/src/hooks/useHiddenItems.ts`（or inline in usePreferencesStore）
- 修改：
  - `apps/web/src/components/ReviewUpsellBanner.tsx`（read/write via hiddenItems）
  - `apps/web/src/components/OnboardingOverlay.tsx`（同上）
  - `apps/web/src/stores/usePreferencesStore.ts`（migration v2→v3：把 old flags 合併進 hiddenItems）
  - `apps/web/src/components/SettingsDialog.tsx`（reset button）
  - `apps/web/src/components/CommandPalette.tsx`（register feature）
- 測試：vitest + typecheck + test-storybook 全綠；migration unit test
- 風險：migration 必須 idempotent — 若 user 已 dismiss 某項目、升級後再升級，不能重複 push ID
