## TDD 規則（每個 task 都適用）

```
RED   → 先寫 failing test，用 renderWithChannel + fakeSummoner + real JSON segment
GREEN → 寫最少的 code 讓 test 過
CHECK → 跑 vitest 確認全綠，再標 [x]
```

- assert 只用 DOM：`screen.getByText`, `getByTestId`, `getByRole`, `compareDocumentPosition`
- `expect` 永遠不改 — test 失敗就修 code
- localStorage 相關 test 必須 `beforeEach/afterEach` 清除 `cc-office:message-visibility`
- icon 相關 task（10, 10b）純 UI，不需要 test，直接實作

---

## 目標示意圖

```
┌─────────────────────────────────────────────────────────┐
│  [ All ]  [ Messages ]  [ Actions ]   ← tab bar 在最頂  │
├─────────────────────────────────────────────────────────┤
│  🔍  Search messages or type a command…                  │
├─────────────────────────────────────────────────────────┤
│                          ← All tab 內容順序 ↓           │
│  ── MESSAGES ──────────────────────────────────────────  │
│  [TEXT     ]  Hello from assistant                      │  ← badge 固定寬度
│  [TOOL_USE ]  bash: ls -la                              │  ← 內容對齊
│  [RESULT   ]  Completed in 2.3s                         │
│                                                         │
│  ── FILTERS ───────────────────────────────────────────  │
│  [💬icon] 對話                              [  ON  ]    │  ← SVG icon 靠左
│    [text ✓] [thinking ✓] [redacted ✓]                   │  ← 展開後 inline pills
│  [🔧icon] 工具 (partial)                    [  ∂  ]    │  ← ∂ = orange border
│    [tool_use ✓] [tool_result ✗]                         │
│  [⚙icon]  系統                              [  ON  ]    │
│  [🪝icon] Hooks                             [ OFF  ]    │
│  [🐛icon] Debug                             [ OFF  ]    │
│  [?icon]  其他  ← 動態，有未知 type 才出現  [  ON  ]    │
│                                                         │
│  ── PANELS ─────────────────────────────────────────    │
│  Raw Event Panel                            [ OFF  ]    │
├─────────────────────────────────────────────────────────┤
│  12 messages                        ↑↓ navigate · esc  │
└─────────────────────────────────────────────────────────┘
```

VisibilityGroupRow 細節：
```
  ┌────────────────────────────────────────────────────┐
  │ [svg] 對話  ← 點 label 展開/收合             [ ON ]│
  │   [text ✓] [thinking ✓] [redacted_thinking ✓]      │  ← inline pills
  └────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────┐
  │ [svg] 工具 (partial)                          [ ∂ ]│  ← orange border, 無背景
  │   [tool_use ✓] [tool_result ✗]                     │
  └────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────┐
  │ [svg] Hooks                                  [OFF] │  ← 收合，不顯示 pills
  └────────────────────────────────────────────────────┘
```

---

## 已完成

- [x] 1.1 MessageVisibilityContext — failing tests（default state, toggleGroup, toggleType, localStorage）
- [x] 1.2 建立 `MessageVisibilityContext.tsx`（provider, hook, LS key `cc-office:message-visibility`）
- [x] 1.3 Wire MessageVisibilityContext 進 ChannelProvider
- [x] 2.1 MessageList filtering — failing tests
- [x] 2.2 `MessageList.tsx` 讀 `useMessageVisibility`，filter messages
- [x] 3.1 `HeaderBar.test.tsx` 更新：移除舊 props tests，加 onOpenCommandPalette test
- [x] 3.2 `HeaderBar.tsx` 簡化：移除舊 props，加 onOpenCommandPalette，單一 ⌘K button
- [x] 4.1 CommandPalette failing tests（open/close, search, keyboard nav, onJumpTo）
- [x] 4.2 建立 `CommandPalette.tsx`（overlay shell, tab bar, search input）
- [x] 4.3 Messages tab 實作（search visible messages only）
- [x] 5.1 Actions tab failing tests（panel toggle, group rows, toggleGroup, pills, toggleType, ∂）
- [x] 5.2 建立 `ActionsTab.tsx`（Panels + Message Visibility sections）
- [x] 5.3 建立 `VisibilityGroupRow.tsx`（group toggle + chevron + inline pills）
- [x] 5.4 Wire ActionsTab 進 CommandPalette Actions tab
- [x] 6.1 All tab failing tests（flat rows + recent messages + search filter）
- [x] 6.2 All tab 實作（flat group toggles above recent 8 messages）
- [x] 7.1 `ChatPanel.tsx` 接線（CommandPalette, onOpenCommandPalette, Raw Panel toggle）
- [x] 17.1 刪除 `SpotlightSearch.tsx` + test
- [x] 17.2 刪除 `SpotlightFilterBar.tsx` + test
- [x] 17.3 移除 `DEFAULT_ON_TYPES` dead export

