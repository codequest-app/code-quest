## 現有狀態（已完成）
- `JsonlDecoder`（原 JsonlReader）：純轉換，JSONL lines → RawEvent ✅
- `JsonlEncoder`（原 JsonlWriter）：純轉換，RawEvent → JSONL line ✅
- `abstract JsonlReader extends` / `MemoryJsonlReader`：暫時實作，待重構 ⚠️
- `abstract JsonlWriter extends` / `MemoryJsonlWriter`：暫時實作，待重構 ⚠️
- `JsonlImporter extends JsonlReader`：暫時實作，有 currentPath smell ⚠️
- `JsonlExporter extends JsonlWriter`：暫時實作，有 currentSession smell ⚠️
- `session-manager` CLI：功能完整 ✅
- 所有測試通過 ✅

## 重構目標：Source / Sink 架構

### 1. `packages/jsonl-codec/` — 定義 interface + 實作

- [ ] 1.1 定義 `SessionData = { events: RawEvent[], record: JsonlSessionRecord }`
- [ ] 1.2 定義 `SessionSource` interface：`read(sessionId: string): Promise<SessionData>`
- [ ] 1.3 定義 `SessionSink` interface：`write(sessionId: string, data: SessionData): Promise<void>`
- [ ] 1.4 🔴 寫 `MemoryReader` 測試 → 🟢 實作 `MemoryReader implements SessionSource`
- [ ] 1.5 🔴 寫 `MemoryWriter` 測試 → 🟢 實作 `MemoryWriter implements SessionSink`
- [ ] 1.6 移除暫時的 `abstract JsonlReader` / `abstract JsonlWriter`（reader.ts, writer.ts）
- [ ] 1.7 更新 index.ts export

### 2. `packages/jsonl-codec/` — JsonlReader / JsonlWriter

- [ ] 2.1 🔴 寫 `JsonlReader` 測試（讀 JSONL 檔 → SessionData）
- [ ] 2.2 🟢 實作 `JsonlReader implements SessionSource`：constructor(jsonlPath)，用 JsonlDecoder
- [ ] 2.3 🔴 寫 `JsonlWriter` 測試（SessionData → 寫 JSONL 檔）
- [ ] 2.4 🟢 實作 `JsonlWriter implements SessionSink`：constructor(outputPath)，用 JsonlEncoder

### 3. `apps/server/` — DbReader / DbWriter

- [ ] 3.1 🔴 寫 `DbReader` 測試（in-memory SQLite + fixture）
- [ ] 3.2 🟢 實作 `DbReader implements SessionSource`：rawEventService + sessionStore → SessionData
- [ ] 3.3 🔴 寫 `DbWriter` 測試
- [ ] 3.4 🟢 實作 `DbWriter implements SessionSink`：SessionData → rawEventService + sessionStore

### 4. `apps/server/` — 組合 importSession / exportSession

- [ ] 4.1 移除 `JsonlImporter` / `JsonlExporter`（或重構為純組合函式）
- [ ] 4.2 實作 `importSession(jsonlPath)` = `JsonlReader(jsonlPath).read()` → `DbWriter.write()`
- [ ] 4.3 實作 `exportSession(sessionId, outputPath)` = `DbReader.read()` → `JsonlWriter(outputPath).write()`
- [ ] 4.4 更新 `session-manager.ts` / `import-jsonl.ts` 使用新 API
- [ ] 4.5 更新相關測試

### 5. 驗證

- [ ] 5.1 全部測試綠燈
- [ ] 5.2 跑 session-manager 確認 import / export 功能正常
