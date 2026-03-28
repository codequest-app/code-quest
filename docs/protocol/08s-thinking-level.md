### 7.22 Thinking Level 控制

**方向**：WebView → Extension → CLI

**用途**：控制 AI 的 extended thinking token 預算，決定推理深度。

---

#### 7.22.1 設定流程

**位置**：第 47574–47575、48099–48107 行

```
WebView ──(set_thinking_level { thinkingLevel, channelId })──→ Extension
  ↓
getMaxThinkingTokensForModel(level)：
  "off" → 0 tokens（停用 thinking）
  其他   → 31999 tokens（最大 thinking）
  ↓
query.setMaxThinkingTokens(tokens)：
  發送 control_request 至 CLI：
  {
    type: "control_request",
    request: {
      subtype: "set_max_thinking_tokens",
      max_thinking_tokens: 0 | 31999
    }
  }
  ↓
settings.setThinkingLevel(level)：
  持久化至 VSCode globalState（key: "thinkingLevel"）
  ↓
回傳 { type: "set_thinking_level_response" }
```

---

#### 7.22.2 Level 對照表

| Level | Max Thinking Tokens | 效果 |
|-------|-------------------|------|
| `"off"` | 0 | 停用 extended thinking |
| 其他（`"default_on"` 等） | 31999 | 啟用 extended thinking |

---

#### 7.22.3 持久化

**位置**：第 48259–48264 行

```javascript
getThinkingLevel() {
  return globalState.get("thinkingLevel") ?? "default_on";
}

setThinkingLevel(level) {
  globalState.update("thinkingLevel", level);
}
```

- 預設值：`"default_on"`
- 儲存於 VSCode `globalState`，跨 session 持久化
- 透過 `init_response` 和 `update_state` 傳遞至 WebView
