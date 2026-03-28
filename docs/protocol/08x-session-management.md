### 7.27 Session 管理操作（v2.1.63 新增）

**方向**：WebView → Extension → 本地儲存 / VSCode

**用途**：提供對話 session 的重新命名、刪除、在編輯器開啟、狀態更新等管理功能。

---

#### 7.27.1 重新命名對話（rename_session）

**位置**：第 50632–50636 行

```
WebView ──(rename_session { sessionId, title })──→ Extension
  ↓
SessionManager.renameSession(sessionId, title)
  ↓
寫入 JSONL 事件：
  { type: "custom-title", sessionId: "xxx", customTitle: "新標題" }
  ↓
回傳 { type: "rename_session_response" }
```

**JSONL 解析**（第 22637 行）：讀取 session 時，遇到 `custom-title` 事件會覆蓋 session 的顯示標題。

---

#### 7.27.2 刪除/隱藏對話（delete_session）

**位置**：第 50638–50641 行

```
WebView ──(delete_session { sessionId })──→ Extension
  ↓
settings.hideSession(sessionId)
  ↓
回傳 { type: "delete_session_response" }
```

> **注意**：此操作並非真正刪除 JSONL 檔案，而是透過 settings 標記為隱藏。

---

#### 7.27.3 在編輯器中開啟對話（open_in_editor）

**位置**：第 70701–70710 行

```
WebView ──(open_in_editor { sessionId })──→ Extension
  ↓
vscode.commands.executeCommand(
  "claude-vscode.editor.open",
  sessionId,
  undefined,
  ViewColumn.Active
)
  ↓
回傳 { type: "open_in_editor_response" }
```

> 此功能為 VSCode 專屬，在編輯器面板中開啟對話內容。

---

#### 7.27.4 更新對話狀態（update_session_state）

**位置**：第 70723–70731 行

```
WebView ──(update_session_state { sessionId, state, title })──→ Extension
  ↓
觸發 onSessionStateChanged(sessionId, state, title) 回調
  ↓
回傳 { type: "update_session_state_response" }
```

用於同步多個 WebView 面板之間的對話狀態。

---

#### 7.27.5 init_response 新增欄位

**v2.1.63 新增的 init_response state 屬性**：

| 屬性 | 類型 | 說明 |
|------|------|------|
| `currentRepo` | string \| null | 偵測到的 GitHub 儲存庫（透過 `git remote get-url origin` 取得後解析） |
| `isOnboardingDismissed` | boolean | 使用者是否已關閉 Onboarding 引導介面 |

**currentRepo 偵測邏輯**（第 49567–49585 行）：

```
Extension 啟動時
  ↓
執行 git remote get-url origin
  ↓
成功 → 解析為 GitHub 格式（owner/repo）→ 快取
失敗 → 回傳 null → 快取
```
