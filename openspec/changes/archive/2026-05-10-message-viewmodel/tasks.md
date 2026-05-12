## 1. ViewModel 型別 + 轉換函式

- [x] 1.1 定義 ViewModel discriminated union 型別（tool_use 拆分 bash/read/edit/agent/default + 其他 message type）
- [x] 1.2 定義 ViewModelContext interface（tasks: Map）
- [x] 1.3 實作 `toViewModel(node, ctx)` — tool_use 類型（bash, read, edit, agent, default）
- [x] 1.4 實作 `toViewModel` — 其他 message type（text, thinking, result, error, hook 等）
- [x] 1.5 實作 `toViewModelNode(node, ctx)` — 遞迴處理 children
- [x] 1.6 測試：18 unit tests green

## 2. 遷移 tool_use rendering

- [x] 2.1 ToolUseBlock 接受 vm prop（雙入口）
- [x] 2.2 renderBody tool_use case 走 toViewModel → ToolUseBlock(vm)
- [x] 2.3 assistant_turn tool_use block 同步走 ViewModel
- [x] 2.4 移除 ToolUseBlock 中的 `useChannelStore(tasks)` 依賴
- [x] 2.5 測試：755 tests green

## 3. 遷移其他 message type

- [x] 3.1 text / thinking / result / error → renderViewModel dispatcher
- [x] 3.2 hook / rate_limit / compact_boundary 等 → passthrough ViewModel
- [x] 3.3 assistant_turn → renderAssistantTurnVm + renderBlockVm
- [x] 3.4 renderBody 有 ctx 時全走 toViewModel → renderViewModel
- [x] 3.5 測試：2066 tests green

## 4. 移除 mergeToolResult

- [x] 4.1 `buildMessageTreeWithResults` 不再呼叫 `mergeToolResult`
- [x] 4.2 tool_result 收集到 results Map，skip 不加入 tree
- [x] 4.3 `toViewModel` 從 ctx.results lookup result（fallback meta.result）
- [x] 4.4 ToolResultsContext 傳遞 results Map 到 ChatMessage
- [x] 4.5 移除舊 `buildMessageTree` deprecated wrapper

## 5. 清理

- [x] 5.1 renderBody 移除舊 switch fallback，只走 ViewModel
- [x] 5.2 移除 renderBlock、renderUserText（已被 ViewModel renderers 取代）
- [x] 5.3 移除未使用的 import（TextMeta）
- [x] 5.4 測試：全 web package 2067 tests green
