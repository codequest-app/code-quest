## 1. Tests (Red)

- [x] 1.1 Write tests for default state: plan content visible, Approve + Continue Planning buttons visible, no textarea
- [x] 1.2 Write tests for clicking "Continue Planning": textarea appears, buttons become Send Feedback + Cancel
- [x] 1.3 Write tests for Cancel: textarea hides, default buttons reappear, comment cleared
- [x] 1.4 Write tests for Send Feedback: onRespond called with behavior deny + message
- [x] 1.5 Write tests for Approve Plan: onRespond called with behavior allow
- [x] 1.6 Write tests for state reset on new requestId

## 2. Implementation (Green)

- [x] 2.1 Add `feedbackOpen` boolean state to `PlanReviewBanner`
- [x] 2.2 Remove `<details>` wrapper — render plan content always expanded
- [x] 2.3 Move buttons to bottom of card
- [x] 2.4 Render default buttons (Approve Plan + Continue Planning) when `feedbackOpen === false`
- [x] 2.5 Render textarea + Send Feedback + Cancel when `feedbackOpen === true`
- [x] 2.6 Wire Cancel: set `feedbackOpen = false`, clear comment
- [x] 2.7 Wire Send Feedback: call `handleReject`, set `feedbackOpen = false`
- [x] 2.8 Reset `feedbackOpen` to false in existing `useLayoutEffect` on requestId change
- [x] 2.9 Update button variants: Approve → primary, Continue Planning → secondary, Send Feedback → secondary, Cancel → ghost

## 3. Storybook

- [x] 3.1 Create `PlanReviewBanner.stories.tsx` with `Default` scenario story
- [x] 3.2 Add `ContinuePlanningExpanded` scenario story (feedbackOpen pre-triggered)
- [x] 3.3 Add `Interactive` story with action logger for `onRespond`
