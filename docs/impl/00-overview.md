# 實作指南總覽

本資料夾提供**自行實作 Claude Code Extension Protocol** 所需的規格文件，著重於「要怎麼做」而非「現有程式做了什麼」。

## 文件列表

| 檔案 | 內容 |
|------|------|
| [01-architecture.md](01-architecture.md) | 整體架構、元件職責、資料流 |
| [02-channel-state-machine.md](02-channel-state-machine.md) | Channel 生命週期與狀態機 |
| [03-sequence-diagrams.md](03-sequence-diagrams.md) | 核心流程序列圖 |
| [04-initialization-checklist.md](04-initialization-checklist.md) | 啟動流程與必要步驟 |
| [05-error-handling.md](05-error-handling.md) | 錯誤處理規範 |

## 閱讀順序

1. 先讀 `01-architecture.md` 了解整體架構
2. 讀 `04-initialization-checklist.md` 確認啟動順序
3. 讀 `02-channel-state-machine.md` 了解 Channel 生命週期
4. 讀 `03-sequence-diagrams.md` 深入每個流程細節
5. 讀 `05-error-handling.md` 補完錯誤處理

## 與 protocol/ 文件的關係

`docs/protocol/` 是**訊息格式參考**（每個訊息長什麼樣），本資料夾是**實作指南**（訊息的順序、狀態、錯誤處理）。實作時兩者搭配使用。
