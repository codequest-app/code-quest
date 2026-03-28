### 7.25 Diff 接受/拒絕流程

**方向**：WebView → Extension → VSCode Diff Viewer → 使用者操作 → Extension → WebView

**用途**：AI 修改檔案後，透過 VSCode diff viewer 顯示變更，讓使用者逐一接受或拒絕。

---

#### 7.25.1 開啟單檔 Diff（open_diff）

**位置**：第 47539–47546、68441–68455 行

```
WebView ──(open_diff { originalFilePath, newFilePath, edits, supportMultiEdits })──→ Extension
  ↓
openDiff() → 委派給 RY() 函數（第 53030–53122 行）
```

---

#### 7.25.2 Diff 顯示與互動流程

**位置**：第 53030–53122 行（`RY` 函數）

```
RY() 函數啟動：
  ↓
1. 建立左側 URI（原始內容）
   └── 處理 dirty file（未儲存的修改）
  ↓
2. 建立右側 URI（修改後內容）
   └── 透過 GY() 套用 edits 產生新內容
  ↓
3. 產生 diff tab 標題：「✻ [Claude Code] original → new」
  ↓
4. 關閉已存在的同名 diff tab
  ↓
5. 註冊事件監聽器：
   ├── onDidChangeTextDocument → 追蹤使用者在 diff 中的修改
   ├── acceptOrRejectDiffs callback → 等待使用者決定
   └── onWillSaveTextDocument → 手動儲存視為接受
  ↓
6. 執行 vscode.diff 命令：
   vscode.diff(leftUri, rightUri, tabLabel, { preview: false, preserveFocus: true })
  ↓
7. 等待使用者操作（Promise.race）：
   ├── 使用者點擊「接受」→ 回傳新 edits
   ├── 使用者點擊「拒絕」→ 回傳 undefined
   ├── 使用者關閉 diff tab → 視為拒絕
   └── 使用者手動儲存 → 視為接受（autoSave off 時）
  ↓
8. 清理所有監聽器
  ↓
回傳 { type: "open_diff_response", newEdits: [...] | undefined }
```

---

#### 7.25.3 接受/拒絕命令

**位置**：第 72192–72209 行

| VSCode 命令 | 說明 |
|-------------|------|
| `claude-code.acceptProposedDiff` | 接受目前的 diff，觸發 `{ accepted: true }` 事件 |
| `claude-code.rejectProposedDiff` | 拒絕目前的 diff，觸發 `{ accepted: false }` 事件 |

兩者都會呼叫 `W8()` 進行狀態重置。

---

#### 7.25.4 接受後的 Edit 計算（KA 函數）

**位置**：第 52980–52988 行

當使用者接受 diff 時，`KA()` 比較原始內容與最終內容，產生結構化的 edit 物件：

```javascript
KA(originalEdits, originalContent, finalContent, mode) {
  // mode: "single" | "multiple"（依 supportMultiEdits 決定）
  // 使用 kU6() 產生 unified diff hunks
  // 回傳 YU6() 轉換後的 edits：
  return [
    { oldString: "原始片段", newString: "修改後片段" },
    ...
  ];
}
```

> 使用者可在 diff viewer 中額外修改右側內容，最終 edit 會反映使用者的手動調整。

---

#### 7.25.5 開啟多檔 Diff（open_file_diffs）

**位置**：第 47701–47705、68582–68607 行

```
WebView ──(open_file_diffs { diffs })──→ Extension
  ↓
遍歷 diffs 物件（key = 檔案路徑，value = { oldContent, newContent }）：
  ├── 建立左側暫存檔（oldContent）
  └── 建立右側暫存檔或使用實際檔案（newContent）
  ↓
執行 vscode.changes 命令：
  vscode.changes("Claude Code changes", [ [label, leftUri, rightUri], ... ])
  ↓
回傳 { type: "open_file_diffs_response" }
```

此為唯讀預覽模式，用於 Code Rewind（§7.15）的 diff 預覽，不含接受/拒絕互動。

---

#### 7.25.6 Diff 狀態追蹤

| VSCode 命令 | 用途 |
|-------------|------|
| `claude-code.viewingProposedDiff` | 設定 context 變數，標記目前正在檢視 diff（控制 accept/reject 按鈕的可見性） |
