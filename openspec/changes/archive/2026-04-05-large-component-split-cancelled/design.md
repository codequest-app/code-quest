## Context

React Compiler 處理 memoization，不需要手動 useCallback/useMemo。拆分只需把邏輯移到新檔案，不影響 render 行為。

## Goals / Non-Goals

**Goals:**
- 每個主檔案低於 ~200 LOC
- 提取的 helper/component 可獨立測試
- 保持所有現有 test expect 不變

**Non-Goals:**
- 不改元件的 public API（props interface）
- 不改 Context 架構（那是另一個 change）
- 不加新測試（除非拆出的 helper 值得獨立測試）

## Decisions

### 1. CommandMenu — 提取 menu items builder

`command-menu-items.tsx` 已存在（281 LOC）負責 items 定義。CommandMenu 自身的 filtering + keyboard nav + render 仍 ~444 LOC。
- 提取 `useCommandMenuKeyboard` 到 `command-menu-keyboard.ts`（keyboard event handler）
- 提取 filter/search logic 到 `command-menu-filter.ts`

### 2. ManageMcpDialog — 提取 helpers + badge

- 提取 `mcp-status-helpers.ts`：scopeLabel, inferScope, groupByScope, statusIcon, statusLabel, statusBadgeCls
- 提取 `McpStatusBadge.tsx`：PlainStatusBadge + RichStatusBadge 合成一個

### 3. ComposeToolbar — 提取 dialog section

- 提取 `ComposeDialogs.tsx`：6 個 Suspense lazy dialog 的 render section
- ComposeToolbar 只保留 toolbar buttons + state

### 4. ComposeInput — 提取 mention logic

- 提取 `use-mention.ts`：mention query detection + search + keyboard handling
- ComposeInput 只保留 textarea + layout

## Risks / Trade-offs

- 過度拆分會增加 import 複雜度 → 只拆明確獨立的邏輯塊
- 拆 hook 需確認 React Compiler 相容 → 避免新增 useCallback/useMemo
