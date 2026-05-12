## 1. Tests (Red) — adapter

- [x] 1.1 `transformUser` 測試：有 `parent_tool_use_id` 時，payload 的 `renderAs` 應為 `'markdown'`
- [x] 1.2 `transformUser` 測試：無 `parent_tool_use_id` 且非 synthetic 時，`renderAs` 為 `'plain'`

## 2. Tests (Red) — web handler

- [x] 2.1 `onMessageUser` 測試：`message:user` 帶 `parentToolUseId` 時，state 中的 message 應有該欄位
- [x] 2.2 `onMessageUser` 測試：無 `parentToolUseId` 的 `message:user` 不受影響

## 3. Implementation — adapter

- [x] 3.1 `transformUser`：`parentToolUseId` 有值時 `renderAs = 'markdown'`

## 4. Implementation — web handler

- [x] 4.1 `applyUserContent` 加入 `parentToolUseId?: string` 參數，建 message 時帶入
- [x] 4.2 `onMessageUser` 將 `p.parentToolUseId` 傳給 `applyUserContent`

## 5. Verify

- [x] 5.1 確認所有測試通過（2098 passed）
- [ ] 5.2 在 UI 確認 subagent 內部 user message 不再出現在頂層 timeline，且顯示為 markdown
