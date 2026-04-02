## 規則

- Server 400 test + Client 619 test + Summoner 271 test 全部 pass
- 測試不變：不修改任何測試檔案的 expect（expect 不變或等價）
- TDD：FakeClaude + real JSON + testing-library，先寫測試再寫 code
- named function（不用 arrow）
- 每步改完跑 test

## 已完成（前次 commit）

- [x] ServerAction 全部轉成 SocketEvent（adapter/runner/Channel/handler）
- [x] 新建 auto-respond.ts handler
- [x] 移除 ServerAction type + server_action 基礎設施
- [x] 補 CLI-initiated set_model/set_permission_mode/get_settings 測試

## 2. Event naming 修正

event name 應反映語義，不暴露來源（不用 `cli:` prefix）。

### 2.1 settings: CLI-initiated 改名

CLI 通知 server 設定已改 → `_updated` 語義。

| 現在 | 改為 |
|---|---|
| `cli:set_model` | `settings:model_updated` |
| `cli:set_permission_mode` | `settings:permission_mode_updated` |

- [ ] 2.1a adapter transform：改 event name
- [ ] 2.1b summoner transform test：更新 expect
- [ ] 2.1c settings.ts handler：改 `emitter.on` event name + rename handler（`onCliSetModel` → `onModelUpdated`）
- [ ] 2.1d settings.test.ts：更新測試描述（expect 不變）
- [ ] 2.1e 全量 test pass

### 2.2 control:open_diff 搬到 permission.ts

`control:open_diff` 是 diff review 審核流程，不是 file 操作。

- [ ] 2.2a 將 `onReadDiff` 從 file.ts 搬到 permission.ts
- [ ] 2.2b file.ts 移除 `readFile` import（如果不再需要）
- [ ] 2.2c permission.ts 加 `readFile` import
- [ ] 2.2d 全量 test pass

### 2.3 auto-respond event name 語義化

auto-respond 事件目前直接用 client-facing event name（`action:open_url` 等）。
但 auto-respond 是 server 內部行為，不應該綁在 client event name 上。

目前 auto-respond 的 4 個事件：
- `action:open_url` — client 也收此事件（顯示 URL）
- `action:open_file` — client 也收此事件（顯示 file toast）
- `notification:show` — client 也收此事件（顯示 notification）
- `mcp:auto_respond` — client 不收（純 server 內部）

前三個由 `dispatchRunnerEvent` 自動 broadcast 給 client + dispatch 給 server handler。
server handler 只需要從 payload 取 `requestId` + `response` 做 auto-respond。
payload 裡的 `response` 欄位是給 server auto-respond 用的，client 不需要。

**方案**：保持現有 event name 不變。auto-respond handler 訂閱這些 event 是合理的 —
它只是附加行為（「這些事件順便需要回應 CLI」）。`mcp:auto_respond` 本身就是純 server 內部事件。
但需要確認 client 端收到 payload 帶 `requestId` + `response` 不會有問題。

- [ ] 2.3a 確認 client 端 handler 對多餘的 payload 欄位（requestId, response）不受影響
- [ ] 2.3b 如果 shared type 需要更新（加 optional requestId/response），更新之
- [ ] 2.3c 全量 test pass

### 2.4 client 端對齊

client 端 handler 目前用的 event name 不受影響（`action:open_url`、`action:open_file`、`notification:show`、`control:diff_review`）。
但需要確認：
- `notification:show` client handler 已處理 `requestId`（onNotificationShowEffect 已有）
- `action:open_url`/`action:open_file` client handler 忽略多餘欄位（OK，只取 `url`/`filePath`）

- [ ] 2.4a 確認 client handler 無需修改
- [ ] 2.4b 619 client test pass

### 2.5 刪除 file_updated 死碼

`system:file_updated` 整條路徑是死碼：
- CLI protocol 不輸出此事件
- adapter 不產出此事件
- extension 的 MCP callback 也未被呼叫（`_4704` 只用第一個 callback）
- 無測試覆蓋

刪除範圍：
- [ ] 2.5a server file.ts：刪除 `onFileUpdated` handler + `emitter.on('system:file_updated', ...)`
- [ ] 2.5b server file.ts：移除 `fileUpdatedPayloadSchema` import（如不再需要）
- [ ] 2.5c shared socket-events.ts：移除 `system:file_updated` + `file:updated` event 定義
- [ ] 2.5d shared schemas/file.ts：移除 `fileUpdatedPayloadSchema`（確認無其他引用）
- [ ] 2.5e client fileHandler.ts：移除 `file:updated` handler（`modifiedFiles` state + UI 保留，未來 file manager 會觸發）
- [ ] 2.5f 全量 test pass

