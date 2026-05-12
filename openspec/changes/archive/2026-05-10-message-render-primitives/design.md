## Context

MessageList 的 render 元件各自內建多種功能（copy、highlight、scroll、label），導致組合時功能重複。例如 `CodeBlock` = highlight + copy，`ToolBlockRow` = label + copy，組合後出現多個 copy button。

現有元件：
- `CodeBlock` — SyntaxHighlighter + CopyButton（綁死）
- `ToolBlockRow` — label + copyText prop + CopyButton（綁死）
- `MarkdownContent` — markdown parse + 內部 CodeBlock（帶 copy）+ FencedCodeWrapper（又帶 copy）
- `OutputContent` — ANSI detect + pre-wrap
- `CollapsibleBlock` — expand/collapse header

## Goals / Non-Goals

**Goals:**
- 拆出單一職責的 render primitives，透過組合疊加功能
- 消除 copy button 重複（同一段內容只出現一個 copy）
- 所有 code 預設自動換行（wrapLongLines）
- TDD 重構：既有測試 expect 不變或等價
- 漸進遷移：新舊元件可並存

**Non-Goals:**
- 不改 `mergeToolResult` / `patchMeta` 的資料流（ViewModel 層抽離列為後續 change）
- 不改 message handler 邏輯
- 不改 `CollapsibleBlock`（已是純呈現）
- 不改 `CopyButton` 本身（保留為 leaf component）

## Decisions

### Primitive 層（純呈現，不帶 copy）

```
<Highlight lang="bash" wrap>     — SyntaxHighlighter，不帶 CopyButton
<Pre wrap>                       — <pre> + whitespace-pre-wrap + monospace
<Ansi>                           — ANSI → React，純轉換（已存在 AnsiContent）
```

### 功能層（可選套用）

```
<Copyable text={}>               — 包 children + hover CopyButton
<Labeled label="IN">             — 左側 label + content 區域
```

### 組合範例

```tsx
// Bash IN
<Labeled label="IN">
  <Copyable text={command}>
    <Highlight lang="bash" wrap>{command}</Highlight>
  </Copyable>
</Labeled>

// Bash OUT
<Labeled label="OUT">
  <Copyable text={output}>
    <Pre>{output}</Pre>
  </Copyable>
</Labeled>

// Read result
<Copyable text={code}>
  <Highlight lang="tsx">{code}</Highlight>
</Copyable>

// Markdown（內部 code block 不帶 copy）
<Markdown>{content}</Markdown>
```

### 遷移策略

1. 建立新 primitives（`Highlight`、`Copyable`、`Labeled`、`Pre`）
2. 用新 primitives 重寫 `BashToolBody` — 驗證既有測試通過
3. 逐一遷移 `ReadToolBody`、`EditToolBody`、`DefaultToolBody`
4. 改 `MarkdownContent` 內部 code block 用 `Highlight`（不帶 copy）
5. 舊 `CodeBlock` 改為 `Copyable` + `Highlight` 的組合（向後相容）
6. 舊 `ToolBlockRow` 改為 `Labeled` + 可選 `Copyable`（向後相容）

### Copy 規則

| 場景 | Copy 位置 | 內容 |
|------|-----------|------|
| Bash IN | `<Copyable>` 包 `<Highlight>` | command |
| Bash OUT | `<Copyable>` 包 `<Pre>` 或 `<Ansi>` | output |
| Read result | `<Copyable>` 包 `<Highlight>` | file content |
| Edit diff | 無 copy（DiffViewer 不變） | — |
| Markdown code block | 無 copy（`<Highlight>` 純呈現） | — |
| Assistant 文字 | ChatMessage 層的 copy（保留） | message.content |

## Risks / Trade-offs

- **Markdown code block 不帶 copy** — 使用者習慣在 code block 右上角看到 copy。但在 tool_use 的 OUT 裡出現 3 個 copy icon 更糟。如果後續需要，可以在 `<Markdown>` 外層加 `<Copyable>`。
- **漸進遷移** — 新舊元件並存期間 import 路徑可能混亂。用 barrel export 管理。
- **wrapLongLines 預設 true** — 某些場景（如 minified JSON）換行後可讀性更差。提供 `wrap={false}` 逃生口。
