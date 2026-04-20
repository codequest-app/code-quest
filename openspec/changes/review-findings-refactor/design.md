## Context

The full-prod review ran 5 parallel Explore agents across 425 files and produced a structured list of findings. Most findings are local (one file, one function) and the codebase is already in good shape — no `as any` in prod, no empty catch, React Compiler used correctly, barrel files clean. The work is distributed across four packages with different testing harnesses (server uses vitest + FakeSummoner, client uses vitest + RTL + FakeSummoner, summoner uses vitest + FakeProcessProvider, shared uses pure vitest).

The only non-trivial finding is `Channel` class in `packages/server/src/socket/channel.ts` carrying too many concerns (control request tracking, notification tracking, processing state, runner wiring, MCP timeouts). Everything else is extraction or renaming.

## Goals / Non-Goals

**Goals:**
- Each finding becomes a small TDD commit (RED if new seam exposes a testable unit; otherwise refactor-only with existing tests guarding behavior)
- `expect`-invariant: no existing test's assertion changes. New tests may be added for newly-exposed units.
- All 8 lefthook checks (biome, typecheck, deprecated scans, test runs) stay green per commit
- Visible reduction in: magic numbers, repeated patterns, function length, nested-ternary complexity

**Non-Goals:**
- No behavior change, no public API change, no schema-level change
- Not rewriting `Channel` from scratch — just extracting two collaborator classes (`ControlRequestTracker`, `NotificationTracker`) that `Channel` delegates to. Same public methods on `Channel`
- Not migrating `z.looseObject()` wholesale — only where strictness clearly matches runtime intent
- Not touching client components beyond one `NAV_KEYS` extraction in `ComposeInput`

## Decisions

### 1. Channel collaborator split: composition over inheritance

`Channel` keeps its public API. Two private collaborators hold the state:

```ts
class Channel {
  private readonly controlRequests = new ControlRequestTracker();
  private readonly notifications = new NotificationTracker();
  trackControlRequest(id, meta) { this.controlRequests.track(id, meta); }
  // ...delegate
}
```

**Alternative considered**: extract via inheritance (`Channel extends ControlRequestOwner`) — rejected, multiple concerns means multiple base classes, awkward in TS.

**Alternative considered**: do nothing — rejected, `Channel` is already 350+ lines and the two tracker concerns are the clearest carve-outs.

### 2. Server long functions: extract named helpers, not classes

`finalizeAndNotify` and `handleOpenClaude` each become one driver function calling 2-3 named helpers. No new classes, no new modules — helpers stay in the same file just above the driver.

### 3. Time constants: single `utils/time-constants.ts` for the 2 known consumers

Both `format-relative-date.ts` and `format-reset-time.ts` use `60 / 60 / 24 / 30 / 365` magic numbers. Extract to `utils/time-constants.ts` exporting `SECONDS_PER_MINUTE`, `MS_PER_HOUR`, etc. Per "抽取前確認 2+ 處 consumer" rule, 2 consumers qualifies.

### 4. Shared schemas: audit, don't rewrite

Grep each `z.looseObject()` call site for whether extra fields are actually expected at runtime (CLI-provider payloads with forward-compat fields → keep loose). Switch to `z.object()` where the shape is stable and owned by us (internal payloads with known keys). Do not force a blanket migration.

### 5. `z.looseObject()` note

Reviewer flagged this as "deprecated" — actually it's Zod v4's replacement for `.passthrough()` and is the correct strict-with-extras form. Not a deprecation issue; the audit is about **unnecessary looseness**, not about the API.

### 6. Order of work

1. Lowest risk / lowest blast radius first (constants, NAV_KEYS, time-constants, tool-registry magic numbers)
2. Summoner readability (transforms control.ts, filesystem extractDirectories, git fallback)
3. Server helpers (finalizeAndNotify, handleOpenClaude)
4. Channel tracker split (last — biggest surface)
5. Shared schema audit (schema work can happen anywhere in the sequence; parking it at the end keeps it isolated)

One commit per task group. Green tests required between commits.

## Risks / Trade-offs

- **[Channel tracker split could leak state-ownership bugs]** → Each extracted method has a unit test added asserting the delegation (trackControlRequest → controlRequests.track), OR an integration test already covers it. Snapshot the Channel test suite before and ensure 100% re-pass after.
- **[Shared schema looseObject changes might break unseen callers]** → Only convert schemas whose all known callers are within the repo (grep-verified). External-fed payloads (CLI stream JSON) stay loose.
- **[Extracting helpers in server could reintroduce subtle async timing bugs]** → Use `vi.waitFor` patterns established in previous branch; keep changes pure (no async reshuffling).

## Migration Plan

No deployment migration — tests pass locally → push → merge to main. No schema change, no DB migration.

## Open Questions

- Should `ControlRequestTracker` / `NotificationTracker` be exported for test visibility, or live as `internal: true` module types? **Proposal**: keep them unexported; test via `Channel`'s public API to preserve encapsulation.
- `utils/time-constants.ts` — singular file vs `utils/time/*.ts` split? **Proposal**: single file. Two consumers, no reason to fragment.
