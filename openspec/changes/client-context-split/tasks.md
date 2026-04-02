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
- TabContext / SessionContext 留到之後（socket 操作少，與 state 緊密耦合）

## 13. 清理

- [x] 13.1 channel contexts 的 socket.on/off 全走 handler map 或 auto-wiring
- [x] 13.2 615 test pass
