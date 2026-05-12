# expandable-text-content Specification

## Purpose
TBD - created by archiving change expandable-text-content. Update Purpose after archive.
## Requirements
### Requirement: 長文字訊息自動截斷並可展開

系統 SHALL 對超過高度上限的 text 類型訊息（user 和 assistant）自動截斷，並提供展開按鈕。截斷邏輯 SHALL 由 caller 層以組合方式套用，內容元件本身不感知截斷。

#### Scenario: user text 訊息過長時顯示展開按鈕

- **WHEN** user text 訊息內容高度超過 600px
- **THEN** 訊息截斷於 600px 並顯示「Show more」按鈕

#### Scenario: assistant text block 過長時顯示展開按鈕

- **WHEN** assistant turn 中的 text block 高度超過 600px
- **THEN** 該 block 截斷於 600px 並顯示「Show more」按鈕

#### Scenario: fast mode（StreamlinedTextContent）過長時顯示展開按鈕

- **WHEN** streamlined text content 高度超過 600px
- **THEN** 截斷並顯示「Show more」按鈕

#### Scenario: 點擊展開後顯示完整內容

- **WHEN** 使用者點擊「Show more」
- **THEN** 顯示完整內容，按鈕改為「Show less」

#### Scenario: tool_use / thinking / tool_result 不截斷

- **WHEN** 訊息類型為 tool_use、thinking、tool_result 或 image
- **THEN** 不套用截斷，各類型維持原有收合機制

### Requirement: Expandable 元件以組合方式使用

`Expandable` SHALL 作為獨立的 wrapper 元件，由外層 caller 決定是否套用，內容元件（`TextContent`、`MarkdownContent`）本身不引用 `Expandable`。

#### Scenario: TextContent 不自行截斷

- **WHEN** `TextContent` 被 render
- **THEN** `TextContent` 本身不包含 `Expandable` 邏輯，純粹 render 內容

