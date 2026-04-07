## Context

RawEventPanel 目前用 `<select>` 做 type 單選 filter，無法同時排除多種 type。串流時 delta 事件量大且無 auto-scroll 控制。

## Goals / Non-Goals

**Goals:**
- 多選 type filter：tag toggle 切換顯示/隱藏，每個 tag 顯示計數
- 預設隱藏含 `delta` 的 event type
- Auto-scroll toggle：串流時自動滾底，可暫停

**Non-Goals:**
- 不改 RawEventPanel 的 props interface（onFetch / onSubscribe / onClose 不變）
- 不做 event 持久化或 export

## Decisions

1. **Tag toggle 取代 select** — 用 Set<string> 記錄 `hiddenTypes`，點 tag 切換 add/delete。比 select 多選更直觀。
2. **預設隱藏邏輯** — 初次收到新 type 時，若 type 名稱含 `delta`（case-insensitive），自動加入 hiddenTypes。用戶可手動 toggle 顯示。
3. **Auto-scroll** — 用 boolean state + ref。開啟時新事件觸發 `scrollIntoView`，關閉時停止。預設開啟。用戶手動往上滾時自動關閉，點按鈕重新開啟。
4. **計數** — 從 events 陣列即時計算，不另存 Map。事件量在千級，效能可接受。

## Risks / Trade-offs

- 全域 `*` scrollbar 已套用，tag 列如果 type 很多需要水平滾動，但實務上 type 種類 < 20，不太會發生。
