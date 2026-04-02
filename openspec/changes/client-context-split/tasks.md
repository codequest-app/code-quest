## 規則

- Handler 使用 named function（不用 arrow），map 在底部集中宣告
- Effects 也使用 named function
- socket.on/off handler 使用 named function（不用 inline arrow）
- 每步 615 test pass

## 1-11. Handler 抽取 + auto-wiring + effects + named function（已完成）

- [x] 全部完成，詳見 git history

## 12. handlers/ 搬到 contexts/handlers/channel/（已完成）

- [x] 12.1-12.3 搬完 + import 更新
- TabContext / SessionContext 留到之後

## 13. ChannelState 拆分 — 把不屬於 message 的 state 搬到對的 context

ChannelState 目前持有 12 個欄位，其中 accountInfo, experimentGates
屬於 config/global，不屬於 messages。
搬到 ChannelConfigContext 後，對應的 handler 也一起搬。

- [x] 13.1-13.4 accountInfo + experimentGates 搬到 ConfigState + configHandlers
- [x] 13.5 ComposeToolbar 改用 useChannelConfig 取 accountInfo，ReviewUpsellBanner 改用 useChannelConfig 取 experimentGates
- [x] 13.6-13.7 ChannelMessagesValue + ChannelState 移除 accountInfo/experimentGates
- [x] 13.8 typecheck + 615 test pass + inline import 修正

## 14. usageQuota/contextUsage 搬到 ChannelConfigContext

- [x] 14.1 usageQuota, contextUsage 搬到 ConfigState
- [x] 14.2 settings:usage handler + requestUsageUpdate action 搬到 configHandlers
- [x] 14.3 system:rate_limit 拆分：usageQuota 部分 → configHandlers，message 部分留 messagesHandlers
- [x] 14.4 ComposeToolbar 改用 useChannelConfig 取 usageQuota/contextUsage/requestUsageUpdate
- [x] 14.5 typecheck + 615 test pass

## 15. modifiedFiles/planComments 評估

modifiedFiles 和 planComments 目前在 ChannelMessagesContext。
評估是否值得拆成獨立 context（看消費端有多少 component 只用這兩個欄位）。

- [x] 15.1 modifiedFiles 消費端：ChatInputArea（1 個），planComments 消費端：PlanReviewBanner（1 個）
- [x] 15.2 決定：留在 ChannelMessagesContext（消費端太少，不值得拆）

## 16. messagesHandlers 內容整理

handler 搬完後，messagesHandlers.ts 應該只剩真正屬於 message 的 handler。
整理 handler 分組順序和註解。

- [x] 16.1 messagesHandlers 剩 message/stream/session/system/file/plan/notification/raw — 合理（不拆 files/plan context）
- [x] 16.2 handler 按 domain 分組（message → stream → session → system → error → file/plan → notification/raw）+ 分隔註解
- [x] 16.3 streaming helpers 搬到 `handlers/channel/streamingHelpers.ts`
- [x] 16.4 guard 提取為 `handlers/channel/guard.ts` createGuard，所有 context 統一使用
- [x] 16.5 typecheck + 615 test pass

## 17. 清理

- [ ] 17.1 確認最終行數
- [ ] 17.2 biome check + typecheck + 615 test pass
