## 1-6. (completed - see git history)

## 7. Code Review 修復

### Client
- [x] 7.1 WorkspaceLayout: `BUSY_STATES` Set 改成 `s.state === 'busy'`
- [x] 7.2 MentionDropdown: `onHover ?? (() => {})` 改成 module-level `noop`

### Server
- [x] 7.3 channel-emitter: `sock.emit as` cast 定義更精確的 emit type
- [x] 7.4 message.ts: `message:result` 兩個 handler 合併或改用不同事件
- [x] 7.5 message.ts: `response.behavior`/`response.updatedInput` 加 zod 驗證
- [x] 7.6 session/query.ts: `handleRawEvents` JSON 回傳定義統一 schema
- [x] 7.7 settings.ts: `contextUsage` 加 zod schema
- [x] 7.8 config.ts: `envBool()` 簡化

### Summoner
- [x] 7.9 git/local.ts: `err as { ... }` 改成 `instanceof GitResponseError`
- [x] 7.10 git/local.ts: `createWorktree` 拆分為 `isExistingWorktree` + `addWorktree`
- [x] 7.11 git/local.ts: `listWorktrees` 提取 `parseWorktreeList`
- [x] 7.12 test/fake-claude.ts: `as string` cast → type narrowing (String/typeof/Array.isArray)
- [x] 7.13 test/fake-socket.ts: `(wrapped as any)._original` 改 WeakMap

## 8. Provider 清理

- [x] 8.1 移除 GitContext（dead code，0 consumer）+ ChannelContext 的 GitProvider wrapper
- ~~8.2 SessionContext Auth 拆分~~ — revert，只有 1 consumer 不需要 Provider
- [x] 8.3 ~~ProjectContext 不應依賴 useSession~~ — 不需要改
