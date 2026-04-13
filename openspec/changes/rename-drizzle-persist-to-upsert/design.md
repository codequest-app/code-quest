## Context

`DrizzleSessionStore.persist` is called from exactly one place: `onSessionInit` in `connect.ts:242-263`, fired when the CLI emits `session:init` carrying a real `sessionId`. The row keyed by that `sessionId` may already exist (user resumed a past conversation into a fresh channel) — in that case we rebind `channelId` and reset `status`. Otherwise we insert.

The bug-shaped feeling isn't a live bug; it's a documentation / naming one. Future readers will miss the side-effects.

## Goals / Non-Goals

**Goals**
- Callsite reads as upsert, because that is what it does.
- Side-effect contract is documented in one place (JSDoc on the interface).

**Non-Goals**
- Split into `insert` + `rebindChannel`: rejected. Every existing caller needs both paths and there is no use-case that wants only one. Splitting adds ceremony without clarity.
- Change the side-effect semantics (e.g. stop resetting `status` on rebind). Out of scope — that is a runtime behavior change with implications for the resume flow.

## Decisions

**Decision: `upsert` over `persistOrRebind` / `writeRow` / `save`.**

- `upsert` is a well-known DB term for "insert-or-update". Reviewer knows immediately what it means.
- `save` is overloaded in ORM land.
- `persistOrRebind` is accurate but clunky.

**Decision: JSDoc on the interface, not only on the Drizzle impl.**

Callers hold the interface type, so the IDE tooltip must come from the interface JSDoc.

## Risks

- Low. Single callsite; compiler catches everything else.
- Minor: test file method-call sites. Guard against the temptation to also change fixture data; only the method *name* changes.

## Migration

1. Rename on interface, add JSDoc.
2. Rename on DrizzleSessionStore.
3. Rename on any fake (tsc will show them).
4. Rename at the one caller.
5. Rename at test callsites (Grep `sessionStore.persist(` then `\.persist\(` scoped to the store).
