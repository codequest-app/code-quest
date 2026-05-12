## 1. 改名 TruncatedContent → Expandable

- [x] 1.1 將 `TruncatedContent.tsx` 改名為 `Expandable.tsx`，export 名稱從 `TruncatedContent` 改為 `Expandable`
- [x] 1.2 更新所有 import（`TextContent`、測試檔、stories 等）

## 2. TDD 重構截斷邏輯移出內容元件

- [x] 2.1 寫 red tests：`TextContent` render 後 DOM 內不存在 `Expandable`（不含 truncated-inner）
- [x] 2.2 修改 `TextContent`：移除內部 `Expandable` 包裹，只 render body
- [x] 2.3 寫 red tests：`NodeContent` 在 `type === 'text'` 時外層有 `Expandable`
- [x] 2.4 修改 `NodeContent`：text type 加上 `<Expandable>` 包裹

## 3. TDD 補上缺漏的 Expandable

- [x] 3.1 寫 red tests：`AssistantTurnContent` 的 text block 外層有 `Expandable`
- [x] 3.2 修改 `AssistantTurnContent`：text block 加上 `<Expandable>`
- [x] 3.3 寫 red tests：`StreamlinedTextContent` 外層有 `Expandable`
- [x] 3.4 修改 `StreamlinedTextContent`：加上 `<Expandable>` 包裹

## 4. 驗收

- [x] 4.1 跑全部 web tests 確認無 regression
