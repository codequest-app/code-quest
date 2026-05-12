## 1. 建立新 Primitives

- [x] 1.1 `Highlight` — SyntaxHighlighter wrapper，不帶 CopyButton，props: `lang`, `wrap`(default true), `children`
- [x] 1.2 `Copyable` — 包 children + hover CopyButton，props: `text` 或 `getText`, `children`
- [x] 1.3 `Labeled` — 左側 label + content 區域，props: `label`, `divider`, `children`
- [x] 1.4 `Pre` — `<pre>` + monospace + whitespace-pre-wrap，props: `children`, `className`
- [x] 1.5 測試：透過 ToolBody 遷移驗證（739 tests green）

## 2. 遷移 ToolUseBlock bodies

- [x] 2.1 `BashToolBody` — IN: `<Labeled><Copyable><Highlight lang="bash"></Labeled>`，OUT: `<Labeled><Copyable><OutputContent></Labeled>`
- [x] 2.2 `ReadToolBody` — `<Copyable><Highlight lang={lang}></Copyable>`
- [x] 2.3 `DefaultToolBody` — IN: `<Labeled><Copyable><Pre></Labeled>`，OUT: `<Labeled><Copyable><OutputContent></Labeled>`
- [x] 2.4 `SkillToolBody` — `<Labeled><Copyable>` 組合
- [x] 2.5 測試：739 tests green

## 3. 遷移 MarkdownContent

- [x] 3.1 MarkdownContent 內部 fenced code block 改用 `<Highlight>`（不帶 copy）
- [x] 3.2 移除 `FencedCodeWrapper` 的 CopyButton
- [x] 3.3 測試：MarkdownContent 既有測試 expect 不變或等價

## 4. 遷移 CodeBlock（向後相容）

- [x] 4.1 `CodeBlock` 改為 `<Copyable><Highlight></Copyable>` 的組合
- [x] 4.2 測試：所有使用 CodeBlock 的地方行為不變

## 5. 遷移 ToolBlockRow（向後相容）

- [x] 5.1 `ToolBlockRow` 改用 `<Labeled>` + 條件 `<Copyable>` 組合
- [x] 5.2 測試：ToolBlock 既有測試 expect 不變或等價

## 6. 整合驗證

- [x] 6.1 radix-tab-conversation live + history 測試全過
- [x] 6.2 session-history 測試全過
- [x] 6.3 MessageList 測試全過
- [x] 6.4 全 web package 測試 green（2050 tests）

## 7. ChatMessage 組合式重構

ChatMessage 內部硬編 `TruncatedContent` 和 `MarkdownContent` 的 if/else 邏輯，
應該改為由 ViewModel renderer 決定呈現方式。

- [x] 7.1 `TextContent` 負責 TruncatedContent 包裝（取代 renderTextVm）
- [x] 7.2 `ChatMessage` user + assistant 移除硬編 TruncatedContent（由 TextContent 處理）
- [x] 7.3 所有 renderXxx 重命名為 Component：TextContent、ThinkingContent、PassthroughContent、AssistantTurnContent、BlockContent、ViewModelContent
- [x] 7.4 `MarkdownContent` 內部 FencedCodeWrapper 簡化為純 `<pre>`（已完成 3.2）
- [x] 7.5 測試：2067 tests green
