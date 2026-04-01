## 1. ChannelMessagesContext handler map + auto-wiring

Handler map：`(state, payload) → newState` 純 function，不碰 setState/socket/side effect。
Handler 使用 named function（不用 arrow），map 在底部集中宣告。
Auto-wiring：一個 useEffect loop 統一 on/off + guard + `setState(prev => handler(prev, p))`。
特殊 events（ref/side effect/socket.emit）個別保留在 context。
每步 615 test pass。

- [x] 1.1 新建 `contexts/channel/messagesHandlers.ts`，21 個純 state handler
- [x] 1.2-1.6 所有 handler 一次完成
- [x] 1.7 typecheck + 615 test pass

## 2. ChannelMessagesContext 改用 auto-wiring

- [x] 2.1 import handler map，auto-wiring loop 接線
- [x] 2.2 特殊 events 個別保留：stream:chunk, message:assistant, message:result, stream:end
- [x] 2.3-2.4 side-effect events 個別保留：notifications, raw:event, disconnect
- [x] 2.5 移除 guard + isTierKey + UsageQuota（搬到 handlers）
- [x] 2.6 typecheck + 615 test pass

## 3. ChannelMessagesContext emit handlers 抽出

Actions（send）從 context 搬到 messagesHandlers.ts。
Emit handler：`(emit, setState?) → actions object`。
Context 只負責接線，不定義業務邏輯。

- [x] 3.1 messagesHandlers.ts 新增 `createMessagesActions`，回傳 actions object（17 個 named function）
- [x] 3.2-3.4 所有 actions 一次搬完
- [x] 3.5 ChannelMessagesContext 的 actions useMemo 改用 createMessagesActions
- [x] 3.6 typecheck + 615 test pass

## 4. ChannelControlContext handler map + auto-wiring

- [x] 4.1 新建 `contexts/channel/controlHandlers.ts`：3 個 on handlers + createControlActions（10 個 emit actions）
- [x] 4.2-4.3 on + emit 一次搬完
- [x] 4.4 context 改用 auto-wiring（3 events）+ 個別保留 4 個特殊 events
- [x] 4.5 typecheck + 615 test pass

## 5. ChannelConfigContext handler map + auto-wiring

- [x] 5.1 新建 `contexts/channel/configHandlers.ts`：4 on handlers + createConfigActions（19 emit actions）
- [x] 5.2-5.3 on + emit 一次搬完（session:states 因需 channelId 個別處理）
- [x] 5.4 context 改用 auto-wiring
- [x] 5.5 typecheck + 615 test pass

## 6. ChannelComposeContext handler map + auto-wiring

- [ ] 6.1 新建 `contexts/channel/composeHandlers.ts`：on handler（speech:message）+ createComposeActions（emit）
- [ ] 6.2 context 改用 auto-wiring
- [ ] 6.3 typecheck + 615 test pass

## 7. 清理

- [ ] 7.1 確認所有 context 不再有手動 guard function
- [ ] 7.2 確認行數大幅下降
- [ ] 7.3 biome check + typecheck + 615 test pass
