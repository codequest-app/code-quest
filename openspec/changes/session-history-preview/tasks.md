## Session History Preview

> TDD：expect 不變或等價。FakeClaude + real JSON。

---

### 1. RawEventStore — 加 getPreview interface

- [ ] 1.1 RawEventStore interface 加 `getPreview(sessionId): Promise<{ firstUser?: string; lastAssistant?: string }>`
- [ ] 1.2 測試：getPreview 回傳正確的 first user + last assistant text

### 2. DrizzleRawStore — SQL 實作

- [ ] 2.1 getPreview 用 SQL query（dir='in' ORDER BY seq ASC LIMIT 1 + dir='out' ORDER BY seq DESC LIMIT 1）
- [ ] 2.2 parse JSON 提取 text content
- [ ] 2.3 測試：有資料、無資料、只有 user、只有 assistant

### 3. FileRawStore — 檔案讀取實作

- [ ] 3.1 getPreview 讀 .jsonl 檔案
- [ ] 3.2 first user：從頭掃找第一條 dir='in' 且 type='user'
- [ ] 3.3 last assistant：從尾掃找最後一條 dir='out' 且 type='assistant'
- [ ] 3.4 測試：有資料、無資料、檔案不存在

### 4. CompositeRawStore — delegate

- [ ] 4.1 getPreview delegate 到第一個 store
- [ ] 4.2 測試

### 5. Sessions Route — 組合回傳

- [ ] 5.1 GET /api/sessions 回傳 enriched sessions（加 firstUserMessage + lastAssistantMessage）
- [ ] 5.2 測試：list 回傳含 preview 欄位

### 6. Client — SessionSummary 型別 + SessionRow UI

- [ ] 6.1 SessionSummary 加 `lastAssistantMessage?: string`
- [ ] 6.2 SessionRow 顯示 lastAssistantMessage preview（truncate 80 chars）
- [ ] 6.3 測試：SessionRow 顯示 preview text

### 7. Socket handler — list_sessions_request 也要 enrich

- [ ] 7.1 misc-handler 的 list_sessions_request 也走 preview enrichment
- [ ] 7.2 測試
