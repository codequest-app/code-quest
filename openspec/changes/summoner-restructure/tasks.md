## Tasks

每步改完跑全部 test 確認 expect 不變。先改 production code 再搬 test。

### Phase 1: Generic types 整理

- [x] 1. `types.ts` 合併 `provider-adapter.ts` 的 generic types（ProviderAdapter, AdapterOutput, ServerAction, SocketEvent re-export），ProviderAdapter 泛型化 `<E, L>`
- [ ] 2. `LaunchOptions` 和 `ParseResult` 搬到 `claude/protocol.ts`（新建 claude/ 資料夾）
- [ ] 3. 移除 `ProtocolEvent` union type，各處改用 zod schema infer 或 `unknown`
- [ ] 4. 刪除 `protocol/provider-adapter.ts`，更新所有 import

### Phase 2: 檔案搬移 + 重命名

- [ ] 5. `process-runner.ts` → `runner.ts`，泛型化移除 claude import
- [ ] 6. `child-process-provider.ts` → `transports/child-process.ts`
- [ ] 7. `protocol/claude-schemas.ts` → `claude/schemas.ts`
- [ ] 8. `protocol/claude-protocol.ts` → `claude/protocol.ts`（合併 step 2 的 LaunchOptions/ParseResult）

### Phase 3: claude-adapter 拆 transforms

- [ ] 9. 建立 `claude/transforms/system.ts` — 提取 convertSystemEvent（16 subtypes）
- [ ] 10. 建立 `claude/transforms/assistant.ts` — 提取 convertAssistantEvent
- [ ] 11. 建立 `claude/transforms/user.ts` — 提取 convertUserEvent
- [ ] 12. 建立 `claude/transforms/result.ts` — 提取 convertResultEvent
- [ ] 13. 建立 `claude/transforms/control.ts` — 提取 convertControlRequest（15+ subtypes）
- [ ] 14. 建立 `claude/transforms/stream.ts` — 提取 convertStreamEvent
- [ ] 15. `protocol/claude-adapter.ts` → `claude/adapter.ts`（只留 dispatch + public methods）
- [ ] 16. 建立 `claude/index.ts` barrel export

### Phase 4: Barrel + Test 搬移

- [ ] 17. 更新 `index.ts` barrel export 路徑
- [ ] 18. 搬移 test 檔案到對應位置，更新 import path
- [ ] 19. 確認 server + client package 的 test 全部通過

### Phase 5: Skill + Cleanup

- [ ] 20. 新增 summoner-structure skill（記錄資料夾結構和命名慣例）
- [ ] 21. 刪除舊的 `protocol/` 資料夾和空檔案
- [ ] 22. 最終全量 test + typecheck + lint
