### 7.19 Session Forking（對話分叉）

**方向**：WebView → Extension → 本地儲存

**用途**：從現有對話的某個時間點建立分支，產生新的 session，包含該時間點之前的所有訊息與檔案快照。

---

#### 7.19.1 請求格式

```json
{
  "type": "request",
  "request": {
    "type": "fork_conversation",
    "forkedFromSession": "原始 session ID",
    "resumeSessionAt": "要分叉的 message UUID（可選）"
  }
}
```

**回應**：

```json
{
  "type": "fork_conversation_response",
  "sessionId": "新 session ID"
}
```

---

#### 7.19.2 完整流程

**位置**：第 47684–47690 行（handler）、第 19582–19672 行（`forkSession`）

```
WebView ──(fork_conversation)──→ Extension
  ↓
B3.load(cwd) → 載入 session storage
  ↓
forkSession(sessionId, resumeSessionAt)：
  ↓
1. 取得原始 session 的訊息列表
  ↓
2. 組裝 transcript
   └── 若指定 resumeSessionAt → 截取到該訊息為止
  ↓
3. 產生新 session ID（UUID）
  ↓
4. UUID 重映射：
   為每個訊息產生新 UUID
   原始 UUID → 新 UUID 的映射表
  ↓
5. 訊息處理：
   ├── 過濾掉 type="progress" 的訊息
   ├── 重映射 uuid 和 parentUuid
   │   └── parentUuid 沿鏈追溯，跳過 progress 訊息
   ├── 更新 sessionId 為新 ID
   └── assistant 訊息同步更新 message.id
  ↓
6. 檔案快照複製：
   ├── 從原始 JSONL 讀取 file-history-snapshot 記錄
   ├── 重映射 snapshot.messageId
   └── 備份檔案：hard link（優先）→ copy（fallback）
       原始：~/.claude/file-history/{oldSessionId}/{file}
       新增：~/.claude/file-history/{newSessionId}/{file}
  ↓
7. 寫入新 JSONL 檔案：
   ~/.claude/projects/{cwd}/{newSessionId}.jsonl
  ↓
8. 若有 summary → 追加 summary 記錄
  ↓
9. 更新記憶體快取：
   ├── sessionMessages Map
   ├── messages Map
   ├── fileHistorySnapshots Map
   └── summaries Map
  ↓
回傳新 sessionId
```

---

#### 7.19.3 UUID 重映射邏輯

**位置**：第 19611–19638 行

```
原始訊息鏈：
  msg-A (parentUuid: null)
    → msg-B (parentUuid: msg-A)
      → progress-1 (parentUuid: msg-B)  ← 被跳過
        → msg-C (parentUuid: progress-1)

分叉後：
  new-A (parentUuid: null)
    → new-B (parentUuid: new-A)
      → new-C (parentUuid: new-B)  ← 自動跳過 progress 找到 msg-B
```

**parentUuid 重映射規則**：
1. 取得原始 parentUuid
2. 沿鏈向上查找，跳過所有 `type === "progress"` 的訊息
3. 找到第一個非 progress 的祖先
4. 使用映射表轉換為新 UUID

---

#### 7.19.4 新 JSONL 檔案結構

```jsonl
{"type":"user","message":{...},"uuid":"new-uuid-1","parentUuid":null,"sessionId":"new-session-id","timestamp":"..."}
{"type":"assistant","message":{...},"uuid":"new-uuid-2","parentUuid":"new-uuid-1","sessionId":"new-session-id","timestamp":"..."}
{"type":"file-history-snapshot","messageId":"new-uuid-2","snapshot":{...}}
{"type":"summary","leafUuid":"new-uuid-2","summary":"對話摘要"}
```
