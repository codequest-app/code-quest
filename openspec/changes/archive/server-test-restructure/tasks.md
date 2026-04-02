## Server Test Restructure

> **規則**：
> - TDD：Red → Green → Refactor
> - FakeClaude + real JSON fixtures（segments pattern）
> - expect 不變或等價，絕對不改 expect
> - 搬移前後 356 tests baseline 不變
> - 每步跑測試

---

### 1. 分析結果

78 tests 分類（0 重複、78 unique）：

| Domain | Count | Target File |
|--------|-------|-------------|
| session | 26 | chat-handler-session.test.ts |
| control | 12 | chat-handler-control.test.ts |
| settings | 8 | chat-handler-settings.test.ts |
| message | 6 | **新建** chat-handler-message.test.ts |
| state | 8 | **新建** chat-handler-state.test.ts |
| plan | 5 | **新建** chat-handler-plan.test.ts |
| git | 3 | **新建** chat-handler-git.test.ts（+ 從 misc 搬出已有的 git tests） |
| auth | 1 | **新建** chat-handler-auth.test.ts |
### 2. 搬移 session tests（26 個）→ chat-handler-session.test.ts

- [ ] 3.1 搬移 session 相關 tests
- [ ] 3.2 跑測試 — 確認 count 不變

### 4. 搬移 control tests（12 個）→ chat-handler-control.test.ts

- [ ] 4.1 搬移 control 相關 tests
- [ ] 4.2 跑測試

### 5. 搬移 settings tests（8 個）→ chat-handler-settings.test.ts

- [ ] 5.1 搬移 settings 相關 tests
- [ ] 5.2 跑測試

### 6. 新建 + 搬移 message tests（6 個）→ chat-handler-message.test.ts

- [ ] 6.1 新建檔案，搬移 message/streaming pipeline tests
- [ ] 6.2 跑測試

### 7. 新建 + 搬移 state tests（8 個）→ chat-handler-state.test.ts

- [ ] 7.1 新建檔案，搬移 state broadcast/config cache tests
- [ ] 7.2 跑測試

### 8. 新建 + 搬移 plan tests（5 個）→ chat-handler-plan.test.ts

- [ ] 8.1 新建檔案，搬移 plan comment/review tests
- [ ] 8.2 跑測試

### 9. 新建 + 搬移 git tests（3 個 + misc 已有的 git tests）→ chat-handler-git.test.ts

- [ ] 9.1 新建檔案，搬移 chat-handler.test.ts 的 git tests
- [ ] 9.2 從 chat-handler-misc.test.ts 搬出已有的 git tests
- [ ] 9.3 跑測試

### 9b. 新建 + 搬移 auth test（1 個）→ chat-handler-auth.test.ts

- [ ] 9b.1 新建檔案，搬移 auth:url test
- [ ] 9b.2 跑測試

### 10. 刪除 chat-handler.test.ts

- [ ] 10.1 確認檔案為空
- [ ] 10.2 刪除
- [ ] 10.3 跑測試 — 356 tests baseline

### 11. Client test 命名統一

- [ ] 11.1 合併 MCPPanel.unit.test.tsx → MCPPanel.test.tsx
- [ ] 11.2 合併 TimelineItem.unit.test.tsx → TimelineItem.test.tsx
- [ ] 11.3 跑 client 測試 — 671 tests / 74 files（合併後 72 files）

### 12. 驗證

- [ ] 12.1 零重複 test descriptions（server）
- [ ] 12.2 356 server tests 全過
- [ ] 12.3 每個 server test file 對應一個 handler domain
- [ ] 12.4 零 `.unit.test.` 檔案（client）
- [ ] 12.5 client tests 全過
