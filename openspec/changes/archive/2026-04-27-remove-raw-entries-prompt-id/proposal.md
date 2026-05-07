## Why

`raw_entries.prompt_id` is dead code. Every writer hardcodes it to `''` (three sites: `raw-recorder.ts` ×2, `fork.ts` ×1) and **no reader exists anywhere in the codebase**. A grep across `packages/**/*.{ts,tsx}` (non-generated, non-test) returns zero sites that consume the column — only schema definitions and write-time `''` stamps.

Earlier (pre-`2886d122`) the column held a uuid, but that path was lost in a refactor. Bringing it back would mean re-inventing a server-generated uuid that has no grounding — it does not correspond to anything CLI emits, does not map to `cliUuid` (which rewind uses), and only serves to "group rows we already wrote". That grouping can be derived from `session_id + seq` range or from the upcoming `raw_deltas.parent_id` foreign key, without a dedicated column.

Instead of restoring a meaningless value, we remove the column. This unblocks the follow-up `raw_deltas` work (which references `raw_entries.id` directly) and cleans up a persistent source of confusion in the schema.

## What Changes

- **Drop `prompt_id`** from both `sqlite` and `mysql` schemas of `raw_entries`.
- **Remove** `promptId` field from Drizzle schema definitions, `RAW_ENTRY_COLUMNS`, the zod schema in `drizzle-raw-store.ts`, and the `RawEntry` type in `summoner/src/types.ts`.
- **Remove** the three hardcoded `promptId: ''` write sites (`raw-recorder.ts` ×2, `fork.ts` ×1).
- **Drizzle migration** drops the column (idempotent: check if exists before drop for MySQL).
- No behavioural change for consumers — nothing reads the column today.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none — this is pure schema cleanup of an unused column; no spec-level behaviour changes)

## Impact

- `apps/server/src/db/schema-{sqlite,mysql,columns}.ts`
- `apps/server/src/services/drizzle-raw-store.ts`
- `apps/server/src/socket/raw-recorder.ts`
- `apps/server/src/socket/handlers/session/fork.ts`
- `apps/summoner/src/types.ts`
- New Drizzle migration files (sqlite + mysql)
- Tests: fixtures that pass `promptId: '...'` literals will break — adjust to drop the field.

Because there are no readers, no production query path changes. Safe to ship as a single PR with a migration.
