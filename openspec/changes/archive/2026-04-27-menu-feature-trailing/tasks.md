## 1. Test (TDD — 先寫，expect 不變)

- [x] 1.1 為 `createEffortFeature` 寫單元測試（cycling、empty levels）
- [x] 1.2 為 `createThinkingFeature` 寫單元測試（toggle on/off）
- [x] 1.3 為 `createFastModeFeature` 寫單元測試（toggle、supportsFastMode=false 不加入）
- [x] 1.4 為 `buildMenuItems` 寫測試：移除 9 個 model params 後仍正確產生 model section

## 2. Feature 介面擴充

- [x] 2.1 `MenuItemFeature` 加 `trailing?: React.ReactNode`
- [x] 2.2 `buildMenuItems` 的 `buildSection` / `toModelItem` pass-through `trailing`

## 3. Feature Factories

- [x] 3.1 新增 `apps/web/src/features/effort/effort-feature.ts`（`createEffortFeature`）
- [x] 3.2 新增 `apps/web/src/features/thinking/thinking-feature.ts`（`createThinkingFeature`）
- [x] 3.3 新增 `apps/web/src/features/fast-mode/fast-mode-feature.ts`（`createFastModeFeature`）

## 4. buildMenuItems 重構

- [x] 4.1 移除 `BuildMenuItemsParams` 的 9 個 model 狀態參數
- [x] 4.2 移除 `buildMenuItems` 裡的 effort-level、toggle-thinking、fast-mode inline items

## 5. CommandMenu 整合

- [x] 5.1 將三個 feature 加入 `localFeatures`（`supportsFastMode` 條件加入 fast-mode）
- [x] 5.2 移除 CommandMenu 傳給 `buildMenuItems` 的 9 個 model 狀態參數

## 6. SparkLegend dot count

- [x] 6.1 SparkLegend 接受 `effortLevels` prop，dot 數量跟著 effortLevels 動態計算
- [x] 6.2 ComposeInput 傳入 `effortLevels`（從 model metadata 算出）

## 7. Model-switch local info

- [x] 7.1 寫測試：切換 model 後 `effortLevels` 應從新 model 的 metadata 取得
- [x] 7.2 確認 `onAvailableModels` 在 string-only payload 時能正確保留 metadata
- [x] 7.3 全部測試通過（3/3 passed — model-switch.test.tsx）

## 8. Code review 修正

- [x] 8.1 移除 dead `tools` section（MenuSections、buildMenuItems、CommandMenu）
- [x] 8.2 移除 dead exports（EffortFeatureDeps、FastModeFeatureDeps、ThinkingFeatureDeps、UsageFeatureDeps、UsageFeature）
- [x] 8.3 `command-menu-parts.tsx` inline 進 `CommandMenu.tsx`
- [x] 8.4 `command-menu-items.tsx` 搬到 `lib/build-menu-items.tsx`

## 9. 驗收

- [ ] 9.1 全部測試通過
- [ ] 9.2 UI 手動確認 effort/thinking/fast-mode 行為不變

## 10. Code review 修正（round 3）

- [x] 10.1 `build-menu-items.tsx`：btw section — 只用一次，不抽（over-engineering），保持 inline
- [x] 10.2 `build-menu-items.tsx`：`registrySlashItems` / `cliSlashItems` map arrow → named functions（對齊 `toModelItem` pattern）
