# Proposal: Migrate to Shiki

## Problem

`react-syntax-highlighter` 透過 `refractor` 打包所有語言 grammar，佔 index bundle **959 KB**（佔總 1,496 KB 的 64%）。即使只需要少數語言也全部載入。

## Solution

改用 `shiki` — VS Code 內建的語法高亮引擎。語言 grammar 是 WASM，按需 lazy load，不打入 main bundle。

## Scope

- 替換 CodeBlock.tsx 和 FileViewer.tsx 的 `react-syntax-highlighter` → `shiki`
- 移除 `react-syntax-highlighter` 依賴
- Bundle size 預計從 ~1,500 KB 降到 ~600 KB
