## ADDED Requirements

### Requirement: Event 命名格式為 namespace:action
所有 C→S socket events 必須使用 `namespace:action` 格式（lowercase, snake_case after colon）。

#### Scenario: 新 event 命名
- **WHEN** 新增 C→S socket event
- **THEN** event name 格式為 `namespace:action`（例：`mcp:reconnect`）
- **THEN** namespace 是已定義的 domain（app, auth, settings, session, chat, mcp, file, git, plugin, plan, speech, terminal）

#### Scenario: 現有 bare event 遷移
- **WHEN** bare event（如 `login`）被遷移
- **THEN** 新名稱為 `auth:login`
- **THEN** server handler 同時監聽新舊 event name（向下相容）

### Requirement: Namespace 定義
每個 namespace 對應一個 domain：

| Namespace | Domain | Handler file |
|---|---|---|
| `app` | 全域（init, provider config） | misc-handler |
| `auth` | 認證 | misc-handler |
| `settings` | 設定（model, permission, thinking） | settings-handler |
| `session` | Session lifecycle | session-handler |
| `chat` | 訊息互動 | message-handler |
| `mcp` | MCP 操作 | mcp-handler |
| `file` | 檔案操作 | file-handler |
| `git` | Git 操作 | git-handler |
| `plugin` | Plugin + marketplace | plugin-handler |
| `plan` | Plan comments | misc-handler |
| `speech` | Speech-to-text | misc-handler |
| `terminal` | Terminal 操作 | misc-handler |

#### Scenario: Namespace 不存在
- **WHEN** 新功能不屬於任何現有 namespace
- **THEN** 定義新 namespace 並加到上表
