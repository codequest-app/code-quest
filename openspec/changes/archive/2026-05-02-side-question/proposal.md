## Why

Claude CLI 已支援 `side_question` control protocol，可在不中斷主對話的情況下向 Claude 問一個獨立問題並取得回答。cc-office 目前完全未暴露此功能，使用者只能把臨時問題混入主對話，污染對話紀錄。

## What Changes

- **shared**：新增 `ask_side_question` RPC request/response 型別
- **server**：新增 `ask_side_question` channel RPC handler，對 Claude process 發送 `side_question` control request 並回傳答案
- **client / compose**：新增 `/btw` slash command，觸發 side question 流程
- **client / UI**：新增 `SideQuestionDialog` — 以 overlay 方式蓋在 ChatPanel 上，顯示 loading 狀態與 Claude 的回答（以 `MarkdownContent` 渲染，支援 code block 等完整格式）

## Capabilities

### New Capabilities

- `side-question`: `/btw <question>` slash command 觸發，server 發送 `side_question` control request，回答以 dialog overlay 顯示於 ChatPanel 內，使用 `MarkdownContent` 渲染，不寫入主對話 messages

### Modified Capabilities

(none)

## Impact

- `packages/shared`：新增 RPC 型別
- `apps/server`：新增 channel RPC handler
- `apps/web/src/contexts/channel`：新增 `askSideQuestion` action 及對應 RPC 呼叫
- `apps/web/src/components`：新增 `SideQuestionDialog`，修改 `ChatPanel` 加入 overlay 邏輯，修改 slash command 清單加入 `/btw`
