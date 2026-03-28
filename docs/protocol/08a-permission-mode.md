### 7.4 Permission Mode 切換流程

**方向**：WebView → Extension → CLI（主動發起）

**觸發條件**：使用者在 WebView UI 點擊底部的模式按鈕，循環切換權限模式。

#### 可用的 Permission Mode

```javascript
// webview/index.js — U3() 函式
let modes = config.allowDangerouslySkipPermissions
  ? ["default", "acceptEdits", "plan", "bypassPermissions"]
  : ["default", "acceptEdits", "plan"];
```

| Mode | 說明 |
|------|------|
| `default` | 預設模式，每次工具使用都詢問權限 |
| `acceptEdits` | 自動接受編輯類工具（Read、Edit、Write 等），僅危險操作才詢問 |
| `plan` | 計畫模式，AI 只能規劃不能執行工具 |
| `bypassPermissions` | 跳過所有權限檢查（需 `allowDangerouslySkipPermissions` 設定開啟才可見） |

#### Cycling 邏輯（WebView）

使用者點擊模式按鈕時，依序循環：`default` → `acceptEdits` → `plan` → `default` ...

```javascript
// webview/index.js — U3()
function U3() {
  let modes = config.allowDangerouslySkipPermissions
    ? ["default", "acceptEdits", "plan", "bypassPermissions"]
    : ["default", "acceptEdits", "plan"];
  let nextIndex = (modes.indexOf(session.permissionMode.value) + 1) % modes.length;
  let nextMode = modes[nextIndex];
  session.setPermissionMode(nextMode);
}
```

#### 完整訊息流

```
WebView                         Extension                        CLI
  │                               │                               │
  │  ① request                    │                               │
  │  { type: "request",           │                               │
  │    request: {                 │                               │
  │      type: "set_permission_   │                               │
  │             mode",            │                               │
  │      mode: "acceptEdits"      │                               │
  │  }}                           │                               │
  │ ─────────────────────────────>│                               │
  │                               │                               │
  │              ② processRequest() (L50421)                      │
  │              呼叫 setPermissionMode()                           │
  │                               │                               │
  │                               │  ③ control_request (stdin)    │
  │                               │  { type: "control_request",   │
  │                               │    request: {                 │
  │                               │      subtype:                 │
  │                               │        "set_permission_mode", │
  │                               │      mode: "acceptEdits"      │
  │                               │  }}                           │
  │                               │ ─────────────────────────────>│
  │                               │                               │
  │                               │  ④ control_response (stdout)  │
  │                               │ <─────────────────────────────│
  │                               │                               │
  │  ⑤ response                   │                               │
  │  { type: "response",          │                               │
  │    result: {                  │                               │
  │      type: "set_permission_   │                               │
  │             mode_response",   │                               │
  │      success: true            │                               │
  │  }}                           │                               │
  │ <─────────────────────────────│                               │
```

#### 相關程式碼

| 步驟 | 程式碼位置 | 說明 |
|------|-----------|------|
| ① WebView 發起 | `webview/index.js` `U3()` | cycling 函式，透過 `sendRequest()` 發送 |
| ② Extension 路由 | `extension.js` L50420-50421 | `processRequest()` 的 `set_permission_mode` case |
| ②→③ Extension 實作 | `extension.js` L50898-50911 | `setPermissionMode()` 呼叫 `query.setPermissionMode(mode)` |
| ③ SDK → CLI | `extension.js` L31123-31124 | `{ subtype: "set_permission_mode", mode }` 寫入 stdin |
| ⑤ 回傳 WebView | `extension.js` L50903-50909 | 成功回 `{ success: true }`，失敗回 `{ success: false }` |

#### 與 `updatedPermissions` 中 `setMode` 的關係

`set_permission_mode` 與 `updatedPermissions` 中的 `{ type: "setMode" }` 效果相同，但觸發方式不同：

| 機制 | 觸發方式 | 時機 |
|------|---------|------|
| `set_permission_mode` request | 使用者主動點擊模式按鈕 | 任何時候 |
| `updatedPermissions: [{ type: "setMode", mode, destination }]` | 使用者在工具權限對話框中選擇 | 回應 `can_use_tool` 時附帶 |

兩者最終都是通知 CLI 切換權限模式，差別在於 `updatedPermissions` 是被動附帶在權限回應中，而 `set_permission_mode` 是主動發起的獨立請求。

---

