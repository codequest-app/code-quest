## Context

`PlanReviewBanner` renders inside the chat message list when Claude requests plan approval. The current implementation has three problems:
1. Plan content is hidden behind a `<details>` collapsible — users might miss it
2. Feedback textarea is always visible but only meaningful for "Continue Planning"
3. Buttons are top-right, disconnected from the content flow

The real extension opens a VS Code Markdown Preview Panel (separate pane). cc-office cannot replicate a separate panel, so the inline card must feel focused and intentional instead.

## Goals / Non-Goals

**Goals**
- Plan content always visible (no collapsible)
- Feedback textarea appears only when "Continue Planning" is clicked
- Buttons at bottom; clear visual flow top→bottom
- Storybook: Default scenario, ContinuePlanningExpanded scenario, Interactive story

**Non-Goals**
- Separate panel/modal — stays inline in chat
- Changing the socket/server protocol

## Decisions

**State: `feedbackOpen: boolean`**
Single boolean in component state. `false` = default (two buttons). `true` = textarea + Cancel + Send Feedback. No need for more states.

**Button variants**
- Approve Plan → `variant="primary"` (positive, dominant action)
- Continue Planning → `variant="secondary"` (secondary action, triggers expansion)
- Send Feedback → `variant="secondary"` (confirms the rejection with optional feedback)
- Cancel → `variant="ghost"` (low prominence, destructive to the in-progress feedback)

**Textarea reset on new request**
Existing `useLayoutEffect` + `lastRequestId` ref resets `comment` when `pending.requestId` changes. Also reset `feedbackOpen` to `false` on new request.

**Plan comments (PlanCommentPopover)**
Keeps existing behaviour — inline selection popover on plan content. Comment count shown next to "📋 Plan Review" header.

**Storybook**
- `Default`: scenario with plan content, no feedback open
- `ContinuePlanningExpanded`: scenario with `feedbackOpen` pre-set via story args or internal state trigger
- `Interactive`: real component with `onRespond` action logger, user can click through both flows

## Risks / Trade-offs

[feedbackOpen reset] If user types feedback then a new plan arrives, `feedbackOpen` resets to false and comment clears. Acceptable — same as current textarea reset behaviour.

## Open Questions

None.
