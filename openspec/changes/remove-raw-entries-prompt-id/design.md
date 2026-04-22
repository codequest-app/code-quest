## Context

`raw_entries.prompt_id` was introduced when the server-side raw event store was first added. Since commit `2886d122` (2026-03) its three writers have all hard-coded `''`, and grep confirms zero reader sites in production code. 578 of 833 user-input rows carry `''`; the remaining 255 are legacy from a pre-regression code path.

We considered restoring the column as a server-minted per-turn uuid, but the value would have no external grounding (CLI does not emit it, rewind uses `cliUuid`, downstream features like `raw_deltas.parent_id` point at `raw_entries.id` directly). A column whose only job is "correlate rows we wrote ourselves" adds schema noise without additional capability.

## Goals / Non-Goals

**Goals:**
- Drop `prompt_id` from both sqlite and mysql schemas.
- Remove the column from all type definitions, zod schemas, and write sites.
- Idempotent migration (safe to run on a DB already missing the column).
- Zero behaviour change for any caller.

**Non-Goals:**
- Any turn-correlation feature. "How do we tag turns?" is deferred to the follow-up `raw_deltas` PR, which will use `raw_entries.id` as the correlation key.
- Migrating historical rows (the column is being dropped, not renamed).
- Touching `cliUuid` / rewind flow.

## Decisions

### Decision 1: Drop, don't rename or keep-but-empty

**Why**: Keeping an unused column costs real schema surface (migrations, types, zod, serialization). Renaming implies a future use we do not have. Dropping is the least ambiguous signal that this field is not a contract.

**Alternative considered**: Repurpose as `turn_root_id: raw_entries.id NULL`. Rejected — no consumer yet; the follow-up PR for `raw_deltas` adds `parent_id` on that new table (where it is actually needed).

### Decision 2: Drizzle migration uses `ALTER TABLE ... DROP COLUMN`

sqlite supports `DROP COLUMN` from 3.35+ (covers both Bun and Node driver). MySQL supports it natively. No intermediate "mark nullable" step needed since nothing reads the column.

### Decision 3: Tests that pass `promptId: '...'` literals get the field removed, not updated

Most fixture tests pass something like `{ ...entry, promptId: 'p1' }`. Delete the key rather than adapt the fixture — those tests assert row-insertion, not `prompt_id` content.

## Risks / Trade-offs

- **[Risk]** A forgotten external consumer (migration script, analytics query) reads `prompt_id`. **Mitigation**: grep verified; reversible by adding the column back — dropped data is 578 `''` values and 255 uuid values none of which are consumed.
- **[Risk]** Drizzle schema drift if an environment's DB wasn't migrated. **Mitigation**: migration runs at server boot; any schema mismatch triggers a hard fail at INSERT time (not silent data corruption).

## Migration Plan

1. Drizzle migration file for sqlite: `ALTER TABLE raw_entries DROP COLUMN prompt_id;`
2. Drizzle migration file for mysql: same.
3. Update drizzle schema files so introspection matches.
4. Ship code + migration in one PR.
5. No backfill, no rollback script.
