# Tasks: resume-session-overlay

## Server 端

- [x] Task 1: `session:list` 加 cwd 過濾參數
- [x] Task 2: `session:launch` 支援 `resume` 參數（已有，確認行為正確）

## Client 端

- [x] Task 3: 相對日期 util
- [x] Task 4: 簡化 SessionRow — title + 相對日期 + hover actions
- [x] Task 5: 簡化 SessionHistory — 搜尋框 + flat list
- [x] Task 6: ChatPanel 加 resume overlay 狀態
- [x] Task 7: 移除 WorkspaceLayout history sidebar
- [x] Task 8: 清理未使用的 SessionListPage
- [x] Task 9: 整合測試

## UI 對齊 extension（第二輪）

- [x] Task 10: 相對日期加 `mo`/`y` 格式
- [x] Task 11: SessionHistory 改為浮動 dropdown dialog
- [x] Task 12: SessionRow — rename/delete 與日期並排
- [x] Task 13: SessionRow — keyboard navigation
- [x] Task 14: 搜尋 highlight
- [x] Task 15: firstUserMessage 作為 title fallback
- [x] Task 16: 第一則 chat:send 後自動 generate_session_title
- [x] Task 17: chat-handler-session.test.ts 移除 biome-ignore-all + 所有 any
- [x] Task 18: resume 先載入歷史再 spawn CLI（session:join 已處理）

## 跨視窗同步

- [x] Task 19: FakeClaude io.emit broadcast 修正 + lazy resume 不 broadcast session:created
- [x] Task 20: 關閉 tab → io.emit('session:dead') → 其他視窗 removeTab

- [x] Task 21: resume 跨視窗同步 — session:resume 事件
  - shared: 新增 C→S `session:resume { channelId }` + S→C `session:resume { channelId }`
  - Server handler: 收到 C→S `session:resume` → io.emit S→C `session:resume` broadcast 給所有 client
  - Client ChatPanel: handleResumeSelect emit `session:resume { channelId }` 給 server（取代直接 replaceActiveTab）
  - Client TabContext: 監聽 S→C `session:resume` → replaceActiveTab(channelId)
  - A 和 B 都收到同一個 broadcast，都執行 replaceActiveTab → ChannelProvider remount → session:join → 載入歷史
  - TDD server: FakeClaude socketA emit session:resume，socketB 也收到 session:resume
  - TDD client: 模擬收到 session:resume 後 active tab 切換

- [x] Task 22: resume 載入歷史時顯示 spinner
  - session:join callback 已回傳 state='busy'（如果 CLI 正在處理）→ spinner 自動出現
  - 不需要額外的 pre-join status 變更（會破壞 idle 狀態的測試）

## Code Review 重構

- [x] Task 23: P0 — session:resume handler 修正
  - 改用 `sessionResumePayloadSchema.parse(payload)` 取代 `chatKillSchema`
  - 加 try-catch（對齊 session:close pattern）

- [x] Task 24: P1 — title generation 錯誤處理 + type safety
  - `.catch(() => {})` → `.catch(e => console.warn(...))`
  - `res.response?.title as string` → zod safeParse 或 type guard

- [x] Task 25: P1 — session:dead double-fire 檢查
  - session:close handler emit session:dead + onExit hook 也可能 emit → 確認是否重複

- [x] Task 26: P1 — channel.isProcessing 封裝
  - 改為 `startProcessing()` / `endProcessing()` 方法

- [x] Task 27: P1 — SessionRow.finishRename 處理失敗
  - await onRename 結果，失敗時給反饋

- [x] Task 28: P1 — 移除 dead code joinSession（如無其他使用者）

- [x] Task 29: P1 — ChatPanel resume 邏輯抽到 context/hook
  - socket.emit 不該在 component 裡直接呼叫
  - resume overlay state（showResumeOverlay, resumeSessions, resumeLoading）移出 ChatPanel

- [x] Task 30: P2 — 小項清理

## Zod 驗證補齊（本次 branch 檔案）

- [x] Task 31: message-handler.ts — generate_session_title response 用 zod
  - 定義 `generateTitleResponseSchema = z.object({ title: z.string() })`
  - `res.response` safeParse 取代 typeof guard
  - TDD: 現有 auto-generates test 不改 expect

- [x] Task 32: channel-hooks.ts — socket event payload 用 zod
  - 每個 switch case 的 `p.xxx as Type` 改為 zod parse
  - 定義各 event payload schema（message:result errors、file_updated、control:cancel 等）
  - TDD: 現有 channel-hooks 相關測試不改 expect

- [x] Task 33: channel.ts — session:init payload fields 用 zod
  - `se.payload.model as string` 等 ~12 處改為 schema safeParse
  - 重用 shared 已有的 schema 或就近定義
  - TDD: 現有測試不改 expect

- [x] Task 34: chat-handler.ts — sessionState cache 用 zod
  - `cache.model as string` 等改為 typed getter 或 schema
  - TDD: 現有測試不改 expect

## Code Review 第二輪

### P1
- [x] Task 35: channel-hooks.ts onExit — 移除 dead code pendingRequests rejection
  - wireRunner.onExit 已清空 pendingRequests，channel-hooks 的 onExit 再 loop 是多餘的
- [x] Task 36: channel-hooks.ts — system:rate_limit payload 用 zod
- [x] Task 37: chat-handler.ts — broadcastSessionState guard 條件補齊
  - 漏了 thinkingLevel/tools/effort/mcpServers，只有 model/cwd/permissionMode 才觸發 settings:update
- [x] Task 38: message-handler.ts — chat:cancel_request handler 加 zod validate
- [x] Task 39: channel.ts — 移除未使用的 ChannelState/transition()/VALID_TRANSITIONS dead code

### P2
- [x] Task 40: session-handler.ts — session:raw_events 加 zod validate
- [x] Task 41: drizzle stores — DrizzleDb interface 合併到共用檔案
- [x] Task 42: channel-manager.ts — 確認 findByRunner 是否 dead code，是則移除
