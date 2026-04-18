## Context

- Store 已有 `colorTheme`, `fontSize`, `density` 與 setters（`usePreferencesStore`）
- `App.tsx` 掛載時同步 `<html>` data-attr，store 任何變動立即反映
- CommandMenu 已有 feature registry 模式（`MenuItemFeature` / `createXxxFeature`），Cmd+K 呼叫
- ActivityBar 目前底部為空（只有 Projects icon 在上）
- Radix Dialog 已用於 AuthDialog / ManageMcpDialog 等，有既有視覺風格

## Goals / Non-Goals

**Goals**
- 使用者可以在 3 秒內找到並切換 theme/density（Cmd+K 或點 gear）
- Settings 面板可擴充（之後加 layout/hiddenItems 軸無結構變動）
- 切換立即生效、自動 persist（無 Apply/Cancel 按鈕）
- 全部新增元件有 story + unit 覆蓋

**Non-Goals**
- 不做 system theme follow（`prefers-color-scheme`）— 留另一 change
- 不做 per-workspace 偏好 — 全域即可
- 不做 Theme preview 縮圖
- ActivityBar 的 gear 不做 badge / 通知指示

## Decisions

### D1. CommandMenu feature 的 execute 語意 = 循環切換

```ts
createColorThemeFeature({ colorTheme, setColorTheme }) {
  return {
    id: 'switch-color-theme',
    menuItem: {
      label: 'Switch theme',
      section: 'General',
      order: 10,
      closeSilent: true,
      trailing: <Badge>{colorTheme}</Badge>, // 顯示當前
    },
    execute: () => setColorTheme(colorTheme === 'dark' ? 'light' : 'dark'),
  };
}
```

- 選 **循環**（toggle）而非**開 submenu**，理由：目前 theme 只有 2 值、density 只有 2 值，循環最快
- fontSize 有 3 值，循環順序 sm→md→lg→sm
- 替代：開子選單讓使用者明確選 — 待軸值變多（≥4）再改

### D2. SettingsDialog 結構 — radio 列表，live-save

```
┌─ Settings ──────────────────────┐
│ Color theme                      │
│  ◉ Dark   ○ Light                │
│                                  │
│ Font size                        │
│  ○ Small  ◉ Medium  ○ Large      │
│                                  │
│ Density                          │
│  ◉ Comfortable  ○ Compact        │
│                                  │
│                        [ Close ] │
└──────────────────────────────────┘
```

- 切 radio = 立即呼叫 store setter = 立即生效（dialog 不擋）
- 沒有 Apply/Cancel：整個 app 即時反映，Esc 或 Close 關閉
- 標題下方一行小字：「Changes apply instantly and are saved automatically」
- 後續加軸只要在 array 裡 push 一項 definition，UI 自動長出

### D3. ActivityBar gear 位置

ActivityBar 既有 icon 全靠上，底部留白。把 ⚙ 放在 ActivityBar **最下方**（`mt-auto`），與頂部 nav icons 視覺分離。

- 替代：放頂部 icon 群末尾 — 但「設定」通常在邊緣（Slack/Discord/VSCode 慣例），靠底部比較對齊使用者直覺
- 手機版（mobile nav）：目前 ActivityBar 在 mobile 隱藏，設定入口改由 Cmd+K 的 open-settings feature 提供

### D4. 分三個 feature 而非一個 "preferences" parent

`color-theme-feature` / `density-feature` / `open-settings-feature` 各自獨立。原因：
- CommandMenu 本來就是 flat list，使用者打字搜尋（"theme" / "density" / "settings"），獨立項目可直接 match
- 符合既有 fast-mode / thinking 結構，不用引入新抽象
- open-settings 是「打開整合面板」的快捷鍵，跟 color-theme 是平行的入口，不是父子

## Risks / Trade-offs

- **SettingsDialog live-save 可能嚇到使用者**（期待「確認」按鈕）→ dialog 頂部說明文字；實測收 feedback 再考慮加 Apply
- **ActivityBar gear 在窄螢幕被擠掉** → 現有 ActivityBar 固定 40px 寬不受影響；mobile 已由 Cmd+K 兜底
- **循環切換在 fontSize（3 值）需要多按** → 若反饋不佳再改 submenu；目前 3 值走 sm/md/lg 3 次內到位
- **Dialog 內 radio state 與 store 同步**：直接用 `useStore` selector，zustand 保證即時；不需本地 state

## Migration Plan

1. 先做 Phase A（3 個 features），各自 TDD（test → impl）
2. 在 CommandMenu 註冊，跑 vitest 確認無 regression
3. 做 Phase B SettingsDialog（component 先寫 story，再寫 interaction test，再接 ActivityBar）
4. 驗證：test-storybook:ci、vitest、typecheck 全綠
5. 手動 smoke：Cmd+K 試 3 個 feature；點 gear 開 dialog；切幾個 radio 看畫面有變
