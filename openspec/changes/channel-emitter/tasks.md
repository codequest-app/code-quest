## 規則

- Server 399 test + Client 615 test 全部 pass
- 測試不變：不修改任何測試檔案的 expect
- TDD 重構

## 1-13. Handler 遷移 + SocketHandler 移除（已完成）

- [x] 全部完成

## 14. Code Review 修正

### P0

- [ ] 14.1 channel-emitter.ts:81 — dispatchRunnerEvent payload spread 加 type guard

### P1

- [ ] 14.2 channel-emitter.ts — 移除未使用的 `_resolveChannel` field + `resolveChannel()` public method
- [ ] 14.3 channel-emitter.ts — `_resolveChannel` 改為 constructor/register 一次設定，不在 handleConnection 每次覆寫
- [ ] 14.4 channel-emitter.ts — `dispatch` 回傳值改 void（多 handler 回傳最後一個是隱晦行為）— 但 handleConnection 需要 return Promise 給 FakeClaude，需要替代方案
- [ ] 14.5 channel-manager.ts — `join` 和 `create` 重複的 channel setup 提取為 shared method
- [ ] 14.6 channel-emitter.ts — handleConnection eventMap 遍歷時序依賴：文件化約束或加 freeze
- [ ] 14.7 399 + 615 test pass

### P2

- [ ] 14.8 channel-emitter.ts — 5 個 broadcast wrapper 只是 delegate，評估簡化
- [ ] 14.9 channel-manager.ts — `cachedModels` 不屬於 ChannelManager，評估搬移
- [ ] 14.10 channel-emitter.ts — SRP：socket tracking 可獨立為 SocketRegistry
- [ ] 14.11 channel-emitter.ts:165 — nested ternary payload parsing 改 if/else
- [ ] 14.12 channel-manager.ts — passthrough getters（provider, runnerCommand 等）評估是否需要
- [ ] 14.13 399 + 615 test pass
