## Context

The server tracks in-memory channels with `Channel.channelId` (renamed from `Channel.id` in commit `e26cb2ce`). Persistence currently stores the same value in a column named `id` on the `sessions` table, exposes it as `SessionRecord.id` / `SessionStore.getById(id)`, and surfaces it on the wire as `SessionSummary.id`. Every call site reads the stored `id` into a local variable called `channelId`, and the client's session history components key rows by `s.id` where `s` is conceptually "a channel".

The rename is overdue but mechanically non-trivial because it crosses four layers: SQL column, Drizzle schema, Zod schema + TS type, and wire type with client consumers. We want one coherent change rather than drift across the stack.

## Goals / Non-Goals

**Goals:**
- `sessions.channel_id` (SQL) ↔ `sessions.channelId` (Drizzle) ↔ `SessionRecord.channelId` (Zod) ↔ `SessionSummary.channelId` (wire) ↔ `s.channelId` (client).
- Zero data loss: column rename via `ALTER TABLE ... RENAME COLUMN`, not drop+add.
- Behavior-preserving: TDD, no `expect(...)` modified; test fixture *inputs* migrate from `{ id: ... }` to `{ channelId: ... }` but assertions stay.
- Drop the three redundant `const channelId = channel.channelId` alias lines in `connect.ts` once the value flows as `channelId` throughout.

**Non-Goals:**
- Not renaming `SessionStore.getById` / `rename` / `updateStatus` / `delete` method names. They take a `channelId` parameter but keep their generic names; chasing method rename here balloons the blast radius without clarifying semantics.
- Not touching the REST path `/api/sessions/:id` URL segment — that's a path parameter, not a payload field, and changing URLs breaks bookmarks / external integrations with no gain.
- Not touching `rawEntries.id` or `settings` keys — those are not channel identifiers.
- Not introducing a dual-name compat shim (`id` + `channelId` on the same response). Single source of truth is the whole point; wire is an internal protocol between our client and our server and we control both.

## Decisions

**Decision 1 — Column rename via `ALTER TABLE ... RENAME COLUMN`, not drop+add.**
Drizzle-kit doesn't reliably detect column renames; it will emit a destructive diff. We hand-author the migration SQL for both dialects so existing rows survive.
*Alternative considered*: drop+add with a data-migration step → rejected, unnecessary risk on user databases.

**Decision 2 — Schema field `channelId` → SQL column `channel_id` (snake_case), consistent with sibling columns (`parent_id`, `session_id`, `created_at`).**
Follows the existing convention in `schema-sqlite.ts` / `schema-mysql.ts`.

**Decision 3 — `SESSION_COLUMNS` consistency array updated in the same commit as the schemas.**
The consistency check (`schema-consistency.test.ts`) is a tripwire that will fail if we change one dialect but not the other, or forget the array. Keep it honest by updating all three together.

**Decision 4 — Wire rename is breaking; in-change migration rather than deprecation.**
Client and server are always deployed together in this repo; there is no external consumer of the `sessionSummarySchema` wire shape. A dual-name compat layer is dead code the day it lands.

**Decision 5 — TDD order: update the schema + type definitions first (red), then fix producers, then consumers, then tests' *inputs*.**
`tsc --noEmit` becomes the migration driver. Any place that currently reads `.id` on a `SessionRecord` / `SessionSummary` surfaces as an error and gets fixed.

**Decision 6 — Leave method names alone.**
`getById(channelId)` is slightly awkward but `getByChannelId` is redundant once the parameter name is explicit. We don't chase this in this change.

## Risks / Trade-offs

- **[Risk]** A deployed environment with existing DBs needs the migration to run before the new code. **Mitigation**: the migration is `ALTER TABLE ... RENAME COLUMN` which is fast and reversible by another rename; document in the migration file.
- **[Risk]** A third-party client or external script reads `id` from `/api/sessions*`. **Accepted**: no such consumer in this repo; internal protocol.
- **[Risk]** `drizzle-kit generate` auto-emits a destructive migration for a column rename. **Mitigation**: hand-write the migration `.sql` files; do not rely on `pnpm db:generate`. If we do run generate for other reasons, delete its session-rename diff before committing.
- **[Risk]** Fixture factories somewhere else in the repo construct `SessionRecord { id: ... }` and are missed. **Mitigation**: rely on `tsc --noEmit` + the test suite.

## Migration Plan

1. Branch from `main`.
2. Write the new session-store-identity spec scenarios (TDD red).
3. Edit DB schemas (SQLite + MySQL) and `SESSION_COLUMNS` in one pass — schema-consistency test must still pass.
4. Author migration SQL files (`ALTER TABLE sessions RENAME COLUMN id TO channel_id`) for both dialects under the appropriate `drizzle/` folder; make sure `pnpm db:migrate:*` picks them up.
5. Edit `sessionRecordSchema`, `SessionStore` method signatures, `drizzle-session-store.ts` queries, and `composite-session-store.ts`. Run typecheck; fix every surfaced server call site (`connect.ts`, `command.ts`, `query.ts`, `session-history.ts`, `routes/sessions.ts`). Drop the three redundant aliases in `connect.ts` as part of this wave.
6. Edit `sessionSummarySchema`; typecheck finds `SessionRow.tsx` + `SessionHistory.tsx`; migrate both to `.channelId`.
7. Update test fixture *inputs* (never assertions) across the ~7 test files.
8. Run `pnpm --filter server lint typecheck test` and `pnpm --filter client lint test` until clean.
9. Commit as a single unit (schema + code + migration + tests + client). Rollback = `git revert` + reverse migration (`ALTER TABLE sessions RENAME COLUMN channel_id TO id`) if needed.
