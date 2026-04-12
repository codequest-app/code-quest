## Why

The server `Channel` class exposes its identifier as `id`, but every consumer immediately aliases or maps it to `channelId` (payloads, event names, log fields, variable names). The mismatch creates friction at every call site and makes grep/navigation noisy. Renaming the property to `channelId` aligns the class shape with how it is already universally referenced.

## What Changes

- Rename `Channel.id` → `Channel.channelId` in `packages/server/src/socket/channel.ts`.
- Update the 16 server usages (across `connect.ts`, `channel-manager.ts`, `channel-emitter.ts`, `git.ts`, `speech.ts`, `permission.ts`, `settings.ts`, `mcp.ts`, `message.ts`) to read `channel.channelId` / `ch.channelId`.
- Update the `fakeChannel` helper in `packages/server/src/__tests__/channel-emitter.test.ts`.
- Pure rename refactor — no protocol, no payload, no runtime behavior change.

## Capabilities

### New Capabilities
- `server-channel-identity`: Codifies the public shape of the server `Channel` class's identifier field so consumers have a single documented name (`channelId`) rather than an ad-hoc `id` → `channelId` mapping at every call site.

### Modified Capabilities
<!-- None. Socket payload shapes on the wire (`channelId` field) are unchanged. -->


## Impact

- **Code**: `packages/server/src/socket/channel.ts` (class), 8 handler/infrastructure files under `packages/server/src/socket/`, and 1 test file.
- **APIs / protocol**: unchanged — emitted socket payloads already use `channelId`.
- **Dependencies**: none.
- **Consumers outside server package**: none — `Channel` is a server-internal class.
