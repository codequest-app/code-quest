### 7.15 File History / Code Rewind（程式碼回退機制）

**方向**：WebView → Extension → CLI → 檔案系統

**用途**：允許使用者將檔案回退到對話中某個時間點的狀態，支援預覽（dry run）與實際執行。

---

#### 7.15.1 檔案快照儲存

CLI 在執行工具（如 Edit、Write）時，會自動建立檔案快照並寫入 session JSONL：

```json
{
  "type": "file-history-snapshot",
  "messageId": "message-uuid",
  "snapshot": {
    "messageId": "message-uuid",
    "trackedFileBackups": {
      "/path/to/file": {
        "backupFileName": "backup-hash-filename"
      }
    }
  }
}
```

**儲存路徑**：`~/.claude/file-history/{sessionId}/{backupFileName}`

快照以 `messageId` 為 key 儲存在 `fileHistorySnapshots` Map 中（第 22502 行）。

---

#### 7.15.2 Rewind 完整流程

```
使用者在 WebView 點擊「回退」
  ↓
WebView 發送 rewind_code 請求：
  {
    type: "request",
    channelId: "xxx",
    request: {
      type: "rewind_code",
      userMessageId: "要回退到的 message UUID",
      dryRun: true | false
    }
  }
  ↓
Extension handler（第 50543–50551 行）：
  取得 channel → 呼叫 query.rewindFiles(userMessageId, { dryRun })
  ↓
Query.rewindFiles()（第 31141–31149 行）：
  發送 control_request 至 CLI：
  {
    type: "control_request",
    request_id: "xxx",
    request: {
      subtype: "rewind_files",
      user_message_id: "message-uuid",
      dry_run: true | false
    }
  }
  ↓
CLI 處理：
  ├── 載入 fileHistorySnapshots 中對應的快照
  ├── 取得該時間點的檔案備份
  ├── dry_run = true → 僅計算 diff，不修改檔案
  └── dry_run = false → 實際還原檔案內容
  ↓
CLI 回傳 control_response：
  {
    type: "control_response",
    response: {
      subtype: "success",
      request_id: "xxx",
      response: {
        fileDiffs: {
          "/path/to/file1": { oldContent: "...", newContent: "..." },
          "/path/to/file2": { oldContent: null, newContent: "..." }
        }
      }
    }
  }
  ↓
Extension 回傳 WebView：
  {
    type: "rewind_code_response",
    fileDiffs: { ... }
  }
  ↓
WebView 顯示 diff 預覽
  ↓（使用者確認後）
可透過 open_file_diffs 開啟 VSCode diff 檢視器
```

---

#### 7.15.3 Dry Run 模式

- `dryRun: true`：CLI 僅計算檔案差異，不實際修改檔案，用於預覽
- `dryRun: false`：CLI 實際還原檔案到指定時間點的狀態
- 兩者回傳相同的 `fileDiffs` 結構

---

#### 7.15.4 Session Fork 時的快照複製

Session fork 時（§7.16），檔案快照需同步複製：

1. 從原始 session JSONL 讀取所有 `file-history-snapshot` 記錄
2. 將 `messageId` 重映射為新 UUID
3. 備份檔案透過 hard link（優先）或 copy（fallback）複製到新 session 目錄

**位置**：第 22798–22843 行（fork 中的快照複製）、第 22886–22914 行（`Fr` 函數，備份檔案複製）

```
原始路徑：~/.claude/file-history/{oldSessionId}/{backupFileName}
新路徑：  ~/.claude/file-history/{newSessionId}/{backupFileName}
複製策略：hard link → copyFile fallback
```