### 2.6 inline type → zod schema（shared）  

消除 `payload as { ... }` inline type assertion，改用 zod safeParse。
新 schema 放 shared 讓前後端共用。

現有 inline type 清單：
- `auto-respond.ts`: `{ requestId, response }` → 新建 `autoRespondPayloadSchema`
- `settings.ts onGetSettings`: `{ requestId }` → 已有 `requestIdPayloadSchema`
- `settings.ts onModelUpdated`: `{ requestId, input }` → 新建 `settingsUpdatedPayloadSchema`
- `settings.ts onPermissionModeUpdated`: 同上
- `permission.ts onForwardToClient`: `{ requestId, subtype, toolName, ... }` → 新建 `controlForwardPayloadSchema`
- `file.ts onReadDiff`: `{ requestId, originalPath, newPath }` → 新建 `controlOpenDiffPayloadSchema`
- `file.ts handleRead`: `{ filePath }` → 已有類似 schema？確認
- `connect.ts`: `{ code }` → 新建 `channelExitPayloadSchema`

- [ ] 2.5a 在 shared schemas 新增缺少的 schema
- [ ] 2.5b 各 handler 改用 zod parse 取代 `as` cast
- [ ] 2.5c 確認前後端都能 import 使用
- [ ] 2.5d 全量 test pass

### 2.6 git.ts middleware + 簽名修正

git handler 都是 `_ch: Channel | null` 但沒用 middleware。
不需要 channel 的 handler 應該用 `withError`（callback 回錯誤 if ch null）或直接不帶 ch。

- [ ] 2.6a 評估每個 handler 是否需要 withChannel/withError/不帶
- [ ] 2.6b 修正簽名 + 加 middleware
- [ ] 2.6c 全量 test pass

### 2.7 cleanup: named function + typecheck + unused imports

**arrow function → named function:**
- `usage.ts`: emitter.on callback 改 named function

**typecheck 問題（unused imports/vars）：**

server handlers:
- `settings.ts`: unused `chatGetStateSchema`
- `settings.ts:125`: unused `payload` param
- `app.ts:49`: unused `payload` param
- `session/command.ts`: unused `withError` import
- `speech.ts:5,9`: unused `payload` params
- `terminal.ts`: unused `terminalGetContentsSchema`, unused `payload` param

summoner:
- `adapter.ts`: unused `ContentBlock` import

client:
- `GitContext.test.tsx`: unused `render`, `screen`
- `GitContext.tsx:33,36`: Expected 2 arguments, but got 3
- `ChannelControlContext.tsx`: unused `ChannelState`
- `guard.ts`: unused `Guard`
- `sessionHandler.ts`: unused `FileSearchResult`

- [ ] 2.7a usage.ts arrow → named function
- [ ] 2.7b 修正所有 unused import/var
- [ ] 2.7c 修正 `GitContext.tsx` 引數問題
- [ ] 2.7d typecheck pass（summoner + server + client 均 0 error）
- [ ] 2.7e 400 server + 619 client + 271 summoner test pass

### 2.8 client/server handler event name 對齊

改完所有 event name 後，比對 client 和 server 所有 handler 的 event name 是否一致。
如果有不對齊（例如 server 改了名但 client 沒跟上，或命名慣例不統一），提出調整方案。

- [ ] 2.8a 列出 server emitter.on 所有 event name
- [ ] 2.8b 列出 client handler map 所有 event name
- [ ] 2.8c 列出 shared socket-events.ts 定義
- [ ] 2.8d 比對三者，找出不對齊項目
- [ ] 2.8e 修正不對齊項目
- [ ] 2.8f 全量 test pass

### 2.9 重構測試

所有 production code 改完後，檢查測試是否反映當前架構。
測試描述、setup pattern、assertion 要符合現在的 event name 和 handler 結構。

- [ ] 2.9a 檢查所有 test describe/it 描述是否反映新 event name
- [ ] 2.9b 檢查 test 中 `as any` / inline type 是否可用 zod schema 取代
- [ ] 2.9c 確認 FakeClaude 使用模式一致（emit real JSON, 不用 spy）
- [ ] 2.9d 全量 test pass
