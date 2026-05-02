## Context

`components/ui/` 目前有 6 個 primitive（`Dialog`、`ChoicePills`、`ToggleSwitch`、`EffortSwitch`、`TriStateIndicator`、`Icons`）。但 components/ 根目錄和子目錄有 40+ 個 component，許多自己 inline 寫跟 primitive 同等級的基礎元件（button、input、panel header）。這是技術債：每次設計師調整 button 顏色或 input padding，都要開 22 個檔案改。

本 change 補齊 primitive 層。

## Goals / Non-Goals

**Goals**
- 所有頻繁重複（≥3 處）的基礎 UI pattern 都有對應 `ui/*` primitive
- Consumer 從 inline className 遷移到 primitive
- 嚴格 TDD：每個 primitive 先寫測試再實作；每個 consumer 遷移時既有測試斷言不動
- Radix Dialog wrapper 擴充吸收 3 個 holdouts

**Non-Goals**
- 不重新設計視覺（variant 樣式從 consumer 現況採樣而來）
- 不引入新 dependency（不用 @floating-ui、不用 class-variance-authority — cva 雖然好用但加 dep 超出範圍）
- 不改 primitive 的既有 API（`Dialog` / `ChoicePills` 等）
- 不做 PopoverShell 的**定位邏輯**（只抽 chrome + outside-click）

## Decisions

### D1. Primitive 樣式設計：採樣現況，不創造新 variant

以 Button 為例：盤點現有 consumer 的 classNames，歸類：
- **primary**: `bg-accent text-white rounded hover:bg-accent/80` — 多數 dialog 主按鈕
- **secondary**: `text-text-muted hover:text-text rounded border border-border hover:bg-white/5` — dialog Close / cancel
- **danger**: `bg-danger text-white rounded hover:bg-danger/80` — destructive actions
- **ghost**: 只有 hover 背景，沒 border — icon-only / link-like

Size：只分 `sm` (px-3 py-1.5 text-sm) 和 `md` (px-4 py-2 text-base)。暫不加 lg/xs。

### D2. PopoverShell 只抽 chrome

```tsx
<PopoverShell onOutsideClick={close}>
  <div /* consumer-defined content */>...</div>
</PopoverShell>
```

內部實作：`border rounded bg-surface shadow-xl` + `useEffect` 掛 document click listener。

Consumer 保留 `position: fixed/absolute` + top/left 計算。這讓 SessionDropdown（下拉）、MentionDropdown（游標附近）、FilterPopover（trigger 下方）各自定位策略不變。

### D3. Dialog size prop — 最小擴充

```tsx
<DialogContent title="..." size="md">  // 現狀 = default
<DialogContent title="..." size="lg" />  // 寬版 (e.g. ManageMcpDialog)
<DialogContent title="..." size="fullscreen" />  // 全螢幕 viewer (ContentPreviewPanel)
```

Size 只影響 max-width/height/padding：
- `md`: `max-h-[calc(100vh-64px)]`（現狀）
- `lg`: `w-[640px] max-w-[calc(100vw-32px)]`
- `fullscreen`: `w-screen h-screen max-w-none max-h-none`

Title 和 mandatory 仍然強制（Dialog 要求 a11y title）。

### D4. EmptyState API loosen

現在 `actionLabel` + `onAction` 都是 required。放寬：

```tsx
interface EmptyStateProps {
  icon: ReactNode;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  testId?: string;
}
```

Invariant: actionLabel 和 onAction **要嘛都給、要嘛都不給**（型別層 overload 表達）。

### D5. TDD 順序

低風險到高風險 — 最大 consumer 改動放最後：

1. **SectionHeader**（最小，3 consumer）
2. **EmptyState loosen**（API 調整，trivial）
3. **SearchField**（3 consumer，含共同 SVG）
4. **TextField**（5 consumer）
5. **PanelHeader**（6 consumer）
6. **PopoverShell**（3 consumer，抽邏輯但保留定位）
7. **Dialog size prop + migrate 3 holdouts**
8. **Button**（15+ consumer，最大，最後做以吸收前面已做的 dialog close buttons）

每一 phase 步驟：
1. RED：先寫 primitive 的 unit test（或更新既有 consumer 的 test 描述預期）
2. GREEN：實作 primitive
3. REFACTOR：migrate 一個 consumer、跑測試、commit；循環直到全部遷移完
4. 每階段結束跑 `test-storybook:ci` + `vitest` + `tsc` + `lint-hardcoded-colors` 全綠

### D6. Story 覆蓋

每個新 primitive 至少 3 個 stories：
- Default variant
- 每個 variant / size 的 matrix
- Dark + Light variants（使用 `withThemePreset`）

## Risks / Trade-offs

- **[sub-pixel visual drift]** 換成 primitive 可能 padding/border 跟原本差 1-2px → Storybook 各 consumer 的 story 需要 visual diff 檢查；必要時調 primitive 而非調 consumer
- **[大範圍 className 改動 → merge conflict]** — 本 branch 完成後盡快 merge，否則 stale 風險高
- **[Radix Dialog migrate 3 holdouts 可能有 focus-trap 行為變化]** — 例：ContentPreviewPanel 裡的自訂 keyboard shortcuts 要確認跟 Radix 不衝突
- **[Button variant 劃分主觀]** — 可能漏抽某 variant（例：tab button）。每遷移一個 consumer 時確認 variant 覆蓋，否則補
