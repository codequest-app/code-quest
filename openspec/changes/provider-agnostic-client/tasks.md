## 1. Phase 1 — ProviderClientConfig 建立 + Server 推送

> TDD：先寫測試再寫 code。FakeClaude + real JSON fixture。

### 1.1 Zod schema + type — DONE
- [x] RED：5 tests（valid, missing brand, empty arrays, optional prefix, optional supportsFastMode）
- [x] GREEN：`shared/schemas/provider.ts` — providerClientConfigSchema + ProviderClientConfig
- [x] REFACTOR：export from schemas/index.ts

### 1.2 ProviderAdapter interface 擴展 — DONE
- [x] RED：8 tests（clientConfig exists, Zod valid, brand, permissionModes, usageTiers, modelDisplayMap, mcpScopes）
- [x] GREEN：`provider-adapter.ts` 加 `readonly clientConfig: ProviderClientConfig`
- [x] GREEN：`claude-adapter.ts` 用 `providerClientConfigSchema.parse()` 建 clientConfig

### 1.3 Server session:init 推送 — DONE
- [x] session:init payload 加 providerConfig（launch + join）
- [x] misc-handler init response 移除 providerConfig
- [x] SessionInitPayload schema 加 providerConfig optional
- [x] 測試：session:init 包含 providerConfig.brand.name === "Claude"

### 1.4 Client ChannelConfigContext 接收 — DONE
- [x] ChannelConfigContext 從 session:init 存 providerConfig
- [x] SessionContext 移除 providerConfig
- [x] 12 components 改用 useChannelConfig().providerConfig
- [x] OnboardingOverlay 用 hardcoded fallback（ChannelProvider 外）
- [x] 零 useContext(SessionContext) in ChannelProvider components

## 2. Phase 2 — Components 消費 clientConfig

### 2.1 model-utils.ts — DONE
- [x] 11 tests, model-utils 接收 modelDisplayMap，刪除 hardcoded opus/sonnet/haiku

### 2.2 CommandMenu fast mode — DONE
- [x] opus-4-6 string match → ModelInfo.supportsFastMode + modelDisplayMap fallback

### 2.3 Brand 文字（9 檔）— DONE
- [x] AuthDialog, ComposeInput, ToolPermissionBanner, OnboardingOverlay 等

### 2.4-2.7 Permission, Auth, MCP, Usage — DONE

### 2.8 Docs URL — DONE

### 2.9 重構 component 的 providerConfig 來源 — DONE（included in 1.4）

## 3. Code Review + 重構（全部程式碼）

### 3.1 P0 — inline type assertions — DONE
- [x] availableModels 型別改 ModelInfo[]（移除 CommandMenu cast）
- [x] SessionContext init providerConfig cast 已移除（providerConfig 不在 init）

### 3.2 其他 code review 項目 — DONE
- [x] inline import → top-level import（channel-hooks fs/promises, chat-handler SocketEvent）
- [x] `as Record` usage tier cast — 合理保留（dynamic key 索引 typed object）
- [x] 無其他可簡化處

## 4. Cleanup — DONE

- [x] 零 `useContext(SessionContext)` in ChannelProvider 內的 component
- [x] 零 hardcoded "Claude"/"Anthropic" in production（除 fallback default）
- [x] 零 model string matching in component logic
- [x] 零 `as never` / `as any` in production code
- [x] 零 component 直接 useSocket
- [x] 零 inline import
- [ ] 更新 skills 反映新架構
- [x] 全部測試通過
