## 1. 移動跨層原語到 renderers/

- [x] 1.1 複製 `message-blocks/primitives.tsx` → `renderers/primitives.tsx`
- [x] 1.2 複製 `message-blocks/CopyButton.tsx` → `renderers/CopyButton.tsx`
- [x] 1.3 更新 `renderers/Copyable.tsx`：import CopyButton 從 `./CopyButton.tsx`
- [x] 1.4 更新 `conversation/ThinkingBlock.tsx`：import RotatableChevron 從 `../renderers/primitives.tsx`
- [x] 1.5 更新 `conversation/SubagentChildren.tsx`：同上
- [x] 1.6 更新 `conversation/ToolGroupSummary.tsx`：同上
- [x] 1.7 更新 `conversation/NodeContent.tsx`：import CollapsibleBlock 從 `../renderers/primitives.tsx`
- [x] 1.8 更新 `tool-use/__tests__/CollapsibleBlock.test.tsx`：import 從 `../renderers/primitives.tsx`

## 2. 移動 tool-use 專屬檔案到 tool-use/ 根層

- [x] 2.1 移動 `message-blocks/message-type-icons.tsx` → `tool-use/message-type-icons.tsx`
- [x] 2.2 移動 `message-blocks/AlertBanner.tsx` → `tool-use/AlertBanner.tsx`
- [x] 2.3 移動 `message-blocks/TaskBadge.tsx` → `tool-use/TaskBadge.tsx`
- [x] 2.4 移動 `message-blocks/ToolBlock.tsx` → `tool-use/ToolBlock.tsx`
- [x] 2.5 移動 `message-blocks/ToolUseHeader.tsx` → `tool-use/ToolUseHeader.tsx`
- [x] 2.6 移動 `message-blocks/ContentRenderer.tsx` → `tool-use/ContentRenderer.tsx`
- [x] 2.7 移動 `message-blocks/ToolResultBlock.tsx` → `tool-use/ToolResultBlock.tsx`
- [x] 2.8 移動 `message-blocks/HookBlocks.tsx` → `tool-use/HookBlocks.tsx`
- [x] 2.9 移動 `message-blocks/SystemBlocks.tsx` → `tool-use/SystemBlocks.tsx`
- [x] 2.10 移動 `message-blocks/ToolUseBlock.tsx` → `tool-use/ToolUseBlock.tsx`
- [x] 2.11 移動 `message-blocks/index.ts` → `tool-use/index.ts`

## 3. 更新移動後檔案的內部 import

- [x] 3.1 `tool-use/ContentRenderer.tsx`：primitives 改從 `../renderers/primitives.tsx`（alias `@/components/chat/renderers/primitives`）
- [x] 3.2 `tool-use/HookBlocks.tsx`：primitives、message-type-icons 改相對路徑
- [x] 3.3 `tool-use/SystemBlocks.tsx`：primitives、message-type-icons、AlertBanner 改相對路徑
- [x] 3.4 `tool-use/ToolResultBlock.tsx`：ContentRenderer、primitives 改相對路徑
- [x] 3.5 `tool-use/ToolUseBlock.tsx`：AlertBanner、ContentRenderer、primitives、TaskBadge、ToolBlock、ToolUseHeader 改相對路徑

## 4. 更新外部 import 路徑

- [x] 4.1 `conversation/NodeContent.tsx`：index、message-type-icons 改從 `../tool-use/index.ts`、`../tool-use/message-type-icons.tsx`
- [x] 4.2 `renderers/content/ToolUseContent.tsx`：ToolUseBlock 改從 `@/components/chat/tool-use/ToolUseBlock`
- [x] 4.3 `tool-use/__tests__/ToolBlock.test.tsx`：import 從 `../ToolBlock.tsx`

## 5. 移動 stories 和 tests

- [x] 5.1 移動 `message-blocks/__tests__/` 內所有測試到 `tool-use/__tests__/`，更新 import 路徑
- [x] 5.2 移動 `message-blocks/*.stories.tsx` 到 `tool-use/`，更新 import 路徑

## 6. 清理

- [x] 6.1 刪除 `message-blocks/primitives.tsx`、`message-blocks/CopyButton.tsx`（原始檔）
- [x] 6.2 刪除 `message-blocks/` 目錄（應已為空）
- [x] 6.3 跑 typecheck：`pnpm --filter @code-quest/web exec tsc --noEmit`
- [x] 6.4 跑全部 web tests 確認無 regression
