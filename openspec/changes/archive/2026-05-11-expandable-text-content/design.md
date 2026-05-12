## Context

目前 `TruncatedContent` 元件以 DOM 高度判斷是否截斷，並提供 Show more / Show less。問題有二：
1. 截斷邏輯耦合在 `TextContent` 內部，違反單一職責（內容元件不應知道自己要被截斷）
2. `AssistantTurnContent` 的 text block 和 `StreamlinedTextContent` 完全漏掉截斷

## Goals / Non-Goals

**Goals:**
- 改名 `TruncatedContent` → `Expandable`（名稱描述行為而非實作）
- 截斷決策統一在 caller 層（`NodeContent` / `AssistantTurnContent`），內容元件不感知
- 補全 assistant text / fast mode text 的截斷

**Non-Goals:**
- 不改 `Expandable` 的內部實作（DOM 高度量測邏輯維持不變）
- 不對 tool_use / thinking / image 等類型加截斷

## Decisions

### 改名：`TruncatedContent` → `Expandable`

`TruncatedContent` 描述「怎麼做」（截斷），`Expandable` 描述「能做什麼」（可展開）。語意更貼近使用意圖，與 Radix `Collapsible` 命名風格一致。

### 截斷決策移到 caller 層

```
// Before: TextContent 自己知道要截斷
function TextContent({ message }) {
  return <TruncatedContent><MarkdownContent /></TruncatedContent>
}

// After: caller 決定是否截斷，TextContent 只管 render
function NodeContent({ message }) {
  if (message.type === 'text') return (
    <Expandable><TextContent message={message} /></Expandable>
  )
}
```

替代方案：在 `TextContent` 加 `expandable` prop — 被否決，因為 prop 讓內容元件仍然感知截斷邏輯。

### 截斷對象：只有 text 類型

- `type === 'text'`（user / assistant message）→ 包 `Expandable`
- `block.type === 'text'`（AssistantTurn 內的 text block）→ 包 `Expandable`
- `StreamlinedTextContent`（fast mode）→ 包 `Expandable`
- `tool_use` / `thinking` / `tool_result` / `image` → 不包（各有自己的收合機制）

## Risks / Trade-offs

- DOM 高度量測在 streaming 過程中可能不穩定（內容還在增長）→ 可接受，streaming 完成後高度才穩定，Show more 按鈕延遲出現是合理行為

## Migration Plan

1. 改名檔案 `TruncatedContent.tsx` → `Expandable.tsx`，export 名稱同步改
2. `TextContent` 移除內部 `Expandable`
3. `NodeContent` / `AssistantTurnContent` / `SystemBlocks` 在 text 類型加上 `Expandable`
4. 更新所有 import
5. 跑既有測試確認無 regression
