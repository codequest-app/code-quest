## Why

client package 的 212 個測試檔使用 jsdom 作為 DOM 環境，需要在 setup.ts 維護 8 個 polyfill（RAF、ResizeObserver、IntersectionObserver、matchMedia 等）。happy-dom 原生支援這些 API，且速度更快。Spike 驗證 1,747 個 test 中僅 2 個因 inline style 處理差異 fail，migration 成本極低。

## What Changes

- 修正 `EffortSwitch.test.tsx` 中 2 個依賴 jsdom style 特定行為的斷言，使其環境無關
- vitest config `environment` 從 `jsdom` 改為 `happy-dom`
- 移除 setup.ts 中 happy-dom 已原生支援的 polyfill（RAF、scrollIntoView、ResizeObserver、IntersectionObserver、matchMedia）
- 移除 `jsdom` devDependency，新增 `happy-dom`
- 保留仍需要的 mock（react-resizable-panels、@tanstack/react-virtual — 因為 layout measurement 在任何非瀏覽器環境都不可用）

## Capabilities

### New Capabilities

_None — this is a tooling migration, not a feature change._

### Modified Capabilities

- `client-testing`: 測試環境從 jsdom 改為 happy-dom，部分 polyfill 不再需要

## Impact

- `apps/web/vitest.config.ts` — environment 設定
- `apps/web/src/test/setup.ts` — 移除不再需要的 polyfill
- `apps/web/src/test/fake-match-media.ts` — 可能可移除或簡化
- `apps/web/src/test/fake-raf.ts` — 評估是否仍需要
- `apps/web/src/components/ui/__tests__/EffortSwitch.test.tsx` — 修正 2 個斷言
- `apps/web/package.json` — dependency 變更
