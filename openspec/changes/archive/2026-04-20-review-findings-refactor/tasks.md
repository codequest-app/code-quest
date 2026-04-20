# Tasks

Each task is one small TDD-guarded commit. Green tests required before next task.

## 1. Client — low-risk constant extractions

- [~] 1.1 Skipped — only 1 call site of `['Tab','ArrowUp','ArrowDown','Enter']` exists in `ComposeInput.tsx:176`. Reviewer claimed two sites; grep confirms one. 2+ consumer rule → inline stays.
- [x] 1.2 Create `packages/client/src/utils/time-constants.ts` with `SECONDS_PER_MINUTE`, `SECONDS_PER_HOUR`, `MS_PER_SECOND`, `MS_PER_MINUTE`, `MS_PER_HOUR`, `MS_PER_DAY`, `DAYS_PER_MONTH_APPROX`, `DAYS_PER_YEAR_APPROX`
- [x] 1.3 Refactor `packages/client/src/utils/format-relative-date.ts` to use the new time constants
- [x] 1.4 Refactor `packages/client/src/utils/format-reset-time.ts` to use the new time constants
- [x] 1.5 Rename magic `60` / `80` slice lengths in `packages/client/src/utils/tool-registry.ts` to named constants (`SUMMARY_MAX_LENGTH`, `DESCRIPTION_MAX_LENGTH`)
- [x] 1.6 Move hard-coded hex values in `packages/client/src/utils/message-preview.ts` `TYPE_COLORS` to Tailwind theme tokens (or a named palette const if no matching token exists)

## 2. Summoner — readability refactors

- [x] 2.1 Replace nested ternaries at `packages/summoner/src/claude/transforms/control.ts:41` and `:112` with `switch` or lookup table
- [x] 2.2 Rewrite `extractDirectories` in `packages/summoner/src/filesystem/local.ts` using `split('/').filter(Boolean)` / `reduce` accumulation (replaces O(n²) `indexOf` loop)
- [x] 2.3 Flatten `checkoutWithFallback` cascade in `packages/summoner/src/git/local.ts:167-177`; add comment documenting the fallback strategy order

## 3. Server — helper extractions (shorter long functions)

- [x] 3.1 Extract `resolveTerminalCwd` and `createAndConfigureChannel` helpers from `packages/server/src/socket/handlers/terminal.ts#handleOpenClaude`
- [~] 3.2 Skipped — `finalizeAndNotify` is 28 lines and already delegates to `applyPerLaunchSettings` + `applyInitResponseAndBroadcast` + `emitInitState` + callback/broadcast. No further cohesive block to extract.

## 4. Server — Channel collaborator split (biggest scope)

- [x] 4.1 Introduce `packages/server/src/socket/control-request-tracker.ts` exporting a `ControlRequestTracker` class owning the `pendingRequests` / `controlRequestMeta` / timeout state currently in `Channel`
- [~] 4.2 NotificationTracker skipped — `notificationRequests` map was dead state (never `.set()` anywhere). Deleted the dead map + methods + never-taken branch in `handlers/message.ts` + `notificationResponseSchema` in shared. `mcpTimeouts` stays inline (3 one-liners, not worth a class).
- [x] 4.3 Thread ControlRequestTracker into `Channel` via composition; every public `Channel` method preserved with identical signatures
- [x] 4.4 Full server suite 483/483 green; shared 63/63; summoner 326/326; client 1295/1295

## 5. Shared — schema audit & consolidation

- [x] 5.1 Extract `channelIdPayloadBase` in `packages/shared/src/schemas/message-stream.ts`; update the 6 payload schemas to `channelIdPayloadBase.extend({ ... })`
- [x] 5.2 Audit each z.looseObject() — DECISION: keep all 40. looseObject is Zod v4 forward-compat primitive (replaces .passthrough); z.object silently drops unknown fields on parse. Original audit framing was wrong.
- [~] 5.3 Skipped — all three are in use: `successResponseSchema` (response-schemas.test.ts), `messageContentSchema` (session-connect.test.ts), `clientMessageSchema` (shared/session.ts).

## 6. Verification

- [x] 6.1 `pnpm test` passes across all packages (server 483, shared 63, summoner 326, client 1295)
- [x] 6.2 `pnpm exec biome check` clean (2 pre-existing warnings in test files unrelated to this change)
- [x] 6.3 `pnpm exec tsc --noEmit` clean per package (via pre-commit hooks)
- [x] 6.4 Branch merged to main as 1097f27a; pre-push lefthook (client + server tests) passed
