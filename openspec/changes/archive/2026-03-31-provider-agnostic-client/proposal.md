## Why

Client components 有 ~146 行 Claude-specific hardcoded 值散落在 15 個檔案裡（brand 文字、model string match、permission modes、auth methods、MCP scopes、usage tiers）。這讓 UI 層與 Claude 耦合，無法支援其他 CLI provider（如 Gemini），也造成維護負擔（CLI 更新 model 名稱時 client 要跟著改）。

同時，CLI 已經回傳 `ModelInfo.displayName` 和 `ModelInfo.supportsFastMode` 等動態資訊，但 client 沒有正確使用，反而自己做 string matching。

## What Changes

- **Phase 1**：刪除 client 的冗餘 model hardcode，改用 CLI 回傳的 `ModelInfo` 資料
- **Phase 2**：`ProviderAdapter` interface 新增 `clientConfig` 屬性，定義 brand、permission modes、auth methods、MCP scopes、usage tiers
- **Phase 3**：Client components 從 Context 讀取 provider config，消除所有 Claude-specific hardcode
- Brand 文字（"Claude"、"Anthropic"、docs URL）集中管理
- Permission mode 定義從 component hardcode 移到 adapter 提供
- Auth method / MCP scope mapping 從 switch statement 移到 config-driven

## Capabilities

### New Capabilities
- `provider-client-config`: ProviderAdapter 提供 client-side UI 配置（brand、capabilities、display hints），Server 透過 init 推送給 client，components 從 Context 消費

### Modified Capabilities

（無既有 spec 需修改）

## Impact

- `apps/summoner/src/protocol/provider-adapter.ts` — ProviderAdapter interface 擴展
- `apps/summoner/src/protocol/claude-adapter.ts` — ClaudeAdapter 實作 clientConfig
- `apps/server/src/socket/handlers/misc-handler.ts` — init response 帶 clientConfig
- `apps/web/src/utils/model-utils.ts` — 刪除 hardcoded fallback
- `apps/web/src/components/` — 15 個檔案移除 hardcode，改讀 Context
- `apps/web/src/contexts/SessionContext.tsx` — 存儲 providerConfig
- `packages/shared/src/schemas/` — 新增 ProviderClientConfig Zod schema
