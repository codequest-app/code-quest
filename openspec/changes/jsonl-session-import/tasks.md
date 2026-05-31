## 已完成

### packages/jsonl-codec/
- ✅ `JsonlDecoder`：JSONL lines → RawEvent（純轉換）
- ✅ `JsonlEncoder`：RawEvent → JSONL line（純轉換，internal only）
- ✅ `SessionData` / `SessionSource` / `SessionSink` interfaces（types.ts）
- ✅ `JsonlFileReader implements SessionSource`：constructor(jsonlPath)，讀 JSONL 檔
- ✅ `JsonlFileWriter implements SessionSink`：constructor(outputPath)，寫 JSONL 檔，注入 sessionId + cwd
- ✅ `MemoryReader` / `MemoryWriter`：for testing
- ✅ 所有測試通過（reader.test.ts、writer.test.ts）

### apps/server/
- ✅ `DbReader implements SessionSource`：rawEventService + sessionStore → SessionData
- ✅ `DbWriter implements SessionSink`：SessionData → DB（內建 skip guard，並行寫入）
- ✅ `importSession(jsonlPath, rawEventService, sessionStore)`：JsonlFileReader + DbWriter 組合
- ✅ `exportSession(sessionId, outputPath, rawEventService, sessionStore)`：DbReader + JsonlFileWriter 組合
- ✅ `session-manager` CLI：互動式 TUI，import / export 功能完整
- ✅ 所有測試通過（761 tests）

## 待驗證

- [ ] 跑 `pnpm --filter @code-quest/server session-manager` 確認 import / export 功能正常
