## Context

`apps/web` 目前只有一套寫死的 Dark+ 色票（`App.css` 的 `@theme`）與單一 `WorkspaceLayout`。`usePreferencesStore` 已存在（zustand + persist），但只裝了 onboarding/review dismiss 兩個 flag。Storybook 10 已接好，60/82 components 與 2/6 features 有 stories，無 test-runner。Playwright 已安裝於 repo。

本變更是「多軸偏好系統」的第一步，重點是**不動視覺**把基礎打好。實際 UX（light theme palette、B 版面）留給後續 change。

## Goals / Non-Goals

**Goals**
- 確立多軸偏好的 store shape、persist key、套用機制（`<html>` data-attr）
- Phase 0 補齊 Storybook 覆蓋率，接上 `@storybook/test-runner` + Playwright，建立視覺回歸 baseline
- Phase 1 實作 `colorTheme` + `fontSize`，**預設值等於現狀**，以 CSS vars dump diff 為空證明無視覺改變
- 為未來 density / layout / visibility 預留介面（型別 + store 欄位），但不實作

**Non-Goals**
- 不新增 light theme palette（只搬 dark palette 到 `:root[data-theme="dark"]`）
- 不實作 B 版面（layout 欄位先存，`App.tsx` 暫時還是固定用 `WorkspaceLayout`）
- 不做 per-user server-side persist（仍走 localStorage）
- 不改元件結構、不改 Tailwind utility class 名稱

## Decisions

### D1. 以 `<html>` data-attr 驅動 CSS vars（而非 class 或 context）

- 採用：`<html data-theme="dark" data-font="md" data-density="comfortable">`，CSS 用 `:root[data-theme="dark"] { --color-bg: ... }` 切換
- 原因：
  - 零 re-render — 切換只動 DOM attribute，React tree 不需重渲
  - 可多軸正交組合，不像 class 容易衝突
  - Tailwind v4 `@theme` 可以用 attribute selector 覆蓋 vars
- 替代方案：
  - Context + inline style：需要全樹 re-render，每個元件要讀 context
  - CSS class：多軸組合時 class 名會爆炸

### D2. Store 結構：扁平欄位 + preset apply helper

```ts
interface PreferencesState {
  colorTheme: 'dark';                    // Phase 1；未來加 'light'
  fontSize: 'sm' | 'md' | 'lg';
  density: 'comfortable' | 'compact';    // 預留，Phase 2
  layout: 'a' | 'b';                     // 預留，Phase 2
  hiddenItems: string[];                 // 預留，Phase 2
  isOnboardingDismissed: boolean;        // 既有
  isReviewUpsellDismissed: boolean;      // 既有

  setColorTheme(v): void;
  setFontSize(v): void;
  applyPreset(name: PresetName): void;
  // ...
}
```

- 保留既有 persist key `code-quest:preferences`，欄位用 zustand `persist` 的 `migrate` 幫既有 user 補預設值
- Preset 只是批次 `set({...})`，不額外存 selectedPreset（避免「偏離 preset 後狀態不一致」問題）

### D3. Phase 0 Storybook 補齊策略

- 補齊 22 個 component + 4 個 feature stories（清單見 tasks.md）
- 每個 story 至少一個 default variant；有明顯狀態分支的補齊（loading/empty/error）
- 接 `@storybook/test-runner`：
  - Smoke：render 不 crash
  - a11y：沿用 `@storybook/addon-a11y`，test-runner 會跑
  - Visual snapshot：Playwright `toHaveScreenshot()` 在 test-runner hook 中截圖
- 關鍵：**補 stories commit 進 main baseline 後**才動 Phase 1，確保 diff 對比基準穩定

### D4. Phase 1 預設值一致性驗證

- `App.css` 拆 `@theme` 成：
  ```css
  :root[data-theme="dark"] { --color-bg: #1e1e1e; ... }   /* 搬現值 */
  :root[data-font="md"]    { font-size: 14px; }            /* 現值 */
  ```
- `App.tsx` 初始化時把 store 值寫到 `document.documentElement.dataset`
- 驗證：
  1. 寫 Playwright script `tools/dump-css-vars.ts`，`getComputedStyle(document.documentElement)` 取所有 `--color-*` + `font-size`，輸出 JSON
  2. 在 `main` 分支跑一次存 baseline；在本分支跑一次比對，必須 100% 相同
  3. Storybook visual snapshot 和 Phase 0 baseline 比對，無 diff

## Risks / Trade-offs

- **CSS vars 拆 block 時漏改值** → dump diff 直接抓；預設值從 git history 複製
- **persist migration 爆掉（既有 user 的 localStorage 只有 onboarding 欄位）** → 用 zustand `persist` 的 `version` + `migrate`，缺欄位補預設；寫 unit test 驗證
- **Storybook 補 22 個 stories 工作量大** → 拆成小 commit，一個檔一個 commit，不阻塞主流程
- **test-runner 初次接會有環境坑** → 先在 CI 外手動跑通，再寫 script；壞的就 skip 不 block（但要記 TODO）
- **Tailwind v4 `@theme` vs attribute override 優先級** → attribute selector 特定性高於 `:root`，實測需驗證

## Migration Plan

1. Phase 0：補 stories → 接 test-runner → baseline snapshot commit 進 main
2. Phase 1：拆 CSS → 擴 store → App.tsx 同步 → dump diff 驗證 → snapshot 比對 → merge
3. Rollback：每 phase 獨立 PR；Phase 1 若 dump diff 不為零直接 revert 該 PR，Phase 0 不受影響

## Open Questions

- test-runner 的 visual snapshot 要放 repo 還是 artifact？先放 repo，之後爆炸再移
- `fontSize` 影響範圍要不要包含 code block？先只動 base `font-size`，code block 用 rem 自然縮放
