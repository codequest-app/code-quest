## Why

cc-office UI 與 extension v2.1.45 在多個元件上有視覺和功能差異，需要逐步對齊以降低使用者在兩端切換時的認知落差。

## What Changes

### Phase 1: Permission Prompt 對齊（優先）
- ToolPermissionBanner 改為 extension 風格的 inline dialog：background overlay、tool name header、collapsible input JSON details、numbered keyboard shortcuts (1=Yes, 2=Allow session, 3=No)、"Tell Claude what to do instead" input、"Esc to cancel" hint

### Phase 2: Elicitation 多問題支援
- ElicitationDialog 加入 tab navigation（navTab），支援多問題跳轉、radio/checkbox options、answered 狀態標記

### Phase 3: Diff Review 對齊
- ContentPreviewPanel 改為 modal overlay（匹配 extension 的 mO modal），保留 DiffViewer 但改 layout

### Phase 4: Tool Use IN/OUT Grid
- Message blocks 加入 IN/OUT label grid layout，bash 工具有專門 styling

### Phase 5: Plugins/Marketplace 對齊
- PluginsPanel 擴充為完整 marketplace（search, tabs, install counts, scope badges）

### Phase 6: Context Menu
- 新增右鍵 context menu（message actions: copy, rewind, fork）

### Phase 7: Worktree Banner 對齊
- WorktreeBanner 加入 "Open worktree" 功能

## Capabilities

### New Capabilities
- `context-menu`: Right-click context menu for messages

### Modified Capabilities
- `client`: Permission prompt, elicitation, diff review, tool use blocks, plugins, worktree banner UI changes

## Impact

- `apps/web/src/components/ToolPermissionBanner.tsx` — 主要重構
- `apps/web/src/components/OptionButton.tsx` — 可能廢棄
- `apps/web/src/components/PermissionHeader.tsx` — 重構
- `apps/web/src/components/ElicitationDialog.tsx` — 加 tab navigation
- `apps/web/src/components/ContentPreviewPanel.tsx` — modal layout
- `apps/web/src/components/message-blocks/` — IN/OUT grid
- `apps/web/src/components/PluginsPanel.tsx` — marketplace
- 新增 ContextMenu component
