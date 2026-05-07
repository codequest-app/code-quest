## Tasks

### 1. Drizzle migrations
- [x] Generate sqlite migration: `ALTER TABLE raw_entries DROP COLUMN prompt_id;`
- [x] Generate mysql migration: same statement.
- [x] Confirm migrations run cleanly on a DB that still has the column and on a DB that already doesn't (idempotent via IF EXISTS where syntax allows; otherwise lint).

### 2. Schema definitions
- [x] Remove `promptId` from `packages/server/src/db/schema-sqlite.ts`.
- [x] Remove `promptId` from `packages/server/src/db/schema-mysql.ts`.
- [x] Remove `'promptId'` from `packages/server/src/db/schema-columns.ts` `RAW_ENTRY_COLUMNS`.

### 3. Zod + TS types
- [x] Remove `promptId: z.string()` from `packages/summoner/src/types.ts` `RawEntry` schema.
- [x] Remove `promptId` from `packages/server/src/services/drizzle-raw-store.ts` (zod input schema + column type + insert payload + query projection — 4 sites).

### 4. Write sites (remove hardcoded `''`)
- [x] `packages/server/src/socket/raw-recorder.ts` — drop `promptId: ''` at lines 21 and 38.
- [x] `packages/server/src/socket/handlers/session/fork.ts` — drop `promptId: ''` at line 146.

### 5. Test fixtures
- [x] `packages/server/src/__tests__/raw-event-store.test.ts` — remove `promptId` keys from all fixtures.
- [x] `packages/server/src/__tests__/composite-raw-store.test.ts` — same.
- [x] Any other test that literal-passes `promptId`.

### 6. Run migrations + regression
- [x] `pnpm --filter @code-quest/server db:migrate` (or equivalent) — sqlite and mysql.
- [x] `pnpm vitest run` — full suite green.
- [x] `pnpm tsc --noEmit` — clean.

### 7. Smoke
- [ ] Start server against real DB, send one message, verify a new `raw_entries` row inserts without error and without `prompt_id`.
