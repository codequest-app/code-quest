## Why

Claude CLI's thinking mode has two orthogonal knobs: `--thinking` (on/off/adaptive)
and `--thinking-display` (summarized/omitted). cc-office wires the first but
never passes the second, so the CLI falls back to `omitted` — model emits a
signed thinking block with an empty `thinking` string, and the UI renders an
empty placeholder (with an orphan copy button). We confirmed this end-to-end
from DB (`raw_events` thinking body is `""`) back to the original CLI JSONL.

To actually show the thinking content in cc-office, we need to opt into
`--thinking-display summarized`, let operators set a server-wide default via
`.env`, and let users override per-session via settings. We also need to fix
the UI so empty thinking blocks don't leave a ghost row on screen.

## What Changes

- Extend `LaunchOptions` (`apps/summoner/src/claude/launch-options.ts`)
  with an optional `thinkingDisplay: 'summarized' | 'omitted'` field.
- `protocol.ts#buildArgs` appends `--thinking-display <value>` when set, gated
  on `thinking != null && thinking !== 'disabled' && typeof thinking !== 'number'`
  (legacy `--max-thinking-tokens` path doesn't accept the flag).
- Add `CLI_THINKING_DISPLAY` env + `config.thinkingDisplay` (default
  `'summarized'`). Matches existing `CLI_*` env namespace.
- Server thread-through: `config.thinkingDisplay` is the default fed into
  `LaunchOptions`, overridable per-session via settings.
- Persist the per-session preference alongside `thinkingLevel` in
  `SettingsStore`, surfaced through `settings:set_thinking_level` (no new RPC).
- UI fix: exclude `thinking` / `redacted_thinking` from the copy-button list
  in `ChatMessage`, and skip rendering the whole message row when the thinking
  body is empty (historical sessions + future signature-only turns).

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `cli`: `buildArgs` must emit `--thinking-display` when configured.
- `adapter`: settings surface must carry `thinkingDisplay` alongside
  `thinkingLevel` and pipe it through `session:launch` + `state:update`; env
  default (`CLI_THINKING_DISPLAY`) applies when per-session setting is unset.
- `client`: thinking / redacted_thinking rows must not show a copy button;
  empty-body thinking rows must not render at all.

## Impact

- `apps/summoner/src/claude/launch-options.ts` (schema)
- `apps/summoner/src/claude/protocol.ts` (arg builder)
- `apps/summoner/src/__tests__/claude/build-args.test.ts`
- `apps/server/src/config.ts` + `apps/server/.env.example` + local `.env`
- `apps/server/src/__tests__/config.test.ts`
- `apps/server/src/socket/channel.ts` (launch wiring)
- `apps/server/src/socket/handlers/settings.ts` (settings handler)
- `apps/server/src/services/settings-store.ts` (persistence key)
- `packages/shared` (event payload schema if the settings event grows)
- `apps/web/src/components/ChatMessage.tsx` (NO_COPY_TYPES + empty-body
  guard)
- `apps/web/src/components/MessageContent.tsx` (thinking case guard)
- Client-side settings UI (follow-up; out of scope unless the existing
  `thinkingLevel` toggle already carries the new field).
