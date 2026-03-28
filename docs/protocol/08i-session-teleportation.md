### 7.12 Session Teleportation（遠端 Session 匯入）

**方向**：WebView → Extension → API → 本地儲存

**用途**：將雲端的遠端 session 完整拉取至本地，使使用者可在 VSCode 中繼續該對話。

---

#### 7.12.1 列出遠端 Sessions

**觸發**：WebView 發送 `list_remote_sessions` 請求

**位置**：第 47815–47830 行

```
WebView ──(list_remote_sessions)──→ Extension
  ↓
Extension 呼叫 TeleportService.fetchRemoteSessions()（第 46817–46869 行）
  ↓
GET https://api.anthropic.com/v1/sessions
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json
  anthropic-version: 2023-06-01
  x-organization-uuid: <orgUUID>
Timeout: 15000ms
  ↓
回應經過篩選（同一 repository）後回傳
```

**回應格式**（傳回 WebView）：

```json
{
  "type": "list_remote_sessions_response",
  "sessions": [
    {
      "id": "remote-session-uuid",
      "lastModified": 1709000000000,
      "messageCount": 0,
      "summary": "Session 標題",
      "isRemote": true,
      "remoteRepo": {
        "owner": "user",
        "name": "repo",
        "branch": "feature-branch"
      },
      "status": "running | idle"
    }
  ]
}
```

---

#### 7.12.2 執行 Teleport

**觸發**：WebView 發送 `teleport_session` 請求，帶 `sessionId`

**位置**：第 47832–47921 行

**完整流程**：

```
WebView ──(teleport_session { sessionId })──→ Extension
  ↓
┌─ API Call 1: 取得 Session 元資料 ─────────────────────────┐
│ GET /v1/sessions/{sessionId}                               │
│ → 取得 title、branch（由 context 中萃取 git branch）       │
└────────────────────────────────────────────────────────────┘
  ↓
┌─ API Call 2: 取得對話記錄 ────────────────────────────────┐
│ GET /v1/session_ingress/session/{sessionId}                │
│ Timeout: 20000ms                                          │
│ → 回傳 { loglines: [ {type, message, uuid, ...}, ... ] }  │
└────────────────────────────────────────────────────────────┘
  ↓
轉換訊息格式（remote → local）
  ↓ 每筆訊息加上 parent_tool_use_id: null, session_id
  ↓
產生新的 localSessionId（UUID）
  ↓
┌─ 寫入本地 JSONL ──────────────────────────────────────────┐
│ 路徑：~/.claude/projects/{normalized-cwd}/{sessionId}.jsonl│
│                                                            │
│ 內容（逐行 JSON）：                                        │
│   { type: "user", message, uuid, parentUuid, ... }         │
│   { type: "assistant", message, uuid, parentUuid, ... }    │
│   ...                                                      │
│   { type: "summary", leafUuid, summary }        ← 若有標題 │
│   { type: "teleported-from",                    ← 元資料   │
│     remoteSessionId, branch, messageCount }                │
└────────────────────────────────────────────────────────────┘
  ↓
更新記憶體 Map：
  ├── teleportedFromSessionIds: localId → remoteId
  ├── teleportBranches: localId → branch
  └── teleportedMessageCounts: localId → count
  ↓
驗證 Git branch（本地/遠端是否存在）
  ↓
回傳結果至 WebView
```

**成功回應**：

```json
{
  "type": "teleport_session_response",
  "success": true,
  "messages": [ ... ],
  "branch": "feature-branch",
  "localSessionId": "new-local-uuid",
  "summary": "Session 標題"
}
```

**失敗回應**：

```json
{
  "type": "teleport_session_response",
  "success": false,
  "error": "Failed to fetch session"
}
```

---

#### 7.12.3 Session JSONL 事件類型

Teleportation 會在 JSONL 檔案中寫入以下專屬事件：

##### teleported-from

**位置**：第 19548–19553 行

標記此 session 從遠端 teleport 而來：

```json
{
  "type": "teleported-from",
  "remoteSessionId": "remote-session-uuid",
  "branch": "feature-branch",
  "messageCount": 42
}
```

##### teleport-skipped-branch

**位置**：第 19566–19581 行

當 teleport 後的 branch checkout 失敗時追加：

```json
{
  "type": "teleport-skipped-branch",
  "branch": "feature-branch",
  "failed": true
}
```

---

#### 7.12.4 Teleported Session 在 Session List 中的呈現

**位置**：第 19318–19343 行

載入 session 列表時，teleported session 會帶以下額外欄位：

```json
{
  "id": "local-session-uuid",
  "summary": "Session 標題",
  "lastModified": 1709000000000,
  "messageCount": 42,
  "teleportedFromSessionId": "remote-session-uuid",
  "teleportBranch": "feature-branch",
  "teleportedMessageCount": 42,
  "skippedBranch": "feature-branch",
  "branchCheckoutFailed": true
}
```

這些欄位讓 WebView 能識別哪些 session 是從遠端匯入的，並顯示相關的 branch checkout 狀態。

---

#### 7.12.5 記憶體追蹤 Map

**位置**：第 19282–19286 行

| Map | Key | Value | 用途 |
|-----|-----|-------|------|
| `teleportedFromSessionIds` | localSessionId | remoteSessionId | 對應遠端 session |
| `teleportBranches` | localSessionId | branch name | 記錄目標分支 |
| `teleportedMessageCounts` | localSessionId | number | 記錄匯入訊息數 |
| `skippedBranches` | localSessionId | branch name | 記錄跳過的分支 |
| `branchCheckoutFailures` | localSessionId | boolean | 記錄 checkout 是否失敗 |

這些 Map 在 `performRefresh()`（第 19399–19481 行）解析 JSONL 時重建，確保重啟後資料仍可用。
