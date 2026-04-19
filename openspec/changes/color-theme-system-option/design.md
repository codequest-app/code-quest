## Context

`light-theme-and-density` + `preferences-ui` 建的 color theme 切換只有 `'dark' | 'light'` 兩個值，預設寫死 `'dark'`。使用者在裝置有 OS 層 dark/light 偏好的情境（macOS / Windows / iOS / Android 都有）下，期待 app 預設跟隨 OS。

同時 SettingsDialog 跟 CommandPalette 是偏好設定的兩個使用者入口 — 兩處 UI 不一致是技術債：同一個選項的視覺行為應該一致。

## Goals / Non-Goals

**Goals**
- 加 `system` 作為第三個 `colorTheme` 選項，且作為新使用者預設
- OS dark/light 偏好變化時，app 即時反應（不用 reload）
- SettingsDialog 三個偏好（theme / font / density）跟 CommandPalette actions tab 視覺一致
- 嚴格 TDD：每個單元先寫測試再實作

**Non-Goals**
- 不動 `density` / `fontSize` 的選項集（只改 colorTheme）
- 不重做 palette token（已在 theme-token-adoption 完成）
- 不新增自動排程色（如 sunset/sunrise）— 只跟隨 OS `prefers-color-scheme`

## Decisions

### D1. `ColorTheme` vs `EffectiveColorTheme` 兩層型別

```ts
export const colorThemeSchema = z.enum(['dark', 'light', 'system']);
export type ColorTheme = z.infer<typeof colorThemeSchema>;  // user preference
export type EffectiveColorTheme = 'dark' | 'light';          // resolved, for rendering
```

**為何分開**：
- 使用者選 `system` 是「邏輯偏好」— persist 到 localStorage 的值
- DOM `data-theme` 要寫的是 concrete 值（CSS 不認識 `'system'`）
- 兩個 concept 各自對應不同 consumer：Settings UI 讀 preference，渲染層讀 effective

**替代**：只保留一個 `ColorTheme`，consumer 各自解析 — rejected，每個 consumer 都要重複 matchMedia 邏輯。

### D2. `useEffectiveColorTheme` 用 `useSyncExternalStore`

```ts
const prefersDark = useSyncExternalStore(
  subscribePrefersDark,
  () => matchMedia('(prefers-color-scheme: dark)').matches,
  () => true,  // SSR fallback
);
```

**為何**：`useSyncExternalStore` 是 React 官方訂閱外部 store 的正確介面。相較 `useEffect + useState` 的 listener 手刻，USS 保證 strict-mode / concurrent-rendering 正確、tearing-free。

### D3. SettingsDialog 複用 FeatureRow

CommandPalette actions tab 已經用 `FeatureRow` 渲染 Feature list（label + trailing ChoicePills）。SettingsDialog 有一樣的資料模型（choice feature），應該直接吃 `Feature[]` 陣列，用 FeatureRow 渲染。

**優點**：
- 視覺與互動 100% 一致（同一個 component）
- 新增偏好 item 只要 `createXxxFeature()`，兩處 UI 自動同步
- `RadioGroup` 這個 dialog-only wrapper 刪除

**取捨**：
- `FeatureRow` 在 palette 情境下會處理 active row highlight、group expansion — dialog 情境不需要這些。但 FeatureRow 對 flat choice feature 的分支是 minimal（就是一個 button + trailing），不會有副作用
- ChoicePills 視覺尺寸為 palette 調過，dialog 可能需要留 spacing 調整 — 若需要調，加 prop 而非 fork component

### D4. `DEFAULTS` 用 explicit type annotation

```ts
const DEFAULTS: Omit<PersistedPreferences, 'hiddenItems'> & { hiddenItems: string[] } = {
  colorTheme: 'system',
  fontSize: 'md',
  density: 'comfortable',
  hiddenItems: [],
};
```

（或更簡單：type it as `PersistedPreferences` if the partial shape fits）

**為何**：`as const` literal narrowing 每個欄位都要標記，視覺吵且容易漏。顯式型別一次涵蓋，editor 自動補全也更好。

### D5. TDD 順序

1. Shared schema：先改 enum，跑 shared test 失敗 → 補測試（'system' 接受）→ 綠
2. Hook：先寫 useEffectiveColorTheme.test.ts（mock matchMedia + store）→ 實作
3. Store default：改 `DEFAULTS`，既有測試要覆蓋新預設行為
4. color-theme-feature：tests 先描述 3 options 循環 → 改 factory
5. App.tsx：先寫 integration test（App mount 時 effective theme 寫入 data-attr）→ 實作
6. SettingsDialog：先寫測試「三個設定項都透過 `data-testid="feature-row-..."` 渲染」→ 重寫 component

每一步 RED → GREEN → （若需要）REFACTOR。

## Risks / Trade-offs

- **[OS 沒 prefers-color-scheme API]** 極老瀏覽器不支援 matchMedia `(prefers-color-scheme: dark)` → `matchMedia` 回傳 `MediaQueryList` 但 `matches` 永遠 `false`。等同於使用者 OS 是 light。可接受。
- **[matchMedia mock 複雜度]** vitest/jsdom 已 mock `matchMedia`（test/setup.ts），但不支援 dispatch change event。hook 測試要手刻 stub subscribe。一次性成本。
- **[SettingsDialog 視覺變化]** 使用者可能不習慣新視覺（pill 變成 feature row）。Trade-off：一致性 > 習慣。若肉眼 UX 明顯倒退，設計師 follow-up 調整 FeatureRow。
- **[Storybook `withThemePreset` 型別]** decorator 型別從 `ColorTheme` 改 `EffectiveColorTheme`，排除 `'system'`。Stories 要預覽具體 theme，不應該讓作者傳 `'system'`。這是 type narrowing，不是 regression。
