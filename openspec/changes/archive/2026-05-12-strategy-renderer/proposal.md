## Why

`Message` type 有 `meta: Record<string, unknown>` — 型別不安全，handler 塞什麼 render 層都要猜。
Component 為了讀 meta 到處 `as unknown as { ... }` cast，沒有 type narrowing。

正確做法：**handler 負責 transform（server event → typed flat fields），component 只讀 typed fields，用 `message.type` dispatch 到對應 component。**

## What Changes

1. handler 轉出的資料全部用 top-level typed fields，不再塞 `meta`
2. `Message` union type 的每個 variant 直接帶 typed fields（透過 `TopLevelMap`）
3. `renderContent` 用 if/else dispatch，每個 type 對應獨立 Content component
4. Component 認識的是 handler 產出的 Message shape，不是 server protocol
5. 最終移除 `meta` field — discriminated union narrow 後 component 直接拿 typed props，不用 cast

## Impact

- `apps/web/src/types/ui.ts` — Message union、TopLevelMap、Block interface
- `apps/web/src/contexts/channel/handlers/` — 所有 handler 只寫 top-level fields
- `apps/web/src/components/chat/renderers/content/` — 獨立 Content components
- `apps/web/src/components/chat/conversation/NodeContent.tsx` — if/else dispatch
- TDD 重構：所有既有測試 expect 不變或等價
