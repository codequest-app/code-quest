## Context

目前結構：
```
chat/
├── renderers/
│   ├── Copyable.tsx          ← import CopyButton from ../tool-use/message-blocks/
│   └── ...
├── conversation/
│   ├── ThinkingBlock.tsx     ← import RotatableChevron from ../tool-use/message-blocks/primitives
│   ├── SubagentChildren.tsx  ← import RotatableChevron from ../tool-use/message-blocks/primitives
│   ├── ToolGroupSummary.tsx  ← import RotatableChevron from ../tool-use/message-blocks/primitives
│   └── NodeContent.tsx       ← import CollapsibleBlock, index from ../tool-use/message-blocks/
└── tool-use/
    └── message-blocks/       ← 混放跨層原語 + tool-use 專屬元件
        ├── primitives.tsx
        ├── CopyButton.tsx
        ├── message-type-icons.tsx
        ├── ToolUseBlock.tsx
        ├── SystemBlocks.tsx
        └── ...
```

目標結構：
```
chat/
├── renderers/
│   ├── primitives.tsx        ← 從 message-blocks 移來（CollapsibleBlock、RotatableChevron）
│   ├── CopyButton.tsx        ← 從 message-blocks 移來
│   └── ...
└── tool-use/
    ├── message-type-icons.tsx ← 從 message-blocks 移來
    ├── ToolUseBlock.tsx      ← 從 message-blocks 移來
    ├── SystemBlocks.tsx
    ├── HookBlocks.tsx
    ├── ContentRenderer.tsx
    ├── TaskBadge.tsx
    ├── ToolBlock.tsx
    ├── ToolResultBlock.tsx
    ├── ToolUseHeader.tsx
    ├── AlertBanner.tsx
    └── index.ts
```

## Goals / Non-Goals

**Goals:**
- 拿掉 `message-blocks/` 子目錄這一層
- 跨層原語（`primitives.tsx`、`CopyButton.tsx`）移到 `renderers/`
- tool-use 專屬元件提升到 `tool-use/` 根層
- 所有 import 正確更新

**Non-Goals:**
- 不改任何元件的實作邏輯
- 不重命名元件或 export
- 不調整 `__tests__` 和 `stories` 以外的結構

## Decisions

### primitives.tsx → renderers/

`CollapsibleBlock`、`RotatableChevron`、`StatusLine`、`CenterDivider`、`AnsiContent`、`OutputContent`、`parseFilePathsInContent` 這些都是純 UI 原語，被 conversation/ 和 renderers/ 層直接引用，不屬於 tool-use 層。

### CopyButton.tsx → renderers/

`Copyable.tsx` 已在 renderers/，且 `CopyButton` 是通用 UI 元件，不是 tool-use 專屬。

### message-type-icons.tsx → tool-use/

只被 `NodeContent`（conversation 層）和 tool-use 內部使用，但屬於 tool-use 的展示邏輯，不算跨層原語。移到 `tool-use/` 根層。

### index.ts 保留位置

`index.ts` 移到 `tool-use/index.ts`，繼續 re-export 給 `NodeContent` 使用。

## Risks / Trade-offs

- Import 路徑大量更新，需逐一確認不遺漏
- stories 和 tests 也要同步更新

## Migration Plan

1. 移動跨層原語：`primitives.tsx`、`CopyButton.tsx` → `renderers/`
2. 移動 tool-use 專屬：其餘檔案 → `tool-use/`
3. 更新所有 import（含 stories、tests）
4. 刪除 `message-blocks/` 目錄
5. 跑 typecheck + tests 確認
