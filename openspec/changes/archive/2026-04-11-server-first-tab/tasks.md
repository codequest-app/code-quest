## 1. 測試先行 — 調整測試支援 sessions prop

- [x] 1.1 TabContext `syncFromServer` tests (8 tests) → 改用 sessions prop rerender，expect 等價
- [x] 1.2 TabContext `createNewTab` tests (2 tests) → 改用 sessions prop，expect 等價
- [x] 1.3 TabContext `new tab button` test (1 test) → rename，expect 不變

## 2. Production Code 清理

- [x] 2.1 移除 syncFromServer（sessions prop diff 是唯一 sync 機制）
- [x] 2.2 移除 launchSession（ChannelContext 自己 launch，不需要 ProjectActions 版本）

## 3. 驗證

- [x] 3.1 全套 unit tests 通過（746 passed）
