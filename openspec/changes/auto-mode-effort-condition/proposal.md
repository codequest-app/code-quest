## Why

Auto mode 讓 model 自主選擇 permission，這需要 extended thinking（`xhigh` effort）。目前 server 在廣播 `app:models` 時，`supportsAutoMode` flag 只看 model 本身的能力，沒有考慮當前 effort level — 導致 effort 不是 `xhigh` 時 Auto mode 仍然顯示（但實際上無法正常運作）。

## What Changes

- Server 在計算 `supportsAutoMode` 時，額外檢查當前 effort level
- 當 effort 不是 `xhigh` 時，即使 model 本身支援 auto mode，`supportsAutoMode` 也應為 `false`
- Client 維持現有邏輯不變（只讀 `supportsAutoMode` flag，不自己判斷 effort）

## Capabilities

### New Capabilities

### Modified Capabilities
- `protocol`: `app:models` 廣播的 `supportsAutoMode` 計算規則加入 effort 條件

## Impact

- `packages/summoner/src/claude/adapter.ts` — `supportsAutoMode` 計算邏輯
- `packages/server/src/socket/handlers/` — 廣播 `app:models` 時帶入當前 effort
- 相關測試需補充 effort 條件的 case
