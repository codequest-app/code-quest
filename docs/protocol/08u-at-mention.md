### 7.24 @ Mention 系統

**方向**：WebView → Extension → 檔案系統 / Terminal / Chrome MCP

**用途**：使用者在輸入框中輸入 `@` 時，觸發檔案、終端機、瀏覽器分頁的搜尋與插入。

---

#### 7.24.1 搜尋流程（list_files_request）

**位置**：第 50375–50378、71363–71390 行

```
WebView ──(list_files_request { pattern })──→ Extension
  ↓
findFiles(pattern)：
  ├── 1. Terminal 搜尋（若 AT_MENTION_TERMINAL=true）
  │     → getMatchingTerminals(pattern)
  ├── 2. Browser 搜尋（若 Chrome MCP 已連接）
  │     → getMatchingBrowserTabs(pattern)
  └── 3. 檔案搜尋
        ├── ripgrep（主要）
        └── VSCode workspace.findFiles（fallback）
  ↓
合併結果，回傳：
{
  type: "list_files_response",
  files: [
    { path: "src/app.ts", name: "app.ts", type: "file" },
    { path: "terminal:Claude_Code", name: "terminal:Claude_Code", type: "terminal" },
    { path: "browser:1:2:https://...", name: "browser:Page_Title", type: "browser" }
  ]
}
```

---

#### 7.24.2 Terminal @ Mention

**前置條件**：環境變數 `AT_MENTION_TERMINAL` 必須為 `"true"`（第 71366 行）

**位置**：第 71392–71418 行

```javascript
getMatchingTerminals(pattern) {
  // 搜尋所有 VSCode 終端機，名稱中空格替換為底線
  // 回傳格式：
  return { path: "terminal:Terminal_Name", name: "terminal:Terminal_Name", type: "terminal" };
}
```

Terminal 名稱中的空格替換為底線（`_`），以便後續 `get_terminal_contents` 能正確查找。

---

#### 7.24.3 Browser @ Mention

**前置條件**：Chrome MCP 已連接

**位置**：第 71442–71465 行

```javascript
getMatchingBrowserTabs(pattern, forceRefresh?) {
  // 透過 chromeMcpClient 取得瀏覽器分頁列表
  // 使用快取（browserTabsCache），失敗時 fallback 至快取資料
  // 回傳格式：
  return {
    path: "browser:{tabGroupId}:{tabId}:{url}",
    name: "browser:{Title_With_Underscores}",
    type: "browser"
  };
}
```

**特殊情況**：新分頁（`tabGroupId === ""` 且 `tabId === 0`）回傳 `path: "browser:new_tab"`。

**篩選邏輯**（第 71420–71440 行，`filterBrowserTabs`）：以 title 和 URL 進行模糊比對。

---

#### 7.24.4 插入 @ Mention（insert_at_mention）

**位置**：第 70604–70610 行

當使用者透過 IDE 命令（`claude-code.insertAtMentioned`，第 75032 行）插入 @ mention 時：

```
IDE 命令觸發 → 呼叫 nativeAtMentionCallback
  ↓
Extension 推送至 WebView：
{
  type: "request",
  channelId: "",
  requestId: "",
  request: { type: "insert_at_mention", text: "@filename" }
}
  ↓
自動顯示 Claude 面板（panelTab.reveal()）
```

---

#### 7.24.5 結果類型對照

| type | path 格式 | 說明 |
|------|----------|------|
| `"file"` | `src/path/to/file.ts` | 一般檔案 |
| `"terminal"` | `terminal:Terminal_Name` | VSCode 終端機 |
| `"browser"` | `browser:{groupId}:{tabId}:{url}` | Chrome 瀏覽器分頁 |
