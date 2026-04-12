## 1. TDD — trim client tests first

- [ ] 1.1 Edit `packages/client/src/contexts/channel/__tests__/ChannelProvider-id-context.test.tsx`: drop the `useSessionId()` assertion and the second `it(...)` block. Keep the `useChannelId()` assertion intact. Drop the `useSessionId` import and the `sessionId` span in the harness component.
- [ ] 1.2 Delete `packages/client/src/contexts/channel/__tests__/SessionIdContext.test.tsx`
- [ ] 1.3 Run `pnpm --filter client test` — expect failures because `ChannelContext.tsx` / `channel/index.ts` still import `SessionIdContext.tsx` (which we haven't deleted yet). That is the driver for step 2.

## 2. Delete SessionIdContext ecosystem

- [ ] 2.1 Delete `packages/client/src/contexts/channel/SessionIdContext.tsx`
- [ ] 2.2 `packages/client/src/contexts/channel/ChannelContext.tsx`: remove `SessionIdProvider` import; remove the `<SessionIdProvider channelId={channelId}>` wrapper (children move up one level so they sit directly inside `<ChannelIdProvider>`).
- [ ] 2.3 `packages/client/src/contexts/channel/index.ts`: remove the `export { SessionIdProvider, useSessionId } from './SessionIdContext';` line.
- [ ] 2.4 Run `pnpm --filter client test` — green (the two tests deleted in step 1 no longer reference the deleted module).

## 3. Trim the wire schema

- [ ] 3.1 `packages/shared/src/schemas/session.ts`: in `sessionInitPayloadSchema`, delete the `sessionId: z.string()` line. The derived `SessionInitPayload` TypeScript type narrows accordingly.

## 4. Stop emitting sessionId from the server

- [ ] 4.1 `packages/server/src/socket/handlers/session/connect.ts`: in `buildSessionInitPayload`, remove the `sessionId: channel.sessionId ?? '',` line from the returned object. (Server-internal `Channel.sessionId` is untouched; only the wire payload changes.)
- [ ] 4.2 Run `pnpm --filter server exec tsc -p tsconfig.build.json --noEmit` — expect clean (the only caller was shaped by the schema, and the schema update in 3.1 tightened it).
- [ ] 4.3 Run `pnpm --filter server test` — some fixture-side tests that build `session:init` payloads with `sessionId:` may fail. Fix their fixture *inputs* only; leave `expect(...)` lines untouched.

## 5. Verify

- [ ] 5.1 `pnpm --filter client exec tsc --noEmit` (or build equivalent) — clean.
- [ ] 5.2 `pnpm --filter client test` — 747/747 (two tests removed from the earlier 749).
- [ ] 5.3 `pnpm --filter server test` — 432/432.
- [ ] 5.4 Lint: `pnpm --filter client lint` + `pnpm --filter server lint` — no new errors vs baseline.
- [ ] 5.5 Grep `useSessionId|SessionIdContext|SessionIdProvider` across `packages/client/src` — expect zero hits.
- [ ] 5.6 Grep `sessionId:` inside `session:init` payload construction sites in tests and fixtures — expect zero hits (the ones that remain are for Channel internal state, not wire).

## 6. Wrap up

- [ ] 6.1 Single commit.
- [ ] 6.2 Open a follow-up note for naming cleanup: `sessionForkPayloadSchema.{forkedFromSession,newSessionId}`, `sessionTeleportPayloadSchema.{remoteSessionId,newSessionId}`, `sessionLaunchPayloadSchema.resume`, `sessionStatesPayloadSchema.activeSessionId`, `initResponseSchema.activeSessionId`, `forkConversationResponseSchema.parentSessionId` — all carry channelId-semantic values but their names still say `session`. Pure renaming, separate change.
