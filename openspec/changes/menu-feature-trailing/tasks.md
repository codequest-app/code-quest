## 1. Test (TDD — 先寫，expect 不變)

- [ ] 1.1 為 `createEffortFeature` 寫單元測試（cycling、empty levels）
- [ ] 1.2 為 `createThinkingFeature` 寫單元測試（toggle on/off）
- [ ] 1.3 為 `createFastModeFeature` 寫單元測試（toggle、supportsFastMode=false 不加入）
- [ ] 1.4 為 `buildMenuItems` 寫測試：移除 9 個 model params 後仍正確產生 model section

## 2. Feature 介面擴充

- [ ] 2.1 `MenuItemFeature` 加 `trailing?: React.ReactNode`
- [ ] 2.2 `buildMenuItems` 的 `buildSection` / `toModelItem` pass-through `trailing`

## 3. Feature Factories

- [ ] 3.1 新增 `packages/client/src/features/effort/effort-feature.ts`（`createEffortFeature`）
- [ ] 3.2 新增 `packages/client/src/features/thinking/thinking-feature.ts`（`createThinkingFeature`）
- [ ] 3.3 新增 `packages/client/src/features/fast-mode/fast-mode-feature.ts`（`createFastModeFeature`）

## 4. buildMenuItems 重構

- [ ] 4.1 移除 `BuildMenuItemsParams` 的 9 個 model 狀態參數
- [ ] 4.2 移除 `buildMenuItems` 裡的 effort-level、toggle-thinking、fast-mode inline items

## 5. CommandMenu 整合

- [ ] 5.1 將三個 feature 加入 `localFeatures`（`supportsFastMode` 條件加入 fast-mode）
- [ ] 5.2 移除 CommandMenu 傳給 `buildMenuItems` 的 9 個 model 狀態參數

## 6. 驗收

- [ ] 6.1 全部測試通過（1111+）
- [ ] 6.2 UI 手動確認 effort/thinking/fast-mode 行為不變
