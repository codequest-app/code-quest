# Proposal: chatpanel-resume-via-picker

## Why

Step 2 (`project-menu-resume`) shipped the server-side `session:resume`
RPC + `ResumeProvider` / `ResumePicker` / `ResumeSessionsDialog`
infrastructure, but only wired the project sidebar surface. The chat
command-menu "Resume conversation" item — intentionally kept as a
prop-chain stub by Step 1 — needs reconnecting so users can resume
from inside an active chat without having to navigate back to the
sidebar.

Reusing the same dialog/picker keeps the two surfaces consistent and
avoids a parallel implementation.

## What Changes

Shared (none — Step 2's `session:resume` event already covers the wire).

Server (none — handleResume already handles both surfaces).

Client:

- `components/ResumePicker.tsx`: `onResume` callback signature gains a
  second arg `session: SessionSummary` so callers can route by
  `session.cwd` when the picker isn't pre-filtered. Project-menu
  surface keeps working unchanged (cwd is known either way).
- `components/ResumeSessionsDialog.tsx`: `cwd` prop becomes optional.
  When omitted (chat surface), `handleResume` routes via
  `session.cwd ?? props.cwd`. Same `setActiveProject` +
  `requestActivateChannel` composition as before.
- `components/ChatPanel.tsx`: adds `resumeOpen` state; lazily mounts
  `<ResumeSessionsDialog />` (no cwd) when the menu fires. Wires
  `<ChatInputArea onResumeConversation={() => setResumeOpen(true)} />`.
- `components/command-menu-items.tsx`: re-adds the
  `"Resume conversation"` entry that fires the `onResumeConversation`
  callback (previously kept as a stub by Step 1).
- `components/OnboardingOverlay.tsx`: refresh the onboarding copy from
  the deleted "History button" reference to the new entry points
  (right-click on a project + chat command menu).

Dead-code cleanup (only safe after this change lands):

- `shared/src/schemas/session.ts`:
  drop `sessionLaunchPayloadSchema.resumeChannelId`.
- `server connect.ts`: delete the resume branch inside `handleLaunch`
  (`resumeChannelId` tracking, `buildLaunchOpts` bridge param, the
  `"No conversation found"` catch branch, and its `session:dead`
  broadcast). All of that is now done by `handleResume`.
- Delete the four legacy tests that exercised the removed launch
  resume path. Their semantics are covered by Step 2's §7
  handleResume dead-path test and §6 spawn-path test.

Out of scope:

- `fork.ts` / `teleport.ts` still pass channelId where the runner
  expects sessionId (pre-existing latent bug). Will be addressed by a
  separate ChannelManager bridge invariant change.
- `session:dead` broadcast on resume failure (handleResume currently
  surfaces the error via callback only; cross-window broadcast can be
  added later if needed).

## Capabilities

Modified: `client`. Adds the chat command-menu surface for resume,
reusing the Step 2 ResumePicker / ResumeSessionsDialog contract.

## Impact

- No wire changes (reuses `session:resume` from Step 2).
- Net source delta is negative — Step 3 wires up small UI plumbing,
  the cleanup commit deletes ~130 lines of dead launch-with-resume
  code.
- `ResumePicker.onResume` signature change is backwards-incompatible
  (one new arg). Only consumer is `ResumeSessionsDialog` (updated in
  the same change).
- Tests: server -4 (deleted dead-resume tests), client unchanged
  shape; total 1222 green.
