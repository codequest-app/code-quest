## 1. 介面補完

- [x] 1.1 `RawEventStore` 介面加入 `hasUserEcho(sessionId): Promise<boolean>` 和 `streamBySession(sessionId, cursor?): AsyncIterable<RawEvent>`
- [x] 1.2 `DrizzleRawEventStore` 實作這兩個方法（現有邏輯搬入）
- [x] 1.3 補 DrizzleRawEventStore 測試（已涵蓋 hasUserEcho + streamBySession 多情境）

## 2. 消除 duck-typing

- [x] 2.1 `CompositeRawEventStore` 移除 `as unknown as CursorStore` 強轉，直接 delegate
- [x] 2.2 `RawEventService` 移除 `as unknown as CursorCapable` 強轉和 fallback 邏輯
- [x] 2.3 確認所有測試通過（659 passed）
