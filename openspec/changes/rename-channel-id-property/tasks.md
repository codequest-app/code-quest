## 1. TDD — make the tests drive the rename

- [ ] 1.1 Update `fakeChannel` in `packages/server/src/__tests__/channel-emitter.test.ts` to build its stub with `channelId` instead of `id` (destructuring default `channelId = 'ch-1'`, returning `{ channelId }`)
- [ ] 1.2 Run `pnpm --filter server test channel-emitter` — expect failures because `Channel` still declares `id` and handlers still read `ch.id`
- [ ] 1.3 Run `pnpm --filter server typecheck` — capture the full list of `.id` access errors as the authoritative to-do set

## 2. Rename the class property

- [ ] 2.1 In `packages/server/src/socket/channel.ts`, rename the `readonly id: string` field (line 44) to `readonly channelId: string` and update the constructor assignment
- [ ] 2.2 Verify no getter alias remains — the property must be only `channelId`

## 3. Fix server call sites (grouped by file)

- [ ] 3.1 `packages/server/src/socket/channel-emitter.ts` — line 99: `this.emit(ch.channelId, event, { channelId: ch.channelId, ... })`
- [ ] 3.2 `packages/server/src/socket/channel-manager.ts` — line 168: `this.emitter.addSocketToChannel(channel.channelId, socket)`
- [ ] 3.3 `packages/server/src/socket/handlers/connect.ts` — lines 28, 134, 188, 243, 268, 270, 271 (7 usages)
- [ ] 3.4 `packages/server/src/socket/handlers/git.ts` — line 99
- [ ] 3.5 `packages/server/src/socket/handlers/speech.ts` — lines 7, 11
- [ ] 3.6 `packages/server/src/socket/handlers/permission.ts` — lines 16, 35, 50
- [ ] 3.7 `packages/server/src/socket/handlers/settings.ts` — lines 205, 213
- [ ] 3.8 `packages/server/src/socket/handlers/mcp.ts` — line 143
- [ ] 3.9 `packages/server/src/socket/handlers/message.ts` — lines 252, 256

## 4. Verify & sweep

- [ ] 4.1 Run `pnpm --filter server typecheck` — expect clean
- [ ] 4.2 Run `pnpm --filter server test` — expect all green, including `channel-emitter.test.ts` that failed in 1.2
- [ ] 4.3 Grep `packages/server/src` for `\.id\b` on `Channel`-typed values (`ch\.id`, `channel\.id`) — expect zero hits
- [ ] 4.4 Grep for stale payload construction like `{ id:` on channel objects — expect zero hits
- [ ] 4.5 Skim the diff against the blast-radius inventory in `design.md` to confirm all 16 server usages + 1 test helper are updated

## 5. Wrap up

- [ ] 5.1 Single commit with message summarizing the rename
- [ ] 5.2 Run full server CI target locally (`pnpm --filter server lint typecheck test`)
