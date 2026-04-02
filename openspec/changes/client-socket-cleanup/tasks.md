## 規則

- Server 398 test + Client 619 test + Summoner 271 test 全部 pass
- 測試不變：不修改任何測試檔案的 expect（expect 不變或等價）
- TDD：FakeClaude + real JSON + testing-library，先寫測試再寫 code
- named function（不用 arrow）
- 每個 case 獨立完成：adapter test(RED) → adapter(GREEN) → server handler → 全量 test pass → 下一個

## 1. open_url：合併 auto_respond 到 SocketEvent

- [x] 1.1 summoner transform test(RED) + adapter(GREEN)
- [x] 1.2 新建 `auto-respond.ts` handler，訂閱 `action:open_url`
- [x] 1.3 更新 adapter.test.ts expect（等價）
- [x] 1.4 全量 test pass

## 2. open_file：同模式

- [x] 2.1 summoner transform test(RED) + adapter(GREEN)
- [x] 2.2 auto-respond handler 加 `action:open_file`
- [x] 2.3 全量 test pass

## 3. show_notification：同模式

- [x] 3.1 summoner transform test(RED → GREEN)
- [x] 3.2 auto-respond handler 加 `notification:show`
- [x] 3.3 全量 test pass

## 4. mcp_notification：同模式

- [x] 4.1 summoner transform test(RED → GREEN)：event `mcp:auto_respond`
- [x] 4.2 auto-respond handler 加 `mcp:auto_respond`
- [x] 4.3 全量 test pass

## 5. get_settings / set_model / set_permission_mode

CLI 發起的 settings control_request，各自獨立 event。
注意：client 也有 `settings:set_model`，CLI 版用 `cli:` prefix 區分。

### 5a. get_settings
- [x] 5a.1 summoner test(RED → GREEN)：event `settings:get_settings`
- [x] 5a.2 settings.ts 新增 `onGetSettings` handler
- [x] 5a.3 全量 test pass

### 5b. set_model + 5c. set_permission_mode
- [x] 5b/c.1 summoner test(RED → GREEN)：`cli:set_model`、`cli:set_permission_mode`
- [x] 5b/c.2 settings.ts 新增 `onCliSetModel`、`onCliSetPermissionMode` handler
- [x] 5b/c.3 全量 test pass

### 5d. 刪除 onAutoRespond
- [x] 5d.1 刪除 `onAutoRespond` + `emitter.on('server:action', ...)` + `ServerAction` import
- [x] 5d.2 全量 test pass

## 6. open_diff → control:open_diff

注意：用 `control:open_diff` 而非 `control:diff_review`，避免跟 server→client 的 `control:diff_review` 衝突（dispatchRunnerEvent 會自動 broadcast）。

- [x] 6.1 summoner test(RED → GREEN)：event `control:open_diff`
- [x] 6.2 file.ts `onReadDiff` 改訂閱 `control:open_diff` + 更新 payload 取值
- [x] 6.3 更新 adapter.test.ts expect（等價）
- [x] 6.4 移除 file.ts `ServerAction` import
- [x] 6.5 全量 test pass

## 7. default → control:forward

- [x] 7.1 summoner test(RED → GREEN)：event `control:forward`
- [x] 7.2 permission.ts `onForwardToClient` 改訂閱 `control:forward` + 更新 payload 取值
- [x] 7.3 移除 permission.ts `ServerAction` import
- [x] 7.4 全量 test pass

## 8. 移除 ServerAction 基礎設施

- [x] 8.1 adapter transform：移除 `serverActions` 變數，return `serverActions: []`
- [x] 8.2 `runner.ts`：移除 `server_action` emit 迴圈
- [x] 8.3 `ChannelHooks`：移除 `onServerAction`
- [x] 8.4 `Channel.bindRunner/unbindRunner`：移除 `server_action` listener
- [x] 8.5 `RunnerListenerRefs`：移除 `serverAction` 欄位
- [x] 8.6 `ChannelManager`：hooks 移除 `onServerAction`
- [x] 8.7 `AdapterOutput.serverActions` 改為 `never[]`
- [x] 8.8 summoner `types.ts`：移除 `ServerAction` type + 3 個子型別
- [x] 8.9 summoner `index.ts`：移除 `ServerAction` export
- [x] 8.10 `channel-emitter.test.ts`：刪除 `server:action dispatch` describe block
- [x] 8.11 全量 test pass（398 server + 619 client + 271 summoner）

## 9. 刪除死碼

- [x] 9.1 permission.ts：刪除 `onDiffReview` + `diffReviewPayloadSchema` import
- [x] 9.2 全量 test pass
