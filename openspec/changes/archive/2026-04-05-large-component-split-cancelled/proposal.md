## Why

Client 有 4 個檔案超過 300 LOC，違反單一職責且降低可維護性：
- CommandMenu.tsx (444) — menu building、keyboard nav、filtering、render 混在一起
- ManageMcpDialog.tsx (380) — status helpers、badge components、grouping、3 種 view mode
- ComposeToolbar.tsx (336) — 6 個 lazy dialog、MCP refresh、speech、toolbar UI
- ComposeInput.tsx (290) — mention detection、keyboard handler、attachment UI

## What Changes

- 從 CommandMenu 提取 keyboard navigation hook 和 menu filtering 邏輯
- 從 ManageMcpDialog 提取 status helpers + badge components
- 從 ComposeToolbar 提取 dialog orchestration 或 MCP refresh
- 從 ComposeInput 提取 mention logic + keyboard handler
- 每個拆分後主檔案應低於 200 LOC

## Capabilities

### New Capabilities

（無新功能，純拆分重構）

### Modified Capabilities

（無 spec-level 行為變更）

## Impact

- `packages/client/src/components/` — 新增子元件檔案
- 所有現有測試不改 expect
- Storybook stories 可能需要更新 import
