## Why

Tab 建立流程存在三種不同的 tab 建立路徑（createNewTab、session:created broadcast、syncFromServer），每種使用不同的 key 策略（client UUID vs channelId）。這增加了理解和維護的複雜度，且 onChange callback 同時承擔 channelId/title/status 三種更新職責。正常流程下 session:created handler 永遠被 alreadyExists 擋掉，是無效邏輯。

## What Changes

- **統一 tab key 策略**：消除 tabKey vs channelId 的二元性，所有路徑使用一致的 key 生成策略
- **拆分 onChange callback**：將 channelId 設定、title 更新、status 更新分離為獨立的、語義清楚的 callback
- **簡化 session:created handler**：釐清它在正常流程 vs 外部建立場景的角色，移除永遠為 true 的 alreadyExists 檢查或明確標記其用途

## Capabilities

### New Capabilities

（無新增 capability — 本次是既有功能的重構簡化）

### Modified Capabilities

- `client`: tab 建立流程、TabContext state 管理、ChannelProvider onChange 介面

## Impact

- `apps/web/src/contexts/TabContext.tsx` — createNewTab、setChannelId、onCreated、syncFromServer
- `apps/web/src/contexts/channel/ChannelContext.tsx` — launch mode、onChange callback
- `apps/web/src/components/WorkspaceLayout.tsx` — onChange handler、tab rendering
- `apps/web/src/test/render-with-workspace.tsx` — test helper 需同步調整
- 所有使用 `renderWithWorkspace` 的測試檔案（約 21 個）可能受影響
