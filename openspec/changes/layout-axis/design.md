## Context

`usePreferencesStore` 已有 `layout: 'a' | 'b'` + `setLayout`，但是 dead store field — 沒人寫、沒人讀、沒 UI、沒 CSS。這是 `preferences-axes-refactor` 設計時明確預留的 Phase 2 軸。

## Goals / Non-Goals

**Goals**
- 補齊 layout 軸的完整 flow：store → App.tsx data-attr → CSS → feature → SettingsDialog → CommandPalette → story
- 對稱 colorTheme / density 的實作模式（設計一致性）
- B layout 為「可驗證骨架」：切到 b 時視覺有明顯差異（例：sidebar 寬度 / 主軸方向），讓 E2E / storybook 能檢查

**Non-Goals**
- 不重寫 WorkspaceLayout 元件
- 不定稿 B layout 最終視覺 — 這留給設計師後續調整
- 不加 per-feature layout override（所有軸統一 global）

## Decisions

### D1. B layout 用 CSS class override

現有 layout 是寫死的 grid／flex，直接在 `:root[data-layout="b"]` 下覆蓋 `--sidebar-width`、`--activity-bar-position` 之類的 CSS var，元件完全不動。

**替代：** 新一個 `WorkspaceLayoutB.tsx` — rejected，複製整個 layout 元件成本大，維護 burden 高。

### D2. Layout feature 用 `createChoiceFeature` 模板

跟 color-theme / density / font-size 一致：choice kind，currentValue 從 store 讀，onSelect 寫回。

### D3. B 的差異視覺先做 sidebar 寬度翻轉 + accent 色強化

最小可感知差異：
```css
:root[data-layout="b"] {
  --sidebar-width: 22rem;      /* a = 16rem */
  --activity-bar-position: right; /* 語意 token，layout 元件讀 */
}
```

細節視覺設計後續 follow-up；骨架先讓切換有感。

## Risks / Trade-offs

- [B 視覺過於 minimal 使用者看不出差] → 差異至少要明顯到 storybook 4-variant diff 能抓；拉寬 sidebar 40% + activity bar 側換 side 就夠
- [CSS var 語意 token `--activity-bar-position` 跟 layout 元件耦合] → acceptable，layout 元件本來就擁有這個 concern
