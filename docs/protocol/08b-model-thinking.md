### 7.5 模型與思考層級切換流程

**方向**：WebView → Extension → CLI（主動發起）

**觸發條件**：使用者在 WebView UI 中選擇不同的模型或切換思考層級。

#### 7.5.1 切換模型（`set_model`）

##### WebView 端邏輯

```javascript
// webview/index.js — session.setModel()
async setModel(model) {
  let previousModel = this.modelSelection.value;
  this.modelSelection.value = model.value;  // 先樂觀更新 UI

  if (!this.claudeChannelId || !this.connection.value) return;

  let result = await this.connection.value.setModel(this.claudeChannelId, model);
  // → sendRequest({ type: "set_model", model }, channelId)

  if (!result.success) {
    this.modelSelection.value = previousModel;  // 失敗時回滾
    this.showNotification(`Failed to set model: ${result.error ?? "Unknown error"}`, "error");
  }
}
```

##### 完整訊息流

```
WebView                         Extension                        CLI
  │                               │                               │
  │  ① request                    │                               │
  │  { type: "request",           │                               │
  │    request: {                 │                               │
  │      type: "set_model",       │                               │
  │      model: {                 │                               │
  │        value: "claude-sonnet- │                               │
  │               4-6-20250514"   │                               │
  │      }                        │                               │
  │  }}                           │                               │
  │ ─────────────────────────────>│                               │
  │                               │                               │
  │              ② setModel() (L50913)                             │
  │              settings.setModel(model.value)  ← VSCode 設定持久化 │
  │              query.setModel(model.value)     ← 通知 CLI        │
  │                               │                               │
  │                               │  ③ control_request (stdin)    │
  │                               │  { type: "control_request",   │
  │                               │    request: {                 │
  │                               │      subtype: "set_model",    │
  │                               │      model: "claude-sonnet-..."│
  │                               │  }}                           │
  │                               │ ─────────────────────────────>│
  │                               │                               │
  │                               │  ④ control_response (stdout)  │
  │                               │ <─────────────────────────────│
  │                               │                               │
  │  ⑤ response                   │                               │
  │  { type: "response",          │                               │
  │    result: {                  │                               │
  │      type: "set_model_        │                               │
  │             response",        │                               │
  │      success: true            │                               │
  │  }}                           │                               │
  │ <─────────────────────────────│                               │
```

##### Extension 實作（`extension.js` L50913-50933）

```javascript
async setModel(channelId, model) {
  let channel = this.channels.get(channelId);
  let previousModel = this.settings.getModel();  // 記住舊值以便回滾
  try {
    await this.settings.setModel(model.value);    // 持久化到 VSCode 設定
    await channel.query.setModel(model.value);    // 透過 stdin 通知 CLI
    return { type: "set_model_response", success: true };
  } catch (error) {
    await this.settings.setModel(previousModel);  // 失敗時回滾設定
    return {
      type: "set_model_response",
      success: false,
      error: error.message
    };
  }
}
```

**雙層回滾機制**：Extension 回滾 VSCode 設定，WebView 回滾 UI 顯示的模型名稱。

##### 模型設定持久化

| 層級 | 儲存位置 | 程式碼 |
|------|---------|--------|
| VSCode 設定 | `claudeCode.selectedModel`（Global） | `extension.js` L51152-51155 |
| CLI 運行時 | stdin `set_model` control_request | `extension.js` L31126-31127 |

#### 7.5.2 切換思考層級（`set_thinking_level`）

##### 可用的 Thinking Level

| 值 | 說明 | `max_thinking_tokens` |
|----|------|----------------------|
| `"off"` | 關閉思考 | `0` |
| 其他（如 `"default_on"`） | 開啟思考 | `31999` |

轉換邏輯（`extension.js` L51130-51132）：

```javascript
getMaxThinkingTokensForModel(level) {
  if (level === "off") return 0;
  return 31999;
}
```

##### WebView 端邏輯

```javascript
// webview/index.js — session.setThinkingLevel()
async setThinkingLevel(level) {
  this.thinkingLevelOverride.value = level;
  let connection = await this.getConnection();
  await connection.setThinkingLevel(this.claudeChannelId, level);
  // → sendRequest({ type: "set_thinking_level", thinkingLevel: level }, channelId)
}
```

使用者也可透過命令列操作 `toggle-thinking` 來切換開/關。

##### 完整訊息流

```
WebView                         Extension                        CLI
  │                               │                               │
  │  ① request                    │                               │
  │  { type: "request",           │                               │
  │    request: {                 │                               │
  │      type: "set_thinking_     │                               │
  │             level",           │                               │
  │      thinkingLevel: "off"     │                               │
  │  }}                           │                               │
  │ ─────────────────────────────>│                               │
  │                               │                               │
  │              ② setThinkingLevel() (L50935)                     │
  │              getMaxThinkingTokensForModel("off") → 0           │
  │              query.setMaxThinkingTokens(0)  ← 通知 CLI         │
  │              settings.setThinkingLevel("off") ← 持久化          │
  │                               │                               │
  │                               │  ③ control_request (stdin)    │
  │                               │  { type: "control_request",   │
  │                               │    request: {                 │
  │                               │      subtype:                 │
  │                               │        "set_max_thinking_     │
  │                               │         tokens",              │
  │                               │      max_thinking_tokens: 0   │
  │                               │  }}                           │
  │                               │ ─────────────────────────────>│
  │                               │                               │
  │                               │  ④ control_response (stdout)  │
  │                               │ <─────────────────────────────│
  │                               │                               │
  │  ⑤ response                   │                               │
  │  { type: "response",          │                               │
  │    result: {                  │                               │
  │      type: "set_thinking_     │                               │
  │             level_response"   │                               │
  │  }}                           │                               │
  │ <─────────────────────────────│                               │
```

> **注意**：WebView 送出的是 `set_thinking_level`（語義化的等級名稱），Extension 轉換後送給 CLI 的是 `set_max_thinking_tokens`（實際的 token 數值）。這個轉換由 `getMaxThinkingTokensForModel()` 完成。

##### 思考層級持久化

| 層級 | 儲存位置 | 程式碼 |
|------|---------|--------|
| VSCode 狀態 | `globalState.thinkingLevel` | `extension.js` L51161-51162 |
| CLI 運行時 | stdin `set_max_thinking_tokens` control_request | `extension.js` L31129-31134 |

##### 相關程式碼位置

| 功能 | 位置 | 說明 |
|------|------|------|
| WebView `setModel` | `webview/index.js` connection `setModel()` | `sendRequest({ type: "set_model", model })` |
| WebView `setThinkingLevel` | `webview/index.js` connection `setThinkingLevel()` | `sendRequest({ type: "set_thinking_level", thinkingLevel })` |
| Extension `setModel` | `extension.js` L50913-50933 | 雙層操作：settings + query，失敗回滾 |
| Extension `setThinkingLevel` | `extension.js` L50935-50942 | 轉換 level → tokens，通知 CLI + 持久化 |
| Extension `getMaxThinkingTokensForModel` | `extension.js` L51130-51132 | `"off"` → 0，其他 → 31999 |
| SDK `setModel` | `extension.js` L31126-31127 | `{ subtype: "set_model", model }` |
| SDK `setMaxThinkingTokens` | `extension.js` L31129-31134 | `{ subtype: "set_max_thinking_tokens", max_thinking_tokens }` |
| Settings `setModel` | `extension.js` L51152-51155 | 寫入 `claudeCode.selectedModel` VSCode 設定 |
| Settings `setThinkingLevel` | `extension.js` L51161-51162 | 寫入 `globalState.thinkingLevel` |

---

