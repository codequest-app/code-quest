## Why

使用者在等待 AI 回覆時無法感知目前已過了多少時間，SpinnerVerb 只有動畫沒有計時，ThinkingBlock 的 `durationMs` prop 雖已定義但未實際傳值，ResultContent 的時間精度（`toFixed(1)`）也不一致。加上顯示時間可讓使用者直覺掌握每個 turn 的執行成本。

## What Changes

- 新增 `useElapsedTime(startTime)` hook，每 100ms 更新一次，回傳 `"3.24s"` 格式字串
- `SpinnerVerb` 接受 `startTime` prop，在 verb 旁 live 顯示 elapsed time
- `ThinkingBlock` streaming 中顯示 `Thinking... 3.24s`，完成後顯示 `Thought for 3.24s`
- `ResultContent` 的 `durationMs` 精度從 `toFixed(1)` 改為 `toFixed(2)`
- `ResultContent` 的 stats 從獨立 `CenterDivider` 分隔線改為附著在最後一則 assistant message 的 footer

## Capabilities

### New Capabilities

- `elapsed-time-hook`: 共用的 `useElapsedTime(startTime)` hook，100ms interval，輸出 `"X.XXs"` 格式
- `spinner-elapsed`: SpinnerVerb 顯示 live elapsed time
- `thinking-elapsed`: ThinkingBlock streaming/完成後顯示執行時間
- `result-stats-footer`: ResultContent stats 移到 assistant message footer，精度改為兩位小數

### Modified Capabilities

- `layout-shell`: result message 的渲染位置從獨立分隔線改為附著 assistant message footer

## Impact

- `packages/client/src/hooks/useElapsedTime.ts`（新增）
- `packages/client/src/components/chat/SpinnerVerb.tsx`
- `packages/client/src/components/chat/conversation/ThinkingBlock.tsx`
- `packages/client/src/components/chat/tool-use/message-blocks/SystemBlocks.tsx`
- `packages/client/src/components/chat/conversation/ChatMessage.tsx`
- `packages/client/src/components/chat/conversation/MessageList.tsx`（可能需調整 result message 傳遞方式）
