## 全部完成

- [x] 1-13. Handler 遷移 + SocketHandler 移除
- [x] 14. Code Review P0/P1 修正
- [x] 15.1 broadcast wrappers 移除（5 個 thin delegate → emitter.broadcastAll 直接呼叫）
- [x] 15.2 cachedModels — 保留在 ChannelManager（和 channel 生命週期相關）
- [x] 15.3 SocketRegistry — 保留在 ChannelEmitter（socket tracking 是 emitter 核心功能）
- [x] 15.4 passthrough getters — 保留（adapter 未暴露到 DI，改動大收益小）
- [x] 399 server + 615 client test pass
