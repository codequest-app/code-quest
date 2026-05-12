## Mapping

| describe group | renderBody type | 改用元件 |
|---|---|---|
| ToolUseBlock | tool_use | `<ToolUseBlock toolName input result defaultOpen={true}>` |
| Task/Agent badge | tool_use (Task tool) | `<ToolUseBlock toolName input task>` |
| ToolResultBlock | tool_result | `<ToolResultBlock content toolId name is_error arrayContent>` |
| error / result / compact_boundary / action_result / slash_command_result | system types | 各自的 export from tool-use/index |
| hook_started / hook_response | hook types | `HookStartedContent`, `HookResponseContent` |
| text | text | inline `<Expandable><MarkdownContent /></Expandable>` |
| interrupt | interrupt | `<InterruptContent>` |
| image / document / redacted_thinking / tool_result array | content block types | `ImageContent`, `DocumentContent`, inline div, `ToolResultBlock` |

## 重構原則

- expect 不變，只換 render 方式
- ToolUseBlock 測試需展開：直接傳 `defaultOpen` prop（不用 click 展開）或保留 click
- task badge 測試：`taskStatus` 在 NodeContent 轉成 Task object，改成直接傳 `task` prop 給 ToolUseBlock
