## 1. TDD — fix getItemKey

- [x] 1.1 RED: 加測試 — timeline group 加入第二個 node 時，getItemKey 回傳值不變（量測不失效）
- [x] 1.2 GREEN: 抽出 `getGroupKey(group, index)` pure function，`getItemKey` 和 React `key` 都改用之
- [x] 1.3 確認所有 MessageList 測試通過（1927 passed）
