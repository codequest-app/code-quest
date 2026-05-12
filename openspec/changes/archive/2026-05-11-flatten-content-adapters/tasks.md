## 1. 移動 AssistantTurnContent

- [ ] 1.1 將 `renderers/content/AssistantTurnContent.tsx` 移到 `conversation/AssistantTurnContent.tsx`，更新 primitives import
- [ ] 1.2 更新所有 import AssistantTurnContent 的檔案

## 2. 移動 ToolUseContent

- [ ] 2.1 將 `ToolUseContent` 和 `ToolUseBlockWithStore` 移到 `tool-use/ToolUseBlock.tsx`（append export）
- [ ] 2.2 更新所有 import ToolUseContent / ToolUseBlockWithStore 的檔案

## 3. Inline TextContent 和 ThinkingContent 進 NodeContent

- [ ] 3.1 將 TextContent render 邏輯 inline 進 `NodeContent.tsx` 的 `renderContent`
- [ ] 3.2 將 ThinkingContent render 邏輯 inline 進 `NodeContent.tsx` 的 `renderContent`
- [ ] 3.3 移除 TextContent、ThinkingContent 的 import

## 4. 清理

- [ ] 4.1 刪除 `renderers/content/` 整個資料夾（含 `__tests__/`）
- [ ] 4.2 跑 typecheck 確認無錯誤
- [ ] 4.3 跑全部 web tests 確認無 regression
