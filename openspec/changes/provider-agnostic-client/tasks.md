## 1. Phase 1 — ProviderClientConfig 建立 + Server 推送

> TDD：先寫測試再寫 code。FakeClaude + real JSON fixture。
> init 是 per-connection，providerConfig 在 launch/join 前就有。

### 1.1 Zod schema + type
- [ ] RED：寫 `providerClientConfigSchema` 的 parse 測試（valid / invalid / optional fields）
- [ ] GREEN：`shared/schemas/provider.ts` 建立 schema + type
- [ ] REFACTOR：export from index.ts

### 1.2 ProviderAdapter interface 擴展
- [ ] RED：寫測試驗證 `ClaudeAdapter` 有 `clientConfig` 屬性且結構正確
- [ ] GREEN：`provider-adapter.ts` 加 `readonly clientConfig: ProviderClientConfig`
- [ ] GREEN：`claude-adapter.ts` 實作 `clientConfig`（brand、permissionModes、authMethods、mcpScopes、usageTiers、modelDisplayMap 從現有 component hardcode 搬過來）

### 1.3 Server init 推送
- [ ] RED：寫 FakeClaude 測試 — `init` callback response 包含 `providerConfig` 欄位
- [ ] GREEN：`misc-handler.ts` init handler 帶 `providerConfig`
- [ ] GREEN：`initResponseSchema` 加 optional `providerConfig` 欄位

### 1.4 Client SessionContext 接收
- [ ] RED：寫 renderWithWorkspace 測試 — `useSession().providerConfig` 有值且結構正確
- [ ] GREEN：SessionContext init callback 存 `providerConfig`
- [ ] GREEN：default fallback config（= 現有 Claude hardcoded 值），providerConfig 為 optional
- [ ] REFACTOR：export `ProviderClientConfig` type 給 components 用

## 2. Phase 2 — Components 消費 clientConfig

> 每個 component 從 Context 讀取 providerConfig，刪除 hardcode。
> expect 不變或等價。TDD refactoring。

### 2.1 model-utils.ts
- [ ] RED：寫測試 — `shortModelName` 接收 `modelDisplayMap` 參數，用 map 取 displayName
- [ ] RED：寫測試 — `getModelDisplayInfo` 從 `modelDisplayMap` 讀取，無 match 時顯示 raw ID
- [ ] GREEN：重構 model-utils.ts 接收 modelDisplayMap 參數，刪除 hardcoded opus/sonnet/haiku
- [ ] REFACTOR：更新 ModelPickerPanel、HeaderBar 呼叫端帶入 modelDisplayMap

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

## 3. Cleanup

- [ ] grep 驗證零 hardcoded "Claude" / "Anthropic" in production components
- [ ] grep 驗證零 model string matching（opus/sonnet/haiku）in component logic
- [ ] 更新 skills 反映新架構
- [ ] 全部測試通過
