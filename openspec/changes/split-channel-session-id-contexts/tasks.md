## 1. ChannelIdContext (TDD)

- [ ] 1.1 Write `packages/client/src/contexts/channel/__tests__/ChannelIdContext.test.tsx`: (a) descendant of `<ChannelIdContext.Provider value="ch-1">` reads `"ch-1"` via `useChannelId()`; (b) calling `useChannelId()` outside a provider throws with a message naming the provider
- [ ] 1.2 Run `pnpm --filter client test ChannelIdContext` — new tests fail (module doesn't exist)
- [ ] 1.3 Implement `packages/client/src/contexts/channel/ChannelIdContext.tsx` exporting `ChannelIdContext`, `ChannelIdProvider` (thin `<ChannelIdContext.Provider>` wrapper if helpful), and `useChannelId(): string`; tests pass

## 2. SessionIdContext (TDD)

- [ ] 2.1 Write `packages/client/src/contexts/channel/__tests__/SessionIdContext.test.tsx` covering the 5 scenarios:
  (a) initial value is `null`
  (b) `session:init` for matching `channelId` flips value to the payload's `sessionId`
  (c) `session:init` for a different `channelId` is ignored
  (d) subsequent `session:init` overwrites with latest sessionId
  (e) listener is removed when the provider unmounts
- [ ] 2.2 Use the project's existing test harness to simulate socket events. Check which of `renderWithChannel`, `renderWithWorkspace`, or a direct `SocketContext` mock fits — prefer whatever the closest existing test (e.g. `session:states` handling in `channel/__tests__/`) already uses. Do NOT invent a new wrapper.
- [ ] 2.3 Run tests — all 5 fail
- [ ] 2.4 Implement `packages/client/src/contexts/channel/SessionIdContext.tsx` exporting `SessionIdContext`, `SessionIdProvider` (component taking `channelId: string` + `children`; uses `useSocket()` + `useEffect` keyed on `[socket, channelId]` to subscribe/unsubscribe from `session:init`), and `useSessionId(): string | null`
- [ ] 2.5 Validate incoming `session:init` payloads with `sessionInitPayloadSchema.safeParse` (project rule: Zod for external data); ignore invalid payloads
- [ ] 2.6 All SessionIdContext tests pass

## 3. Wire into `ChannelProvider`

- [ ] 3.1 In `packages/client/src/contexts/channel/ChannelContext.tsx`, wrap the existing sub-provider stack with `<ChannelIdContext.Provider value={channelId}>` (outermost) and `<SessionIdProvider channelId={channelId}>` (just inside)
- [ ] 3.2 Do NOT change the existing `channelId` props passed to the four rich providers — leave them exactly as they are
- [ ] 3.3 Add a smoke test: mount `<ChannelProvider channelId="ch-1">`, assert a descendant can read `"ch-1"` via `useChannelId()` and `null` via `useSessionId()` before any event

## 4. Verify

- [ ] 4.1 `pnpm --filter client test` — full suite green (existing tests must stay green since no consumer touched)
- [ ] 4.2 `pnpm --filter client lint` — no new errors vs baseline
- [ ] 4.3 Grep `useChannelMessages/Control/Config/Compose` call sites for regressions — none expected since we didn't change them

## 5. Refactor — extract `ChannelIdProvider` component

- [ ] 5.1 Add a named `ChannelIdProvider({ channelId, children })` component in `ChannelIdContext.tsx` as a thin wrapper over `<ChannelIdContext.Provider value={channelId}>` — symmetry with `SessionIdProvider`, attach point for future validation/logging
- [ ] 5.2 Update `ChannelContext.tsx` to use `<ChannelIdProvider channelId={channelId}>` instead of raw `<ChannelIdContext.Provider>`
- [ ] 5.3 Update `ChannelIdContext.test.tsx` to wrap with `<ChannelIdProvider channelId="ch-1">` (more semantic than `<ChannelIdContext.Provider value="ch-1">`)
- [ ] 5.4 Full client test run — all green

## 7. Cleanup — remove duplicated `channelId` from rich contexts

- [ ] 7.1 Migrate consumer `packages/client/src/components/HeaderBar.tsx`: replace `const { channelId } = useChannelMessages()` with `const channelId = useChannelId()` (keep everything else)
- [ ] 7.2 Migrate consumer `packages/client/src/components/ChatPanel.tsx`: replace `const { channelId, subscribeRawEvents } = useChannelMessages()` with `const channelId = useChannelId()` + `const { subscribeRawEvents } = useChannelMessages()`
- [ ] 7.3 Update test helper in `packages/client/src/contexts/channel/__tests__/channelId-in-state.test.tsx`: swap `const { channelId } = useChannelMessages()` → `const channelId = useChannelId()` inside the `ChannelIdDisplay` component. **Keep every `it` / `expect` line as-is.**
- [ ] 7.4 Run full client tests — expect all green (consumers migrated, rich contexts still expose `channelId` → nothing broken yet)
- [ ] 7.5 `ChannelMessagesContext.tsx`: drop `channelId` from `ChannelMessagesValue` type, drop from `MessagesStateValue` `Pick<...>` list, drop from provider's `value={{ ... }}`, drop `channelId: string` from provider props, call `useChannelId()` internally where `channelId` was previously the prop
- [ ] 7.6 `ChannelControlContext.tsx`: same treatment
- [ ] 7.7 `ChannelConfigContext.tsx`: same treatment
- [ ] 7.8 `ChannelComposeContext.tsx`: same treatment
- [ ] 7.9 `ChannelContext.tsx` orchestrator: stop passing `channelId` prop to the four rich providers
- [ ] 7.10 Run `pnpm --filter client test` — all green (no test assertions changed)
- [ ] 7.11 Run `pnpm --filter client lint` — no new errors vs baseline
- [ ] 7.12 Grep `channelId:` inside the 4 refactored context value objects and `channelId: string` in the 4 provider prop types — expect zero hits

## 8. Wrap up

- [ ] 8.1 Single commit summarizing the additive split
- [ ] 8.2 Open a brief follow-up note (issue / memo) for the future "remove channelId from rich context values" cleanup so it doesn't get forgotten
