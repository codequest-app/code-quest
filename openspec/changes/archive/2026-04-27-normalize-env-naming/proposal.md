## Why

cc-office's env namespace grew organically. Prefixes are inconsistent (`RAW_STORE_*` vs `FILE_EXPLORER_*` vs bare `AUTO_MODE` / `SYSTEM_PROMPT` / `ALLOW_DANGEROUSLY_SKIP_PERMISSIONS`), some names use dead terms (`RAW_STORE` — raw *what*? stored *how*?), one env (`RAW_STORE_FILE_DIR`) is dead code, and boolean conventions are mixed (positive vs negative phrasing).

Laravel's established `.env` conventions give a clear template: domain-prefixed (`APP_*`, `DB_*`, `LOG_*`, `MAIL_*`, `CACHE_*`), short but self-describing, positive boolean phrasing, and a small vocabulary (`DRIVER`, `CONNECTION`, `URL`, `HOST`, `PORT`, `PATH`). Applying that template normalizes the whole surface in one pass, and — critically — aligns env names with the codebase's own internal vocabulary (the project talks about **events**, but the env variable is still called `RAW_STORE`).

Doing all renames in a single change is cheaper than staging: one deprecation-warning cycle, one `.env` migration for the team, one git-blame moment. Follow-up PRs can remove fallbacks once the warnings are quiet.

## What Changes

### Env renames

| Old | New | Rationale |
|---|---|---|
| `PORT` | `APP_PORT` | Laravel `APP_*` domain |
| `RAW_STORE` | `RAW_EVENTS_DRIVERS` | match domain vocab; self-describing |
| `RAW_STORE_SQLITE_PATH` | `RAW_EVENTS_SQLITE_PATH` | same prefix family |
| `RAW_STORE_FILE_DIR` | **removed** (dead) | no raw writer; file settings store hardcoded |
| `SYSTEM_PROMPT` | `CLI_SYSTEM_PROMPT` | Claude CLI domain prefix |
| `AUTO_MODE` | `CLI_AUTO_MODE` | same |
| `ALLOW_DANGEROUSLY_SKIP_PERMISSIONS` | `CLI_BYPASS_PERMISSIONS` | shorter, positive, domain prefix |
| `FILE_EXPLORER_ROOTS` | `EXPLORER_ROOTS` | drop redundant `FILE_` (explorer is fs by definition) |

### Not renamed (intentional)

- `DATABASE_URL` — broad-industry standard (Heroku, Docker, PostgreSQL, Prisma, Drizzle). Renaming to `DB_URL` would hurt tool compatibility more than it helps internal consistency.
- `LOG_LEVEL` — already canonical.
- `NODE_ENV` — Node.js platform standard.
- `VITE_SERVER_URL` — Vite enforces `VITE_` prefix.

### Code-level identifier renames (kept aligned with env)

- `config.rawStore` → `config.rawEvents` (outer key only; `.drivers` field stays).
- `RawStoreDriver` type → `RawEventsDriver` (exported).
- `VALID_RAW_STORE_DRIVERS` → module-local `DRIVERS` const (not exported).
- `parseRawStoreDrivers` → `parseRawEventsDrivers` (exported).
- Class file `drizzle-raw-store.ts` → `drizzle-raw-event-store.ts`; `DrizzleRawStore` → `DrizzleRawEventStore`.
- Class file `composite-raw-store.ts` → `composite-raw-event-store.ts`; `CompositeRawStore` → `CompositeRawEventStore`.
- `RawEventStore` interface / `rawEventStore` variable / `raw:event` socket event / `RawEventPanel` component — already aligned, no change.

### Dead-code cleanup

- Remove `'file'` from `VALID_RAW_STORE_DRIVERS` (no raw writer registers on it).
- `FileSettingsStore` stops reading `RAW_STORE_FILE_DIR`; either hardcode `./data/settings.json` or drop if DB stores are authoritative (check during implementation).

### Backward compatibility

None. Single-developer project — the `.env` files in the repo are updated in the same PR. No fallback reader, no deprecation warning. Boot with an old-named env simply reads nothing and defaults apply (which will surface as obvious misbehaviour in seconds).

### New placeholder

Add a commented `# RAW_EVENTS_PERSIST_DELTAS=false` to `.env.example` pointing at the follow-up `raw_deltas` change. No code wires it up in this PR — just the name is reserved.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none — env naming and code identifiers are deployment/maintenance concerns, not spec-level behaviour)

## Impact

- `apps/server/src/config.ts` — all env reads, type renames.
- `apps/server/src/bin/server.ts` — `config.rawStore` reader sites.
- `apps/server/src/container.ts` — `FileSettingsStore` decoupling from raw store; identifier renames.
- `apps/server/src/services/drizzle-raw-store.ts` → `drizzle-raw-event-store.ts` (rename + class rename).
- `apps/server/src/services/composite-raw-store.ts` → `composite-raw-event-store.ts` (rename + class rename).
- `apps/server/.env`, `apps/server/.env.example` — full rewrite in new naming.
- Tests — any fixture referencing `RAW_STORE`, `SYSTEM_PROMPT`, `AUTO_MODE`, `ALLOW_DANGEROUSLY_SKIP_PERMISSIONS`, `FILE_EXPLORER_ROOTS`, `PORT`, or the renamed classes / types.
- No DB schema change, no client change (Vite envs untouched), no protocol change.
