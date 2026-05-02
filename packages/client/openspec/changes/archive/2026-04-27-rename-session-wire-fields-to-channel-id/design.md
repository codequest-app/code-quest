## Context

After `remove-session-id-from-client-wire`, the client no longer receives CLI sessionId. Remaining wire fields with `session`-flavored names all carry channelId values; the misleading naming dates from when the two ids weren't separated. This change updates those names so the wire reflects what the value actually is.

## Goals / Non-Goals

**Goals:** Consistent `channelId`-named wire fields wherever the value is a channelId. Zero behavior change. Full test suite green; no `expect(...)` modified.

**Non-Goals:** Renaming URL path params (`/api/sessions/:id`). Renaming internal server variables that use the old names. Touching the CLI-facing `launchOptions.resumeSessionId` (that one really is a sessionId — it's the arg for `--resume` passed to the CLI process).

## Decisions

**Decision 1 — Rename, no compat shim.** Client + server are always deployed together from this repo. A dual-name transitional schema is dead code the day it lands.

**Decision 2 — Keep the `SessionFork*`/`SessionTeleport*` schema/type names.** Only the field names inside those payloads change. The schema/payload names themselves refer to the operation (fork a session, teleport a session), which is still a session-level concept.

**Decision 3 — Rename `sessionLaunchPayloadSchema.resume` to `resumeChannelId`.** The current field name `resume` is short but ambiguous; callers historically passed both channelId and sessionId values. Explicit naming locks in the channelId semantic.

**Decision 4 — TDD-via-compiler.** Edit the schema first; typecheck + tests surface every caller; fix them. No new tests; existing coverage verifies behavior is unchanged.

## Risks / Trade-offs

- **[Risk]** A test fixture or server variable still reads the old name via dynamic lookup (`obj[key]` with runtime string). **Mitigation**: grep all old names before commit.
- **[Trade-off]** Churn in 7 files. Accepted — one-time, clears technical debt.

## Migration Plan

1. Edit `packages/shared/src/schemas/session.ts` — rename all 8 fields.
2. `tsc --noEmit` (server + client) — collect all breaks.
3. Fix callers file-by-file.
4. Run both test suites. Fix fixture inputs where tests build payloads with old field names.
5. Lint clean.
6. Single commit.
