## 4. REST API 請求格式

### 4.1 API 端點設定

**位置**：第 45326–45341 行

```javascript
{
  BASE_API_URL:           "https://api.anthropic.com",
  CONSOLE_AUTHORIZE_URL:  "https://platform.claude.com/oauth/authorize",
  CLAUDE_AI_AUTHORIZE_URL:"https://claude.ai/oauth/authorize",
  TOKEN_URL:              "https://platform.claude.com/v1/oauth/token",
  API_KEY_URL:            "https://api.anthropic.com/api/oauth/claude_cli/create_api_key",
  ROLES_URL:              "https://api.anthropic.com/api/oauth/claude_cli/roles",
  MCP_PROXY_URL:          "https://mcp-proxy.anthropic.com",
  MCP_PROXY_PATH:         "/v1/mcp/{server_id}",
}
```

---

### 4.2 Usage API

**位置**：第 45421–45445 行

```
GET https://api.anthropic.com/api/oauth/usage
Headers:
  Content-Type: application/json
  Authorization: Bearer <token>
Timeout: 5000ms
```

**回應格式**：

```json
{
  "five_hour":       { "utilization": 0.5, "resets_at": "2026-02-18T10:00:00Z" },
  "seven_day":       { "utilization": 0.3, "resets_at": "2026-02-25T00:00:00Z" },
  "seven_day_sonnet":{ "utilization": 0.4, "resets_at": "2026-02-25T00:00:00Z" },
  "extra_usage": {
    "is_enabled":    true,
    "monthly_limit": 1000,
    "used_credits":  500,
    "utilization":   0.5
  }
}
```

---

### 4.3 Sessions API

```
GET https://api.anthropic.com/v1/sessions
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json
  anthropic-version: 2023-06-01
  x-organization-uuid: <orgUUID>
Timeout: 15000ms
```

---

### 4.4 認證 Headers

**OAuth 模式**（位置：第 53901 行）：

```json
{
  "Authorization": "Bearer <access_token>",
  "anthropic-beta": "oauth-2025-04-20"
}
```

**API Key 模式**：

```json
{
  "x-api-key": "<api_key>"
}
```

---

### 4.5 Profile API

#### CLI Profile

**位置**：第 53604–53613 行

```
GET https://api.anthropic.com/api/claude_cli_profile
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json
```

**回應格式**：

```json
{
  "organization": {
    "organization_type": "claude_max | claude_pro | claude_team | ..."
  }
}
```

Extension 據此判斷使用者的方案類型（`max`、`pro`、`team` 等）。

#### OAuth Profile

**位置**：第 53838–53853 行

```
GET https://api.anthropic.com/api/oauth/profile
Headers:
  Authorization: Bearer <token>
  anthropic-beta: oauth-2025-04-20
Timeout: 10000ms
```

**回應格式**：

```json
{
  "organization": {
    "uuid": "org-uuid-xxx"
  }
}
```

用於取得組織 UUID，供 Sessions API 等需要 `x-organization-uuid` header 的端點使用。

---

### 4.6 Session Ingress API（Session Teleportation）

**位置**：第 46893–46904 行

```
GET https://api.anthropic.com/v1/session_ingress/session/{sessionId}
Headers:
  Authorization: Bearer <token>
Timeout: 20000ms
```

**回應格式**：

```json
{
  "loglines": [
    { "type": "user", "message": { ... }, "uuid": "xxx" },
    { "type": "assistant", "message": { ... }, "uuid": "xxx" }
  ]
}
```

用於遠端 Session Teleportation：從雲端拉取指定 session 的完整對話記錄，匯入本地 session 儲存。

---

### 4.7 MCP OAuth Start-Auth API（v2.1.63 新增）

**位置**：第 71087–71088 行

```
GET {baseUrl}/api/organizations/{orgId}/mcp/start-auth/{serverId}
```

- `baseUrl`：組織基底 URL
- `orgId`：組織 ID
- `serverId`：MCP 伺服器 ID（原始 `mcprs` 前綴轉為 `mcpsrv`）

**用途**：取得 MCP 伺服器的 OAuth 認證 URL，供使用者在瀏覽器中開啟以完成授權。回傳的 `authUrl` 會被傳遞至 WebView 供使用者互動。

---

