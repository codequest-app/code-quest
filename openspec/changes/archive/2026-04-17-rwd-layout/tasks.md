# RWD Layout Tasks

## Phase 1 — 基礎建設

- [x] `useBreakpoint` hook（TDD）
  - spec: specs/breakpoints/spec.md
  - file: `packages/client/src/hooks/useBreakpoint.ts`

- [x] MessageList max-width（TDD）— skipped, not needed
  - 在 message content wrapper 加 `max-w-3xl mx-auto`
  - file: `packages/client/src/components/MessageList.tsx`

## Phase 2 — Layout Shell

- [x] WorkspaceLayout breakpoint 切換
  - Desktop：現有三欄
  - Tablet：ActivityBar + Sidebar hidden（overlay drawer）+ EditorArea 全寬
  - Mobile：ActivityBar hidden + EditorArea 全寬
  - file: `packages/client/src/components/WorkspaceLayout.tsx`

- [x] Sidebar Drawer（tablet/mobile）
  - slide-in from left + backdrop
  - file: `packages/client/src/components/WorkspaceLayout.tsx`（inline）

## Phase 3 — Mobile Nav

- [x] MobileNav 元件（TDD）— skipped, replaced by Menu button in mobile top bar
  - spec: specs/mobile-nav/spec.md
  - file: `packages/client/src/components/MobileNav.tsx`

- [x] ChatPanel 整合 MobileNav — skipped, not needed
  - mobile 下 ChatInputArea bottom 預留 MobileNav 高度
  - MobileNav Sessions 按鈕連接 openResumeOverlay
  - file: `packages/client/src/components/ChatPanel.tsx`

## Phase 4 — RawEventPanel overlay（mobile）

- [x] RawEventPanel mobile overlay
  - mobile：`fixed inset-0 z-50`
  - tablet/desktop：維持 `w-72 shrink-0`
  - file: `packages/client/src/components/ChatPanel.tsx`
