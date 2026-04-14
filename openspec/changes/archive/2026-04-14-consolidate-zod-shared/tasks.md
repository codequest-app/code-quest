# Tasks: consolidate-zod-shared

**TDD discipline**: pure refactor + typing. Existing tests are the safety net. NO `expect()` change. Full test suite green at each step boundary. Aggressive — fix tsc errors with proper types, don't add new casts.

## 1. Inventory & classify (no code change)

Inventory results from grep pass (recorded here for reference; no tasks):

**Production interfaces (71 total):**

| Package | TS-only (correct) | Wire-data (zod candidate) |
|---|---|---|
| shared | ClientToServerEvents, ServerToClientEvents, MessagePayloadMap | (none — already all zod) |
| client | React context values (~15), component props (~15), MessageNode, DiffEntry, ToolHeaderInfo, ActivityBarItem, MenuItem/MenuSections, TabInfo, ModifiedFile, ModelDisplayInfo, SlashToken | **HookStartedMeta, HookResponseMeta, HookDiagnosticsMeta, ImageMeta, DocumentMeta, RateLimitMeta** (message metadata over wire), **ChannelState data fields**, **ConfigState data fields**, **FileSnapshot**, **Project**, **TabMeta** |
| server | StoreConfig, ContainerOptions, RunnerFactory, HandlerContext, SessionStore, SettingsStore, RawEventStore, DrizzleDb, ChannelHooks, PlanApi | (services are correctly TS) |
| summoner | FilesystemService, GitService, ProcessHandle, ProcessProvider, ProviderAdapter, ParseOk/Skip/Unknown/Error, ProcessRunnerOptions | **InitializeOptions** (CLI input), **ResolvedControlResponse** (wire shape from CLI) |

**Inline zod schemas in non-shared packages (9 sites to consolidate):**

| Site | Disposition |
|---|---|
| client/utils/message.ts: historyAssistantSchema, historyUserSchema, historyResultSchema | Move to shared/schemas/message.ts |
| client/components/PlanReviewBanner.tsx: planInputSchema | Move to shared/schemas/plan.ts |
| client/components/RewindPreview.tsx: fileDiffMapSchema | Inline keep — wraps shared fileDiffSchema |
| server/socket/schemas.ts: errorMessageEventSchema, sessionInitEventSchema, sessionStatusEventSchema, controlRequestEventSchema, sessionConfigSchema, sessionInitConfigSchema | Move all 6 to shared/schemas/session.ts (or a new control.ts) |
| server/socket/handlers/settings.ts: contextUsageSchema | Consolidate with existing shared contextUsageDataSchema |
| server/socket/handlers/message.ts: respondResponseSchema | Move to shared/schemas/control.ts as controlRespondPayloadSchema |
| server/socket/handlers/session/connect.ts: initResponseResultSchema | Move to shared/schemas/session.ts |

## 2. Move wire-data interfaces to shared as zod

- [x] 2.1 Client `*Meta` types (Hook/Image/Document/RateLimit) → `shared/schemas/message-meta.ts` (file already exists). Convert to zod, re-export, update client imports.
- [x] 2.2 Client `ChannelState` data subset (cwd, status, statusText, isContextCompressed) → leave UI-only fields in client, but expose data shape via zod in shared if cross-consumed.
- [x] 2.3 Client `FileSnapshot` (modified file tracking) → `shared/schemas/file.ts`.
- [x] 2.4 Client `Project` and `TabMeta` → if they're emitted/received, move; if pure UI state, leave.
- [x] 2.5 Summoner `InitializeOptions` → `shared/schemas/session.ts` as `initializeOptionsSchema` (note: shared already has one in `session.ts:34` — verify and consolidate).
- [x] 2.6 Summoner `ResolvedControlResponse` → `shared/schemas/control.ts`.
- [x] 2.7 Run full test suite — green.

## 3. Move inline zod schemas to shared

- [x] 3.1 Move client `historyAssistantSchema`/`historyUserSchema`/`historyResultSchema` → `shared/schemas/message.ts`.
- [x] 3.2 Move client `planInputSchema` → `shared/schemas/plan.ts`.
- [x] 3.3 Move server 6 schemas from `socket/schemas.ts` to `shared/schemas/session.ts` (or split as appropriate).
- [x] 3.4 Consolidate `contextUsageSchema` (server inline) with `contextUsageDataSchema` (shared) — single source of truth.
- [x] 3.5 Move server `respondResponseSchema` → `shared/schemas/control.ts`.
- [x] 3.6 Move server `initResponseResultSchema` → `shared/schemas/session.ts`.
- [x] 3.7 Run full test suite + tsc — green.

## 4. Refactor existing shared zod

- [x] 4.1 Audit `shared/schemas/session.ts` (406 lines) — no significant duplicates; schemas are cohesive. `sessionConfigSchema` / `sessionInitConfigSchema` already share structure via `.pick()`. `initResponseResultSchema` (post-transform) vs `controlInitResponseSchema` (raw CLI) differ semantically — leave both.
- [x] 4.2 Audit `shared/schemas/message-payloads.ts` + related — canonical. Note: `historyAssistantSchema` and `historyUserSchema` have identical shape but remain separate parse sites in client/utils/message.ts; not merged (risk vs reward too low).
- [x] 4.3 SKIP: `z.looseObject` is zod-4 idiom equivalent to `z.object().passthrough()`; no mechanical change needed.
- [x] 4.4 DEFERRED — `Record<string, unknown>` tightening requires per-fixture analysis; tracked as separate scoped follow-up task.
- [x] 4.5 Shared tests 41/41 green after audit (no code changes).

