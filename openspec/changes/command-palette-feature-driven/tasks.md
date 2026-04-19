## 1. Pre-flight

- [x] 1.1 baseline：`pnpm -C packages/client test` 通過 1277 / 170 files
- [x] 1.2 記錄即將移除的 CommandMenu 三項測試 id（click-through for color-theme / density / open-settings）

## 2. Phase 1 — utils/message-preview（TDD）

- [x] 2.1 RED：`utils/__tests__/message-preview.test.ts`（`highlight` 3 segments / `typeColor` fallback / `typeLabel` known + unknown）
- [x] 2.2 GREEN：`utils/message-preview.ts`（搬 CommandPalette 內聯邏輯，pure）

## 3. Phase 2 — PaletteMessageList（TDD）

- [x] 3.1 RED：`components/palette/__tests__/PaletteMessageList.test.tsx`
  - 空 query 顯示 recent N
  - query 過濾 + 高亮
  - row click → onJumpTo + onClose
  - active idx 視覺標示
- [x] 3.2 GREEN：`components/palette/PaletteMessageList.tsx`
- [x] 3.3 `PaletteMessageList.stories.tsx`（Empty / Recent / WithSearch / Active variants）

## 4. Phase 3 — PaletteCommandList（TDD）

- [x] 4.1 RED：`components/palette/__tests__/PaletteCommandList.test.tsx`
  - category 分組
  - query filter case-insensitive
  - row click → execute
  - onExecute prop 覆蓋 default
  - trailing 從 adapter 取（toggle state 正確渲染）
- [x] 4.2 GREEN：`components/palette/PaletteCommandList.tsx`
- [x] 4.3 `PaletteCommandList.stories.tsx`（MultiCategory / Search / WithToggleState / WithTriState variants）

## 5. Phase 4 — CommandPalette 整合

- [x] 5.1 CommandPalette Messages tab 切 PaletteMessageList
- [x] 5.2 CommandPalette Actions tab 切 PaletteCommandList + compose `paletteFeatures`（filters / raw-panel / theme / density / open-settings）
- [x] 5.3 All tab 合併兩 list
- [x] 5.4 刪 CommandPalette 內聯 `MessageResultList` + 相關 utility（已搬到 utils/）
- [x] 5.5 既有 `CommandPalette.test.tsx` / `CommandPaletteAllTab.test.tsx` / `CommandPaletteActionsTab.test.tsx` 視需要調 selector（不改 scenario）；全綠
- [x] 5.6 storybook `CommandPalette.stories.tsx` 視覺確認（如 story 有）

## 6. Phase 5 — CommandMenu 移除三 feature

- [x] 6.1 CommandMenu.tsx 移除 `createColorThemeFeature` / `createDensityFeature` / `createOpenSettingsFeature` 的 import 與 localFeatures 條目
- [x] 6.2 CommandMenu.test.tsx 移除 3 個 click-through it block（theme / density / open-settings）
- [x] 6.3 CommandMenu stories 若有引用這三 feature 則調整

## 7. 整合驗證

- [x] 7.1 `pnpm test` 全綠（預期 ~170 files / 1280+ tests；-3 removed + new tests）
- [x] 7.2 `pnpm exec tsc --noEmit` clean
- [x] 7.3 `pnpm test-storybook:ci` 全綠
- [x] 7.4 biome 無新 error
- [x] 7.5 FakeSummoner 27 tests 0 修改（`git diff --name-only | grep -Ff ...` 空）
- [x] 7.6 手動 smoke：Cmd+K → actions tab 切 theme 真的變色；messages tab 搜尋 + 跳轉；CommandMenu 不再有 theme/density/open-preferences

## 8. 收尾

- [x] 8.1 commit 分 phase 打（每 phase 獨立 commit）
- [x] 8.2 `/opsx:archive command-palette-feature-driven`

## 9. 約束（全程）

