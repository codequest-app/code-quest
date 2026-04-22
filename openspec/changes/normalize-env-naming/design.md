## Context

Current env surface (server):

```
DATABASE_URL
RAW_STORE                    → list of drivers
RAW_STORE_SQLITE_PATH        → sqlite file
RAW_STORE_FILE_DIR           → dead for raw events; still read by settings file store
SYSTEM_PROMPT
ALLOW_DANGEROUSLY_SKIP_PERMISSIONS
FILE_EXPLORER_ROOTS
AUTO_MODE
```

The `RAW_STORE_*` family is the most conspicuously misaligned with the codebase's internal vocabulary (event-centric class / socket / panel names). This PR fixes that one family and tackles the dead `file` driver as a cleanup side-effect. Other awkward names (`AUTO_MODE`, `ALLOW_DANGEROUSLY_SKIP_PERMISSIONS`) are **out of scope**; batching too many rename changes at once dilutes review and hurts git-blame archaeology.

## Goals / Non-Goals

**Goals:**
- `RAW_STORE_*` → `RAW_EVENTS_*` with zero-downtime dev experience (old vars keep working with a deprecation log).
- Drop `'file'` as a raw-event driver (it never was one post-refactor).
- Remove `RAW_STORE_FILE_DIR` from both config and env files.
- Leave a placeholder comment for the follow-up `RAW_EVENTS_PERSIST_DELTAS` so reviewers see the forward plan.

**Non-Goals:**
- Implementing delta persistence / `raw_deltas` table (follow-up PR).
- Other env renames (`APP_PORT`, `CLI_*`, etc.) — noted in conversation, deferred.
- Changing the driver-list parsing syntax (still comma-separated).

## Decisions

### Decision 1: Backward-compatible fallback

```ts
const rawEvents = process.env.RAW_EVENTS_DRIVERS ?? process.env.RAW_STORE ?? '';
const sqlitePath = process.env.RAW_EVENTS_SQLITE_PATH ?? process.env.RAW_STORE_SQLITE_PATH ?? './data/code-quest.db';

if (process.env.RAW_STORE && !process.env.RAW_EVENTS_DRIVERS) {
  logger.warn('RAW_STORE is deprecated; use RAW_EVENTS_DRIVERS');
}
```

**Why**: Anyone with an existing `.env` keeps working, sees a warning, and can migrate on their own cadence. Removal happens in the next PR (once team confirms they migrated).

**Alternative considered**: Hard rename, no fallback. Rejected — breaks dev machines with stale `.env`; adds a trivial amount of code to support one cycle.

### Decision 2: `'file'` driver removed, `FileSettingsStore` gets a fixed data dir

The file driver in `VALID_RAW_STORE_DRIVERS` was the only way to enable `FileSettingsStore`. That coupling never made sense — settings persistence should be independent of the raw-event backend choice.

Two options:
- **(a)** Hardcode `FileSettingsStore('./data/settings.json')` and remove the env entirely.
- **(b)** Introduce `SETTINGS_FILE_PATH` as its own env.

Prefer (a) — settings-file location has never been configured by anyone (grep `RAW_STORE_FILE_DIR=` in history returns only the template). Adding a new env for a dial nobody touches is noise.

### Decision 3: Driver enum shrinks from `['sqlite','mysql','file']` to `['sqlite','mysql']`

If someone still has `RAW_STORE=sqlite,mysql,file` in their `.env`, `parseRawStoreDrivers` already ignores unknown drivers with a warning. So the enum shrink is effectively a no-op with a nicer warning message for the `'file'` token.

## Risks / Trade-offs

- **[Risk]** A hidden consumer reads `RAW_STORE` directly (not through `config.ts`). **Mitigation**: grep confirmed — only `config.ts` reads it.
- **[Risk]** Settings file gets written to a different path than before if `./data/events` was intentional. **Mitigation**: Check current `.env` — `RAW_STORE_FILE_DIR=./data/events` was the default; new hardcoded path `./data/settings.json` is a subset of `./data/`. Migration one-liner: `mv ./data/events/settings.json ./data/settings.json` if present.
- **[Risk]** CI / deploy configs carry `RAW_STORE=...`. **Mitigation**: deprecation warning at boot flags it; runtime keeps working.

## Migration Plan

1. Ship config fallback + warning.
2. Update `.env` / `.env.example` in repo to the new names.
3. Post-merge: team members rename their local `.env` at leisure (warning prompts them).
4. Follow-up PR (1–2 weeks): remove the fallback + warning.
