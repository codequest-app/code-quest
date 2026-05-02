## Context
channel.ts 411 行混合 schemas + types + class。server.ts 有不屬於它的 utilities。

## Goals / Non-Goals
**Goals:** 職責分離，schemas 獨立，types 集中，消除重複
**Non-Goals:** 不改 runtime 行為，不拆 buildChannelHooks

## Decisions
1. 建 socket/schemas.ts：payload schemas + SessionState + RequestMeta
2. types.ts 加：WireRunnerHooks, PendingRequest, pickDefined, SessionBroadcastState
3. MCP constants 移出 server.ts
4. channel.ts 屬性分組 + conditional spread 用 pickDefined
5. channel-manager.ts 提取 CreateChannelOptions
