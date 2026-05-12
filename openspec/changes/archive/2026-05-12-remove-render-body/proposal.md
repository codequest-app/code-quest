## Why

`renderBody` 是 `NodeContent` 只為測試暴露的 public function，讓測試繞過 store 直接呼叫 `renderContent`。它讓測試與 `NodeContent` 強耦合，且因 task/result 永遠 undefined 而降低覆蓋度。

## What Changes

- `message-blocks.test.tsx`：把每個 `renderBody({type: X, ...})` 改成直接 render 對應元件
- 刪除 `NodeContent.tsx` 的 `renderBody` export

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
（無）

## Impact

- `src/components/chat/tool-use/__tests__/message-blocks.test.tsx`
- `src/components/chat/conversation/NodeContent.tsx`
