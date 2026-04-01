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