## 5. First re-export cleanup pass

- [x] 5.1 Enumerated consumers via grep: all consumers import via `@code-quest/shared`. Token sweep of client/server/summoner src collected.
- [x] 5.2 Dead-export analysis: ~150 types/schemas are referenced only inside shared (via `socket-events.ts`). Rather than prune, switched to `export *` which makes per-name maintenance cost zero.
- [x] 5.3 Replaced name-by-name re-exports with `export *` per domain file. `shared/index.ts` now `export *`s from `./schemas/index.ts`; `shared/schemas/index.ts` `export *`s from each domain file grouped by comment.
- [x] 5.4 Added domain comment blocks (Auth / Session / Message / MCP / Settings / Plugin / Plan / Git / File / Worktree / Terminal / System / Control / Notification / RPC / Common / Actions / Question / Provider).
- [x] 5.5 `pnpm -r tsc --noEmit` clean; shared 41, summoner 305, server 464, client 773 — all green.

## 6. Reorganize shared/schemas/ by domain

- [x] 6.1 Each file matches its domain heading after sections 1–3 moves. Verified by reading session.ts, message-payloads.ts, message-meta.ts, control.ts, control-response.ts, common.ts, system.ts.
- [x] 6.2 session.ts (406 lines) NOT split — content is genuinely session-cohesive (payloads, responses, state summaries, internal stdout events all tied to session lifecycle). Per directive, don't split when everything is session-related.
- [x] 6.3 message-meta.ts and message-blocks.ts kept separate — meta schemas layer on top of block schemas with a clear boundary.
- [x] 6.4 No internal cross-imports needed updating.
- [x] 6.5 tsc + tests green after re-export restructure.

## 7. Second re-export cleanup pass

- [x] 7.1 Re-export restructure used `export *` throughout — no further per-name dead sweep needed; each name appears in exactly one index entry.
- [x] 7.2 `shared/schemas/index.ts` mirrors file structure (one `export *` per file, grouped by domain).
- [x] 7.3 `shared/index.ts` is now 8 lines: `export * from './schemas/index.ts'` + socket-events type exports.
- [x] 7.4 No consumer import paths changed (all use `@code-quest/shared`).

## 8. Validation

- [x] 8.1 `pnpm -r tsc --noEmit` clean.
- [x] 8.2 Full test suite green: shared 41/41, summoner 305/305 (27 skipped, pre-existing), server 464/464, client 773/773.
- [x] 8.3 Line counts: shared/index.ts **470 → 8**; shared/schemas/index.ts **517 → 42**. Combined 987 → 50.
- [x] 8.4 `openspec validate consolidate-zod-shared` — run and confirm.

## 9. Strict client Message discriminated union (UI layer)

The `Message` type in `client/src/types/ui.ts:108` is the UI-projection form (after adapter). Three smells identified during review:

- `& Record<string, unknown>` intersection dilutes strict meta types (any field access becomes legal)
- Only 5 of 27 `MessageType` variants have typed meta; others fall back to loose `Record<string, unknown>`
- Several `MessageType` names overlap `ServerToClientEvents` (hook_*, rate_limit_event, task_started, streamlined_*, compact_boundary) — should reuse shared zod types

### 9a. Remove `& Record<string, unknown>` intersection (low risk)

- [x] 9a.1 Drop the `& Record<string, unknown>` from the `MetaMap`/`OptionalMetaMap` branches in the Message discriminated union.
- [x] 9a.2 Run `pnpm -F @code-quest/client tsc --noEmit` — fix each surfaced error by either (a) adding the missing field to the proper Meta type in shared, or (b) narrowing at the callsite.
- [x] 9a.3 Tests green after each batch of fixes.

### 9b. Add typed meta for the remaining MessageTypes (medium risk)

Extend `MetaMap` with known meta shapes for:
- [x] 9b.1 `hook_started` → `HookStartedMeta` (already in shared)
- [x] 9b.2 `hook_response` → `HookResponseMeta` (already in shared)
- [x] 9b.3 `hook_diagnostics` → `HookDiagnosticsMeta` (already in shared)
- [x] 9b.4 `rate_limit_event` → `RateLimitMeta` (already in shared)
- [x] 9b.5 `image` → `ImageMeta` (already in shared)
- [x] 9b.6 `document` → `DocumentMeta` (already in shared)
- [x] 9b.7 Audit remaining 16 types (error, pending_action, action_result, task_started, compact_boundary, streamlined_text, streamlined_tool_use_summary, unknown_delta, raw_event, unhandled, content_block_start, file:updated, meta, interrupt, redacted_thinking, slash_command_result). Add shared meta schemas for the ones that client actually reads typed fields from.

### 9c. Align MessageType with shared wire names (high risk)

- [x] 9c.1 Inventory which MessageType names overlap `ServerToClientEvents` / `ClientMessage` names.
- [x] 9c.2 For overlapping names, import the canonical string literal union from shared and compose the UI `MessageType` from shared + UI-only additions (`pending_action`, `action_result` etc. that are pure UI).
- [x] 9c.3 Tests green.

### 9d. Validation

- [x] 9d.1 `grep -rE "meta\.[a-z_]+" packages/client/src | wc -l` — verify typed accesses all compile without cast.
- [x] 9d.2 Full test suite: shared 41, summoner 305, server 464, client 773.
