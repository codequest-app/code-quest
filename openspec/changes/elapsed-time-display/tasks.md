## 1. formatElapsed 工具函式（TDD）

- [ ] 1.1 寫 `formatElapsed.test.ts`：< 1000ms → `"324ms"`（整數 ms）
- [ ] 1.2 寫 `formatElapsed.test.ts`：≥ 1000ms → `"1.234s"`（三位小數）
- [ ] 1.3 實作 `apps/web/src/utils/formatElapsed.ts`（Green）

## 2. useElapsedTime hook（TDD）

- [ ] 2.1 寫 `useElapsedTime.test.ts`：null startTime 回傳 null
- [ ] 2.2 寫 `useElapsedTime.test.ts`：有 startTime 回傳 `formatElapsed` 格式字串
- [ ] 2.3 寫 `useElapsedTime.test.ts`：unmount 時 cancelAnimationFrame
- [ ] 2.4 實作 `apps/web/src/hooks/useElapsedTime.ts`（rAF，Green）

## 3. ChannelState 加 turnStartTime（TDD）

- [ ] 3.1 寫測試：`sendMessage` 後 channelState 有 `turnStartTime`
- [ ] 3.2 寫測試：`onMessageResult` 後 `turnStartTime` 清為 null
- [ ] 3.3 `ChannelState` type 加 `turnStartTime?: number | null`
- [ ] 3.4 `message.ts` sendMessage：記 `turnStartTime: Date.now()`
- [ ] 3.5 `ChannelMessagesContext.tsx` onMessageResult：清 `turnStartTime: null`

## 4. ThinkingBlock elapsed time（TDD）

- [ ] 4.1 `ThinkingMeta` type 加 `startTime?: number`
- [ ] 4.2 `streaming.ts`：建立 thinking message 時加 `startTime: Date.now()`
- [ ] 4.3 `ChannelMessagesContext.tsx`：thinking block 完成時用自己的 startTime 算 durationMs
- [ ] 4.4 寫測試：`isStreaming=true` + `startTime` → label 含 elapsed（live）
- [ ] 4.5 寫測試：`isStreaming=false` + `durationMs` → `"Thought for 1.234s"`
- [ ] 4.6 寫測試：`isStreaming=false` + 無 durationMs → `"Thinking"`
- [ ] 4.7 修改 `ThinkingBlock.tsx`：加 `startTime` prop，接 `useElapsedTime`

## 5. SpinnerVerb elapsed time（TDD）

- [ ] 5.1 寫測試：無 startTime → 不顯示時間
- [ ] 5.2 寫測試：有 startTime → 顯示 `formatElapsed` 格式字串
- [ ] 5.3 修改 `SpinnerVerb.tsx`：加 `startTime` prop，DOM ref 直寫 elapsed span（rAF）
- [ ] 5.4 串接：從 channel context 讀 `turnStartTime` 傳給 `SpinnerVerb`

## 6. ResultContent 格式統一（TDD）

- [ ] 6.1 寫測試：durationMs < 1000 → 顯示 `"XXXms"`
- [ ] 6.2 寫測試：durationMs ≥ 1000 → 顯示 `"X.XXXs"`
- [ ] 6.3 修改 `SystemBlocks.tsx` ResultContent：`toFixed(1)` 改用 `formatElapsed`

## 7. 手動驗證

- [ ] 7.1 SpinnerVerb 秒數正確 live 更新
- [ ] 7.2 ThinkingBlock streaming 中顯示 elapsed，完成後顯示靜態時間
- [ ] 7.3 result 分隔線的時間格式正確（< 1s 顯示 ms，≥ 1s 顯示三位小數 s）
- [ ] 7.4 頁籤切換背景再切回來，數字正確（rAF 驗證）

## 8. result stats 移到 assistant message footer（選做，最後再評估）

- [ ] 8.1 寫測試：result 緊接 assistant → stats 出現在 assistant message 內
- [ ] 8.2 寫測試：result 緊接 assistant → result message 本身不獨立渲染
- [ ] 8.3 修改 `MessageList.tsx`：偵測 result message，將 meta 傳給前一則 assistant
- [ ] 8.4 修改 `ChatMessage.tsx` / `AssistantMessage`：接受並渲染 `resultStats` footer
- [ ] 8.5 修改 `SystemBlocks.tsx`：`result` type 在 renderBody 回傳 null
