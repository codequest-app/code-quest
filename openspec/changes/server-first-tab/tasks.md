## 1. 測試先行 — 調整測試支援 server-first 架構

- [x] 1.1 TabContext `syncFromServer` tests (8 tests) → 改用 sessions prop rerender，expect 等價
- [x] 1.2 TabContext `createNewTab` tests (2 tests) → 改用 sessions prop，expect 等價
- [x] 1.3 TabContext `new tab button` test (1 test) → rename，expect 不變
- [ ] 1.4 render-with-workspace → 改成 server-first pipeline（不手動 click "New tab"）
- [ ] 1.5 title-from-messages (2 tests) → 跟 render-with-workspace 調整
- [ ] 1.6 WorkspaceLayout per-project (2 tests) → 走真實 pipeline 取代 serverSocket.emit
- [ ] 1.7 ChannelContext tests — 移除 self-launch 相關 setup

## 2. 重構 Production Code

- [ ] 2.1 createNewTab → emit session:launch，不直接建 tab（tab 由 sessions prop diff 自動產生）
- [ ] 2.2 ChannelContext 移除 self-launch（session:launch emit + SpinnerVerb）
- [ ] 2.3 EditorArea onNewTab / onNewChannel 改呼叫 launch action
- [ ] 2.4 WorkspaceLayout handleAddProject 改用 launch action
- [ ] 2.5 移除 syncFromServer（sessions prop diff 是唯一機制）

## 3. 驗證

- [ ] 3.1 全套 unit tests 通過
- [ ] 3.2 手動驗證：新 tab、reload、per-project 切換
