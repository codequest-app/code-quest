## 1. Expandable 加 defaultOpen prop

- [x] 1.1 寫 red test：`Expandable defaultOpen={true}` 時預設展開（有 Show less 或內容可見）
- [x] 1.2 修改 `Expandable`：`useState(defaultOpen ?? false)`，加 `defaultOpen?: boolean` prop

## 2. NodeContent text type 傳入 defaultOpen

- [x] 2.1 寫 red test：`NodeContent isLastTurn={true}` + `type==='text'` 時 Expandable 預設展開
- [x] 2.2 寫 red test：`NodeContent isLastTurn={false}` + `type==='text'` 時 Expandable 預設收合
- [x] 2.3 修改 `NodeContent`：text type 的 `<Expandable defaultOpen={isLastTurn ?? false}>`

## 3. AssistantTurnContent text block 傳入 defaultOpen

- [x] 3.1 寫 red test：`AssistantTurnContent isLastTurn={true}` 時 text block Expandable 預設展開
- [x] 3.2 修改 `AssistantTurnContent`：text block 加 `defaultOpen={isLastTurn ?? false}`

## 4. StreamlinedTextContent 傳入 defaultOpen

- [x] 4.1 寫 red test：`StreamlinedTextContent defaultOpen={true}` 時 Expandable 預設展開
- [x] 4.2 修改 `StreamlinedTextContent`：加 `defaultOpen` prop 並傳給 `Expandable`
- [x] 4.3 修改 `NodeContent`：呼叫 `StreamlinedTextContent` 時傳入 `defaultOpen={isLastTurn ?? false}`

## 5. 驗收

- [x] 5.1 跑全部 web tests 確認無 regression
