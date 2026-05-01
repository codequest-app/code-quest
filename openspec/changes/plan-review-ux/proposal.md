## Why

The current `PlanReviewBanner` has a confusing layout: buttons are top-right, plan content is hidden in a collapsible `<details>`, and the feedback textarea is always visible even though it only applies to "Continue Planning". The real Claude Code extension shows plan review as a dedicated markdown panel — cc-office's inline equivalent should match that sense of focus and clarity.

## What Changes

- Remove `<details>` collapsible — plan content always fully expanded
- Move Approve / Continue Planning buttons to the bottom of the card
- Hide feedback textarea by default; reveal it inline (no dialog) only after clicking "Continue Planning"
- Add Cancel button when textarea is expanded to return to default state
- Rename "Continue Planning" send action to "Send Feedback" for clarity
- Add Storybook stories: `Default` scenario, `ContinuePlanningExpanded` scenario, `Interactive`

## Capabilities

### New Capabilities

### Modified Capabilities
- `plan-review-banner`: layout, button placement, conditional feedback textarea behaviour

## Impact

- `packages/client/src/components/chat/plan-review/PlanReviewBanner.tsx` — full redesign
- `packages/client/src/components/chat/plan-review/PlanReviewBanner.stories.tsx` — new file
- `packages/client/src/components/chat/plan-review/__tests__/PlanReviewBanner.test.tsx` — new/updated tests
