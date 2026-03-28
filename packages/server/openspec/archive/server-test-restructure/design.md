## Context

Server test files 已部分拆分（session、settings、control、mcp、misc），但原始 `chat-handler.test.ts`（1371 行、78 tests）未清理，與拆分後的檔案大量重複。

## Goals / Non-Goals

**Goals:**
- 消除 test 重複（同一行為不應測兩次）
- `chat-handler.test.ts` 中 unique tests 搬到對應 handler test files
- 刪除 `chat-handler.test.ts`
- 356 tests baseline 不變

**Non-Goals:**
- 不改產品程式碼
- 不加新 tests（除非搬移時發現 gap）
- 不改 test 的 expect 邏輯

## Decisions

### 1. 按 handler 分類，不新建檔案

已有 5 個拆分檔案（session、settings、control、mcp、misc）。`chat-handler.test.ts` 的 tests 全部歸入這 5 個。如果有 test 不屬於任何一個（如 message pipeline、plan comments），歸入 `chat-handler-misc.test.ts`。

**Rationale**: 減少檔案數，避免過度拆分。如果 misc 太大可以再拆。

### 2. 重複 test 以拆分版為準

當 `chat-handler.test.ts` 和拆分檔案有重複覆蓋時，保留拆分版（通常更精確），刪除原始版。

### 3. 搬移順序：先標記再搬

先在 `chat-handler.test.ts` 標記每個 test 歸屬（session/settings/control/misc），確認無遺漏後再批次搬移。

## Risks / Trade-offs

- **[風險] 搬移時遺漏 unique test** → 搬移前後比對 test count（356 baseline）
- **[風險] setup() helper 差異** → 各拆分檔案可能用不同 setup，搬移時需確認 helper 相容
