## 1. Multi-select type filter

- [x] 1.1 RED: 測試 — 點擊 type tag 切換 hidden，被 hidden 的 event 不顯示
- [x] 1.2 GREEN: 實作 hiddenTypes Set state + tag toggle UI，取代 select 單選
- [x] 1.3 RED: 測試 — 每個 type tag 顯示 event count
- [x] 1.4 GREEN: 實作 tag count 顯示

## 2. Delta 預設隱藏

- [x] 2.1 RED: 測試 — 含 "delta" 的 type 預設不在顯示列表中
- [x] 2.2 GREEN: 實作 — 初始化 hiddenTypes 時自動加入含 delta 的 type
- [x] 2.3 RED: 測試 — 用戶點擊可 override 顯示 delta type

## 3. Auto-scroll toggle

- [x] 3.1 RED: 測試 — 新事件到達時自動滾到底部
- [x] 3.2 GREEN: 實作 autoScroll state + scrollIntoView
- [x] 3.3 RED: 測試 — 用戶手動上滾時 auto-scroll 自動關閉
- [x] 3.4 GREEN: 實作 onScroll 偵測 + 自動關閉
- [x] 3.5 RED: 測試 — 點擊 auto-scroll 按鈕重新啟用

## 4. 整合驗證

- [x] 4.1 確認 search text + type filter 同時運作
- [x] 4.2 確認既有 RawEventPanel props interface 不變
