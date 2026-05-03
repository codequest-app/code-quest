## Context

`ClaudeAdapter`（`packages/summoner/src/claude/adapter.ts`）實作 `ProviderAdapter` interface，是 Claude CLI stdout → ClientMessage 的轉換橋樑。目前有三種職責混在同一個檔案：

1. **Inbound transform**：`convertRateLimitMessage`、`convertAuthStatusMessage` 是 inline 函式，但 `transforms/` 目錄已有六個風格一致的 transformer 檔案（`assistant.ts`、`system.ts` 等）
2. **Outbound mapping**：`REQUEST_MAPPINGS` 是 60+ 行的靜態資料表，混在 class 定義旁邊
3. **Wiring**：`ClaudeAdapter` class 把上述邏輯組合起來

## Goals / Non-Goals

**Goals:**
- `transforms/notification.ts`、`transforms/auth.ts` 各自獨立，風格與現有 transforms 一致
- `request-mappings.ts` 獨立為純資料模組
- `adapter.ts` 只做 import 和 wiring，不含任何業務邏輯

**Non-Goals:**
- `ProviderAdapter` interface 不動
- `protocol.ts`、`schemas.ts`、`client-config.ts`、`launch-options.ts` 不動
- `plugin-cli.ts` 不動
- 現有 `transforms/` 檔案不動
- 行為不變（純搬移，無邏輯修改）

## Decisions

**決策 1：`transformRateLimit` 和 `transformAuthStatus` 各自一個檔案**

- Option A：合併進 `transforms/system.ts`（system 已經很大了）
- Option B：各自一個小檔案 ✓

選 B。`rate_limit_event` 和 `auth_status` 在 protocol schema 上是獨立 top-level type，不是 `system` 的 subtype，放 `system.ts` 語意不對。

**決策 2：`request-mappings.ts` export 純 `const`，不 export class**

`REQUEST_MAPPINGS` 是靜態資料，不需要封裝成 class 或 factory。直接 `export const requestMappings` 讓 adapter import 使用，最簡單。

**決策 3：`RequestMapping` type 跟著 `request-mappings.ts` 走**

目前 `RequestMapping` interface 定義在 `adapter.ts` 頂部，只有 `REQUEST_MAPPINGS` 用到它。搬移時一起搬，不留在 adapter。

## Risks / Trade-offs

- [Risk] 搬移時不小心漏改 import → Mitigation: TypeScript 編譯錯誤會立即抓出
- [Risk] 測試 mock 路徑假設檔案位置 → Mitigation: 現有測試測行為不測路徑，`adapter-integration.test.ts` 應無需修改
