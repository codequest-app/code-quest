## Why

Raw Event Panel 串流時 delta 事件量極大（content_block_delta），淹沒其他有意義的事件，難以除錯。目前的 type filter 是單選 select，無法同時排除多種 type。也缺少 auto-scroll 控制和事件計數。

## What Changes

- 將 type filter 從 select 單選改為 **多選 tag toggle**，點擊 type tag 切換顯示/隱藏
- 每個 type tag 旁顯示 **event 計數**
- **預設隱藏** 名稱含 `delta` 的 event type（如 `content_block_delta`）
- 新增 **auto-scroll toggle**：串流時自動滾到底部，可暫停查看歷史

## Capabilities

### New Capabilities
- `raw-event-filter`: 多選 type filter（tag toggle + 計數 + 預設隱藏 delta）與 auto-scroll toggle

### Modified Capabilities

## Impact

- `packages/client/src/components/RawEventPanel.tsx` — 主要變更檔案
- 移除現有 `<select>` filter，改為 tag-based multi-select
- 無 API / schema 變更
