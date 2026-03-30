## 1. Phase 1 — ProviderClientConfig 建立 + Server 推送

> TDD：先寫測試再寫 code。FakeClaude + real JSON fixture。
> init 是 per-connection，providerConfig 在 launch/join 前就有。

### 1.1 Zod schema + type — DONE
- [x] RED：5 tests（valid, missing brand, empty arrays, optional prefix, optional supportsFastMode）
- [x] GREEN：`shared/schemas/provider.ts` — providerClientConfigSchema + ProviderClientConfig
- [x] REFACTOR：export from schemas/index.ts

### 1.2 ProviderAdapter interface 擴展 — DONE
- [x] RED：8 tests（clientConfig exists, Zod valid, brand, permissionModes, usageTiers, modelDisplayMap, mcpScopes）
- [x] GREEN：`provider-adapter.ts` 加 `readonly clientConfig: ProviderClientConfig`
- [x] GREEN：`claude-adapter.ts` 用 `providerClientConfigSchema.parse()` 建 clientConfig

### 1.3 Server init 推送 — DONE
- [x] RED：chat-handler-settings.test.ts — init response 包含 providerConfig.brand.name
- [x] GREEN：misc-handler init 帶 `ctx.providerConfig`
- [x] GREEN：HandlerContext 加 `providerConfig?`，ChatHandler getter 從 channelManager 取
- [x] GREEN：channelManager 暴露 `providerClientConfig`（不暴露整個 adapter）
- [x] GREEN：initResponseSchema 加 optional providerConfig

### 1.4 Client SessionContext 接收 — DONE
- [x] RED：ProviderConfigDisplay test component + `findByTestId('brand-name')` === "Claude"
- [x] GREEN：SessionContext init callback 存 `providerConfig` state
- [x] GREEN：providerConfig 為 optional（向下相容）
- [x] ProviderClientConfig type 已從 @code-quest/shared export

## 2. Phase 2 — Components 消費 clientConfig

> 每個 component 從 Context 讀取 providerConfig，刪除 hardcode。
> expect 不變或等價。TDD refactoring。

### 2.1 model-utils.ts — DONE
- [x] RED：11 tests（shortModelName 4, getModelDisplayInfo 4, getModelInfoDisplayName 3）
- [x] GREEN：model-utils.ts 接收 modelDisplayMap，刪除 hardcoded opus/sonnet/haiku
- [x] REFACTOR：HeaderBar、ModelPickerPanel、ComposeToolbar 帶入 modelDisplayMap from providerConfig

### 2.2 CommandMenu fast mode
- [ ] RED：寫測試 — fast mode toggle 用 `ModelInfo.supportsFastMode`，fallback 查 `modelDisplayMap`
- [ ] GREEN：CommandMenu 刪除 `opus-4-6` string match，改用 ModelInfo + modelDisplayMap

### 2.3 Brand 文字（8 檔）
- [ ] AuthDialog：`providerConfig.brand.loginTitle` / `.brand.name`
- [ ] ComposeInput：`providerConfig.brand.placeholder`
- [ ] ToolPermissionBanner：`providerConfig.brand.name`
- [ ] OnboardingOverlay：`providerConfig.brand.name`
- [ ] TerminalPanel：`providerConfig.brand.name`
- [ ] PluginsPanel：`providerConfig.brand.name`
- [ ] InstalledPluginList：`providerConfig.brand.name` / `.brand.company`
- [ ] PermissionModePicker：`providerConfig.brand.name`

### 2.4 Permission modes
- [ ] PermissionModePicker：PERMISSION_MODES array → `providerConfig.permissionModes`

### 2.5 Auth methods
- [ ] AccountUsageDialog：formatAuthMethod switch → `providerConfig.authMethods.find()`

### 2.6 MCP scopes
- [ ] ManageMcpDialog：scopeLabel switch + inferScope → `providerConfig.mcpScopes`

### 2.7 Usage tiers
- [ ] AccountUsageDialog + UsageBar：USAGE_TIERS → `providerConfig.usageTiers`（消除重複定義）

### 2.8 Docs URL
- [ ] ComposeToolbar：hardcoded URL → `providerConfig.brand.docsUrl`

## 3. Code Review + 重構

- [ ] code review 找出職責不清、過度設計、code smell
- [ ] 該用 Zod 的地方必須用 Zod（`as` type assertion → Zod parse）
- [ ] inline type（`as Record<string, unknown>`、`as X | undefined`）→ 用 Zod schema 或正確的 type narrowing
- [ ] inline import（`import('node:fs/promises')`、動態 import）→ top-level import
- [ ] 可簡化之處（冗餘邏輯、重複 code、過深巢狀）
- [ ] 重構發現的問題

## 4. Cleanup

- [ ] grep 驗證零 hardcoded "Claude" / "Anthropic" in production components
- [ ] grep 驗證零 model string matching（opus/sonnet/haiku）in component logic
- [ ] 確認零 `as never` / `as any` in production code
- [ ] 確認零 component 直接 useSocket
- [ ] 更新 skills 反映新架構
- [ ] 全部測試通過
