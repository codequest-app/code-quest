## 1. Attachment 資料結構

- [x] 1.1 ChannelComposeContext — attachments 增加 objectUrl 欄位（createObjectURL）
- [x] 1.2 送出後 revokeObjectURL 清理
- [x] 1.3 component unmount 時 revoke 所有 objectURL

## 2. Input 區縮圖

- [x] 2.1 ComposeInput — image 檔案替換為 `<img>` 縮圖，非 image 保留現有 chip 樣式
- [x] 2.2 hover 顯示移除按鈕（overlay，image chip）
- [x] 2.3 點擊縮圖開啟 ImagePreviewModal（僅 image）
- [x] 2.4 測試：paste image → 縮圖出現；paste PDF → chip；移除；預覽
- [x] 2.5 Storybook

## 3. ImagePreviewModal

- [x] 3.1 新增 ImagePreviewModal 元件（dialog overlay + 大圖）
- [x] 3.2 ESC / 點擊 overlay 關閉
- [x] 3.3 測試 + Storybook

## 4. 訊息列表圖片渲染

- [x] 4.1 新增 `parseAttachments(content)` util — 從 content 解析 `[Attachment: name]\n{base64}` 區塊，回傳 `{ name, base64, mimeType }[]` 和剩餘文字
- [x] 4.2 NodeContent user message — 用 parseAttachments 渲染：image → `<img>`，非 image → 📄 chip，隱藏原始 attachment 文字
- [x] 4.3 點擊圖片開啟 ImagePreviewModal
- [x] 4.4 測試：content 含 attachment → 顯示為圖片、點擊預覽

## 5. 驗證

- [x] 5.1 全部 tests green
- [x] 5.2 瀏覽器驗證：paste → thumbnail → 送出 → inline image → 點擊預覽
