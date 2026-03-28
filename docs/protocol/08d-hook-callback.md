### 7.7 Hook 回調流程（`hook_callback` 觸發機制）

**方向**：Claude CLI → stdout → Extension（被動接收）

**觸發條件**：CLI 在執行工具前後（PreToolUse / PostToolUse），回調 Extension 預先註冊的 hook 函式。

> **✅ Hooks 獨立於 `can_use_tool`，在純 CLI stream-json 模式下也能使用**
>
> Hooks 和 canUseTool 是完全獨立的機制。`hasBidirectionalNeeds()`（第 30881 行）用 `||` 判斷：
> ```javascript
> hasBidirectionalNeeds() {
>   return (
>     this.sdkMcpTransports.size > 0 ||
>     (this.hooks !== void 0 && Object.keys(this.hooks).length > 0) ||  // hooks 獨立
>     this.canUseTool !== void 0  // canUseTool 獨立
>   );
> }
> ```
> 只要在 `initialize` control_request 中帶上 hooks 設定，CLI 就會在工具執行前後發出 `hook_callback`，不需要提供 `canUseTool` callback。

#### Hook 註冊階段

Extension 在 `spawnClaude()` 時定義 hooks（第 70787–70804 行）：

```javascript
hooks: {
  PreToolUse: [
    {
      matcher: "Edit|Write|MultiEdit",
      hooks: [(F) => O.captureBaseline(F)]       // 記錄檔案原始狀態
    },
    {
      matcher: "Edit|Write|Read",
      hooks: [(F) => this.saveFileIfNeeded(F)]    // 先儲存未存檔的檔案
    },
  ],
  PostToolUse: [
    {
      matcher: "Edit|Write|MultiEdit",
      hooks: [(F) => O.findDiagnosticsProblems(F)] // 檢查 linting 錯誤
    },
  ],
}
```

初始化時（第 31087–31102 行），每個 hook 函式會被分配一個 `callback_id` 並存入 `hookCallbacks` Map：

```javascript
for (let j of K.hooks) {
  let B = `hook_${this.nextCallbackId++}`;
  this.hookCallbacks.set(B, j);  // 例如 "hook_0" → captureBaseline 函式
  x.push(B);
}
```

然後在 `initialize` control_request 中告知 CLI：

```json
{
  "type": "control_request",
  "request": {
    "subtype": "initialize",
    "hooks": {
      "PreToolUse": [
        { "matcher": "Edit|Write|MultiEdit", "hookCallbackIds": ["hook_0"], "timeout": 5000 },
        { "matcher": "Edit|Write|Read", "hookCallbackIds": ["hook_1"], "timeout": 5000 }
      ],
      "PostToolUse": [
        { "matcher": "Edit|Write|MultiEdit", "hookCallbackIds": ["hook_2"], "timeout": 5000 }
      ]
    }
  }
}
```

#### 實際觸發階段

```
① CLI 準備執行 Edit 工具（符合 PreToolUse 的 matcher "Edit|Write|MultiEdit"）
    ↓
② CLI 透過 stdout 送出：
    {
      type: "control_request",
      request_id: "xxx",
      request: {
        subtype: "hook_callback",
        callback_id: "hook_0",
        input: { file_path: "/src/app.js", ... },
        tool_use_id: "xxx"
      }
    }
    ↓
③ Extension readMessages()（第 30948 行）→ handleControlRequest()
    ↓
④ processControlRequest()（第 31045 行）判斷 subtype === "hook_callback"
    ↓
⑤ handleHookCallbacks()（第 31301 行）：
    - 用 callback_id 從 hookCallbacks Map 找到對應函式
    - 執行該函式
    ↓
⑥ Extension 透過 stdin 回傳 control_response 給 CLI
    ↓
⑦ CLI 收到 hook 執行結果後，繼續執行工具
    ↓
⑧ 工具執行完畢後，CLI 再觸發 PostToolUse hook（hook_2）
    重複 ②-⑥ 流程
```

