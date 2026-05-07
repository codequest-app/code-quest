## MobileNav

### 顯示條件
- 只在 mobile（< 768px）顯示
- `fixed bottom-0 left-0 right-0`，高度 `h-14`（56px）
- `z-40`（低於 CommandPalette z-50，高於一般內容）

### 按鈕（3 個）
| Icon | 功能 |
|------|------|
| 💬 Chat bubble | 無動作（目前已在聊天頁，可作 active 狀態標示）|
| 📋 Sessions | 開啟 SessionDropdown（resumeConversation）|
| ☰ Menu | 展開 Sidebar drawer |

### 樣式
- 背景：`bg-surface border-t border-border`
- 每個按鈕：`flex-1 flex flex-col items-center justify-center gap-0.5 text-text-muted`
- Active 狀態（目前 tab）：`text-accent`

### 測試
- 在 mobile breakpoint 下顯示
- 在 tablet/desktop 下不顯示（`hidden md:hidden` or 條件 render）
- Menu 按鈕點擊觸發 sidebar drawer 開啟
- Sessions 按鈕點擊觸發 onResumeConversation
