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

- [ ] 15.1 盤點 modifiedFiles/planComments 的消費端
- [ ] 15.2 決定是否拆出（如果消費端少就留著）
- [ ] 15.3 如果拆：建立 ChannelFilesContext + 搬 handler
- [ ] 15.4 typecheck + 615 test pass

## 16. messagesHandlers 內容整理

handler 搬完後，messagesHandlers.ts 應該只剩真正屬於 message 的 handler。
整理 handler 分組順序和註解。

- [ ] 16.1 確認 messagesHandlers 只剩 message/stream/session domain 的 handler
- [ ] 16.2 整理 handler 順序：message → stream → session → system（留下的）→ effects
- [ ] 16.3 streaming helper（streamingRemovePlaceholder 等）從 ChannelMessagesContext 頂層搬到 handler 或獨立檔案
- [ ] 16.4 guard 重複 5 次 → 提取 createGuard utility
- [ ] 16.5 typecheck + 615 test pass

## 17. 清理

- [ ] 17.1 確認最終行數
- [ ] 17.2 biome check + typecheck + 615 test pass
