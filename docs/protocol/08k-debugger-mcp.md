### 7.14 Debugger MCP 整合

**方向**：VSCode Debugger → Extension → CLI（自動觸發）

**用途**：當 VSCode 偵測到 debug session 啟動時，自動將 Extension MCP 伺服器加入所有頻道，讓 AI 能存取 debugger 資訊。

---

#### 7.14.1 狀態機

```
inactive ──(偵測到 active debug session)──→ active
                                              ↓
                                    (debug session 結束)
                                              ↓
                                           inactive

任何狀態 ──(addDebuggerMcp 失敗)──→ error { error: msg }
```

| 狀態 | 格式 |
|------|------|
| `inactive` | `{ status: "inactive" }` |
| `active` | `{ status: "active" }` |
| `error` | `{ status: "error", error: "錯誤訊息" }` |

---

#### 7.14.2 自動偵測機制

**位置**：第 71579–71584 行

Extension 監聽 `extensionMcpServer.debuggerController.onStateChange()` 事件（第 70598 行），當狀態變更時呼叫 `updateDebuggerStateForAllChannels(state)`：

```javascript
updateDebuggerStateForAllChannels(state) {
  for (let [channelId, channel] of this.channels) {
    let hasMcp = "claude-vscode-extension" in channel.mcpServers;
    if (state.hasActiveSession && !hasMcp)
      this.addDebuggerMcpToChannel(channelId);      // 自動啟用
    else if (!state.hasActiveSession && hasMcp)
      this.removeDebuggerMcpFromChannel(channelId);  // 自動停用
  }
}
```

> **共用伺服器**：Debugger MCP 與 Jupyter MCP 共用同一個 `"claude-vscode-extension"` MCP 伺服器名稱。

---

#### 7.14.3 啟用流程（addDebuggerMcpToChannel）

**位置**：第 71586–71615 行

```
偵測到 debug session 啟動
  ↓
遍歷所有頻道
  ↓
合併 mcpServers["claude-vscode-extension"] = extensionMcpServer.config
  ↓
query.setMcpServers(mergedServers) → 通知 CLI
  ↓
成功 → debuggerMcpState = { status: "active" }
失敗 → debuggerMcpState = { status: "error", error: msg }
  ↓
pushChannelStateUpdate()
```

---

#### 7.14.4 停用流程（removeDebuggerMcpFromChannel）

**位置**：第 71616–71635 行

```
偵測到 debug session 結束
  ↓
遍歷所有頻道
  ↓
從 mcpServers 移除 "claude-vscode-extension"
  ↓
query.setMcpServers(remainingServers) → 通知 CLI
  ↓
debuggerMcpState = { status: "inactive" }
  ↓
pushChannelStateUpdate()
```

---

#### 7.14.5 ask_debugger_help 請求

**位置**：第 50329–50332、71577 行

WebView 可發送 `ask_debugger_help` 請求觸發 debugger 協助：

```json
{
  "type": "request",
  "channelId": "頻道 ID（必填）",
  "request": { "type": "ask_debugger_help" }
}
```

回應：`{ type: "ask_debugger_help_response" }`

---

#### 7.14.6 初始狀態

**位置**：第 71570–71575 行

```javascript
getInitialDebuggerState() {
  return debuggerController.getState().hasActiveSession
    ? { status: "active" }
    : { status: "inactive" };
}
```

頻道建立時（第 49857 行），以 `getInitialDebuggerState()` 設定初始 `debuggerMcpState`。
