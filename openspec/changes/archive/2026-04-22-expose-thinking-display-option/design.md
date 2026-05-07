## Context

Claude CLI 2.1.45 exposes two thinking-related flags:

```
--thinking <mode>           enabled | adaptive | disabled
--thinking-display <value>  summarized | omitted
```

cc-office's `buildArgs` in `apps/summoner/src/claude/protocol.ts:27-33` only
maps the first. The second defaults on the CLI side to `omitted`, so model
output arrives with `"thinking": ""` + signature. The UI renders that as an
empty panel. Verified directly against the CLI's raw JSONL
(`~/.claude/projects/.../<session>.jsonl`): zero `thinking_delta` events and
every thinking block is empty-body + signature-only.

Upstream wiring already treats thinking as a user-facing setting:

- `LaunchOptions.thinking: 'adaptive' | 'disabled' | number` carries the mode.
- `settings:set_thinking_level` persists a `thinkingLevel: 'default_on' | 'off'`
  that the server translates into a max-thinking-tokens value and/or
  `--thinking` mode.

So we already have a settings lane to piggyback on.

## Goals / Non-Goals

**Goals:**
- When the user has thinking enabled, thinking content actually renders in the
  UI (not an empty panel).
- `thinkingDisplay` is tunable per-session via settings, default `summarized`.
- Existing behavior preserved when `thinking === 'disabled'` or the legacy
  numeric budget is used.

**Non-Goals:**
- Restoring the delta path (`RAW_EVENTS_WRITE_DELTAS`) — orthogonal; this change
  doesn't depend on writing deltas because `summarized` arrives in the final
  assistant message.
- Exposing a separate UI control for `thinkingDisplay`. Tying it to the
  existing `thinkingLevel` toggle is enough for now.
- Supporting values beyond `summarized` / `omitted`. CLI has only these two.

## Decisions

### 1. Add `thinkingDisplay` to `LaunchOptions`, default undefined

`LaunchOptions.thinkingDisplay?: 'summarized' | 'omitted'`. `buildArgs` emits
`--thinking-display <value>` iff set AND `thinking != null` AND
`typeof thinking !== 'number'` AND `thinking !== 'disabled'`. When unset,
no flag is emitted (preserves CLI default for callers that don't care).

**Alternative considered:** always default to `summarized` at the summoner
layer. Rejected — summoner should be transport, not policy. The server decides
the default.

### 2. Two-layer default: env (operator) + settings (per-session)

Precedence (highest wins): **per-session setting** → **env** (`CLI_THINKING_DISPLAY`)
→ **hard-coded default `summarized`**.

- `config.ts` parses `CLI_THINKING_DISPLAY` and exposes
  `config.thinkingDisplay: 'summarized' | 'omitted'` (default `'summarized'`).
  Matches the existing `CLI_*` env namespace (`CLI_SYSTEM_PROMPT`,
  `CLI_BYPASS_PERMISSIONS`, `CLI_AUTO_MODE`).
- The launch-options assembly site reads `config.thinkingDisplay` as the
  baseline, then lets the per-session `SettingsStore` value override.
- Invalid env value → fall back to the hard-coded default. No process crash.

**Why two layers:** operators want a deployment-wide knob (privacy-sensitive
setups may default to `omitted`) without building UI; users want per-session
control when the UI exists. Env default + settings override is the same
pattern as other CLI-facing toggles in cc-office.

### 3. Reuse `thinkingLevel` settings lane, don't invent a new one

Extend the existing `settings:set_thinking_level` payload with an optional
`thinkingDisplay` field, persist under settings key `thinkingDisplay`. No new
RPC event needed. `'off'` keeps its current effect (no thinking); when level is
non-off, `thinkingDisplay` kicks in.

**Alternative considered:** dedicated `settings:set_thinking_display` event.
Rejected — the two settings are coupled (display only matters when thinking is
on), so collocating keeps the surface small.

### 4. Numeric-budget legacy path is untouched

Older models use `--max-thinking-tokens N` (legacy path in `protocol.ts`). That
path predates `--thinking-display`; the CLI rejects the flag in that mode.
`buildArgs` skips emitting it when `typeof thinking === 'number'`.

### 5. UI: don't render empty thinking rows + no copy button on thinking

Even with `summarized`, some turns still come back signature-only (model's
choice). Plus historical sessions have `thinking=""`. Today the UI:

- Passes all message types except an explicit deny-list into `CopyButton`.
  `thinking` / `redacted_thinking` aren't in the deny-list → orphan copy
  button on the row.
- `<ThinkingBlock>` returns `null` when body is empty, but the surrounding
  `AssistantMessage` wrapper (`<div class="group relative py-1">`) still
  renders — leaving a padded empty row with just the copy button.

Fix:
1. Add `'thinking'` / `'redacted_thinking'` to `NO_COPY_TYPES` in
   `ChatMessage.tsx`.
2. In `AssistantMessage`, compute `renderBody(message)` first; if it's
   `null`, return `null` for the whole component (skip the wrapper).
3. Move the empty-body guard to `MessageContent#case 'thinking'` so
   `renderBody` returns null cleanly (ThinkingBlock's own guard becomes
   redundant but kept for defensive symmetry).

## Risks / Trade-offs

- **Risk:** `summarized` changes what ends up in the CLI JSONL (previously
  empty thinking bodies). Historical sessions still render empty; only new
  sessions benefit. → Accept. No migration for past sessions.
- **Risk:** Users relying on current `omitted` behavior (e.g., privacy
  concerns) get surprised by the default flip. → Mitigation: setting is
  toggleable; release note mentions the change.
- **Trade-off:** coupling display to `thinkingLevel` means the UI can't express
  "thinking on but output hidden" without first reaching settings. That combo
  is niche; acceptable.
