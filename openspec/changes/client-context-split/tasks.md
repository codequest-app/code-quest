## 規則

- Handler 使用 named function（不用 arrow），map 在底部集中宣告
- Effects 也使用 named function
- socket.on/off handler 使用 named function（不用 inline arrow）
- 每步 615 test pass

## 1-17. Handler 抽取 + state 拆分 + 整理（已完成）

- [x] 全部完成，詳見 git history

## 18. 提取 auto-wiring utility

4 個 context 重複 ~15 行相同的 socket.on/off + guard + cleanup loop。
提取到 guard.ts 或獨立 utility。

- [x] 18.1 wireHandlers function（支援 state handlers + effects + beforeUpdate + skipGuard）
- [x] 18.2 ChannelMessagesContext 改用 wireHandlers（~30 行 → 8 行）
- [x] 18.3 ChannelControlContext 留到 23 統一 full state 後再改
- [x] 18.4 ChannelConfigContext 改用 wireHandlers（~20 行 → 3 行）
- [x] 18.5 ChannelComposeContext 改用 wireHandlers（~15 行 → 3 行）
- [x] 18.6 typecheck + 615 test pass

## 19. 消除 stream:chunk 和 message:assistant 的重複 helper

兩個 useEffect 各自定義 removePlaceholder, appendOrCreateText — 完全相同。
提到 useEffect 外面共享。

- [x] 19.1-19.2 stream:chunk + stream:end + message:assistant 合成一個 useEffect，共用 streaming helpers
- [x] 19.3 typecheck + 615 test pass

## 20. ControlContext 提取 addControlAndMessage helper

control:permission 和 control:hook_callback 邏輯幾乎一樣。
提取共用 function。

- [x] 20.1-20.2 addControlAndMessage helper，permission + hook_callback 合成一個 useEffect
- [x] 20.3 typecheck + 615 test pass

## 21. messagesHandlers 提取 addMessage helper

- [x] 21.1 addMessage(state, msgFields) helper
- [x] 21.2 6 個 simple handler 改用（streamText, streamToolSummary, hookStarted, taskStarted, errorMessage, notificationShow）
- [x] 21.3 typecheck + 615 test pass

## 22. configHandlers onSettingsUpdate 簡化

9 個 `if (payload.X !== undefined) update.X = payload.X` 重複 pattern。

- [x] 22.1 SETTINGS_KEY_MAP + loop 取代 9 個 if-check
- [x] 22.2 typecheck + 615 test pass

## 23. controlHandlers 統一回傳 full state

- [x] 23.1 controlHandlers 改回傳 full ControlState（`...state` spread）
- [x] 23.2 ChannelControlContext 改用 wireHandlers + composite setState wrapper
- [x] 23.3 typecheck + 615 test pass

## 24. 清理

- [x] 24.1 615 test pass — 全部完成
