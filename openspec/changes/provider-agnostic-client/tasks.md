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

### 1.3 Server session:init 推送（改：從 init 移到 session:init）
- [x] misc-handler init 帶 providerConfig（已做，但需移除）
- [ ] session:init event payload 加 `providerConfig`（從 adapter 取）
- [ ] session-handler：launch/join 的 `buildSessionInitPayload()` 帶 providerConfig
- [ ] misc-handler：init response 移除 providerConfig
- [ ] 測試：session:init 包含 providerConfig

### 1.4 Client ChannelConfigContext 接收（改：從 SessionContext 移到 ChannelConfig）
- [ ] ChannelConfigContext：從 session:init 的 payload 存 providerConfig
- [ ] SessionContext：移除 providerConfig state 和 init 存取
- [ ] 測試：renderWithWorkspace → useChannelConfig().providerConfig 有值

## 2. Phase 2 — Components 消費 clientConfig

### 2.1 model-utils.ts — DONE
- [x] 11 tests, model-utils 接收 modelDisplayMap，刪除 hardcoded opus/sonnet/haiku

### 2.2 CommandMenu fast mode — DONE
- [x] opus-4-6 string match → ModelInfo.supportsFastMode + modelDisplayMap fallback

### 2.3 Brand 文字（9 檔）— DONE
- [x] AuthDialog, ComposeInput, ToolPermissionBanner, OnboardingOverlay 等

### 2.4-2.7 Permission, Auth, MCP, Usage — DONE

### 2.8 Docs URL — DONE

### 2.9 重構 component 的 providerConfig 來源
- [ ] 7 個 ChannelProvider 內 component：`useContext(SessionContext)` → `useChannelConfig().providerConfig`
  - PluginsPanel, UsageBar, InstalledPluginList, TerminalPanel, PermissionModePicker, ToolPermissionBanner, ManageMcpDialog
- [ ] ComposeToolbar, HeaderBar, ComposeInput, CommandMenu, AuthDialog：`useSession().providerConfig` → `useChannelConfig().providerConfig`
- [ ] OnboardingOverlay（ChannelProvider 外）：用 fallback default，不讀 providerConfig
- [ ] SessionContext：移除 providerConfig 相關 export

## 3. Code Review + 重構（全部程式碼）

### 3.1 P0 — inline type assertions
- [ ] CommandMenu `modelEntry as` cast → `availableModels` 型別改 `ModelInfo[]`
- [ ] SessionContext init：移除 `(res as Record<string, unknown>).providerConfig` cast（已不需要）

### 3.2 其他 code review 項目
- [ ] 該用 Zod → Zod parse
- [ ] inline type（`as Record<string, unknown>`）→ 正確 type narrowing
- [ ] inline import → top-level import
- [ ] 可簡化之處
- [ ] AccountUsageDialog + UsageBar `as Record` usage tier cast → helper
- [ ] 重構發現的問題

## 4. Cleanup

- [x] grep 驗證：零 model string matching in component logic
- [x] grep 驗證：零 `as never` / `as any` in production code
- [x] grep 驗證：零 component 直接 useSocket
- [ ] grep 驗證：零 `useContext(SessionContext)` in ChannelProvider 內的 component
- [ ] grep 驗證：零 hardcoded "Claude"/"Anthropic" in production（除 fallback default）
- [ ] 更新 skills 反映新架構
- [ ] 全部測試通過
