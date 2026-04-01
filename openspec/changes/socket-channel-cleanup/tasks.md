## Tasks

每步改完跑 test 確認 expect 不變。

### Phase 1: schemas.ts 獨立

- [ ] 1. 建 socket/schemas.ts，從 channel.ts 搬入 7 個 payload schemas + SessionState + RequestMeta
- [ ] 2. channel.ts import from schemas.ts，刪除搬走的 code
- [ ] 3. 更新所有 import SessionState / RequestMeta 的檔案
- [ ] 4. 跑全部 test

### Phase 2: types.ts 擴充

- [ ] 5. WireRunnerHooks + PendingRequest 從 channel.ts 搬到 types.ts
- [ ] 6. pickDefined 從 server.ts 搬到 types.ts
- [ ] 7. 提取 SessionBroadcastState type alias（消除 inline union 重複）
- [ ] 8. MCP_MESSAGE_TIMEOUT + jsonRpcError 從 server.ts 搬到獨立模組或 mcp 相關
- [ ] 9. 跑全部 test

### Phase 3: channel.ts 整理

- [ ] 10. 屬性分組（state / processing / sockets / control / meta）
- [ ] 11. 清過時 comment（line 18-20）
- [ ] 12. 重複 conditional spread 用 pickDefined（buildSessionInitPayload + wireRunner updateMetaCache）
- [ ] 13. _runnerListeners → named interface
- [ ] 14. 跑全部 test

### Phase 4: channel-manager.ts 整理

- [ ] 15. 提取 CreateChannelOptions interface
- [ ] 16. 跑全部 test

### Phase 5: Cleanup

- [ ] 17. Code review 最終檢查
- [ ] 18. 最終全量 test + typecheck
