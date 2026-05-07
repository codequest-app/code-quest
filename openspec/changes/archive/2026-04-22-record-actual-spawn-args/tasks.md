## Tasks

### 1. Red — summoner runner tests
- [x] `apps/summoner/src/__tests__/runner.test.ts` (or
      `claude/process-runner.test.ts` — use the existing file):
  - `runner.launchArgs` matches `adapter.buildArgs(opts)` after
    construction, is readonly (type-level).
  - When stdout yields a `session:init` line, the emitted
    `client_message`'s payload has `args` equal to
    `runner.launchArgs`.
  - Non-init ClientMessages do not gain an `args` field.

### 2. Green — ProcessRunner
- [x] `apps/summoner/src/runner.ts`:
  - Change `private readonly launchArgs` → `public readonly launchArgs`.
  - In `_processLine`, after `transform`, if a `ClientMessage.name`
    is `'session:init'`, spread augment its `payload` with
    `{ args: this.launchArgs }` before emitting.

### 3. Red/Green — shared schema
- [x] `packages/shared/src/schemas/session.ts`:
  - Add `args: z.array(z.string()).optional()` to
    `sessionInitEventSchema`.
  - If any test snapshots break (schema fixture diff), update them.

### 4. Red — server session-record test
- [x] `apps/server/src/__tests__/settings.test.ts` or a dedicated
      `session-record.test.ts`:
  - After a `session:launch` with a known `launchOptions`, the
    persisted `sessions.args` (read via `sessionStore.getById`)
    contains the CLI flags corresponding to those options (e.g.
    `--thinking`, `--thinking-display`).
  - Two launches with different opts produce different stored args.

### 5. Green — server wiring
- [x] `apps/server/src/socket/handlers/session/connect.ts`:
  - `onSessionInit` reads `args` from the parsed `session:init`
    payload (via `sessionInitEventSchema`) and writes it to DB.
  - Fallback: if `args` missing, write `[]` and log a warning.
- [x] `apps/server/src/socket/channel-manager.ts`: remove
      `runnerArgs` getter (verify no other consumers).
- [x] `apps/server/src/container.ts`: remove `args:
      adapter.buildArgs()` from `runnerFactory`. Also remove from
      the `RunnerFactory` interface in `types.ts`.

### 6. Test harness parity
- [x] If `FakeProcessRunner` / fake-summoner exists with its own
      `session:init` emission, mirror the augmentation so tests
      that assert on `sessions.args` still see runner-provided args.

### 7. Regression
- [x] `pnpm -r test` all green.
- [x] `pnpm tsc --noEmit` all packages clean.

### 8. Manual verify
- [ ] Start fresh server + session. `SELECT args FROM sessions
      ORDER BY created_at DESC LIMIT 1` shows full args including
      `--thinking adaptive --thinking-display summarized`.
- [ ] Launch two sessions with different models; confirm different
      `args` stored.
