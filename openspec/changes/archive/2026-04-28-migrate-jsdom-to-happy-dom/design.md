## Context

client package 使用 jsdom v24 作為 Vitest DOM 環境，setup.ts 維護 8 個 polyfill 補足 jsdom 缺失的瀏覽器 API。Spike 結果顯示切換 happy-dom 後 1,745/1,747 tests pass，僅 EffortSwitch 的 2 個 inline style 斷言 fail。

## Goals / Non-Goals

**Goals:**
- 切換測試環境至 happy-dom，減少 polyfill 維護負擔
- 移除不再需要的 polyfill code
- 確保所有 1,747 tests 在 happy-dom 下全 pass

**Non-Goals:**
- 不遷移至 Vitest Browser Mode（中期目標，不在此次範圍）
- 不改動 server/shared/summoner package 的測試配置
- 不重構 react-resizable-panels 和 @tanstack/react-virtual 的 mock（layout measurement 在非瀏覽器環境仍不可用）

## Decisions

### 1. 先修斷言再切環境

先修正 EffortSwitch.test.tsx 中依賴 jsdom 特定 style 行為的斷言，確認 jsdom 全 pass 後再切 happy-dom。這樣每一步都有綠燈保底，若 happy-dom 切換後出現額外問題可立即定位。

替代方案：直接切 happy-dom 再一次修所有 fail → 風險較高，無法區分「斷言修改引入的問題」vs「環境切換引入的問題」。

### 2. 逐一評估 polyfill 移除

每移除一個 polyfill 後跑測試確認，而非一次全砍。setup.ts 的 polyfill 清單：

| Polyfill | happy-dom 原生支援？ | 行動 |
|----------|---------------------|------|
| requestAnimationFrame | ✓ | 移除 setup.ts polyfill；保留 fake-raf.ts（測試用 controllable RAF） |
| scrollIntoView | ✓ | 移除 |
| ResizeObserver | ✓ | 移除 |
| IntersectionObserver | ✓ | 移除 |
| matchMedia | ✓ | 移除 setup.ts polyfill；評估 fake-match-media.ts 是否仍需要 |
| react-resizable-panels mock | N/A（layout 問題） | 保留 |
| @tanstack/react-virtual mock | N/A（layout 問題） | 保留 |

### 3. 保留 fake-raf.ts 和 fake-match-media.ts 作為 test utility

這兩個 fake 不只是 polyfill，還提供可控的測試行為（FakeRaf 控制 frame timing、FakeMediaQueryList 控制 media query 狀態）。移除的是 setup.ts 中的全域 polyfill，不是 test utility。

## Risks / Trade-offs

- **[Style 處理差異]** → happy-dom 對 `element.style.width = 'calc(...)'` 可能回傳空字串而非原始值。Spike 已發現並定位，修正斷言即可。
- **[未知的行為差異]** → happy-dom 不走 W3C spec 驗證，edge case 可能與 jsdom 不同。Mitigation: 全 test suite pass 即為驗證，後續若發現問題可逐案處理。
- **[fake-match-media.ts 相容性]** → happy-dom 原生 matchMedia 可能與 fake 衝突。需實際測試確認。
