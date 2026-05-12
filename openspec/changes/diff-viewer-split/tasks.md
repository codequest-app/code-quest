## 1. 安裝依賴

- [ ] 1.1 安裝 `react-diff-view` package

## 2. TDD 重構 DiffViewer

- [ ] 2.1 寫 red tests：split 模式預設顯示兩欄（左欄刪除行、右欄新增行）
- [ ] 2.2 寫 red tests：切換按鈕存在，點擊後切換到 unified 模式
- [ ] 2.3 實作 `DiffViewer` 內部改用 `react-diff-view`，預設 split 模式
- [ ] 2.4 實作切換按鈕（split ↔ unified）
- [ ] 2.5 確認 `editable` / `onAccept` / `onReject` 測試仍通過

## 3. 樣式調整

- [ ] 3.1 用 Tailwind 覆寫 react-diff-view 的 token 顏色（刪除紅、新增綠）
- [ ] 3.2 確認在 dark / light theme 下顯示正確

## 4. 驗收

- [ ] 4.1 跑全部 web tests 確認無 regression