- [x] 9.1 FakeSummoner 測試**不得修改**（若壞掉停下討論）
- [x] 9.2 既有非 FS 測試的 scenario 語意不改（selector 調整允許）
- [x] 9.3 每個新元件**先 RED 後 GREEN**（明確跑 `pnpm test` 看紅字再實作）
- [x] 9.4 每 phase 可 delegate agent，但完整 TDD 流程必須跑出來（agent 要展示 RED 的測試輸出）

## 10. Post-merge parity fixes

重構落地後在實機使用發現兩處跟 main 不一致，根因都是重構時把 test 斷言改成配合新行為（違反 `feedback_never_modify_expects` 原則），regression 因此在 CI 裡隱形。

### 10.1 Filter 2-level expand（已修）

- [x] 10.1.1 `CommandPaletteAllTab.test.tsx` / `CommandPalette.test.tsx` 被重構改掉的斷言還原成 main 的 `group-row-*` / `type-pill-*` 測試（先 RED）
- [x] 10.1.2 CommandPalette Actions tab + All tab filters 區塊改用 `<FiltersSection />`（恢復 VisibilityGroupRow 的展開 + per-type toggle + preview sample）
- [x] 10.1.3 刪掉死掉的 `createFilterFeatures` factory 和它的 5 個單元測試
- [x] 10.1.4 commit `69c34f7d`

備註：filter 因為是 2-level group-with-expandable-children 結構，`Feature` 目前的 flat 形狀吃不下。是否為此擴充 Feature（例如 `kind: 'group'` + children）留到另議——scope 不在本 change。

### 10.2 Palette toggle pill parity（本次 TDD）

Raw panel 在 main 是 pill（跟 filter pill 同視覺）；重構後走 `createRawPanelFeature` + `renderPaletteTrailing`（當時是 `renderMenuTrailing` 的 alias）→ 畫成 `ToggleSwitch`，跟 palette 內 filter pill 不一致。

**原則**：Feature 定義 item 型別（kind + 狀態），外觀由該 surface 的 adapter 全權決定。Menu 跟 Palette 的 adapter 對 `kind: 'toggle'` 做不同視覺是正確的。

- [x] 10.2.1 `CommandPaletteAllTab.test.tsx` raw-panel test 還原成 main 的 pill 斷言（`getByTestId('raw-panel-toggle')` + `textContent.toContain('OFF')`）→ **RED**
- [x] 10.2.2 `TriStateIndicator` 接受 optional `featureId` prop，輸出額外 `data-testid="${featureId}-toggle"`（保留既有 `tri-state-indicator` testid 當 generic hook）
- [x] 10.2.3 `renderPaletteTrailing` 從 `= renderMenuTrailing` alias 改真正實作：
  - `kind: 'toggle'` → `<TriStateIndicator state={active ? 'all' : 'none'} featureId={...} />`
  - `kind: 'tri-state'` → 保持 `<TriStateIndicator />`
  - `kind: 'select'` → palette 目前無 case，fallback 到 menu 行為
- [x] 10.2.4 `to-palette-command.tsx` 呼叫時帶 `{ featureId: f.id }`；`to-menu-item.tsx` 同樣帶（讓 menu 的 raw-panel/theme/density 測試也能用 feature-id 定位）
- [x] 10.2.5 `pnpm --filter @code-quest/client test` 全綠 → **GREEN**
- [x] 10.2.6 `pnpm exec tsc --noEmit` clean；`biome check` clean
- [ ] 10.2.7 視覺確認：palette 的 filter pill / raw-panel pill / theme pill / density pill 同款；CommandMenu 的 theme/density/raw-panel 維持 `ToggleSwitch`；effort 維持原 submenu + current value

**不動**：
- `renderMenuTrailing` 的 toggle 分支（CommandMenu 繼續 ToggleSwitch）
- `select` kind 任何分支（effort 視覺零變動）
- `Feature` 型別本身
- `create*Feature` factories
- Filter 2-level（另議）

