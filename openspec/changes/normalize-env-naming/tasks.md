## Tasks

### 1. Code-level identifier rename (keep env + code aligned)
- [x] `config.rawStore` → `config.rawEvents`; update every reader (`bin/server.ts`, `container.ts`, tests).
- [x] `config.rawStore` → `config.rawEvents` (outer key only; `.drivers` field stays).
- [x] `RawStoreDriver` type → `RawEventsDriver` (exported).
- [x] `VALID_RAW_STORE_DRIVERS` → module-local `DRIVERS` (not exported; context from file + function names).
- [x] `parseRawStoreDrivers` → `parseRawEventsDrivers` (exported).
- [x] File + class: `drizzle-raw-store.ts` → `drizzle-raw-event-store.ts`, `DrizzleRawStore` → `DrizzleRawEventStore`.
- [x] File + class: `composite-raw-store.ts` → `composite-raw-event-store.ts`, `CompositeRawStore` → `CompositeRawEventStore`.
- [x] Update imports everywhere. `RawEventStore` interface / `rawEventStore` variable / `raw:event` socket / `RawEventPanel` stay (already aligned).

### 2. config.ts env reads (new names only)
Config reads the new env names directly. Repo `.env` is updated in this PR. No fallback to deprecated names.

- [x] `APP_PORT`
- [x] `RAW_EVENTS_DRIVERS`
- [x] `RAW_EVENTS_SQLITE_PATH`
- [x] `CLI_SYSTEM_PROMPT`
- [x] `CLI_AUTO_MODE`
- [x] `CLI_BYPASS_PERMISSIONS`
- [x] `EXPLORER_ROOTS`
- [x] `loadConfig(env)` factory accepts a custom env map for testing.

### 3. Drop `'file'` raw driver
- [x] Remove `'file'` from module-local `DRIVERS`.
- [x] Update warning message in `parseRawEventsDrivers` to list only `sqlite,mysql`.

### 4. `FileSettingsStore` decoupling
- [x] Remove `if (config?.file)` branch from `container.ts` `buildStores`.
- [x] Decide: hardcode `./data/settings.json` OR drop `FileSettingsStore` entirely (verify DB settings store is authoritative).
- [x] Remove `storeConfig.file` assignment from `bin/server.ts`.

### 5. `.env` / `.env.example`
- [x] Rewrite `packages/server/.env.example` in the new names, grouped by domain (App / DB / Raw Events / CLI / Explorer / Client), with comments explaining each.
- [x] Include commented `# RAW_EVENTS_PERSIST_DELTAS=false` placeholder (follow-up PR wires it).
- [x] Migrate local `packages/server/.env` to new names.
- [x] `DATABASE_URL`, `LOG_LEVEL`, `NODE_ENV`, `VITE_SERVER_URL` — unchanged.

### 6. Tests
- [x] Unit `parseRawEventsDrivers`: `'file'` now unknown + warning; `'sqlite,mysql'` valid.
- [x] Unit `loadConfig({...})`: all new names read correctly.
- [x] Unit `loadConfig({})`: empty env → correct defaults.

### 7. Regression + smoke
- [x] `pnpm -r test` — all green (server 485, client 1314, summoner 326).
- [x] `pnpm tsc --noEmit` — clean across all packages (shared's ES2023 lib bump addressed in sibling commit).
- [ ] Boot server manually as smoke (left to you).

### 8. Documentation
- [ ] Update any `README.md` / docs referencing the old env names (none found on grep — skip).
- [ ] Commit message: list all renames + note fallback + removal target (next PR).
