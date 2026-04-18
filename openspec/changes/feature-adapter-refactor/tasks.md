## 1. Pre-refactor Audit（必做，**任何實作前**）

- [x] 1.1 Baseline：158 test files / 1211 tests（含 2 個 flaky under parallel；單檔跑 PASS）。記錄於 `audit/baseline.md`
- [x] 1.2 27 個 FakeSummoner-based 測試列於 `audit/fake-summoner-tests.txt`
- [x] 1.3 Coverage audit：18 個 factory 已有 test；**補 5 個**（compact, manage-plugins, mcp-servers, rewind, usage）共 14 新 tests，全綠。map 於 `audit/coverage-map.md`
- [x] 1.4 commit audit baseline

## 2. Phase 1 — Adapter 基礎（TDD）

- [x] 2.1 RED：`lib/__tests__/feature-type.test.ts`（`Feature` / `FeatureState` 型別存在與 narrowing）
- [x] 2.2 GREEN：擴充 `lib/feature.ts` 加 `Feature` / `FeatureState` / type guards
- [x] 2.3 RED：`lib/adapters/__tests__/to-menu-item.test.tsx`（至少 5 scenarios：無 state / toggle / tri-state / select / ui.closeSilent override）
- [x] 2.4 GREEN：`lib/adapters/to-menu-item.tsx`
- [x] 2.5 RED：`lib/adapters/__tests__/to-palette-command.test.tsx`
- [x] 2.6 GREEN：`lib/adapters/to-palette-command.tsx`
- [x] 2.7 RED：`lib/adapters/__tests__/to-slash-command.test.ts`
- [x] 2.8 GREEN：`lib/adapters/to-slash-command.ts`
- [x] 2.9 RED：`lib/adapters/__tests__/trailing-renderers.test.tsx`
- [x] 2.10 GREEN：`lib/adapters/trailing-renderers.tsx`（含 `renderMenuTrailing` / `renderPaletteTrailing`）
- [x] 2.11 RED：擴充 `FeatureRegistry` test（`getFeatures()` 回 Feature[]，舊 API 保留）
- [x] 2.12 GREEN：`FeatureRegistry` 內部支援兩種 shape；新舊並存
- [x] 2.13 Commit `feat(lib): add Feature type + adapters + registry shim`

## 3. Phase 1.5 — 示範遷移 `clear`（完整 TDD 跑一輪）

- [x] 3.1 RED：clear-feature.test 改斷言新 shape（`feature.label` / `feature.category`，路徑變但語意不變）
- [x] 3.2 GREEN：clear-feature.ts 改回傳 `Feature`（拿掉 `menuItem: {}` 包裝）
- [x] 3.3 CommandMenu 未改（registry shim 自動 adapt）
- [x] 3.4 完整 vitest：168 files / 1261 tests（0 regression；FakeSummoner 27 test 0 改動）
- [x] 3.5 typecheck clean
- [ ] 3.6 storybook（延後到 Phase 3 結尾統一跑）
- [x] 3.7 Commit `576cd2fb`
- [x] 3.8 FakeSummoner test 0 變動 ✓

## 4. Phase 2 — 批次遷移（每組獨立 commit；每組完驗證）

每個 factory 流程：
1. 讀原 factory + 原 test
2. 寫新 test（or 擴既有 test）驗 Feature shape
3. 改 factory 回 Feature
4. 跑 affected tests + storybook
5. 若 FakeSummoner test 動 → 停下討論

**4A. 無 state（16 個）**
- [x] 4A.1 `compact`
- [x] 4A.2 `resume`
- [x] 4A.3 `rewind`
- [x] 4A.4 `new-conversation`
- [x] 4A.5 `usage`
- [x] 4A.6 `view-help`
- [x] 4A.7 `switch-account`
- [x] 4A.8 `reload-plugins`
- [x] 4A.9 `mention-file`
- [x] 4A.10 `attach-file`
- [x] 4A.11 `manage-plugins`
- [x] 4A.12 `mcp-servers`
- [x] 4A.13 `mcp-status`
- [x] 4A.14 `general-config`
- [x] 4A.15 `open-settings`

**4B. 有 state（6 個）**
- [x] 4B.1 `fast-mode`（toggle）— commit `6aadce16` + cleanup `41797175`
- [x] 4B.2 `thinking`（toggle）
- [x] 4B.3 `color-theme`（toggle）
- [x] 4B.4 `density`（toggle）
- [x] 4B.5 `effort`（select）
- [x] 4B.6 `model`（select）

**4C. 複雜**
- [x] 4C.1 `btw` — commit `01b64c40`（保留 createBtwLocalFeature 為 per-render 包裝，base feature 統一）

**4D. Palette-only**
- [x] 4D.1 `filters`（tri-state）
- [x] 4D.2 `raw-panel`（toggle）

## 5. Phase 3 — 清理與驗證

- [x] 5.1 `MenuItemFeature` / `SlashCommandFeature` 只存在於 `lib/{feature.ts, adapters/, feature-registry.ts, build-menu-items.ts}` + 相關 tests；**0 個 factory / component / context 檔直接使用**
- [~] 5.2 Legacy shape 支援**保留**（registry + build-menu-items 的 legacy branch）。決定理由：
  - 零外部 call site 使用，但移除沒有實質好處
  - 10 行 shim 成本低、無 runtime penalty
  - 保留為未來 plugin 註冊或外部 feature registration 留門
  - 可視需要未來另開 change 移除
- [x] 5.3 全套驗證：
  - vitest: 170 files / 1281 tests（vs pre-refactor 1211 baseline：+70 new tests）
  - typecheck: clean
  - test-storybook:ci: 95 suites / 356 tests
  - biome: 變動範圍 clean（6 infos = pre-existing）
- [x] 5.4 FakeSummoner 27 測試 **0 修改** ✓
- [~] 5.5 （跳過 legacy 移除 commit — 依 5.2 決定保留）
- [ ] 5.6 `/opsx:archive feature-adapter-refactor`

## 6. 約束（全程遵守）

- [ ] 6.1 **FakeSummoner-based 測試不得修改**；若遷移讓其壞掉 → STOP 並回報
- [ ] 6.2 **既有非 FakeSummoner 測試的 expect 不得改語意**；要改 DOM selector 可以、改 assertion 語意不行
- [ ] 6.3 每個 factory 遷移**獨立 commit**，便於 revert
- [ ] 6.4 Phase 2 可 delegate agent 批量做，但**人 review 每次 commit**
