## 1. 新增 transform 模組

- [x] 1.1 新增 `packages/summoner/src/claude/transforms/notification.ts`，export `transformRateLimit`（從 adapter.ts 搬入 `convertRateLimitMessage` 並改名）
- [x] 1.2 新增 `packages/summoner/src/claude/transforms/auth.ts`，export `transformAuthStatus`（從 adapter.ts 搬入 `convertAuthStatusMessage` 並改名）

## 2. 新增 request-mappings 模組

- [x] 2.1 新增 `packages/summoner/src/claude/request-mappings.ts`，export `RequestMapping` type 及 `requestMappings` const（從 adapter.ts 搬入 `RequestMapping` interface 和 `REQUEST_MAPPINGS`，並更名 const）

## 3. 精簡 adapter.ts

- [x] 3.1 在 `adapter.ts` 移除 `RequestMapping` interface、`REQUEST_MAPPINGS` 定義，改 import `requestMappings` from `./request-mappings.ts`
- [x] 3.2 在 `adapter.ts` 移除 `convertRateLimitMessage`、`convertAuthStatusMessage` inline 函式，改 import `transformRateLimit`、`transformAuthStatus`
- [x] 3.3 更新 `OTHER_MESSAGE_TRANSFORMERS` 中對應的 handler，改用新 import 名稱

## 4. 驗證

- [x] 4.1 執行 `tsc --noEmit` 確認無型別錯誤
- [x] 4.2 執行 adapter 相關測試確認行為不變
