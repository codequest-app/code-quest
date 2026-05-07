## Why

`ClaudeAdapter` 目前混雜三種職責（inbound transform、outbound mapping、wiring），導致不同層的邏輯堆在同一個 class 裡，且 inline 函式風格與 `transforms/` 目錄不一致。趁著正在評估新增 Gemini adapter 的時機，先把 Claude 的內部職責拆乾淨，讓每個檔案只做一件事。

## What Changes

- 新增 `claude/transforms/notification.ts`：搬入 `convertRateLimitMessage`，改名 `transformRateLimit`
- 新增 `claude/transforms/auth.ts`：搬入 `convertAuthStatusMessage`，改名 `transformAuthStatus`
- 新增 `claude/request-mappings.ts`：搬入 `REQUEST_MAPPINGS` 靜態資料及 `RequestMapping` 型別，export 為 `requestMappings`
- 修改 `claude/adapter.ts`：移除上述三項的 inline 定義，改為 import，class 本身成為純 wiring

## Capabilities

### New Capabilities

- `claude-adapter-internals`: ClaudeAdapter 內部職責拆分 — transforms 與 request mappings 各自獨立檔案

### Modified Capabilities

- `adapter`: ClaudeAdapter 的實作細節調整（`REQUEST_MAPPINGS` 與兩個 inline convert 函式移出），外部行為與 `ProviderAdapter` interface 不變

## Impact

- 影響檔案：`apps/summoner/src/claude/adapter.ts`（修改）、`claude/transforms/notification.ts`（新增）、`claude/transforms/auth.ts`（新增）、`claude/request-mappings.ts`（新增）
- `ProviderAdapter` interface 不動
- 無 breaking change：所有公開 API 行為不變
- 測試：`adapter-integration.test.ts` 無需修改（行為不變）
