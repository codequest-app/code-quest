## 已完成

### packages/jsonl-codec/
- ✅ `JsonlDecoder`：JSONL lines → RawEvent（純轉換）
- ✅ `JsonlEncoder`：RawEvent → JSONL line（純轉換，注入 sessionId + cwd）
- ✅ `SessionData` / `SessionSource` / `SessionSink` interfaces（types.ts）
- ✅ `JsonlReader implements SessionSource`：constructor(jsonlPath)
- ✅ `JsonlWriter implements SessionSink`：constructor(outputPath)，寫入時注入 sessionId + cwd
- ✅ `MemoryReader` / `MemoryWriter`：for testing
- ✅ 所有測試通過（reader.test.ts、writer.test.ts）

### apps/server/
- ✅ `DbReader implements SessionSource`：rawEventService + sessionStore → SessionData
- ✅ `DbWriter implements SessionSink`：SessionData → DB（內建 skip guard）
- ✅ `importSession(jsonlPath, rawEventService, sessionStore)`：JsonlReader + DbWriter 組合
- ✅ `exportSession(sessionId, outputPath, rawEventService, sessionStore)`：DbReader + JsonlWriter 組合
- ✅ 移除 `JsonlImporter` / `JsonlExporter` class
- ✅ `session-manager` CLI：互動式 TUI，import / export 功能完整
- ✅ 所有測試通過（762 tests）

## 待驗證

- [ ] 跑 `pnpm --filter @code-quest/server session-manager` 確認 import / export 功能正常