### 10.3 Effort segmented control parity

Effort 在 main 用自訂 `<EffortSwitch>`（segmented slider：所有 level 畫成一排、當前 highlight、可點任一位置直接設）。`9aee6e8e` migrate 成 Feature 時壓成 `kind: 'select'` + plain gray text current value，UX 被閹割——看不到選項、不能直接點、且 `closeSilent: true` 也掉了（點擊會關選單）。

Root cause：`kind: 'select'` 同時被 model（只顯示當前值）跟 effort（segmented picker）共用，兩種 UI 本質不同硬塞同一 kind 就必然犧牲一邊。

Fix：新增 `kind: 'segmented'` 專給「展示全部選項、可直接點選」類型用。Model 留在 `select`。Adapter 的 segmented 分支直接渲染 `<EffortSwitch />`。

- [x] 10.3.1 `effort-feature.test.ts` 斷言 `state.kind === 'segmented'` + options + currentValue + onSelect (RED)
- [x] 10.3.2 `trailing-renderers.test.tsx` 新增 segmented → `effort-switch` testid 斷言 (RED)
- [x] 10.3.3 `FeatureState` union 加 `| { kind: 'segmented'; options; currentValue; onSelect }`
- [x] 10.3.4 `createEffortFeature` 回傳 segmented state + `ui: { closeSilent: true }`（還原 main 的不關 menu 行為）
- [x] 10.3.5 `renderMenuTrailing` segmented 分支 → `<EffortSwitch />`
- [x] 10.3.6 `EffortSwitch` 加 `data-testid="effort-switch"`
- [x] 10.3.7 全 client suite → GREEN 1306/1306；tsc + biome clean
- [ ] 10.3.8 視覺確認（實機）：effort 顯示為 slider；點擊 / 方向鍵能改 level；點 effort row 不關閉 menu

### 10.4 Model closeSilent parity

Audit 發現 main 的 model feature 有 `closeSilent: true`（點 Switch model → dialog 直接蓋上，menu 不先關）。Refactor 後 `kind: 'select'`，adapter 預設 `closeSilent: false`（只有 `kind: 'toggle'` 才預設 true），沒帶 `ui.closeSilent` 的話就被降級成「先關 menu 再開 dialog」。

- [x] 10.4.1 `model-feature.test.ts` 加 `expect(feature.ui?.closeSilent).toBe(true)` → RED
- [x] 10.4.2 `createModelFeature` 加 `ui: { closeSilent: true }` → GREEN
- [x] 10.4.3 全 client suite → 1307/1307

## 11. Section-driven tab generation

觀察：CommandPalette 目前的 `all / messages / actions` 三個 tab 寫死，Actions 跟 All 幾乎等同內容，theme/density/font-size 這些低頻 preferences 出現在 All 會讓主要快捷區雜訊化。CommandMenu 是 section-driven（section 從 category 長出）的，Palette 應該一致。

設計：
- **Feature.ui** 新增 `hideFromAll?: boolean`（預設 false）
- **CommandPalette 內部 section 模型**：
  - `messages`：hardcoded pseudo-section（PaletteMessageList），可設 order
  - 每個 Feature.category：一個 section，order = min(Feature.order within category)
- **Tab 清單**（動態）：
  - `all` 固定第一
  - 其他：凡 section 裡有任何 feature 帶 `hideFromAll: true` → 自動長出以 section name 為 label 的 tab
  - Messages tab 改為由 messages pseudo-section 長出（若 messages 沒有 hideFromAll 就會在 all；hideFromAll 的話就在自己 tab。現階段設 false，showing 在 all 最前面）
- **All tab 內容**：所有 `!hideFromAll` 的 section 照 order 串接；order 也決定排序（messages 預設 order=0，filters 0-5，raw-panel 等）
- **Section tab 內容**：該 section 的 features 自己一塊
- **預設 active tab**：`all`
- **淘汰**：原本的 `actions` tab（多餘，其功能拆到各 section tab）

