## 規則

- Handler 使用 named function（不用 arrow），map 在底部集中宣告
- Effects 也使用 named function
- socket.on/off handler 使用 named function（不用 inline arrow）
- 每步 615 test pass

## 1-11. ChannelMessages/Control/Config/Compose handler 抽取（已完成）

- [x] 全部完成，詳見 git history

## 12. handlers/ 搬到 contexts/ 下 + 加入 Tab/Session handlers

handlers 不屬於 channel，搬到 `contexts/handlers/`。
同時把 TabContext、SessionContext 的 socket 操作也抽出來。

- [x] 12.1 `contexts/channel/handlers/` → `contexts/handlers/channel/`
- [x] 12.2 更新所有 import 路徑
- [x] 12.3 typecheck + 615 test pass
- [ ] 12.4 新建 `contexts/handlers/tabHandlers.ts`：on handlers（session:created, session:dead, session:resume, connect）+ emit actions（session:launch, app:init）
- [ ] 12.5 TabContext 改用 handler map + auto-wiring
- [ ] 12.6 typecheck + 615 test pass
- [ ] 12.7 新建 `contexts/handlers/sessionHandlers.ts`：on handlers（connect, connect_error, notification:auth_url）+ emit actions（session:close, session:resume, auth:login, auth:oauth_code, app:init, session:list/get/fork/teleport/rename/delete/update_state）
- [ ] 12.8 SessionContext 改用 handler map + auto-wiring
- [ ] 12.9 typecheck + 615 test pass

## 13. 清理

- [ ] 13.1 確認 contexts/ 下所有 socket.on/off 都走 handler map 或 auto-wiring
- [ ] 13.2 biome check + typecheck + 615 test pass
