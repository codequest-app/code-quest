## 1. AdapterOutput.events → messages (summoner types + adapter)

- [x] 1.1 Rename `AdapterOutput.events` → `messages` in `types.ts`, update all references in adapter.ts, runner.ts, transforms
- [x] 1.2 Run summoner tests

## 2. Transform function renames (summoner transforms)

- [x] 2.1 Rename `transformAssistantEvent` → `transformAssistant`, `transformUserEvent` → `transformUser`, `transformSystemEvent` → `transformSystem`, `transformResultEvent` → `transformResult`, `transformStreamEvent` → `transformStream` (keep `transformControlRequest` as-is)
- [x] 2.2 Update adapter.ts imports and calls
- [x] 2.3 Run summoner tests

## 3. Adapter private method + standalone function renames

- [x] 3.1 Rename `convertEvent` → `convertMessage`, `convertOtherEvent` → `convertOtherMessage`, `convertRateLimitEvent` → `convertRateLimitMessage`
- [x] 3.2 Rename parameter/variable `event` → `message` where it refers to ProtocolMessage in adapter standalone functions
- [x] 3.3 Run summoner tests

## 4. Runner variable rename

- [x] 4.1 Rename `protocolEvent` → `protocolMessage` in runner.ts
- [x] 4.2 Run summoner tests

## 5. Server renames

- [x] 5.1 Rename `se` → `message` in channel.ts (`handleInternalEvent`, `onClientMessage` callback, `bindRunner`)
- [x] 5.2 Rename `dispatchRunnerEvent` → `dispatchRunnerMessage` in channel-emitter.ts + channel-manager.ts
- [x] 5.3 Rename `event` → `message` in session-history.ts loop variables
- [x] 5.4 Run server tests

## 6. Test description cleanup

- [x] 6.1 Update test descriptions and variable names in summoner and server test files
- [x] 6.2 Run all tests (summoner + server + client)
