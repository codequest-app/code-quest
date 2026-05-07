## Context

`Channel` is a server-internal class in `apps/server/src/socket/channel.ts` that wraps a spawned CLI process and its socket membership. Its identifier is currently exposed as `id: string`, but every consumer in the server reads it into a `channelId` variable or payload field (16 usages across 9 files, plus 1 test). TypeScript will surface every broken access at compile time, so the risk is low; the main concern is keeping the refactor disciplined and test-driven per project rules.

## Goals / Non-Goals

**Goals:**
- Rename `Channel.id` → `Channel.channelId` with zero behavioral change.
- Follow TDD: adjust the one test that references `id` *first* (so it fails), then rename the property and call sites until green.
- Keep the refactor atomic — one commit, no drive-by changes.

**Non-Goals:**
- Changing emitted socket payload shapes (`channelId` field already used on the wire).
- Renaming anything else on `Channel` (e.g., `write`, session lifecycle).
- Touching client code — `Channel` never leaves the server package.

## Decisions

**Decision 1 — Rename, do not add an alias.**
A getter alias (`get id()`) would avoid touching call sites but leaves two names for the same field and defeats the purpose. We do a hard rename.
*Alternative considered*: dual-export with deprecation comment → rejected, unnecessary for an internal class.

**Decision 2 — TDD order: fix test helper first.**
`apps/server/src/__tests__/channel-emitter.test.ts` has `fakeChannel(id = 'ch-1'): Channel { return { id } as unknown as Channel; }`. Update this (and any expectation it drives) *before* the class rename, run the suite to see it fail against the old class, then rename the class + usages to make it green. Per project rule: never modify `expect` — only the helper shape changes here.
*Alternative considered*: rename class first, fix tests last → rejected, violates TDD guidance in `feedback_tdd_refactoring.md`.

**Decision 3 — Use an automated refactor, verify by hand.**
Use IDE/TS rename-symbol (or a scripted find-replace scoped to `apps/server/src/**`) for mechanical safety, then visually diff the 9 files against the blast-radius inventory before committing.

## Risks / Trade-offs

- **[Risk]** A missed usage silently keeps the old field name via `any`/`as unknown as Channel` casts in tests. → **Mitigation**: rely on `tsc --noEmit` plus the tracked test-file list; grep for `\.id\b` in the handler files after the rename as a final sweep.
- **[Risk]** Churn in git blame on 9 files. → **Trade-off accepted**: rename clarity outweighs blame noise for a one-time change.
- **[Risk]** Someone lands a parallel change adding a new `ch.id` usage mid-refactor. → **Mitigation**: do it in a single short-lived branch; rebase before merging.

## Migration Plan

1. Branch from current feature branch.
2. Update `channel-emitter.test.ts` `fakeChannel` helper to emit `channelId`; run `pnpm --filter server test` — expect failures from Channel class definition mismatch.
3. Rename the property in `channel.ts` and fix call sites file-by-file (order: `channel-emitter.ts`, `channel-manager.ts`, handler files alphabetically).
4. Run `pnpm --filter server typecheck` and `pnpm --filter server test` — expect clean.
5. Single commit, standard PR. No rollout gating; no rollback plan beyond `git revert`.
