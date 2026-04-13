# Design: chatpanel-resume-via-picker

## Context

This change is the second consumer of the resume infrastructure built
in `project-menu-resume`. The hard architectural decisions
(server-driven RPC, ResumeProvider, picker contract,
`pendingActivateChannel` intent) all live there — this change only
makes a small contract tweak so the picker can also be used without a
cwd filter.

## Decisions

### Decision 1 — `ResumePicker.onResume` gains a `session` arg

Project surface always knows the cwd (it came from the right-click).
Chat surface does NOT — the picker shows all sessions. To route the
resumed channel to the right project pane, the dialog needs the
session's cwd.

Chosen: extend `onResume(channelId)` → `onResume(channelId, session)`.
The picker passes the clicked `SessionSummary` row back. Caller picks
what to use.

Alternatives:

- *Two pickers* (`ProjectScopedResumePicker` + `GlobalResumePicker`)
  each with their own contract — duplication for no real win.
- *Pass `cwd` instead of full session* — works today but the row may
  carry other useful fields later (parentId, etc); passing the full
  row is future-proof at no extra cost.

### Decision 2 — `ResumeSessionsDialog.cwd` becomes optional

When `cwd` is set, picker filters to that project (project surface).
When omitted, picker shows all (chat surface). `handleResume` routes
via `session.cwd ?? props.cwd`. Single dialog component covers both
surfaces; no new file needed.

### Decision 3 — Dead launch-with-resume cleanup happens in this change

`session:launch { resumeChannelId }` had its last client emitter
deleted in Step 1 (`remove-broken-resume`). Step 2 didn't touch it
because the new resume path was still being built. Now that chat
/resume is back via `session:resume`, the launch-resume code is
verifiably unreachable from any client.

Removing it now (rather than a follow-up) keeps the diff coherent —
the same change that brings chat /resume back is the one that takes
the old chat /resume code path out.

The deleted pieces:

- `sessionLaunchPayloadSchema.resumeChannelId`
- `handleLaunch`'s `let resumeChannelId` + dead-resume catch branch
- `buildLaunchOpts(parsed, resumeSessionId)` second param
- 4 tests in `session-connect.test.ts` that exercised the removed
  branch (their semantics are covered by Step 2's handleResume tests)

## Risks

- **Risk:** Picker callers that used the old single-arg signature
  (channelId only) would silently ignore the new second arg. Mitigated
  because `ResumeSessionsDialog` is the only consumer in repo and it
  was updated atomically in this change.
- **Risk:** Removing dead launch-resume code could break an unknown
  external client that still emitted it. Mitigated by repo-wide grep
  showing zero `resumeChannelId` source occurrences after Step 1.
- **Risk:** OnboardingOverlay copy now mentions "right-click" — works
  in desktop browsers; may need touch alternative phrasing later. Not
  addressed in this change.

## Out of scope

- `fork.ts` / `teleport.ts` channelId-vs-sessionId bridge (separate
  change).
- `session:dead` broadcast for resume failures (callback error already
  flows to caller; cross-window sync is a future follow-up).
- Picker UI polish (sorting beyond createdAt DESC, virtualization,
  multi-select, etc).
