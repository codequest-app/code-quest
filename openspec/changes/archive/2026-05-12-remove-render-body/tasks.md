## 1. 重寫測試

- [x] 1.1 ToolUseBlock describe：改用 `<ToolUseBlock>` 直接 render
- [x] 1.2 Task/Agent badge describe：改用 `<ToolUseBlock>` + task prop
- [x] 1.3 ToolResultBlock describe：改用 `<ToolResultBlock>` 直接 render
- [x] 1.4 SystemBlocks describe：改用各自元件直接 render
- [x] 1.5 HookBlocks describe：改用 `HookStartedContent`、`HookResponseContent`
- [x] 1.6 Other blocks describe：改用 `Expandable`+`MarkdownContent`、`InterruptContent`
- [x] 1.7 Content block types describe：改用 `ImageContent`、`DocumentContent` 等

## 2. 清理

- [x] 2.1 確認所有測試綠燈
- [x] 2.2 刪除 `NodeContent.tsx` 的 `renderBody` export
- [x] 2.3 跑 typecheck + 全部測試
