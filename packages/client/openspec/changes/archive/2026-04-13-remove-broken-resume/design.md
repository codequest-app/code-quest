# Design: remove-broken-resume

## Context

`session:resume` was wired as a fire-and-forget broadcast back when the client owned all session-state mutation. After the channelId/sessionId split and the move to `session:launch { resumeSessionId }` for fork/teleport, the resume path was never migrated. It now degrades the UI without doing anything useful.

## Decisions

### Decision 1: Hard delete vs. deprecation flag

Chosen: hard delete the schema, event, server handler, and client subscription in one change.

Alternatives considered:

- *Soft deprecate* — keep the event but no-op the handler. Rejected: nothing on the wire would observe it, and dead protocol surfaces accumulate.
- *Repurpose the event* for the new flow. Rejected: the new flow is `session:launch { resumeSessionId }` (already exists). Re-using the name for a different shape is more confusing than starting fresh in change 2.

### Decision 2: Where to draw the boundary

The "Resume conversation" command-menu entry is removed in this change rather than left dangling pointing at a deleted callback. Change 3 reintroduces it pointing at the new `SessionPicker`.

`ChatPanel`'s overlay state and `<SessionDropdown>` rendering go away with it — they were the only consumer of `resumeSession()`.

### Decision 3: Tests

Existing tests asserting on the broadcast (`session:resume` listener) or on the menu item are deleted, not modified. Per project rule `NEVER modify test expects`. Deleting a whole test block is fine; rewriting `expect(...)` lines is not.

## Risks

- **Risk:** A test elsewhere indirectly relies on `resumeSession` existing on the SessionContext type. *Mitigation:* tsc will catch — fix by removing the call site, not by keeping the field.
- **Risk:** `SessionDropdown` becomes unused after deleting its only caller. *Mitigation:* `SessionDropdown` is also referenced by `SessionHistory`/etc. — verify with grep before deleting; if unused, delete; otherwise leave for change 2 to reuse via `SessionPicker`.
- **Risk:** Wire-incompatible with older deployed clients. *Mitigation:* this branch is pre-release; no deployed clients to coordinate with.

## Out of scope

- The replacement resume flow (covered by `project-menu-resume` and `chatpanel-resume-via-picker`).
- Any change to `session:fork` / `session:teleport` / `session:join` (they don't use `session:resume`).
