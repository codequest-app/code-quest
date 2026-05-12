## ADDED Requirements

### Requirement: message-blocks 子目錄不存在

重組後，`chat/tool-use/message-blocks/` 目錄 SHALL 不存在。所有原本在其中的檔案 SHALL 移至正確層級。

#### Scenario: 跨層原語在 renderers 層

- **WHEN** 開發者需要使用 `CollapsibleBlock`、`RotatableChevron`、`CopyButton`
- **THEN** 可從 `chat/renderers/primitives.tsx` 或 `chat/renderers/CopyButton.tsx` import，不需要穿越 tool-use 層

#### Scenario: tool-use 專屬元件在 tool-use 根層

- **WHEN** 開發者需要使用 `ToolUseBlock`、`SystemBlocks`、`HookBlocks` 等
- **THEN** 可從 `chat/tool-use/` 根層直接 import，不需要 `message-blocks/` 子路徑

#### Scenario: import 路徑無 message-blocks 片段

- **WHEN** 任何檔案 import chat 相關元件
- **THEN** import 路徑中不包含 `message-blocks/` 片段
