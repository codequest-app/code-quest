## Context

`packages/shared/src/socket-events.ts` (598 lines) currently defines typed signatures for the socket and emitter interfaces. Event names appear inside these interfaces as string-literal keys, so `socket.emit('session:list', …)` is type-checked against the interface shape. However, the *string itself* is duplicated at every call site — `apps/web/**`, `apps/server/**`, and tests — with no single source listing all names. Result: renames require global grep-and-replace, and typos at call sites compile cleanly if the event is accepted by a permissive overload.

## Goals / Non-Goals

**Goals:**
- Give event names a single, typed home in `@code-quest/shared`.
- Make every project-defined `emit` / `on` / `sendRequest` call reference that home.
- Zero runtime or protocol change.

**Non-Goals:**
- Re-architecting the socket API, introducing a new transport, or changing payload schemas.
- Wrapping Socket.IO with a custom client (e.g. to enforce constant usage via API shape).
- Covering Socket.IO's own lifecycle events (`connect`/`disconnect`).

## Decisions

### Shape: nested-by-namespace frozen object literal

```ts
export const EVENTS = {
  session: {
    list:           'session:list',
    generate_title: 'session:generate_title',
    created:        'session:created',
    // …
  },
  worktree: {
    create: 'worktree:create',
    list:   'worktree:list',
    delete: 'worktree:delete',
  },
  chat: {
    rewind_code: 'chat:rewind_code',
    // …
  },
  // …
} as const satisfies Record<string, Record<string, string>>;
```

- Using `as const satisfies` keeps the literal types narrow (`'session:list'`, not `string`) while catching structural mistakes at definition time.
- Nested-by-namespace matches the existing `<ns>:<name>` wire convention, so `EVENTS.session.list === 'session:list'`.
- Alternative — flat `EVENTS.SESSION_LIST`. Rejected: loses namespace grouping and diverges from wire naming.
- Alternative — enum. Rejected: TS enums bring runtime overhead and awkward iteration; `as const` object is idiomatic modern TS.

### Type derivation

Existing typed-signature source of truth (per-interface string-literal keys) stays as-is. The `EVENTS` tree's values are all wire-identical to those keys, so no interface rewrite is needed. Optionally, add a `type EventName = FlattenEventValues<typeof EVENTS>` helper if a consumer wants the union.

### Migration strategy

1. Land `EVENTS` in `@code-quest/shared` with all current names populated.
2. Migrate server call sites (larger, higher-risk) first — one commit per handler group keeps diffs reviewable.
3. Migrate client call sites.
4. Enable a lint rule (optional follow-up) to ban string literals matching `/^[a-z]+:[a-z_]+$/` in emit/on calls outside the shared module. Out of scope for this change unless the migration reveals enough gaps to justify it.

### Test fixtures

Integration tests that assert the wire-level string (if any) keep the literal AND add an `EVENTS.*` equality assertion so a future rename breaks the test loudly.

## Risks / Trade-offs

- [Massive diff] ~35+ files touched. → Mitigated by landing as one atomic PR; the diff is mechanical (literal → `EVENTS.x.y`) and easy to review with a column-diff tool.
- [Key shape drift] `'session:list'` (snake-ish) vs camelCase TS idiom. → Keep snake-compatible keys (`EVENTS.session.list`, `EVENTS.session.generate_title`) to mirror the wire exactly. Deviating would require a mental translation at every call site.
- [Partial adoption] If only half the call sites migrate, the codebase becomes inconsistent. → Enforce completeness via a grep gate in the PR description (no remaining `['":][a-z]+:[a-z_]+['"]` matches in touched packages outside the shared module).

## Migration Plan

Single PR. Land in this order within the PR:
1. Add `EVENTS` to `packages/shared/src/socket-events.ts` + barrel export.
2. Migrate `apps/server/src/**` call sites.
3. Migrate `apps/web/src/**` call sites.
4. Run full workspace tests.

Rollback: revert the PR — runtime behaviour is unchanged so there is no state to migrate back.

## Documented Exemptions

After migration, two categories of `'x:y'`-style literals legitimately remain in the source tree:

1. **Type-level string literal arguments** — `Payload<'session:init'>`, `Record<'stream:text', …>`, and handler-map keys like `{ 'stream:text': onStreamText, … }`. TypeScript generic type parameters and object-literal type keys cannot reference runtime const values; using `typeof EVENTS.stream.text` in type position works for single generics but not for handler maps whose shape is indexed by the string literal. A future helper like `type EventPayload<E extends EventName> = …` could fold these into the constant, but it is out of scope for this refactor.
2. **Node.js module specifiers** — `import … from 'node:fs'`, `'node:path'`, `'node:url'`. These are transport-level imports, not project events, and happen to match the `<ns>:<name>` grep pattern.
3. **CLI control protocol event names** — `channel.sendRequest('session:initialize', …)`, `'auth:authenticate'`, `'auth:oauth_callback'`, `'message:interrupt'`, `'message:stop_task'`, `'message:cancel_async'`, `'message:rewind'`, `'message:side_question'`, `'plan:*'` comment sync, etc. These travel server↔CLI-subprocess, not client↔server, so they are a distinct protocol and not covered by the socket-oriented `ServerToClientEvents` / `ClientToServerEvents` signatures. Centralising them would require a separate `CLI_EVENTS` constant; that is out of scope for this change.

These exemptions are intentional; the Requirement's "MUST NOT use bare literals" targets runtime `emit` / `on` / `sendRequest` arguments, which are fully migrated.

## Open Questions

- Key casing for multi-word events (e.g. `'session:generate_title'`): mirror wire (`generate_title`) vs TS idiom (`generateTitle`). Design locks in wire-mirror; revisit if friction emerges.
