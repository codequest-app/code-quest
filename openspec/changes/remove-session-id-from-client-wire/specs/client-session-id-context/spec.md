## REMOVED Requirements

### Requirement: `SessionIdContext` publishes the server-assigned `sessionId`

**Reason**: The requirement codified a React context that has no real consumer. Its existence depended on the server leaking the CLI `sessionId` on the `session:init` socket event. With that leak being closed in this change (removing `sessionId` from `sessionInitPayloadSchema`), the context has nothing to publish and nothing to consume. Client-side callers needing a channel-scoped identifier use `useChannelId()`; operations that conceptually involve the CLI sessionId (resume, fork, rewind) send `channelId` to the server and let `sessionHistory.resolveSessionId` translate internally at the protocol boundary.

**Migration**: No client-side migration needed — `useSessionId()` had no production consumers. Delete the `SessionIdContext.tsx` module, its tests, the `SessionIdProvider` wrapper in `ChannelContext.tsx`, and the barrel re-exports in `channel/index.ts`.
