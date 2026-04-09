## 1. 測試先行 — 調整測試支援 server-first 架構

- [x] 1.1 TabContext `syncFromServer` tests (8 tests) → 改用 sessions prop rerender，expect 等價
- [x] 1.2 TabContext `createNewTab` tests (2 tests) → 改用 sessions prop，expect 等價
- [x] 1.3 TabContext `new tab button` test (1 test) → rename，expect 不變

## 2. Production Code — 小步重構

- [ ] 2.1 ProjectActions 加 `launchSession(cwd?)`：emit `session:launch`，additive，不破壞任何東西
- [ ] 2.2 EditorArea `onNewTab` 改呼叫 `launchSession()` 取代 `createNewTab()`
- [ ] 2.3 EditorArea `onNewChannel` 改呼叫 `launchSession(cwd)` 取代 `createNewTab({ cwd })`
- [ ] 2.4 ChannelContext 移除 self-launch（`session:launch` emit + SpinnerVerb），always launched=true
- [ ] 2.5 TabContext 移除 `createNewTab`（dead code）
- [ ] 2.6 TabContext 移除 `syncFromServer`（dead code）
- [ ] 2.7 清理 test helpers — 確認 renderWithWorkspace / renderWithChannel 仍正常

## 3. 驗證

- [ ] 3.1 全套 unit tests 通過
- [ ] 3.2 手動驗證：新 tab、reload、per-project 切換