**相關程式碼**：

```javascript
// 第 31301 行
handleHookCallbacks(z, v, j, K) {
  let U = this.hookCallbacks.get(z);  // 用 callback_id 找到對應函式
  if (!U) throw Error(`No hook callback found for ID: ${z}`);
  return U(v, j, { signal: K });      // 執行 hook 函式
}
```

#### 已註冊的 Hook 函式一覽

| callback_id | 時機 | 匹配工具 | 函式 | 功能 |
|-------------|------|---------|------|------|
| `hook_0` | PreToolUse | Edit, Write, MultiEdit | `captureBaseline(input)` | 在修改檔案前記錄原始狀態，用於後續差異比較 |
| `hook_1` | PreToolUse | Edit, Write, Read | `saveFileIfNeeded(input)` | 若 VSCode 中該檔案有未儲存變更，先自動儲存 |
| `hook_2` | PostToolUse | Edit, Write, MultiEdit | `findDiagnosticsProblems(input)` | 修改後檢查 VSCode 診斷問題（linting、型別錯誤等） |

#### `hook_callback` 的 input 格式（CLI → Extension）

CLI 發送 `hook_callback` 時，`input` 欄位包含以下結構（由 hook 函式內部的欄位存取推導，第 56027–56101 行）：

```json
{
  "hook_event_name": "PreToolUse",       // 或 "PostToolUse"
  "tool_name": "Edit",                   // 觸發的工具名稱（Edit、Write、MultiEdit、Read）
  "tool_input": {                        // 工具的原始輸入
    "file_path": "/src/app.js",
    "old_string": "...",
    "new_string": "..."
  }
}
```

#### `hook_callback` 的回傳格式（Extension → CLI）

Hook 函式的回傳值會作為 `control_response.response.response` 寫回 CLI stdin。

##### 基本格式：繼續執行

所有 hook 函式正常情況下都回傳 `{ continue: true }`，表示工具可以繼續執行：

```json
{
  "continue": true
}
```

##### 帶額外資訊格式（PostToolUse 診斷結果）

`findDiagnosticsProblems()`（第 56045–56087 行）偵測到新的診斷問題時，會附帶 `hookSpecificOutput`：

```json
{
  "continue": true,
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "<ide_diagnostics>...診斷摘要...</ide_diagnostics>"
  }
}
```

`additionalContext` 中的診斷摘要由 `formatDiagnosticsSummary()` 產生，包含 VSCode 偵測到的 linting 錯誤、型別錯誤等。

##### 完整 control_response 包裝

```json
{
  "type": "control_response",
  "response": {
    "subtype": "success",
    "request_id": "對應的 request_id",
    "response": {
      "continue": true,
      "hookSpecificOutput": {             // 可選
        "hookEventName": "PostToolUse",
        "additionalContext": "<ide_diagnostics>...</ide_diagnostics>"
      }
    }
  }
}
```

##### 各 Hook 函式回傳值對照

| Hook 函式 | 回傳值 | 說明 |
|-----------|--------|------|
| `captureBaseline()` | `{ continue: true }` | 僅記錄基線，不影響工具執行 |
| `saveFileIfNeeded()` | `{ continue: true }` | 儲存完畢後繼續，即使儲存失敗也繼續 |
| `findDiagnosticsProblems()` 無問題時 | `{ continue: true }` | 無新增診斷問題 |
| `findDiagnosticsProblems()` 有問題時 | `{ continue: true, hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: "<ide_diagnostics>...</ide_diagnostics>" } }` | 將診斷資訊回傳給 CLI，CLI 可將其注入後續 context |

> **備註**：目前所有 hook 都回傳 `continue: true`，不會阻止工具執行。`continue: false` 的行為在此 Extension 中未被使用，但 CLI 端可能支援用 `continue: false` 來中止工具執行。

---

