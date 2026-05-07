## Why

summoner package 的 Claude-specific code（48KB）跟 generic code 混在同一層，`provider-adapter.ts` 的 generic interface 直接 import `claude-schemas.ts` 的 `ProtocolEvent`，導致加入 Gemini 等新 provider 時會破壞架構。`claude-adapter.ts`（25KB/812 行）職責過多，一個檔案處理 25+ event types。`ProtocolEvent` 手動維護的 union type 與已有的 zod schema 完全重複。

## What Changes

- 依功能拆資料夾：generic code 留 root，claude-specific 搬入 `claude/`，process transport 搬入 `transports/`
- `ProviderAdapter` 泛型化 `<E, L>`，generic code 不再 import claude-specific types
- `claude-adapter.ts` 拆成 `adapter.ts` + 6 個 transform 檔案（system, assistant, user, result, control, stream）
- 移除 `ProtocolEvent` union type — 各 transform 直接用 zod schema 的 infer type
- 移除 `provider-adapter.ts` — generic types 合併到 `types.ts`，`LaunchOptions`/`ParseResult` 搬到 `claude/protocol.ts`
- 重命名：`process-runner.ts` → `runner.ts`，`child-process-provider.ts` → `transports/child-process.ts`
- 純重構，行為完全不變，所有 test expect 不變或等價

## Capabilities

### New Capabilities

（無新功能，純重構）

### Modified Capabilities

（無行為變更）

## Impact

- `packages/summoner/src/` 所有檔案重新組織
- `packages/summoner/src/index.ts` barrel export 路徑更新
- `packages/server/` 和 `packages/client/` import from `@code-quest/summoner` 的 public API 不變（barrel export 保持相容）
- test 檔案跟隨 production code 搬移，import path 更新