---

## 9. Extension 對齊預設值 + 動態 `其他` group（TDD）

- [x] 9.1 確認 `MessageVisibilityContext` 預設值：`tool_result` 必須是 ON（extension 顯示它）；只有 hooks/debug 預設 OFF。若有差異更新既有 tests
- [x] 9.2 **RED** — 寫 failing tests：other group 預設 none、registerUnknownType 加入並啟用、toggleGroup other 關閉
- [x] 9.3 **GREEN** — 在 `MessageVisibilityContext` 加 `other` group + `registerUnknownType` + `unknownTypes`
- [x] 9.4 **GREEN** — 更新 `MessageList.tsx`：呼叫 `registerUnknownType`，filter 時 `unknownTypes.has(m.type)` 也通過

## 10. HeaderBar — ⌘K 換 Heroicons SVG（無需 test）

- [x] 10.1 安裝 `@heroicons/react`
- [x] 10.2 在 `HeaderBar.tsx` 改用 `MagnifyingGlassIcon`（outline 24px），`title="Command Palette (⌘K)"`

## 10b. Visibility Group 換 Heroicons SVG（無需 test）

- [x] 10b.1 確認 `@heroicons/react` 已安裝
- [x] 10b.2 `VISIBILITY_GROUPS` 的 `emoji` 欄位換成 `icon: ComponentType`（ChatBubbleLeftRightIcon / WrenchScrewdriverIcon / Cog6ToothIcon / BoltIcon / BugAntIcon）；`OTHER_GROUP_ICON = QuestionMarkCircleIcon`
- [x] 10b.3 `VisibilityGroupRow.tsx` 渲染 Heroicons SVG，顏色繼承父層 currentColor

## 11. JetBrains 風格 VisibilityGroupRow 重寫（TDD）

- [x] 11.1 **RED** — 更新 `ActionsTab.test.tsx`：label text 取代 emoji、ON/OFF/∂ textContent 斷言、無 group-chevron
- [x] 11.2 **GREEN** — 重寫 `VisibilityGroupRow.tsx`：Heroicons SVG icon + label（group-label）靠左點擊展開，ON/OFF/∂ pill（group-toggle）靠右
- [x] 11.3 **GREEN** — `ActionsTab.test.tsx` + `CommandPaletteAllTab.test.tsx` 全綠
- [x] 11.4 **GREEN** — Flat mode 無 pills；∂ pill 呼叫 `onPartialClick` 切到 actions tab

## 12. Messages tab — type badge 對齊（TDD）

- [x] 12.1 badge span 加 `min-width: 90px; text-align: center`（jsdom 無法驗證座標，跳過 DOM 位置 test）

## 13. CommandPalette 佈局 — tab bar 移到 search 上方（TDD）

- [x] 13.1 **RED** — `compareDocumentPosition` 驗證 tablist 在 search input 之前
- [x] 13.2 **GREEN** — `CommandPalette.tsx` 調整順序：`[tab bar] → [search input] → [content]`

## 14. All tab 內容順序：Messages → Filters → Panels（TDD）

- [x] 14.1 **RED** — `compareDocumentPosition` 驗證 messages button 在 group-row 之前
- [x] 14.2 **GREEN** — 拆分 `ActionsTab` 為 `<FiltersSection>` + `<PanelsSection>`；All tab 改為：messages → `<FiltersSection flat>` → `<PanelsSection>`

## 15. RawEventPanel inline filter bar（TDD）

- [x] 15.1 已有 `RawEventPanel.test.tsx` 覆蓋 filter chips（sorted by count, checked/unchecked）
- [x] 15.2 `RawEventFilterBar.tsx` 已實作（inline, horizontal scroll, count badge）
- [x] 15.3 `RawEventPanel.tsx` 已使用 `RawEventFilterBar`（無 FilterPopover）

## 16. All tab partial 狀態導航（TDD）

- [x] 16.1 **RED** — `CommandPaletteAllTab.test.tsx` 加 ∂ pill 點擊切 actions tab test
- [x] 16.2 **GREEN** — `FiltersSection` 傳 `onPartialClick={() => setActiveTab('actions')}` 給 `VisibilityGroupRow`

## 17. 最終收尾

- [x] 17.1 刪除 `SpotlightSearch.tsx` + test
- [x] 17.2 刪除 `SpotlightFilterBar.tsx` + test
- [x] 17.3 移除 `DEFAULT_ON_TYPES` dead export
- [x] 17.4 全套 943 tests 全綠
