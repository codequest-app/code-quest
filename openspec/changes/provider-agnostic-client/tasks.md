## 1. Phase 1 — ProviderClientConfig 建立

### 1.1 Zod schema + type — DONE
### 1.2 ProviderAdapter interface 擴展 — DONE

### 1.3 get_provider_config event
- [ ] `shared/schemas/`：新增 `getProviderConfigResponseSchema`（response 含 `providerConfig`）
- [ ] `shared/socket-events.ts`：ClientToServerEvents 加 `get_provider_config` event
- [ ] `server/handlers/settings-handler.ts`：handler 回傳 `channelManager.providerClientConfig`
- [ ] 測試：FakeClaude send get_provider_config → 回傳 providerConfig.brand.name === "Claude"

### 1.4 Client ChannelConfigContext 主動請求
- [ ] ChannelConfigContext useEffect mount 時 emit `get_provider_config`
- [ ] callback 存 providerConfig 到 configState
- [ ] 測試：renderWithWorkspace → useChannelConfig().providerConfig 有值

### 1.5 移除舊的 providerConfig 傳遞路徑
- [ ] session:init payload 移除 providerConfig 欄位
- [ ] session-handler launch/join 移除 providerConfig spread
- [ ] sessionInitPayloadSchema 移除 providerConfig
- [ ] SessionContext 已無 providerConfig（已完成）
- [ ] init response 已無 providerConfig（已完成）
- [ ] handler-context.ts 移除 providerConfig field（改在 handler 裡直接取）

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
- [ ] 更新 skills 反映新架構
- [ ] 全部測試通過
