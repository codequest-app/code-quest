## Tasks

### 1. Red — build-args tests
- [x] `apps/summoner/src/__tests__/claude/build-args.test.ts`:
  - `thinking='adaptive' + thinkingDisplay='summarized'` → args contain both flags
  - `thinking='adaptive' + thinkingDisplay='omitted'` → flag is `omitted`
  - `thinking='disabled' + thinkingDisplay='summarized'` → no `--thinking-display`
  - `thinking=31999 + thinkingDisplay='summarized'` → uses `--max-thinking-tokens`, no `--thinking-display`
  - `thinking='adaptive'` alone → no `--thinking-display`

### 2. Green — LaunchOptions + buildArgs
- [x] `apps/summoner/src/claude/launch-options.ts`: add
      `thinkingDisplay: z.enum(['summarized', 'omitted']).optional()` to the schema.
- [x] `apps/summoner/src/claude/protocol.ts#buildArgs`: after the
      `--thinking <mode>` push, emit `--thinking-display` when:
      `o.thinkingDisplay != null && typeof o.thinking === 'string' && o.thinking !== 'disabled'`.

### 3. Env + config default
- [x] `apps/server/src/config.ts`: add
      `thinkingDisplay: 'summarized' | 'omitted'` (default `'summarized'`),
      parsed from `CLI_THINKING_DISPLAY` env var. Matches the existing
      `CLI_*` env namespace used for other Claude CLI knobs.
- [x] `apps/server/.env.example` + local `.env`: document the new var
      (commented, defaults stated).
- [x] `apps/server/src/__tests__/config.test.ts`: cases for default,
      explicit `summarized` / `omitted`, invalid value falls back to default.

### 4. Server wiring
- [x] `apps/server/src/socket/channel.ts` (or the launch-options
      assembly site): thread `config.thinkingDisplay` (env default) into
      `LaunchOptions.thinkingDisplay`, overridable by per-session settings.
- [x] `apps/server/src/socket/handlers/settings.ts`: extend the
      `settings:set_thinking_level` handler to accept and persist
      `thinkingDisplay`. When the per-session setting is unset, fall
      back to `config.thinkingDisplay`.
- [x] Shared schema (`packages/shared`): widen
      `settings:set_thinking_level` payload with optional `thinkingDisplay`.
- [x] **Bug fix discovered during integration**: `buildLaunchOpts` must
      also set `launchOptions.thinking = 'adaptive'` when `thinkingLevel`
      is non-off. Without it, no `--thinking` flag is passed to the CLI
      (cc-office currently only uses runtime `set_max_thinking_tokens`
      control), so `--thinking-display` is gated out by `buildArgs` and
      our whole change is inert on Opus 4.7 (whose default is `omitted`).
      Only Opus 4.6 happened to "work" because its API default was
      `summarized`.

### 5. Red → Green — settings handler tests
- [x] `apps/server/src/__tests__/settings.test.ts` `chat:set_thinking_level`
      block: add cases for:
      - client sending `thinkingDisplay=omitted` → persisted + forwarded on
        next launch
      - client omits `thinkingDisplay` → falls back to `config.thinkingDisplay`
        (env default)
- [x] Ensure `thinkingLevel='off'` path omits `--thinking-display` in the
      final CLI args (regression).

### 6. UI: hide empty thinking rows + drop copy button on thinking
Two connected problems:
- `NO_COPY_TYPES` in `ChatMessage.tsx` doesn't include `'thinking'` /
  `'redacted_thinking'` → copy button still renders on thinking blocks.
- `ThinkingBlock` returns null when body is empty, but the surrounding
  `AssistantMessage` wrapper (`<div class="group relative py-1">`) keeps
  rendering → empty padded row with an orphan copy button.

- [x] Red — client test: thinking message with non-empty body has no
      copy button (`queryByTestId('message-copy')` = null within the
      thinking row).
- [x] Red — client test: thinking message with empty body renders
      nothing (no row, no copy button).
- [x] Red — client test: non-empty thinking still renders the
      `<ThinkingBlock>` (happy path unchanged).
- [x] Green — add `'thinking'`, `'redacted_thinking'` to
      `NO_COPY_TYPES` in `ChatMessage.tsx`.
- [x] Green — move the empty-body guard to
      `MessageContent#case 'thinking'` so `renderBody` returns null for
      empty thinking; `AssistantMessage` returns null when its
      `renderBody` result is null (skip the wrapper entirely).

### 7. Manual verify
- [ ] Start a fresh session with thinking default_on. Trigger a prompt that
      typically produces thinking (e.g. "explain X"). Confirm the thinking
      panel shows content in the UI and the `raw_events` row has non-empty
      `"thinking"` body.
- [ ] Toggle `thinkingDisplay=omitted` in settings, repeat; confirm panel is
      empty again.

### 8. Regression
- [x] `pnpm -r test` all green.
- [x] `pnpm tsc --noEmit` clean.
