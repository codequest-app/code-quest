## 1. Store migration v2 → v3

- [x] 1.1 寫 migration unit test：v2 shape → v3 shape with merged hiddenItems
- [x] 1.2 實作 migrate 函式（dedup via Set）
- [x] 1.3 更新 shared preferencesStateSchema 加 hiddenItems 必填 + remove deprecated booleans (or keep as deprecated)
- [x] 1.4 版本號 bump 到 3

## 2. Hooks / helpers

- [x] 2.1 ~~`hooks/useHiddenItems.ts`~~ — skipped: only 2 consumers; inlining `hiddenItems.includes(...)` + `hideItem(id)` directly in each component is simpler than a 2-export hook wrapper
- [x] 2.2 ~~Unit tests for both hooks~~ — N/A (hook not created); store methods `hideItem` / `showItem` / `clearHiddenItems` have dedicated tests

## 3. Migrate existing consumers

- [x] 3.1 OnboardingOverlay：read/write via `useIsHidden('onboarding-overlay')`
- [x] 3.2 ReviewUpsellBanner：read/write via `useIsHidden('banner-review-upsell')`
- [x] 3.3 Remove `isOnboardingDismissed` / `isReviewUpsellDismissed` from store interface（migration 還是要 handle 舊值）
- [x] 3.4 Story updates: ReviewUpsellBanner + OnboardingOverlay stories' `setState` shim migrated from old booleans to `hiddenItems` array

## 4. New UI entry

- [~] 4.1 ~~`features/reset-dismissed/reset-dismissed-feature.ts`~~ — implemented then reverted per user decision
- [~] 4.2 ~~CommandPalette register~~ — reverted
- [~] 4.3 ~~SettingsDialog "Show dismissed items" button~~ — reverted

**Note:** The underlying store refactor (unified `hiddenItems` array replacing two boolean flags, v2→v3 migration, `hideItem`/`showItem`/`clearHiddenItems` methods) is kept. Only the user-facing reset UI was reverted.

## 5. 驗證

- [x] 5.1 vitest + typecheck clean
- [x] 5.2 test-storybook:ci 全綠
- [ ] 5.3 手動升級測試（舊 localStorage → 新 schema）— 覆蓋在 3 個 migration unit tests 中；真機測試留給 reviewer
- [x] 5.4 commit（archive 留給 reviewer）