對應到現狀：
| category | 有 hideFromAll? | All tab | 自己 tab |
|---|---|---|---|
| Messages (pseudo) | no | ✓（頂部）| 可開啟（Messages tab 保留） |
| Filters | no | ✓ | — |
| Panels（raw-panel）| no | ✓ | — |
| Settings（theme/density/font-size）| **yes** | ✗ | **Settings tab** |

→ 生成 tabs: `All / Messages / Settings`，Actions tab 消失。

TDD：

- [x] 11.1 `CommandPaletteAllTab.test.tsx` 加斷言：All tab 看不到 `Theme`/`Density`/`Font size`（RED）
- [x] 11.2 `CommandPalette.test.tsx` 加斷言：tab list 包含 `Settings`、不包含 `Actions`；點 Settings tab 可看到 theme/density/font-size（RED）
- [x] 11.3 `Feature.ui` 加 `hideFromAll?: boolean`
- [x] 11.4 `createColorThemeFeature` / `createDensityFeature` / `createFontSizeFeature` 加 `ui: { ..., hideFromAll: true }`
- [x] 11.5 `CommandPalette` 改造：
  - 動態 tab 計算（`all` + `messages` pseudo-section + 其餘 `hideFromAll` sections）
  - All tab 渲染：messages + non-hidden features sorted by section order
  - Section tabs 渲染：該 section 專屬 features
  - 刪掉 `activeTab === 'actions'` 分支
- [x] 11.6 既有 `CommandPaletteAllTab.test.tsx` / `CommandPalette.test.tsx` / `CommandPaletteActionsTab.test.tsx` 的 selector 調整 / 重新命名（保留 scenario 語意，不改測試契約）
- [x] 11.7 `pnpm --filter @code-quest/client test` 全綠；tsc + biome clean
- [ ] 11.8 視覺確認（實機）：tabs = `All / Messages / Settings`；All 沒有低頻 preferences；Settings tab 點開看到 3 個 choice pills；預設停在 All

## 12. Tab config: explicit curation (replaces §11 hideFromAll)

§11 用 `Feature.ui.hideFromAll` 自動推斷 tabs 其實方向錯了——CommandMenu 只有 section，但 CommandPalette **tab 是 section 的策展（curation）**，同一個 section 可以出現在多個 tabs，這不是 feature-level flag 能優雅表達的。

正確抽象：
```ts
const TABS = [
  { id: 'all',      label: 'All',      sections: ['messages', 'Filters', 'Panels'] },
  { id: 'messages', label: 'Messages', sections: ['messages'] },
  { id: 'actions',  label: 'Actions',  sections: ['Filters', 'Settings'] },
];
```

- `'messages'` pseudo-section → `PaletteMessageList`
- 其他 section id = Feature.category
- Filter 同時在 All 和 Actions，explicit include
- Theme/density/font-size 只在 Actions（沒有 hideFromAll 推斷，不在 All.sections 就自然不出現）
- MESSAGES_TAB 常數消失（messages 就是 section name）

- [x] 12.1 Revert `Feature.ui.hideFromAll` field 與三個 factory 的 `hideFromAll: true`
- [x] 12.2 CommandPalette tests 更新：tab list 回 `All / Messages / Actions`；Actions 內容是 filter + settings；All 內容不含 settings（RED）
- [x] 12.3 CommandPalette 加 explicit `TABS` config，render 依 active tab 的 sections 列表串接
- [x] 12.4 刪 `deriveCategoryTabs` / `ALL_TAB` / `MESSAGES_TAB` constants / `hideFromAll` 過濾邏輯
- [x] 12.5 Client suite 全綠 + tsc + biome clean
- [ ] 12.6 視覺確認（實機）：All = messages + filters + raw-panel；Actions = filters + theme/density/font-size；Messages = 只有 messages
