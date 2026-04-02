## 規則

- Server 400 test + Client 619 test + Summoner 271 test 全部 pass
- 測試不變：不修改任何測試檔案的 expect（expect 不變或等價）
- TDD：FakeClaude + real JSON + testing-library，先寫測試再寫 code
- named function（不用 arrow）
- 每個 case 獨立完成：adapter test(RED) → adapter(GREEN) → server handler → 全量 test pass → 下一個

## 1. 消除 ServerAction（已完成）

- [x] 所有 control_request subtypes 轉為 SocketEvent
- [x] 新建 auto-respond.ts handler
- [x] 移除 ServerAction type + server_action runner event + onServerAction hook
- [x] 補 CLI-initiated set_model/set_permission_mode/get_settings 測試

## 2. Event naming + cleanup（已完成）

- [x] 2.1 `cli:set_model` → `settings:model_updated`，`cli:set_permission_mode` → `settings:permission_mode_updated`
- [x] 2.2 `control:open_diff` 從 file.ts 搬到 permission.ts
- [x] 2.3 auto-respond event name 確認（保持不變，附加行為）
- [x] 2.4 client 端確認不需修改
- [x] 2.5 刪除 file_updated 死碼（CLI protocol 不輸出、extension MCP handler 未接通）
- [x] 2.6 inline type → zod schema（5 個新 schema）
- [x] 2.7 git.ts middleware：`handleUpdateSkippedBranch` 改用 `withError(withChannel(...))` + `ch.id`
     其他 git handler（status/checkout/log/diff/exec）不需要 channel，保持不變
- [x] 2.8 usage.ts arrow → named function
- [x] 2.9 修正所有 unused import/var + typecheck 0 errors
- [x] 2.10 修正 git:status/git:diff shared types + GitContext.tsx 引數
- [x] 2.11 修正 biome useExhaustiveDependencies warnings
- [x] 2.12 client/server event name 對齊確認（無問題）
- [x] 2.13 測試描述更新
- [x] 400 server + 619 client + 271 summoner test pass
