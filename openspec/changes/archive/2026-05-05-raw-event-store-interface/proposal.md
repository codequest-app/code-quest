## Why

`RawEventStore` 介面缺少 `hasUserEcho` 和 `streamBySession` 兩個方法，導致 `CompositeRawEventStore` 和 `RawEventService` 都用 `as unknown as` duck-typing 強轉，且 `RawEventService` 裡還重複了 `hasUserEcho` 的 fallback 業務邏輯（掃 `"type":"user"` 原始事件），造成兩處維護點。

## What Changes

- `RawEventStore` 介面加入 `hasUserEcho` 和 `streamBySession` 方法（含 default 實作給舊 store）
- `CompositeRawEventStore` 和 `RawEventService` 移除 duck-typing，直接 delegate
- `RawEventService` 的 fallback 邏輯刪除，業務判斷集中在 store 層

## Impact

- `apps/server/src/services/raw-event-service.ts`
- `apps/server/src/services/composite-raw-event-store.ts`
- `apps/server/src/services/drizzle-raw-event-store.ts`（實作新介面方法）
