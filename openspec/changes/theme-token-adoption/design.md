## Context

Light theme 在 `<html>` 層級看起來正確（bg、text、surface），但打開 CommandPalette 後整個 palette 仍是深色 — 因為 `CommandPalette.tsx` 的 inline style 直接寫死 `background: 'linear-gradient(180deg, #1c1e22 0%, #181a1e 100%)'`。這個 bug 之所以沒在 `light-theme-and-density` 被抓到：
1. 該 change 的 Playwright 驗證只 dump `<html>` 層 CSS vars — 浮動層不在 snapshot 範圍
2. Storybook 的 CommandPalette Light variant 確實存在，但 test-runner 只 render 不 crash，沒比對視覺差
3. 寫死 hex 是在 `preferences-axes-refactor` 前就存在的技術債，當時兩個 change 都沒做「全面 token 採用」

## Goals / Non-Goals

**Goals**
- 凡是 runtime 會看到的顏色都走 token（無論 dark 或 light theme 切換都有正確視覺）
- 驗證機制能抓到「下一個人再寫死 hex」的 regression
- Light theme 的 CommandPalette / SettingsDialog / PaletteMessageList / FeatureRow 視覺可用（不是設計定稿，但可讀可操作）

**Non-Goals**
- 不重新設計 dark palette（目標是 light 不瞎，不是重做 dark）
- 不做設計師級 light theme visual polish（色彩層級、contrast ratio 合格即可）
- 不動 component 結構
- 不加 `layout: 'a' | 'b'` 或其他預留軸（已 revert）

## Decisions

### D1. Token 命名：semantic over visual
```
✗ --color-dark-bg-main           (visual)
✓ --color-floating-bg-from       (semantic: floating surface 頂部背景)
✓ --color-row-active-bg          (semantic: 目前選中列的 tint)
```

原因：semantic token 跨 theme 保持一致意義（dark floating-bg 是深灰漸層、light floating-bg 是淺灰漸層），visual token 名字到另一個 theme 就語意錯亂。

### D2. Token 數量最小化
能用既有 token 組合出來的就不新增。例：
- `box-shadow` 的陰影色（目前 `rgba(0,0,0,0.7)`）→ dark 可用 `--color-shadow: 0,0,0`，light 改 `--color-shadow: 100,100,100`，用 `rgba(var(--color-shadow), 0.3)`。但這比較囉嗦，若只有一個 consumer 直接 `--color-floating-shadow: rgba(...)` 更簡單。**取捨：每個 token 的 consumer ≥ 2 才新增；= 1 就用 literal 但放在 CSS 層而不是 JSX inline**。

### D3. Inline style 盡量改 Tailwind utility
Tailwind v4 `@theme` 可以直接暴露 `--color-xxx` 為 `bg-xxx` / `text-xxx` / `border-xxx` utility。優先讓 consumer 寫 `className="bg-floating-from"` 而不是 `style={{ background: 'var(--color-floating-from)' }}`。例外：gradient、box-shadow 這類 Tailwind 表達不簡潔的仍用 inline + `var()`。

### D4. 驗證機制三層防護

1. **靜態 lint**：`tools/lint-hardcoded-colors.mjs` 掃 `.tsx` inline style 的 `#abc`、`rgb(...)`、`rgba(...)` pattern。允許 list（例：transparent backgrounds、`currentColor`）。CI exit 1 on hit。
2. **Storybook 視覺變體**：每個有顯著背景 / 邊框色的元件至少有 `Light` 和 `Dark` variant
3. **Playwright floating-surface snapshot**：`dump-theme-variants.mjs --with-floating` 四組合各產 2 張圖（頁面層 + floating 打開）+ 對應 JSON（computed style dump）

Lint 是最快回饋；Storybook 靠 review；Playwright 是 baseline。三層任一條漏掉都還有備援。

### D5. Light palette colour strategy
沿用 `light-theme-and-density` 已建立的 light palette（VS Code Light+ 取向），為新 token 選值時：
- 浮動層背景：淺灰偏白漸層（`#fafafa` → `#f0f0f0`），避免純白（過亮傷眼）
- 邊框：比 `--color-border` 深一階（floating 需要更清楚的邊界）
- Active row：accent 色 × 8-12% alpha（dark 是 `rgba(217,119,87,0.07)`，light 可能要 15% 才看得出）
- Overlay：`rgba(255,255,255,0.5)` + `backdrop-filter: blur`（取代 dark 的 `rgba(10,10,12,0.75)`）

## Risks / Trade-offs

- **[Light palette 值需要微調]** 視覺第一版可能顏色偏冷/偏暖，這是接受的 follow-up cost
- **[lint script 誤判]** 有些合法的 inline rgba（例：`rgba(var(--color-accent), 0.3)`）需要在 allow-list 裡放過 — 用 token 為前綴的 `var(...)` 直接跳過檢查
- **[dump-theme-variants `--with-floating` 需要 CommandPalette 可開啟的 fixture]** 新建一個 minimum reproducible fixture HTML 而不是跑真實 app
- **[Tailwind `@theme` 在 v4 語法有細節]** 需要實測哪些 token 可以直接轉 utility、哪些要手動宣告
