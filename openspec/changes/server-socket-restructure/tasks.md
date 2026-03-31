## Tasks

每步改完跑全部 test 確認 expect 不變。先改 production code 再更新 test import。

### Phase 1: Handler 檔名去 `-handler` 後綴

- [x] 1. `connection-handler.ts` → `connection.ts`
- [x] 2. `message-handler.ts` → `message.ts`
- [x] 3. `settings-handler.ts` → `settings.ts`
- [x] 4. `file-handler.ts` → `file.ts`
- [x] 5. `git-handler.ts` → `git.ts`
- [x] 6. `terminal-handler.ts` → `terminal.ts`
- [x] 7. `mcp-handler.ts` → `mcp.ts`
- [x] 8. `plan-handler.ts` → `plan.ts`
- [x] 9. `speech-handler.ts` → `speech.ts`
- [x] 10. `auth-handler.ts` → `auth.ts`（暫留 handlers/，Phase 4 再搬）
- [x] 11. `plugin-handler.ts` → `plugin.ts`（暫留 handlers/，Phase 4 再搬）
- [x] 12. 更新 chat-handler.ts 的 import paths
- [x] 13. 跑全部 test 確認通過

### Phase 2: helpers.ts 拆散

- [x] 14. `persistNewSession` + `DEFAULT_THINKING_TOKENS` 搬到 `session-lifecycle.ts`
- [x] 15. `execGit` 搬到 `git.ts`（session-fork import from git.ts）
- [x] 16. `runPluginCommand*` 搬到 `plugin.ts`
- [x] 17. `rg*` 搬到 `file.ts`
- [x] 18. 刪除 `helpers.ts`
- [x] 19. 跑全部 test 確認通過

### Phase 3: session/ 資料夾

- [x] 20. 建立 `handlers/session/` 資料夾
- [x] 21. `session-handler.ts` 拆成 `session/management.ts`（CRUD + management）+ `session/index.ts`（barrel register）
- [x] 22. `session-lifecycle.ts` → `session/lifecycle.ts`
- [x] 23. `session-fork.ts` → `session/fork.ts`
- [x] 24. 刪除舊的 session-handler.ts, session-lifecycle.ts, session-fork.ts
- [x] 25. 跑全部 test 確認通過

### Phase 4: Claude-specific 搬到 claude/

- [x] 26. 建立 `socket/claude/` 資料夾
- [x] 27. `handlers/auth.ts` → `claude/auth.ts`
- [x] 28. `handlers/plugin.ts` → `claude/plugin.ts`
- [x] 29. 從 `handlers/mcp.ts` 提取 chrome/jupyter handlers → `claude/mcp-servers.ts`
- [x] 30. `handlers/mcp.ts` 瘦身（只留 generic MCP operations）
- [x] 31. 更新 chat-handler.ts 的 import paths + handleConnection 註冊
- [x] 32. 跑全部 test 確認通過

### Phase 5: chat-handler.ts → server.ts

- [x] 33. `chat-handler.ts` → `server.ts`
- [x] 34. class `ChatHandler` → `SocketServer`
- [x] 35. 更新 DI binding（container.ts, types.ts symbol）
- [x] 36. 更新所有 test import
- [x] 37. 跑全部 test 確認通過

### Phase 6: handler-context.ts → types.ts + context.ts

- [x] 38. 提取 `TypedSocket`, `TypedServer`, `errMsg`, `ensureChannel` → `types.ts`
- [x] 39. `HandlerContext` interface + `PluginCacheEntry` → `context.ts`
- [x] 40. 刪除 `handler-context.ts`
- [x] 41. 更新所有 import
- [x] 42. 跑全部 test 確認通過

### Phase 7: HandlerContext 瘦身

- [ ] 43. 從 HandlerContext 移除 `chromeMcpState` → claude/ 專屬 state
- [ ] 44. 從 HandlerContext 移除 `pluginCache` + `PLUGIN_CACHE_TTL` → claude/ 專屬 state
- [ ] 45. 跑全部 test 確認通過

### Phase 8: Code review + Refactor + Cleanup

- [ ] 46. Code review：檢查所有搬移後的檔案，找出 interface/inline type 該改 zod 的
- [ ] 47. Refactor：執行 code review 發現的改進
- [ ] 48. 更新 server-socket-structure skill
- [ ] 49. 最終全量 test + typecheck + lint
- [ ] 50. 確認 server + client test 數量不變
