## Context

目前 ComposeInput 貼上圖片時用 `addAttachments()` 加入 File 物件，UI 只顯示檔名。送出時在 ChannelComposeContext 用 FileReader 讀成 base64 再 append 到訊息文字裡。訊息列表裡圖片就是一串 base64 文字。

## Goals / Non-Goals

**Goals:**
- 貼上圖片後在 input 上方顯示縮圖（thumbnail）
- 點擊縮圖可預覽大圖（modal）
- 送出後 user message 裡圖片顯示為 `<img>` 而非 base64 文字
- 點擊訊息裡的圖片可預覽大圖

**Non-Goals:**
- 不做拖拽上傳（只處理 paste）
- 不做圖片壓縮/resize
- 不做 server 端圖片儲存（仍用 base64 傳輸）

## Decisions

### 1. Attachment 資料結構

在 `ChannelComposeContext` 的 attachments 增加 `objectUrl` 欄位（`URL.createObjectURL(file)`），用於 UI 預覽。送出後 revoke。

### 2. Input 區縮圖

替換現有的檔名顯示為 `<img src={objectUrl}>` 縮圖（64x64 或 48px height, object-cover）。hover 顯示移除按鈕。點擊開啟 ImagePreviewModal。

### 3. 訊息列表圖片渲染

**send 格式不變**：圖片仍以 `[Attachment: filename]\n{base64}` append 到 content 文字，Claude CLI 需要這個格式解析圖片。

NodeContent 在渲染 user message 時，解析 content 中的 `[Attachment: ...]` 區塊，將 base64 data 轉為 `<img src="data:image/...;base64,...">` 顯示，不顯示原始文字。

### 4. ImagePreviewModal

共用元件，接收 `src: string`，用 dialog/overlay 顯示大圖。ESC 或點擊 overlay 關閉。

## Risks / Trade-offs

- **[Risk] 大圖 base64 in memory** — 多張大圖可能佔用大量記憶體。暫不處理，未來可考慮壓縮。
- **[Trade-off] objectURL 生命週期** — 需要在 component unmount 或送出後 revoke，避免 memory leak。
