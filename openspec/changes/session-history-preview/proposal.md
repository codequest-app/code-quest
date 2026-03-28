# Session History Preview

## 問題
Session History 只顯示 title/createdAt，看不到對話內容。用戶不知道每個 session 做了什麼。

## 方案
RawEventStore 加 `getPreview(sessionId)` method，各實作最佳化：
- DrizzleRawStore — SQL query 只查 2 條（first user + last assistant）
- FileRawStore — 讀檔案頭 + 檔案尾
- CompositeRawStore — delegate

Route handler 組合 session list + preview，回傳給 client。
SessionRow 顯示 firstUserMessage + lastAssistantMessage preview。

## 不做
- 不改 DB schema（不加欄位）
- 不改 SessionStore interface
