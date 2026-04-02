## 規則

- Server 400 test + Client 619 test + Summoner 276 test 全部 pass
- 測試不變：不修改任何測試檔案的 expect（expect 不變或等價）
- TDD：FakeClaude + real JSON + testing-library，先寫測試再寫 code
- named function（不用 arrow）

## 1. 消除 ServerAction（已完成）

- [x] 所有 control_request subtypes 轉為 SocketEvent
- [x] 新建 auto-respond.ts handler
- [x] 移除 ServerAction type + server_action runner event + onServerAction hook
- [x] 補 CLI-initiated set_model/set_permission_mode/get_settings 測試

## 2. Event naming + cleanup（已完成）

- [x] 2.1–2.13 全部完成

## 3. Code review 修正 + sendRequest（已完成）

- [x] 3.1 plan.ts closePreview catch 回 `{ success: false }`
- [x] 3.2 permission.ts onOpenDiff 加 catch handler
- [x] 3.3 session handler middleware 評估 — 不需改動（不依賴 channel，自帶 try/catch）
- [x] 3.4 settings.ts silent catch 評估 — 設計上 fire-and-forget，不需改動
- [x] 3.5 Channel.sendRequest + adapter.formatRequest（26 event mappings）
- [x] 3.5 所有 handler 遷移完成（settings, message, mcp, session/connect, session/command, channel-manager, claude/auth, claude/mcp-servers）
- [x] 3.5 sendControlRequest 改 private
- [x] 400 server + 619 client + 276 summoner test pass
