## 1. 修正環境依賴的斷言（jsdom 下先 pass）

- [x] 1.1 修正 `EffortSwitch.test.tsx` 的 2 個 inline style 斷言，改為不依賴特定 DOM 環境的序列化行為（例如檢查 `getAttribute('style')` 或 `element.style.cssText`）
- [x] 1.2 確認 jsdom 下全 1,747 tests pass

## 2. 切換測試環境

- [x] 2.1 `packages/client/package.json` 新增 `happy-dom` devDependency
- [x] 2.2 `packages/client/vitest.config.ts` 的 `environment` 從 `jsdom` 改為 `happy-dom`
- [x] 2.3 確認 happy-dom 下全 tests pass

## 3. 移除不再需要的 polyfill

- [x] 3.1 移除 setup.ts 中 `requestAnimationFrame` polyfill（保留 `fake-raf.ts` test utility）
- [x] 3.2 移除 setup.ts 中 `scrollIntoView` stub
- [x] 3.3 移除 setup.ts 中 `ResizeObserver` stub
- [x] 3.4 移除 setup.ts 中 `IntersectionObserver` stub
- [x] 3.5 移除 setup.ts 中 `matchMedia` polyfill，驗證 `fake-match-media.ts` 與 happy-dom 的相容性
- [x] 3.6 每移除一項後跑測試確認無 regression

## 4. 清理 dependency

- [x] 4.1 移除 `jsdom` devDependency
- [x] 4.2 最終確認全 tests pass + type check pass
