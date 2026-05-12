## Why

目前貼上圖片到 chat input 時：

1. 只顯示檔名 + 移除按鈕，**沒有縮圖預覽**，使用者無法確認貼的是什麼圖
2. 送出後，圖片以 `[Attachment: filename]\n{base64}` 純文字呈現在訊息列表裡，看不到圖片
3. 無法點擊圖片預覽大圖

## What Changes

### Input 區域
- 貼上圖片後在 input 上方顯示 **縮圖 thumbnail**（而非只有檔名）
- 點擊縮圖可 **預覽大圖**（modal 或 lightbox）
- 保留移除按鈕（hover 或 overlay）

### 訊息列表
- user message 中的圖片附件顯示為 **inline 圖片**（`<img>` tag），而非 base64 文字
- 點擊可預覽大圖

## Capabilities

### New Capabilities
- `image-paste-preview`: 圖片貼上預覽 + 訊息內圖片渲染

### Modified Capabilities
- `compose-input`: input 區顯示圖片縮圖
- `message-render`: user message 渲染圖片附件

## Impact

- `apps/web/src/components/chat/compose/ComposeInput.tsx` — 縮圖 UI + 點擊預覽
- `apps/web/src/contexts/channel/ChannelComposeContext.tsx` — attachment 保留 objectURL 供預覽
- `apps/web/src/components/chat/conversation/ChatMessage.tsx` — user message 圖片渲染
- `apps/web/src/components/chat/conversation/MessageContent.tsx` — 圖片 block 渲染
- 可能新增 ImagePreviewModal 元件
