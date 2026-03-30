## Context

Summoner 的 `ProviderAdapter` 已經是 per-provider 的抽象（`ClaudeAdapter`），負責 CLI 的 parse/transform/format。但 client 端沒有對應的 provider 抽象 — UI 配置（brand、permission modes、tool display）直接 hardcode 在 component 裡。

CLI 回傳的 `ModelInfo` 已有 `displayName`、`supportsFastMode` 等欄位，但 client 忽略了這些動態資料，自己做 string matching fallback。

## Goals / Non-Goals

**Goals:**
- Client components 零 Claude-specific hardcode
- `ProviderAdapter` 成為 provider 資訊的 single source of truth（protocol + UI config）
- CLI 動態資料（ModelInfo）優先使用，不再做 string matching
- 分 3 phase 漸進式重構，每 phase 獨立可驗證

**Non-Goals:**
- 不實作第二個 provider（如 GeminiAdapter）— 只確保架構支援
- 不改 CLI protocol — clientConfig 由 adapter 提供，不依賴 CLI 新增欄位
- 不改 ServerToClientEvents/ClientToServerEvents 結構 — 只在 init response 加一個欄位

## Decisions

### 1. clientConfig 放在 ProviderAdapter，不放 CLI

**決定**：`ProviderAdapter` interface 新增 `readonly clientConfig: ProviderClientConfig`

**理由**：
- 我們控制 adapter，不控制 CLI
- Adapter 已經是 per-provider 的，自然知道自己的 brand 和 capabilities
- 不需要改 protocol，不需要 CLI 配合

### 2. clientConfig 透過 init response 推送

**決定**：Server 在 `init` callback response 加 `providerConfig` 欄位

**理由**：
- `init` 是 client 連線後第一個呼叫，適合傳一次性配置
- 不需要新 event type，只是在現有 response 加欄位
- Client 存在 SessionContext（全域，不是 per-channel）

### 3. Phase 1 不動 protocol，只修 client

**決定**：Phase 1 只刪 client 的 model-utils hardcode，用 CLI 已回傳的 `ModelInfo` 資料

**理由**：
- 零風險，不改 interface、不改 server、不改 protocol
- 立即消除最明顯的 code smell（string matching）
- 可以獨立 commit + 驗證

### 4. ProviderClientConfig 結構

```typescript
interface ProviderClientConfig {
  brand: {
    name: string;           // "Claude"
    company: string;        // "Anthropic"
    docsUrl: string;        // "https://docs.anthropic.com/..."
    placeholder: string;    // "⌘ Esc to focus or unfocus Claude"
    loginTitle: string;     // "Login to Claude"
  };
  permissionModes: Array<{
    id: string;             // "normal" | "acceptEdits" | "plan" | "bypassPermissions"
    label: string;          // "Normal"
    description: string;    // "Claude asks before any changes"
  }>;
  authMethods: Array<{
    id: string;             // "claudeai" | "console" | "api-key" | "3p"
    label: string;          // "Claude AI" | "Anthropic Console"
  }>;
  mcpScopes: Array<{
    id: string;             // "project" | "local" | "user" | "claudeai" | "managed"
    label: string;          // "Project" | "Local" | "claude.ai"
    prefix?: string;        // "claude.ai " — for scope inference from server name
  }>;
  usageTiers: Array<{
    key: string;            // "five_hour" | "seven_day" | "seven_day_sonnet"
    label: string;          // "Session (5hr)"
    shortLabel: string;     // "5hr"
  }>;
  modelDisplayMap: Array<{
    pattern: string;        // "opus" | "sonnet" | "haiku" — substring match
    displayName: string;    // "Opus 4.6" | "Sonnet" | "Haiku"
    subLabel?: string;      // "Sonnet 4.6 · Best for everyday tasks"
    supportsFastMode?: boolean; // true for opus — fallback when CLI ModelInfo 沒給
  }>;
  defaultModelDescription: string; // "Most capable for complex work"
}
```

### 5. 資料流

```
ClaudeAdapter
  │  .clientConfig (static, defined in adapter)
  ▼
Server (misc-handler.ts)
  │  init callback → { settings, sessions, providerConfig, ... }
  ▼
Client (SessionContext)
  │  providerConfig state
  ▼
Components
  │  useSession().providerConfig.brand.name
  │  useSession().providerConfig.permissionModes
  │  etc.
```

## Risks / Trade-offs

### Risk: Phase 1 刪 model fallback 後 display 退化
- **情境**：CLI 回傳純字串 model ID（沒有 displayName）
- **影響**：UI 顯示 raw ID 如 "claude-sonnet-4-6" 而不是 "Sonnet"
- **緩解**：確認 Claude CLI 的 `initialize_response.models` 格式。如果確實只回傳字串，保留一個最小 fallback（但從 adapter clientConfig 提供，不是 client hardcode）

### Risk: init response 向下相容
- **情境**：舊 server 不回傳 providerConfig
- **影響**：client 拿不到 config
- **緩解**：client 端設 default fallback config（= 現在的 hardcoded 值），providerConfig 是 optional

### Trade-off: 集中 vs 分散
- **集中**（ProviderClientConfig）：一個地方定義所有 provider-specific 值，好找好改
- **分散**（現狀）：每個 component 自己 hardcode，改一個不會影響其他
- **選擇**：集中。因為 provider 切換是全域行為，不會只改一個 component
