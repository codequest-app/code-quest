## Why

Channel-level socket subscriptions are duplicated across three contexts
(`ChannelMessagesContext`, `ChannelConfigContext`, `ChannelControlContext`).
Each context calls `wireHandlers(...)` separately inside its own `useEffect`,
and `session:states` is subscribed three times for the same broadcast.
There is no single place to see which events the channel layer consumes, which
makes it easy to accidentally add another `socket.on(...)` instead of
registering a handler.

## What Changes

- Add a `ChannelSocketRouter` that owns the single `socket.on(...)` subscription
  for all channel events and fans out payloads to registered handlers.
- Replace the three `wireHandlers(socket, channelId, ...)` calls in
  `ChannelMessagesContext`, `ChannelConfigContext`, `ChannelControlContext`
  with `router.register({ handlers, setState, effects, ... })`.
- Dedupe the `session:states` subscription so only one listener hits the
  socket per channel.
- Keep the three imperative socket.on call-sites that mix subscription with
  side effects (`joinSession` on `session:states`, `message:result` with
  `chat:send` emit, `handlers/streaming.ts`) out of this change — they are
  not pure reducer-shaped handlers.

## Capabilities

### New Capabilities
- `channel-socket-router`: single subscription point for channel-scoped socket
  events with per-context handler registration, channelId guard, and
  coordinated lifecycle.

### Modified Capabilities
(none — this is a pure refactor of an internal mechanism; no user-facing spec
changes)

## Impact

- `packages/client/src/contexts/channel/handlers/guard.ts` — `wireHandlers`
  becomes internal to the router or is replaced.
- `packages/client/src/contexts/channel/ChannelMessagesContext.tsx`,
  `ChannelConfigContext.tsx`, `ChannelControlContext.tsx` — each drops its
  `wireHandlers` useEffect and calls `router.register(...)` instead.
- A new `ChannelSocketRouter` provider/hook is added at the channel scope so
  the three contexts share one router instance per channel.
- No test changes: FakeClaude emits events to the real socket and the
  end-to-end path is unchanged. Refactor rule applies — existing `expect`
  assertions stay.
