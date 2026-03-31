## 1. Phase 1 — ProviderClientConfig 建立

### 1.1 Zod schema + type — DONE
### 1.2 ProviderAdapter interface 擴展 — DONE

### 1.3 get_provider_config event — DONE
- [x] getProviderConfigResponseSchema + GetProviderConfigResponse type
- [x] ClientToServerEvents 加 get_provider_config
- [x] settings-handler 回傳 channelManager.providerClientConfig
- [x] 測試：get_provider_config → brand.name === "Claude"

### 1.4 Client ChannelConfigContext 主動請求 — DONE
- [x] ChannelConfigContext useEffect mount 時 emit get_provider_config
- [x] 測試：ProviderConfigDisplay 驗證 brand.name === "Claude"

### 1.5 移除舊的 providerConfig 傳遞路徑 — DONE
- [x] session:init payload + sessionInitPayloadSchema 移除 providerConfig
- [x] session-handler launch/join 移除 providerConfig spread
- [x] initResponseSchema 移除 providerConfig
- [x] handler-context.ts 移除 providerConfig field
- [x] chat-handler.ts 移除 providerConfig getter

## 2. Phase 2 — Components 消費 clientConfig

### 2.1 model-utils.ts — DONE
### 2.2 CommandMenu fast mode — DONE
### 2.3 Brand 文字（9 檔）— DONE
### 2.4 Permission modes — DONE
### 2.5 Auth methods — DONE
### 2.6 MCP scopes — DONE
### 2.7 Usage tiers — DONE
### 2.8 Docs URL — DONE
### 2.9 重構 component 的 providerConfig 來源 — DONE（all use useChannelConfig）

## 3. Code Review + 重構 — DONE

- [x] stateUsagePayloadSchema 加 contextUsage（移除 double cast）
- [x] 抽 channelEmit helper（DRY 3 contexts）
- [x] session.ts 移除 providerClientConfigSchema re-export
- [x] availableModels 型別改 ModelInfo[]
- [x] inline import → top-level import

## 4. Cleanup

- [x] 零 `useContext(SessionContext)` in ChannelProvider components
- [x] 零 hardcoded "Claude"/"Anthropic"（除 fallback default）
- [x] 零 model string matching in component logic
- [x] 零 `as never` / `as any` in production code
- [x] 零 component 直接 useSocket
- [x] 零 inline import
- [x] 更新 skills 反映新架構
- [x] 審查所有 event 命名（namespace 一致性：`session:*` vs `chat:*` vs bare `get_*`），提出調整方案
- [x] 全部測試通過
