## Tasks

每步改完跑全部 test 確認 expect 不變。先改 production code 再搬 test。

### Phase 1: Generic types 整理

- [x] 1. `types.ts` 合併 `provider-adapter.ts` 的 generic types（ProviderAdapter, AdapterOutput, ServerAction, SocketEvent re-export），ProviderAdapter 泛型化 `<E, L>`
- [x] 2. `LaunchOptions` 搬到 `claude/launch-options.ts`（新建 claude/ 資料夾），ProcessRunner.args 改 unknown
- [x] 3. 移除 `ProtocolEvent` 從 public API，server 改用 unknown，內部定義留到 transforms 拆完再刪
- [x] 4. 刪除 `protocol/provider-adapter.ts`，更新所有 import

- [x] 4.5. 移除 summoner 的 SocketEvent re-export，server 改從 @code-quest/shared import

### Phase 2: 檔案搬移 + 重命名

- [x] 5. `process-runner.ts` → `runner.ts`
- [x] 6. `child-process-provider.ts` → `transports/child-process.ts`
- [x] 7. `protocol/claude-schemas.ts` → `claude/schemas.ts`
- [x] 8. `protocol/claude-protocol.ts` → `claude/protocol.ts`

### Phase 3: claude-adapter 拆 transforms

- [x] 9. 建立 `claude/transforms/system.ts` — 提取 convertSystemEvent（16 subtypes）
- [x] 10-14. 建立 assistant, user, result, control, stream transforms
- [x] 15. `protocol/claude-adapter.ts` → `claude/adapter.ts`
- [x] 16. 建立 `claude/index.ts` barrel export

### Phase 4: Barrel + Test 搬移

- [x] 17. 更新 `index.ts` barrel export 路徑
- [x] 18. 搬移 test 檔案到對應位置，更新 import path
- [x] 19. 確認 server 397 + client 615 + summoner 266 全部通過

### Phase 5: Skill + Cleanup

- [ ] 20. 新增 summoner-structure skill（記錄資料夾結構和命名慣例）
- [ ] 21. 刪除舊的 `protocol/` 資料夾和空檔案
- [ ] 22. 最終全量 test + typecheck + lint
