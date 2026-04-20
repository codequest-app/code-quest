# Tasks

Each task is one small TDD-guarded commit. Green tests required before next task.

## 1. Client — low-risk constant extractions

- [~] 1.1 Extract `NAV_KEYS_COMPOSE` constant in `packages/client/src/components/ComposeInput.tsx` (replaces duplicate array literal at two call sites)
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

- [ ] 3.1 Extract `resolveTerminalCwd` and `createAndConfigureChannel` helpers from `packages/server/src/socket/handlers/terminal.ts#handleOpenClaude`
- [ ] 3.2 Extract `applyPerLaunchSettings` vs broadcast helpers from `packages/server/src/socket/handlers/session/connect.ts#finalizeAndNotify`

## 4. Server — Channel collaborator split (biggest scope)

- [ ] 4.1 Introduce `packages/server/src/socket/control-request-tracker.ts` exporting a `ControlRequestTracker` class owning the `pendingRequests` / `controlRequestMeta` / timeout state currently in `Channel`
- [ ] 4.2 Introduce `packages/server/src/socket/notification-tracker.ts` exporting a `NotificationTracker` class owning `pendingNotifications` / `mcpTimeouts` state
- [ ] 4.3 Thread both trackers into `Channel` via composition; keep every public method on `Channel` with identical signatures delegating to the trackers
- [ ] 4.4 Run full server test suite and confirm no test / assertion changed

## 5. Shared — schema audit & consolidation

- [ ] 5.1 Extract `channelIdPayloadBase` in `packages/shared/src/schemas/message-stream.ts`; update the 6 payload schemas to `channelIdPayloadBase.extend({ ... })`
- [ ] 5.2 Audit each `z.looseObject()` call site across `packages/shared/src/schemas/`; for schemas whose all callers are in-repo with known fixed keys, migrate to `z.object(...)`. Leave loose for CLI-provider-facing payloads.
- [ ] 5.3 Verify and remove confirmed-unused exports from `packages/shared/src/schemas/common.ts` (grep across workspace for `successResponseSchema`, `messageContentSchema` — remove only if truly no consumers)

## 6. Verification

- [ ] 6.1 `pnpm test` passes across all packages
- [ ] 6.2 `pnpm exec biome check` clean
- [ ] 6.3 `pnpm exec tsc --noEmit` clean per package
- [ ] 6.4 Push branch + confirm lefthook pre-push hooks (typecheck + tests) pass
