## 已完成

### packages/jsonl-codec/
- ✅ `JsonlDecoder`：JSONL lines → RawEvent（純轉換）
- ✅ `JsonlEncoder`：RawEvent → JSONL line（純轉換，注入 sessionId + cwd）
- ✅ `SessionData` / `SessionSource` / `SessionSink` interfaces（types.ts）
- ✅ `JsonlReader implements SessionSource`：constructor(jsonlPath)
- ✅ `JsonlWriter implements SessionSink`：constructor(outputPath)
- ✅ `MemoryReader` / `MemoryWriter`：for testing
- ✅ 所有測試通過（reader.test.ts、writer.test.ts）

### apps/server/
- ✅ `DbReader implements SessionSource`：rawEventService + sessionStore → SessionData
- ✅ `DbWriter implements SessionSink`：SessionData → DB（內建 skip guard）
- ✅ `importSession(jsonlPath, rawEventService, sessionStore)`：JsonlReader + DbWriter 組合
- ✅ `exportSession(sessionId, outputPath, rawEventService, sessionStore)`：DbReader + JsonlWriter 組合
- ✅ `session-manager` CLI：互動式 TUI，import / export 功能完整
- ✅ `db-reader-writer.test.ts`：整合測試

## 待重構

### 1. 移除 `JsonlImporter` / `JsonlExporter` class（保留函式）

`JsonlImporter` / `JsonlExporter` 是 Source/Sink 重構前的殘留。現在 `importSession` / `exportSession` 函式更直接。

- [ ] 1.1 `jsonl-importer.test.ts`：改測 `importSession` 函式
- [ ] 1.2 `jsonl-exporter.test.ts`：改測 `exportSession` 函式
- [ ] 1.3 `session-manager.ts`：改用 `importSession` / `exportSession` 函式
- [ ] 1.4 `import-jsonl.ts`：改用 `importSession` 函式
- [ ] 1.5 移除 `JsonlImporter` class（jsonl-importer.ts）
- [ ] 1.6 移除 `JsonlExporter` class（jsonl-exporter.ts）

### 2. 驗證

- [ ] 2.1 全部測試綠燈
- [ ] 2.2 跑 `session-manager` 確認 import / export 功能正常
