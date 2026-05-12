## Why

MessageList 的 render 元件（CodeBlock、ToolBlockRow、MarkdownContent）各自內建 copy button、syntax highlight、scroll 等功能，導致組合時重複出現 — 一個 Bash tool_use 展開後最多同時出現 3 個 copy icon。元件無法單獨疊加功能，每層都是「全包式」設計。

同時，原始 protocol 訊息在 handler 階段就被 `mergeToolResult` 和 `patchMeta` 汙染（tool_result 被吃進 tool_use.meta.result），使得 render 層無法獨立取得原始資料，也難以換一種呈現方式。

## What Changes

- 拆出組合式 render primitives：`<Highlight>`（純 syntax highlight）、`<Copyable>`（加 copy 功能）、`<Labeled>`（加 IN/OUT label）、`<Pre>`（pre-wrap 文字）
- 現有 `CodeBlock` 改為用新 primitives 組合，不再內建 copy
- 現有 `ToolBlockRow` 改為用 `<Labeled>` + 可選 `<Copyable>` 組合
- `MarkdownContent` 內部 code block 使用 `<Highlight>` 純呈現，不帶 copy
- `BashToolBody`、`ReadToolBody` 等用新 primitives 重新組合，每層只一個 copy
- `<Highlight>` 預設 `wrapLongLines=true`（自動換行）
- 保留 `mergeToolResult` 和 `patchMeta` 現有行為，ViewModel 層抽離列為後續 change

## Capabilities

### New Capabilities
- `render-primitives`: 組合式 render primitives（Highlight、Copyable、Labeled、Pre），每個只做一件事，透過組合疊加功能

### Modified Capabilities

## Impact

- `apps/web/src/components/chat/renderers/CodeBlock.tsx` — 拆分為 Highlight + Copyable 組合
- `apps/web/src/components/chat/renderers/MarkdownContent.tsx` — 內部 code block 改用 Highlight
- `apps/web/src/components/chat/tool-use/message-blocks/ToolBlock.tsx` — ToolBlockRow 改用 Labeled + Copyable
- `apps/web/src/components/chat/tool-use/message-blocks/ToolUseBlock.tsx` — BashToolBody 等用新 primitives
- `apps/web/src/components/chat/tool-use/message-blocks/primitives.tsx` — OutputContent 保留
- `apps/web/src/components/chat/tool-use/message-blocks/CopyButton.tsx` — 保留不變，被 Copyable 包裝
- TDD 重構：所有既有測試的 expect 不變或等價
