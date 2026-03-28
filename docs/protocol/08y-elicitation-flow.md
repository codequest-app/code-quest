### 7.25 MCP Elicitation 流程

**方向**：CLI → Extension（control request），Extension 回應後繼續

---

#### 概述

Elicitation 是 MCP 伺服器在執行過程中向使用者索取額外資訊的機制，例如 OAuth 授權 URL 或表單輸入。CLI 以 control request 形式通知 Extension，由 Extension 決定如何呈現給使用者。

---

#### 訊息格式

**CLI → Extension（control_request）：**

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": {
    "subtype": "elicitation",
    "mcp_server_name": "github",
    "message": "請輸入 GitHub OAuth 授權後的 callback URL",
    "mode": "url",
    "url": "https://github.com/login/oauth/authorize?...",
    "elicitation_id": "elicit_abc123",
    "requested_schema": {}
  }
}
```

**Extension → CLI（control_response）：**

```json
{
  "type": "control_response",
  "response": {
    "subtype": "success",
    "request_id": "xxx",
    "response": { "action": "decline" }
  }
}
```

---

#### 欄位說明

| 欄位 | 類型 | 說明 |
|------|------|------|
| `mcp_server_name` | `string` | 發起請求的 MCP 伺服器名稱 |
| `message` | `string` | 向使用者顯示的提示訊息 |
| `mode` | `"url" \| "form"` | 互動模式：`url` 要求輸入 URL，`form` 要求填寫表單 |
| `url` | `string?` | 需要使用者造訪的 URL（`mode: "url"` 時使用） |
| `elicitation_id` | `string` | 本次 elicitation 的唯一識別碼 |
| `requested_schema` | `object` | 表單模式下的欄位 schema（`mode: "form"` 時使用） |

---

#### 流程

```
MCP 伺服器需要使用者輸入
    ↓
CLI 發送 control_request（subtype: "elicitation"）至 Extension
    ↓
Extension 的 handleControlRequest() 檢查 onElicitation 處理器
    ↓
┌─────────────────────────────────┬─────────────────────────┐
│ 有 onElicitation handler        │ 無 handler              │
│ （如 MCP OAuth 流程）           │                         │
│ ↓                               │ ↓                       │
│ 呼叫 onElicitation callback     │ 回傳 { action: "decline" }│
│ 顯示 UI 讓使用者輸入            │                         │
│ 回傳使用者的回應                │                         │
└─────────────────────────────────┴─────────────────────────┘
    ↓
Extension 發送 control_response 回 CLI
    ↓
MCP 伺服器繼續執行
```

---

#### 相關程式碼

```javascript
// extension.js 第 31012–31027 行
} else if (v.request.subtype === "elicitation") {
  let U = v.request;
  if (this.onElicitation)
    return await this.onElicitation(
      {
        serverName: U.mcp_server_name,
        message: U.message,
        mode: U.mode,
        url: U.url,
        elicitationId: U.elicitation_id,
        requestedSchema: U.requested_schema,
      },
      { signal: z },
    );
  return { action: "decline" };
}
```

---
