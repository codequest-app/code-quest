# Tasks: fix-session-init-parse

## 已完成
- [x] Task 1: zod .parse() consistent + session:init schema fix
- [x] Task 2: code review + cleanup
- [x] Task 3: fork session parentId test
- [x] Task 4: channelManager.create() wait for session:init before return
- [x] Task 5: dotenv/config auto-load

## 結構重構：消除 channel-hooks + 整體架構改善

### Phase 1: Channel 只管狀態，hooks 移回 ChatHandler

- [x] Task 6: Channel.wireRunner 只保留 state update + event forward
  - wireRunner 裡的 state update（sessionId、sessionState、metaCache）留在 Channel ✅
  - hooks.onSocketEvent 呼叫改為 Channel 自己 forward runner events → ChatHandler listen
  - hooks.onServerAction / hooks.onExit 同理
  - **TDD 注意**: 所有 chat-handler-*.test.ts 的 expect 不變，只改內部接線方式
  - **FakeClaude**: 用 claude.send / claude.emit，不用 claude.socket.emit

- [x] Task 7: 把 onSocketEvent 的 business logic 移到 ChatHandler
  - session:init → broadcastSessionState('busy') + persist
  - message:result → broadcastSessionState('idle') + generate title
  - system:rate_limit → usageTracker.update
  - system:file_updated → emitToSession
  - control:cancel/permission/elicitation/diff_review/mcp → routing
  - **TDD 注意**: 逐一搬移，每搬一個 case 跑一次測試

- [x] Task 8: onServerAction + onExit 移到 ChatHandler
  - auto_respond（get_settings、set_model、set_permission_mode）
  - read_diff、forward_to_client
  - onExit → broadcastSessionState('exited') + resetSessionState + emitToSession
  - **TDD 注意**: expect 不變

- [x] Task 9: 刪除 hooks/ 目錄和 channel-hooks.ts
  - WireRunnerHooks interface 移除
  - buildChannelHooks 不再需要
  - **TDD 注意**: 編譯通過 + 所有測試通過

### Phase 2: session-handler.ts 拆分

- [x] Task 10: 拆分 session-handler.ts（456 行）
  - session-lifecycle.ts: launch / join / close / resume（~200 行）
  - session-crud.ts: list / list_remote / get / raw_events / rename / delete / update_state / generate_title（~150 行）
  - session-fork.ts: fork / teleport（~100 行）
  - session-handler.ts 變成 barrel — import + register 三個子模組
  - **TDD 注意**: 純搬移不改邏輯，每搬一個檔案跑測試，expect 不變
  - **最後**: code review + refactor + cleanup

### Phase 3: DRY + 架構改善

- [x] Task 11: handler wrapper factory（DRY try-catch）
  - 抽出 `wrapHandler(schema, handler)` 統一 parse + try-catch + callback
  - 每個 handler 改用 wrapper
  - **TDD 注意**: expect 不變，只改結構

- [x] Task 12: CompositeStore 告警 + retry
  - partial failure 加 console.error（已做）
  - 加 retry 機制（最多 3 次）
  - 加 health check — 啟動時測試所有 store 可寫
  - **TDD 注意**: 新增 composite store 測試

### Phase 4: Production readiness

- [x] Task 13: 結構化 logging（pino）
  - 替換所有 console.log/warn/error → logger.info/warn/error
  - request context（channelId、sessionId）自動注入
  - **TDD 注意**: mock logger 驗證 log 呼叫

- [x] Task 14: Socket disconnect cleanup
  - socketChannelsMap cleanup on disconnect
  - pluginCache TTL
  - cachedModels invalidation

- [x] Task 15: Rate limiting (skipped — self-hosted app, not needed)
  - Socket event rate limit（per socket per event type）
  - REST route rate limit
  - **TDD 注意**: 新增 rate limit 測試

### Final code review 重構

P1:
- [x] Task 16: broadcastSessionState 抽 pickDefined helper（42 行 → ~20 行）
- [x] Task 17: SessionState 移除 index signature，加 pendingTitlePrompt 欄位
- [x] Task 18: session:launch 抽 sub-steps（111 行 → ~40 行 + helpers）
- [x] Task 19: session persist 抽 persistNewSession helper（DRY fork/launch）
- [x] Task 20: bin/server.ts error handler as cast → type guard

P2:
- [x] Task 21: get_settings then/catch fallback DRY
- [x] Task 22: composite delete 加 partial failure log
- [x] Task 23: 確認 getFirstAlive 是否 dead code
- [x] Task 24: fork events → parentEvents 命名
- [x] Task 25: final cleanup（空 catch 加 logger.debug）
