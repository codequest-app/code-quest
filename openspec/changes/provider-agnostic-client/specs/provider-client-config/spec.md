## ADDED Requirements

### Requirement: ModelInfo 動態資料優先
CLI 回傳的 ModelInfo 欄位（displayName、supportsFastMode 等）是 model display 的 single source of truth，client 不做 string matching fallback。

#### Scenario: CLI 回傳 ModelInfo 含 displayName
- **WHEN** CLI 的 initialize_response.models 回傳 `{ value: 'claude-sonnet-4-6', displayName: 'Sonnet 4.6' }`
- **THEN** ModelPickerPanel 顯示 "Sonnet 4.6"，不做 string matching

#### Scenario: CLI 回傳 ModelInfo 不含 displayName
- **WHEN** CLI 的 initialize_response.models 回傳 `{ value: 'claude-sonnet-4-6' }`（無 displayName）
- **THEN** 顯示 raw model ID "claude-sonnet-4-6"

#### Scenario: Fast mode 判斷
- **WHEN** model 的 `ModelInfo.supportsFastMode === true`
- **THEN** CommandMenu 顯示 fast mode toggle
- **WHEN** model 的 `ModelInfo.supportsFastMode` 為 false 或 undefined
- **THEN** CommandMenu 不顯示 fast mode toggle

### Requirement: ProviderAdapter 提供 clientConfig
每個 ProviderAdapter 實作必須提供 `clientConfig: ProviderClientConfig`，包含 brand、permissionModes、authMethods、mcpScopes、usageTiers。

#### Scenario: ClaudeAdapter 提供完整 clientConfig
- **WHEN** ClaudeAdapter 被建構
- **THEN** `adapter.clientConfig.brand.name` === "Claude"
- **THEN** `adapter.clientConfig.permissionModes` 包含 4 個 mode（normal, acceptEdits, plan, bypassPermissions）
- **THEN** `adapter.clientConfig.usageTiers` 包含 3 個 tier（five_hour, seven_day, seven_day_sonnet）

### Requirement: Server 透過 init 推送 providerConfig
Server 在 client 呼叫 `init` event 時，response 包含 `providerConfig` 欄位。

#### Scenario: Client 連線後收到 providerConfig
- **WHEN** client emit `init` event
- **THEN** callback response 包含 `providerConfig` 欄位
- **THEN** `providerConfig.brand.name` 為非空字串

#### Scenario: providerConfig 向下相容
- **WHEN** server 版本較舊，init response 不含 providerConfig
- **THEN** client 使用 default fallback config（現有 hardcoded 值）

### Requirement: Components 從 Context 讀取 provider 資訊
所有 client components 不直接 hardcode provider-specific 值，從 SessionContext 的 providerConfig 讀取。

#### Scenario: Brand 文字
- **WHEN** component 需要顯示產品名稱
- **THEN** 使用 `providerConfig.brand.name`，不 hardcode "Claude"

#### Scenario: Permission modes 定義
- **WHEN** PermissionModePicker render
- **THEN** 從 `providerConfig.permissionModes` 取得 mode 列表，不 hardcode

#### Scenario: Auth method display
- **WHEN** AccountUsageDialog 顯示 auth method label
- **THEN** 從 `providerConfig.authMethods` 找對應 label，不用 switch

#### Scenario: MCP scope display
- **WHEN** ManageMcpDialog 顯示 scope label
- **THEN** 從 `providerConfig.mcpScopes` 找對應 label，不用 switch

#### Scenario: Usage tier display
- **WHEN** UsageBar 或 AccountUsageDialog 顯示 usage tiers
- **THEN** 從 `providerConfig.usageTiers` 取得 tier 定義，不 hardcode
