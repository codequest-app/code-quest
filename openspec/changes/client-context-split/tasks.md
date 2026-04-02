## 規則

- Handler 使用 named function（不用 arrow），map 在底部集中宣告
- Client handler 分類對齊 server handler
- 每步 615 test pass
- 用現有測試保護重構

## 1-24. 前期重構（已完成）

- [x] 詳見 git history

## 25. Client handler 按 server handler 分類重組

現在 messagesHandlers.ts 混了 message/stream/system/error/file/plan/notification/raw。
按 server handler 分類拆開，每個 handler 是一個 factory function 回傳 { on, effects?, actions? }。

- [x] 25.1 messageHandler.ts（on: message:user, stream:text, stream:tool_summary + actions: sendMessage, abort, kill）
- [x] 25.2 sessionHandler.ts（on: session:status, disconnect + actions: fetchRawEvents, subscribeRawEvents, forkSession, rewindToMessage）
- [x] 25.3 systemHandler.ts（on: compact_boundary, hook_started, hook_response, task_started, api_retry, rate_limit, error:message）
- [x] 25.4 notificationHandler.ts（on: notification:show, raw:event + effects: toast, auth_url, open_url, open_file, show, raw:event, disconnect）
- [x] 25.5 fileHandler.ts（on: file:updated + actions: searchFiles, getTerminalContents, openClaudeTerminal）
- [x] 25.6 planHandler.ts（on: plan:comment_added/removed + actions: addPlanComment, clearPlanComments）
- [x] 25.7 controlHandlers.ts → permissionHandler.ts
- [x] 25.8 configHandlers.ts → settingsHandler.ts
- [x] 25.9 composeHandlers.ts → speechHandler.ts
- [x] 25.10 刪除 messagesHandlers.ts，ChannelMessagesContext 改用新 handler maps
- [x] 25.11 actions 歸位（message/session/file/plan 各自的 createXxxActions）
- [x] typecheck + 615 test pass

## 26. 最終確認

- [x] 26.1 client handler 對齊 server handler 命名
- [ ] 26.2 確認行數
- [ ] 26.3 biome check + typecheck + 615 test pass
