# Spec: AddButton

## 需求

AddButton dropdown 對齊 extension：加 icon、改 label、修 dismiss 行為。

## 選項
| id | label | icon |
|---|---|---|
| upload | Upload from computer | 上傳 SVG（從 extension 提取） |
| files | Add context | @ SVG（從 extension 提取） |

## Dismiss 行為
- `Escape` 關閉 dropdown
- 點擊 dropdown 外部關閉
- 兩者都是 `useEffect` + `document.addEventListener`，只在 open 時綁定

## 驗收條件
- [ ] 每個選項有 SVG icon
- [ ] label 改為 "Add context"（原 "Files & Folders"）
- [ ] Esc 關閉
- [ ] click outside 關閉
