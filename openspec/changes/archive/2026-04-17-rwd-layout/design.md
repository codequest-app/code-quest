## Context

cc-office 目前版面假設桌機固定視窗，三欄結構：ActivityBar（40px）+ Sidebar（260px）+ EditorArea（flex-1）。未來需支援 mobile/tablet，版面需要根據螢幕尺寸重排。

## Goals / Non-Goals

**Goals:**
- Mobile（< 768px）可正常使用核心功能（聊天、送訊息）
- Tablet（768–1023px）Sidebar 可收合，主要內容區不被壓縮
- Desktop（≥1024px）維持現有三欄版面，不破壞現有使用體驗
- MessageList 在超寬螢幕有合理的最大行寬

**Non-Goals:**
- 不針對觸控優化所有互動細節（例如 hover state 不改）
- 不重新設計 UI 風格，只處理版面適應性
- 不處理 landscape mobile 的特殊情況

## Breakpoints

使用 Tailwind 預設 breakpoint：

| Name | min-width | 用途 |
|------|-----------|------|
| (base) | 0px | Mobile portrait |
| `sm` | 640px | Mobile landscape / 小平板 |
| `md` | 768px | 平板 |
| `lg` | 1024px | 桌機 |

## 各 Breakpoint 版面行為

### Mobile（< 768px）
```
┌─────────────────────────┐
│ TabBar (水平滾動)         │
├─────────────────────────┤
│                         │
│  MessageList            │
│  (全寬)                  │
│                         │
├─────────────────────────┤
│ ChatInputArea           │
├─────────────────────────┤
│ MobileNav (底部)         │
│ [Chat] [Sessions] [...] │
└─────────────────────────┘
```
- ActivityBar：隱藏（`hidden md:flex`）
- Sidebar：隱藏，改由 MobileNav 的 drawer 展開
- ChatInputArea：`absolute bottom-[nav-height]`（預留 MobileNav 空間）
- RawEventPanel：全螢幕 overlay（`fixed inset-0`）

### Tablet（768px–1023px）
```
┌────┬────────────────────┐
│ AB │ TabBar             │
│    ├────────────────────┤
│    │                    │
│    │  MessageList       │
│    │                    │
│    ├────────────────────┤
│    │ ChatInputArea      │
└────┴────────────────────┘
```
- ActivityBar：顯示（w-10）
- Sidebar：預設隱藏，點 ActivityBar icon 展開為 overlay drawer
- RawEventPanel：overlay drawer（`absolute` 或 `fixed`）

### Desktop（≥1024px）
```
┌────┬──────────┬─────────────────────┐
│ AB │ Sidebar  │ EditorArea          │
│    │ (260px)  │ TabBar              │
│    │          ├─────────────────────┤
│    │          │ MessageList         │
│    │          │ (max-w-3xl center)  │
│    │          ├─────────────────────┤
│    │          │ ChatInputArea       │
└────┴──────────┴─────────────────────┘
```
- 維持現有行為，Sidebar 常駐顯示
- RawEventPanel：側邊 panel（現有 w-72）

## Decisions

### useBreakpoint hook
```typescript
// apps/web/src/hooks/useBreakpoint.ts
export function useBreakpoint() {
  // 回傳 'mobile' | 'tablet' | 'desktop'
  // 基於 window.matchMedia + resize event
}
```

### MobileNav
```
apps/web/src/components/MobileNav.tsx
```
- 固定在底部，高度 56px
- 3–4 個 icon button：Chat（目前對話）、Sessions（歷史）、Sidebar（drawer toggle）
- 不需要文字 label（icon 夠清楚）

### Sidebar Drawer（tablet/mobile）
- 點 MobileNav 或 ActivityBar 的 Sidebar icon 展開
- 從左側 slide in，有半透明 backdrop
- 點 backdrop 收合

### MessageList max-width
- 加 `max-w-3xl mx-auto`（768px）到 message content wrapper
- ChatInputArea 的 `max-w-[680px]` 維持不變，兩者視覺上對齊

## 實作順序

1. `useBreakpoint` hook（最底層，無 UI 依賴）
2. `MessageList` max-width（最簡單，獨立改動）
3. `WorkspaceLayout` breakpoint-aware 切換（ActivityBar/Sidebar 隱藏邏輯）
4. `MobileNav` 元件
5. Sidebar drawer 行為
6. `ChatPanel` RawEventPanel overlay（mobile）
