## Why

channel.ts 混合了 zod schemas、types、class 定義。server.ts 有 utility functions 和 MCP constants 不屬於 orchestrator。inline types 散落各處。

## What Changes

- 建 socket/schemas.ts 集中 payload schemas + infer types
- WireRunnerHooks, PendingRequest 搬到 types.ts
- pickDefined 搬到 types.ts
- MCP constants 搬到 handlers/mcp.ts 或獨立模組
- channel.ts 屬性分組 + 清 comment + 消除重複 conditional spread
- channel-manager.ts CreateChannelOptions interface
- 純重構，expect 不變或等價

## Capabilities
### New Capabilities
（無）
### Modified Capabilities
（無）

## Impact
- socket/ 內部結構調整
- 外部 API 不變
