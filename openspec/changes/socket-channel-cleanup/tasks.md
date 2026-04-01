## Tasks

每步改完跑 test 確認 expect 不變。

### Phase 1: schemas.ts 獨立

- [x] 1. 建 socket/schemas.ts，從 channel.ts 搬入 7 個 payload schemas + SessionState + RequestMeta
- [x] 2. channel.ts import from schemas.ts，刪除搬走的 code
- [x] 3. 更新所有 import SessionState / RequestMeta 的檔案
- [x] 4. 跑全部 test

### Phase 2: types.ts 擴充

- [x] 5. WireRunnerHooks + PendingRequest 從 channel.ts 搬到 types.ts
- [x] 6. pickDefined 從 server.ts 搬到 types.ts
- [x] 7. 提取 SessionBroadcastState type alias（消除 inline union 重複）
- [x] 8. MCP_MESSAGE_TIMEOUT + jsonRpcError 從 server.ts 搬到 schemas.ts
- [x] 9. 跑全部 test

### Phase 3: channel.ts 整理

- [x] 10. 屬性分組（state / processing / sockets / control / meta）
- [x] 11. 清過時 comment（line 18-20）
- [x] 12. 重複 conditional spread 用 pickDefined（buildSessionInitPayload + wireRunner updateMetaCache）
- [x] 13. _runnerListeners → named interface（RunnerListeners in types.ts）
- [x] 14. 跑全部 test

### Phase 4: channel-manager.ts 整理

- [x] 15. 提取 CreateChannelOptions interface
- [x] 16. 跑全部 test

### Phase 5: Cleanup

- [x] 17. Code review 最終檢查
- [x] 18. 最終全量 test + typecheck

### Phase 6: handler 雙向化 + HandlerContext 瘦身

每個 handler 同時做三件事：
1. 搬入 buildChannelHooks 對應邏輯（export onRunnerEvent / onServerAction / onExit）
2. handler 內的 delegate 呼叫改成直接用 ctx.channelManager / ctx.io
3. 同步更新 context.ts interface

每步改完跑 test。

- [x] 19. message.ts — 搬入 `message:result`（endProcessing + title generation）；移除 requireRunner 改用 channelManager.get()?.runner
- [x] 20. session/lifecycle.ts — 搬入 `session:init` → broadcastSessionState('busy') + onExit；移除 resolveSessionId / getSessionHistory / getPendingReplayEvents 改直接用 channelManager
- [x] 21. file.ts — 搬入 `system:file_updated` → emit file:updated；搬入 `read_diff` server action
- [x] 22. mcp.ts — 搬入 `control:mcp`（timeout + relay + jsonRpcError）
- [x] 23. settings.ts — 搬入 `auto_respond`（get_settings / set_model / set_permission_mode）
- [x] 24. 新建 handlers/control.ts — 搬入 `control:cancel/permission/elicitation/diff_review` + `forward_to_client`
- [x] 25. 新建 handlers/usage.ts — 搬入 `system:rate_limit` → usageTracker.update
- [x] 26. 跑全部 test
- [x] 27. server.ts buildChannelHooks 改為純 dispatch（已在 task 24-25 同步完成）

### Phase 7: SocketServer 瘦身

- [x] 28. 移除 delegate methods（resolveSessionId / getSessionHistory / getPendingReplayEvents / requireRunner / sendNotification）+ 更新 handler 呼叫端 + 更新 context.ts interface
- [x] 29. broadcastSessionState / emitToSession / addSocketToChannel 保留（有實際邏輯，不是純 delegate）
- [x] 30. 跑全部 test + typecheck

### Phase 8: 重構 test

- [ ] 31. 檢視所有 test，更新因重構需要調整的 import / mock
- [ ] 32. 最終全量 test + typecheck
