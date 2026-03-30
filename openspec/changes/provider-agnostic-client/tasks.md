## 1. Phase 1 — ProviderClientConfig 建立 + Server 推送

> 先定義 config 結構，實作 ClaudeAdapter clientConfig，Server 透過 init 推送。
> Model display mapping 保留（與 extension 一致），但從散落的 component 搬到 adapter。

- [ ] 1.1 `shared/schemas/`：新增 `provider.ts` — `providerClientConfigSchema` Zod schema + `ProviderClientConfig` type（含 brand、permissionModes、authMethods、mcpScopes、usageTiers、modelDisplayMap）
- [ ] 1.2 `summoner/protocol/provider-adapter.ts`：`ProviderAdapter` interface 加 `readonly clientConfig: ProviderClientConfig`
- [ ] 1.3 `summoner/protocol/claude-adapter.ts`：`ClaudeAdapter` 實作 `clientConfig`（從現有 component hardcode 搬過來）
- [ ] 1.4 `shared/schemas/session.ts`：`initResponseSchema` 加 optional `providerConfig` 欄位
- [ ] 1.5 `server/handlers/misc-handler.ts`：`init` handler response 帶 `providerConfig`（從 adapter 取）
- [ ] 1.6 `client/contexts/SessionContext.tsx`：`init` callback 存 `providerConfig`，export
- [ ] 1.7 `client/contexts/SessionContext.tsx`：default fallback config（= 現有 Claude hardcoded 值），providerConfig 為 optional
- [ ] 1.8 測試：adapter clientConfig 結構正確；server init response 含 providerConfig；client SessionContext 存取正確

## 2. Phase 2 — Components 消費 clientConfig

> 每個 component 從 Context 讀取 providerConfig，刪除 hardcode。
> model-utils.ts 的 mapping 從 providerConfig.modelDisplayMap 讀取。

- [ ] 2.1 `model-utils.ts`：shortModelName / getModelDisplayInfo 改從 `modelDisplayMap` 讀取，刪除 hardcoded opus/sonnet/haiku
- [ ] 2.2 `CommandMenu.tsx`：fast mode 判斷改從 `ModelInfo.supportsFastMode` 讀取（CLI 有給就用），fallback 查 `modelDisplayMap`
- [ ] 2.3 `HeaderBar.tsx`：shortModelName 帶入 modelDisplayMap
- [ ] 2.4 Brand 文字（5 檔 15 行）：AuthDialog、ComposeInput、ToolPermissionBanner、OnboardingOverlay、TerminalPanel、PluginsPanel、InstalledPluginList、PermissionModePicker → `providerConfig.brand.*`
- [ ] 2.5 Permission modes（1 檔 34 行）：PermissionModePicker → `providerConfig.permissionModes`
- [ ] 2.6 Auth methods（1 檔）：AccountUsageDialog `formatAuthMethod` → `providerConfig.authMethods`
- [ ] 2.7 MCP scopes（1 檔）：ManageMcpDialog scopeLabel / inferScope → `providerConfig.mcpScopes`
- [ ] 2.8 Usage tiers（2 檔 8 行）：AccountUsageDialog + UsageBar → `providerConfig.usageTiers`（消除重複定義）
- [ ] 2.9 ComposeToolbar docs URL → `providerConfig.brand.docsUrl`
- [ ] 2.10 測試：components render 時從 context 讀取 providerConfig，零 hardcode

## 3. Cleanup

- [ ] 3.1 grep 驗證零 hardcoded "Claude" / "Anthropic" in production components
- [ ] 3.2 grep 驗證零 model string matching（opus/sonnet/haiku）in component logic
- [ ] 3.3 更新 skills 反映新架構
- [ ] 3.4 全部測試通過
