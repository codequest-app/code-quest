## 1. ChannelMessagesContext handler map + auto-wiring

Handler map：`(state, payload) → newState` 純 function，不碰 setState/socket/side effect。
Auto-wiring：一個 useEffect loop 統一 on/off + guard + `setState(prev => handler(prev, p))`。
特殊 events（ref/side effect/socket.emit）個別保留在 context。
每步 615 test pass。

- [x] 1.1 新建 `contexts/channel/messagesHandlers.ts`，21 個純 state handler
- [x] 1.2-1.6 所有 handler 一次完成
- [x] 1.7 typecheck + 615 test pass

## 2. ChannelMessagesContext 改用 auto-wiring

- [ ] 2.1 import handler map，auto-wiring loop 接線
- [ ] 2.2 特殊 events 個別保留：stream:chunk（ref）、message:assistant（ref）、message:result（dequeue + socket.emit）、stream:end（只做 resetRef）
- [ ] 2.3 side-effect events 個別保留：notification:toast, notification:auth_url, action:open_url, action:open_file
- [ ] 2.4 混合 events 的 side effect 部分個別保留：notification:show（toast）、disconnect（toast）、raw:event（toast + socket.emit）
- [ ] 2.5 移除 guard function + 舊的 socket.on/off 區塊
- [ ] 2.6 typecheck + 615 test pass

## 3. ChannelControlContext handler map + auto-wiring

- [ ] 3.1 新建 `contexts/channel/controlHandlers.ts`
- [ ] 3.2 搬入純 state events：control:permission, control:elicitation, control:diff_review, control:hook_callback, chat:cancel_request, session:closed
- [ ] 3.3 context 改用 auto-wiring + 個別保留 control:mcp（side effect: auto-respond）
- [ ] 3.4 typecheck + 615 test pass

## 4. ChannelConfigContext handler map + auto-wiring

- [ ] 4.1 新建 `contexts/channel/configHandlers.ts`
- [ ] 4.2 搬入純 state events：settings:update, session:states, session:init, session:status, app:models
- [ ] 4.3 context 改用 auto-wiring
- [ ] 4.4 typecheck + 615 test pass

## 5. ChannelComposeContext handler map + auto-wiring

- [ ] 5.1 新建 `contexts/channel/composeHandlers.ts`（speech:message 1 個）
- [ ] 5.2 context 改用 auto-wiring
- [ ] 5.3 typecheck + 615 test pass

## 6. 清理

- [ ] 6.1 確認所有 context 不再有手動 guard function
- [ ] 6.2 確認行數大幅下降
- [ ] 6.3 biome check + typecheck + 615 test pass
