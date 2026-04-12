## 1. Rename wire schema fields

- [ ] 1.1 `packages/shared/src/schemas/session.ts`:
  - `sessionForkPayloadSchema`: `forkedFromSession` → `forkedFromChannelId`, `newSessionId` → `newChannelId`
  - `sessionTeleportPayloadSchema`: `remoteSessionId` → `remoteChannelId`, `newSessionId` → `newChannelId`
  - `sessionLaunchPayloadSchema.resume` → `resumeChannelId`
  - `sessionStatesPayloadSchema.activeSessionId` → `activeChannelId`
  - `initResponseSchema.activeSessionId` → `activeChannelId`
  - `forkConversationResponseSchema.parentSessionId` → `parentChannelId`

## 2. Fix server callers (typecheck-driven)

- [ ] 2.1 `pnpm --filter server exec tsc -p tsconfig.build.json --noEmit` — enumerate errors
- [ ] 2.2 `socket/handlers/session/fork.ts`: read fields with new names; update `channelManager.create(newChannelId, ...)`, pass `forkedFromChannelId` where applicable
- [ ] 2.3 `socket/handlers/session/connect.ts`: read `parsed.resumeChannelId` instead of `parsed.resume`; internal variable `resumeSessionId` stays (it's the CLI arg; the misleading name is about to be corrected too if we want — but scope-deferred)

## 3. Fix client callers (typecheck-driven)

- [ ] 3.1 `pnpm --filter client exec tsc --noEmit` — enumerate errors
- [ ] 3.2 `contexts/SessionContext.tsx`: update emit payloads for `session:fork` and `session:teleport`
- [ ] 3.3 `contexts/channel/handlers/session.ts`: update any listener that reads the old field names

## 4. Fix tests (fixture inputs only, no expects)

- [ ] 4.1 `server/src/__tests__/session-fork.test.ts`: swap `forkedFromSession: x, newSessionId: y` → `forkedFromChannelId: x, newChannelId: y` in emitted payloads. Assertions that read from persistedArgs still work because server passes channelId to sessionStore.persist as before.
- [ ] 4.2 `server/src/__tests__/app.test.ts`: any references to `activeSessionId` in response fixtures
- [ ] 4.3 `server/src/__tests__/session-connect.test.ts`: `{ resume: X }` → `{ resumeChannelId: X }` in the 4 call sites (line ~853, 1033, 1058, 1082)

## 5. Verify

- [ ] 5.1 `pnpm --filter server test` — 431/431
- [ ] 5.2 `pnpm --filter client test` — 743/743
- [ ] 5.3 `pnpm --filter server lint` + `pnpm --filter client lint` — no new errors vs baseline
- [ ] 5.4 Grep `forkedFromSession|remoteSessionId|newSessionId|parentSessionId|activeSessionId` across `packages/*/src` — expect zero hits
- [ ] 5.5 Grep `parsed\.resume\b|payload\.resume\b|resume:\s` in server callers — expect zero leftover (tests that build the payload still allowed if they pass through new field)

## 6. Wrap up

- [ ] 6.1 Single commit — naming cleanup.
