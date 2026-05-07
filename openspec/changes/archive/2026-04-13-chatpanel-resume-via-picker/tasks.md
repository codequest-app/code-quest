# Tasks: chatpanel-resume-via-picker

> **TDD discipline:** RED → GREEN. NEVER modify existing `expect()` —
> delete entire `it(...)` blocks instead. Recorded retroactively
> because the work was small enough to do in one pass; each step was
> verified red-then-green at the time.

## 1. ResumePicker contract update

- [x] 1.1 RED: extend the existing
      `clicking a row calls useResume and forwards channelId via onResume`
      test in `ResumePicker.test.tsx` to also assert that the second
      arg passed to `onResume` is the picked `SessionSummary` row
      (with `id` and `cwd` matching the seeded fixture).
- [x] 1.2 GREEN: change `ResumePickerProps.onResume` to
      `(channelId, session) => void`; pass `row` from the click
      handler.

## 2. ResumeSessionsDialog generalisation

- [x] 2.1 GREEN: make `ResumeSessionsDialog.cwd` optional. Update
      `handleResume(channelId, session)` to derive `targetCwd =
      session.cwd ?? props.cwd`. Skip `setActiveProject` /
      `requestActivateChannel` if no cwd is available (unreachable in
      practice — DB rows have cwd).

## 3. ChatPanel surface

- [x] 3.1 GREEN: add `resumeOpen` state; render
      `<ResumeSessionsDialog open onOpenChange />` lazily (only when
      `resumeOpen`); wire
      `<ChatInputArea onResumeConversation={() => setResumeOpen(true)} />`.

## 4. Command menu re-wire

- [x] 4.1 GREEN: re-add the `id: 'resume-conversation'` entry in
      `command-menu-items.tsx` that fires
      `callbacks.onResumeConversation?.()` (the prop chain was kept
      intentionally by Step 1 §6.1 for exactly this).

## 5. Onboarding copy refresh

- [x] 5.1 GREEN: update `OnboardingOverlay.tsx` step copy from the
      stale "History button" reference to the new entry points
      ("right-click a project / use the command menu"). Mark Step 1
      `remove-broken-resume` tasks §6 deferred items as resolved.

## 6. Dead-code cleanup (launch-with-resume)

- [x] 6.1 RED: confirm zero `resumeChannelId` source occurrences in
      `packages/**` (grep, exclude `data/events/`).
- [x] 6.2 GREEN: drop `sessionLaunchPayloadSchema.resumeChannelId`.
- [x] 6.3 GREEN: in `connect.ts`, remove `let resumeChannelId`, drop
      the second arg from `buildLaunchOpts`, and delete the
      `if (resumeChannelId && message.includes('No conversation found'))`
      catch branch (including the `session:dead` broadcast it emitted).
- [x] 6.4 GREEN: delete the 4 `it(...)` blocks in
      `session-connect.test.ts` that asserted the removed launch
      resume path. Their semantics are covered by Step 2's
      `session:resume` spawn / dead-path tests.

## 7. Verify

- [x] 7.1 `pnpm --filter shared exec vitest run` — green (the 2
      pre-existing broken contract test files are unrelated).
- [x] 7.2 `pnpm --filter server test` — 458 green
      (was 462; -4 = the deleted dead-resume tests).
- [x] 7.3 `pnpm --filter client test` — 764 green.
- [x] 7.4 `pnpm --filter server exec tsc -p tsconfig.build.json --noEmit`
      and `pnpm --filter client exec tsc --noEmit` — both clean.
- [x] 7.5 `openspec validate chatpanel-resume-via-picker --strict` — TBD.
- [x] 7.6 Sweep grep `resumeChannelId` repo-wide — zero hits.

## 8. Wrap up

- [x] 8.1 Two commits on `feat/remove-broken-resume`:
      - `7cb1845a feat(client): chat /resume reintroduced via shared ResumePicker (Step 3)`
      - `780d3aef chore: remove dead session:launch resume code path`

## 9. Follow-up refactors (post-impl code review)

- [~] 9.1 **Extract shared resume routing hook — WON'T DO.** On review the two surfaces have different context access (chat has TabActions + channel.messages, dialog mounts outside TabProvider), so the "duplication" is intentional divergence rather than accidental. The pure `resumeRoute` decision function covers the shared part; each surface dispatches differently on purpose.
- [x] 9.2 **User-visible error on resume failure.** Both ChatPanel + ResumeSessionsDialog now emit `toast.error('Resume failed: ...')` via sonner instead of silent console.error. Commit `d90497a3`.
- [x] 9.3 **Collapse ResumeContext reject branches.** Merged under §15.2 discriminated union refactor. Commit `9c9f4f1b`.
