## 1. `packages/jsonl-codec/` — JsonlReader ✅

- [x] 1.1 建立 package 結構、`decodeProjectDir` / `encodeProjectDir`
- [x] 1.2 `JsonlReader`（instance，`readLine` + `extractSessionRecord`）
- [x] 1.3 TDD：assistant 64 筆與 MySQL 一致、user dir:out、isSidechain skip

## 2. `packages/jsonl-codec/` — JsonlWriter ✅

- [x] 2.1 `JsonlWriter`（instance，`writeLine`）
- [x] 2.2 TDD：skip stream_event/control/echo，assistant 64 筆與 JSONL 一致

## 3. JsonlImporter ✅

- [x] 3.1 TDD：`jsonl-importer.test.ts`（in-memory SQLite + b3dbab57 fixture）
- [x] 3.2 實作 `apps/server/src/services/jsonl-importer.ts`

## 4. JsonlExporter TDD（server，in-memory DB + 真實 fixture）

- [ ] 4.1 🔴 寫 `jsonl-exporter.test.ts`：
  - 用 `createTestContainer()` + b3dbab57 MySQL raw_events fixture
  - 先 import session，再 export 到暫存路徑
  - 驗證輸出 JSONL 的 assistant 64 筆 message.content 與原始 JSONL 一致
- [ ] 4.2 🟢 實作 `apps/server/src/services/jsonl-exporter.ts`

## 5. Session Manager CLI

- [x] 5.1 安裝 `@inquirer/prompts`
- [x] 5.2 實作 `SessionScanner`（掃 JSONL + 判斷 import 狀態）
- [ ] 5.3 擴充 `SessionScanner.scanExportable()`：掃 DB sessions，檢查 JSONL 是否存在
- [ ] 5.4 重構 `session-manager.ts`：
  - 加主選單（Import / Export / Exit）
  - Import flow：現有邏輯 + chalk 上色
  - Export flow：列可 export sessions，選擇後呼叫 `JsonlExporter`
  - 加 `chalk` 顏色（yellow=PARTIAL/not imported，gray=IMPORTED/EXPORTED，green=success）

## 6. 驗證

- [ ] 6.1 跑 session-manager import，開 app 確認 session list + history
- [ ] 6.2 跑 session-manager export，確認 JSONL 檔產出且 `claude --resume` 可用

## 7. Wiring

- [ ] 7.1 server start 時掃描 `~/.claude/projects/`，背景執行 import

---

*後續（WS Protocol 搬到 summoner）待驗證完成後再討論。*
