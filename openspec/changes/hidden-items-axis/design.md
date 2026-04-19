## Context

`hiddenItems: string[]` 在 store 已存在但零消費者。目前兩個「dismissible UI」各自有獨立 boolean flag (`isOnboardingDismissed`, `isReviewUpsellDismissed`)。這是前 preferences-axes-refactor 時代遺留的 single-purpose flags。本 change 統一成 ID-based generic mechanism。

## Goals / Non-Goals

**Goals**
- `hiddenItems` 成為 dismissible UI 的 single source of truth
- 既有兩個 boolean flag migrate 成 `hiddenItems` 成員
- 提供 reset / show-all 機制

**Non-Goals**
- 不主動讓使用者「hide」任意 UI（只有 caller push，沒有 browse-and-hide UI）
- 不重新設計 OnboardingOverlay / ReviewUpsellBanner 的 UX

## Decisions

### D1. ID 命名慣例：kebab-case + domain prefix

- `'onboarding-tip-<name>'` for onboarding dots
- `'banner-<name>'` for dismissible banners
- `'feature-suggest-<id>'` for future feature discovery tips

### D2. Migration v2 → v3

```ts
migrate: (persisted, fromVersion) => {
  if (fromVersion < 3) {
    const prev = persisted as Partial<PreferencesState> & {
      isOnboardingDismissed?: boolean;
      isReviewUpsellDismissed?: boolean;
    };
    const hidden = new Set(prev.hiddenItems ?? []);
    if (prev.isOnboardingDismissed) hidden.add('onboarding-overlay');
    if (prev.isReviewUpsellDismissed) hidden.add('banner-review-upsell');
    return { ...DEFAULTS, ...prev, hiddenItems: [...hidden] };
  }
  return persisted;
}
```

Remove the two legacy booleans from store shape after migrate.

### D3. Hook API

```ts
function useIsHidden(id: string): boolean;
function useToggleHidden(id: string): () => void;  // toggles, or explicit hide()/show()
```

Derive `isOnboardingDismissed` / `isReviewUpsellDismissed` as `useIsHidden('onboarding-overlay')` at call sites.

## Risks / Trade-offs

- [Migration idempotency] → always `new Set(...)` dedup before serialize
- [Stale IDs accumulate forever] → accept; list is small, not a perf issue. Reset button addresses UX recovery
- [Removing boolean flags breaks external consumers] → migration preserves semantic; re-exporting derived hooks if widely used
