## Tasks

### 前置準備
- [x] Remove CwdContext and useCwd (zero production consumers)
- [x] Remove cwd default value from ChannelProvider prop
- [x] ChannelProvider launch useEffect: use `cwd` presence as launch signal, send channelId in session:launch

### TabContext 重構
- [x] Refactor `createNewTab` to use channelId as tab key (tabKey === channelId)
- [x] Update WorkspaceLayout: use tab key as channelId, remove channelId from onChange handler
- [x] ChannelProvider: add `launched` state to wait for launch before rendering children
- [x] Refactor `onCreated` (session:created handler) to use addTab without cwd
- [x] Refactor `syncFromServer` to use single key lookup
- [x] Remove `setChannelId` action from TabContext
- [x] Remove `channelId` field from `TabMeta` interface
- [x] Simplify `onChange` type from `{ channelId?, title?, status? }` to `{ title?, status? }`
- [x] Update `ChannelChangeUpdate` type in `types/chat.ts`
- [x] ChannelProvider `channelId` prop required (string, not optional)
- [x] Remove `if (!channelId) return null` branch (replaced by `if (!launched)`)

### Bug fix
- [x] Remove session:close from launch effect cleanup (Strict Mode double invoke caused false close+dead)

### 測試更新
- [x] Update WorkspaceLayout test data (tab key = channelId)
- [x] Update syncFromServer test (cwd no longer stored from server)
- [x] Remove setChannelId tests (function removed)
- [x] renderWithWorkspace waits for compose textarea (ensures full mount)

### 後續
- [x] 重寫 ChannelContext.test.tsx — renderWithChannel + component harness，expect 等價
- [x] Loading 狀態顯示：launch 期間顯示 "Connecting…" 取代空白 tab

### 測試改寫（renderHook → per-test fake component + testing-library）
概念：每個 test 自己渲染需要的 fake component，只包含該 test 的操作和驗證，不共用大 harness
- [x] TabContext.test.tsx（20 個 renderHook）— per-test fake component
- [x] useInputHistory.test.ts — 保留 renderHook（純 ref hook，不觸發 re-render，component test 無法觀察變化）
- [x] useSpeechToText.test.ts — 保留 renderHook（同上，純 ref + MockSpeechRecognition）
- [x] SocketContext.test.tsx — 保留 renderHook（2 個簡單 Provider test，收益低）
- [x] 移除 vi.spyOn(claude.socket, 'emit') — 4 處改用 side-effect 驗證，2 處 GitContext 保留（git RPC 無 UI side effect）

### Code review 修正
- [x] ChannelContext: launch 失敗時 setLaunched(true) 避免 "Connecting…" 永遠卡住
- [x] ChannelMessagesContext: session:join 失敗時仍設 joinedRef=true 避免 onSessionStates 被永遠擋住
- [x] 測試：launch 失敗情境（RED→GREEN TDD）
- [x] 測試：join 失敗情境（RED→GREEN TDD）
- [x] renderWithChannel 新增 skipInit option

### Code review 修正 (round 2)

#### 高優先：zod 驗證
- [x] TabContext: app:init callback 加 zod safeParse（initResponseSchema）
- [x] TabContext: onCreated/onDead/onResume payload 加 zod safeParse（shared schemas）
- [x] ChannelConfigContext: app:config callback 加 zod safeParse（getProviderConfigResponseSchema）
- [x] streaming.ts: file:read callback 加 zod safeParse（fileReadResponseSchema）

#### 中優先：測試品質
- [x] ChannelContext.test: 移除 `as Function` → `(...a: unknown[]) => unknown`
- [x] ChannelContext.test: 合併重疊的 launch test
- [x] TabContext.test: 合併重疊的 session:created test
- [x] TabContext.test: 修正假檢驗 `toBeGreaterThanOrEqual(1)` → `toBe(tabsBefore + 1)`
- [x] TabContext.test: syncFromServer magic string 抽 `idleSession()` factory
