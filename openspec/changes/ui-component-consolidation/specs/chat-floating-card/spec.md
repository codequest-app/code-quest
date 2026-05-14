## ADDED Requirements

- 新增 `components/chat/ui/FloatingCard.tsx`，渲染 `bg-surface border border-border rounded-lg shadow-floating p-3`
- 接受 `as` prop（預設 `'div'`）、`className`、`children`，以及 `HTMLAttributes<HTMLElement>` 的其他 props
- 不包含 `z-index`、`min-width`、`max-width`、`padding` override — 由 consumer 透過 `className` 傳入
- 取代以下地方的 inline 樣式：
  - `components/chat/compose/PermissionModePicker.tsx` — popover 外框
  - `components/chat/compose/AttachMenu.tsx` — menu 外框
  - `components/chat/conversation/MessageActionsMenu.tsx` — dropdown 外框
  - `components/chat/plan-review/PlanReviewBanner.tsx` — banner card
  - `components/chat/tool-use/HookCallbackCard.tsx` — callback card
  - `components/chat/tool-use/ToolPermissionCard.tsx` — permission card
