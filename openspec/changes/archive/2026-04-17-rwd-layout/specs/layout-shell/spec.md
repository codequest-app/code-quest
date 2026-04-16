## Layout Shell（WorkspaceLayout RWD）

### 行為

**Desktop（≥1024px）**
- 現有三欄版面不變：ActivityBar（40px）+ Sidebar（260px）+ EditorArea（flex-1）

**Tablet（768–1023px）**
- ActivityBar 顯示
- Sidebar 預設隱藏，點 ActivityBar icon 展開為 overlay drawer（從左側 slide in，有 backdrop）
- EditorArea 佔滿 ActivityBar 以外的全部寬度

**Mobile（< 768px）**
- ActivityBar 隱藏
- Sidebar 隱藏（由 MobileNav drawer 取代）
- EditorArea 全寬
- MobileNav 固定在底部（h-14，56px）
- ChatPanel 的 ChatInputArea absolute bottom 需預留 MobileNav 高度（bottom-[calc(1rem+56px)]）

### MessageList max-width
- message content wrapper 加 `max-w-3xl mx-auto`（768px）
- 只影響內容的橫向寬度，scroll container 本身仍全寬

### Sidebar Drawer（tablet/mobile）
- 從左側 translate-x slide in（`-translate-x-full` → `translate-x-0`）
- 有半透明 backdrop（`bg-black/40`）
- 點 backdrop 或按 Esc 收合
- 寬度：Sidebar 原本的 260px

### RawEventPanel（mobile）
- Mobile 下改為 `fixed inset-0 z-50` 全螢幕 overlay
- Tablet/Desktop 維持原本 `w-72 shrink-0` 側邊 panel
