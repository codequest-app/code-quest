# TDD 測試規劃 - Phase 1: xterm.js 終端整合

**建立日期**: 2026-02-09
**目標**: 使用 TDD 方法開發 xterm.js 終端整合功能

---

## 測試優先原則

### Red-Green-Refactor 循環

```
1. Red    - 寫測試（失敗）
2. Green  - 最小實作（通過）
3. Refactor - 重構優化
```

### 覆蓋率目標

- **單元測試**: >80%
- **整合測試**: 關鍵流程 100%
- **E2E 測試**: 主要使用場景

---

## 後端測試計畫

### 1. TerminalSession 單元測試

**檔案**: `packages/server/src/terminal/__tests__/session.test.ts`

**測試項目**:
- [ ] 創建 session 時生成唯一 ID
- [ ] 初始狀態 isRunning = false
- [ ] Claude CLI 啟動時使用正確參數
  - [ ] `--print --output-format stream-json --verbose`
  - [ ] 正確的 model 參數
- [ ] Gemini CLI 啟動時使用正確參數
  - [ ] `--output-format stream-json`
  - [ ] 正確的 model 參數
- [ ] start() 後 isRunning = true
- [ ] 接收到 CLI 輸出時發送 'data' 事件
- [ ] CLI 退出時發送 'exit' 事件
- [ ] write() 正確發送輸入到 PTY
- [ ] write() 在未運行時拋出錯誤
- [ ] resize() 正確調整終端大小
- [ ] kill() 正確終止進程
- [ ] 重複 start() 拋出錯誤
- [ ] getInfo() 返回正確的資訊

**預計時間**: 2-3 小時

---

### 2. TerminalManager 單元測試

**檔案**: `packages/server/src/terminal/__tests__/manager.test.ts`

**測試項目**:
- [ ] createSession() 創建新 session 並返回 ID
- [ ] createSession() 可選擇性自動啟動 prompt
- [ ] getSession() 返回正確的 session
- [ ] getAllSessions() 返回所有 session
- [ ] killSession() 終止特定 session
- [ ] killAll() 終止所有 session
- [ ] session 事件正確轉發到 manager
  - [ ] 'session:data' 事件
  - [ ] 'session:exit' 事件

**預計時間**: 1-2 小時

---

### 3. Socket.io 處理整合測試

**檔案**: `packages/server/src/socket/__tests__/handlers.test.ts`

**測試項目**:
- [ ] 客戶端連接時記錄日誌
- [ ] 'terminal:create' 事件創建新終端
- [ ] 'terminal:create' 成功後發送 'terminal:created'
- [ ] 'terminal:create' 失敗後發送 'terminal:error'
- [ ] 'terminal:input' 正確寫入到 session
- [ ] 'terminal:resize' 正確調整 session 大小
- [ ] 'terminal:kill' 正確終止 session
- [ ] 'terminal:list' 返回所有 session 列表
- [ ] Manager 的 'session:data' 廣播到所有客戶端
- [ ] Manager 的 'session:exit' 廣播到所有客戶端

**預計時間**: 2-3 小時

---

### 4. HTTP 端點測試

**檔案**: `packages/server/src/__tests__/index.test.ts`

**測試項目**:
- [ ] GET /health 返回 200 和正確格式
- [ ] CORS 設定正確
- [ ] 優雅關閉（SIGTERM）功能

**預計時間**: 1 小時

---

## 前端測試計畫

### 1. useSocket Hook 測試

**檔案**: `packages/client/src/hooks/__tests__/useSocket.test.ts`

**測試項目**:
- [ ] 初始化時 isConnected = false
- [ ] socket 連接成功後 isConnected = true
- [ ] socket 斷開後 isConnected = false
- [ ] createTerminal() 發送正確事件
- [ ] sendInput() 發送正確事件
- [ ] resizeTerminal() 發送正確事件
- [ ] killTerminal() 發送正確事件
- [ ] requestTerminalList() 發送正確事件
- [ ] unmount 時正確清理 socket

**預計時間**: 2 小時

---

### 2. useTerminalStore 測試

**檔案**: `packages/client/src/stores/__tests__/terminalStore.test.ts`

**測試項目**:
- [ ] 初始狀態為空 tabs 和 null activeTabId
- [ ] addTab() 創建新 tab 並返回 ID
- [ ] addTab() 設置新 tab 為 active
- [ ] removeTab() 移除 tab
- [ ] removeTab() 移除 active tab 時切換到下一個
- [ ] setActiveTab() 正確切換 active tab
- [ ] updateTab() 正確更新 tab 屬性
- [ ] getActiveTab() 返回 active tab

**預計時間**: 1-2 小時

---

### 3. Terminal 組件測試

**檔案**: `packages/client/src/components/Terminal/__tests__/Terminal.test.tsx`

**測試項目**:
- [ ] 渲染終端容器
- [ ] 初始化 xterm 實例
- [ ] 創建 canvas 元素
- [ ] 加載 FitAddon 和 WebLinksAddon
- [ ] 用戶輸入時調用 onData
- [ ] 終端大小變化時調用 onResize
- [ ] unmount 時正確清理

**預計時間**: 2 小時

---

### 4. TerminalTabs 組件測試

**檔案**: `packages/client/src/components/Terminal/__tests__/TerminalTabs.test.tsx`

**測試項目**:
- [ ] 渲染所有 tabs
- [ ] 顯示正確的 tab 標題
- [ ] 點擊 tab 切換 active
- [ ] 顯示運行狀態指示器
- [ ] 點擊關閉按鈕調用 removeTab
- [ ] 點擊 + 按鈕調用 onNewTerminal

**預計時間**: 1-2 小時

---

### 5. NewTerminalDialog 組件測試

**檔案**: `packages/client/src/components/Terminal/__tests__/NewTerminalDialog.test.tsx`

**測試項目**:
- [ ] isOpen=false 時不渲染
- [ ] isOpen=true 時渲染對話框
- [ ] 選擇 provider 時更新 model 選項
- [ ] 輸入 prompt
- [ ] 點擊創建調用 onCreate
- [ ] 點擊取消調用 onClose
- [ ] 創建後清空 prompt

**預計時間**: 1-2 小時

---

## E2E 測試計畫（手動）

### 場景 1: 創建單一終端

**步驟**:
1. 啟動 server 和 client
2. 確認連接成功
3. 點擊 + 新增終端
4. 選擇 Claude Sonnet
5. 輸入 "Say hello"
6. 確認終端創建成功
7. 確認 Claude 輸出正常顯示

**預期結果**:
- ✅ 終端正常創建
- ✅ xterm 顯示 Claude 輸出
- ✅ 可以在終端中輸入

**預計時間**: 10 分鐘

---

### 場景 2: 多終端並行

**步驟**:
1. 創建終端 1: Claude Haiku
2. 創建終端 2: Claude Sonnet
3. 創建終端 3: Gemini
4. 在終端 1 輸入命令
5. 切換到終端 2
6. 在終端 2 輸入命令
7. 切換到終端 3
8. 確認三個終端輸出獨立

**預期結果**:
- ✅ 可以同時運行 3 個終端
- ✅ Tab 切換正常
- ✅ 輸出完全隔離

**預計時間**: 15 分鐘

---

### 場景 3: 終端生命週期

**步驟**:
1. 創建終端
2. 執行命令到結束
3. 確認終端狀態更新（運行 → 空閒）
4. 關閉終端
5. 確認 tab 被移除

**預期結果**:
- ✅ 狀態指示器正確更新
- ✅ 關閉功能正常
- ✅ 沒有記憶體洩漏

**預計時間**: 10 分鐘

---

### 場景 4: 錯誤處理

**步驟**:
1. 嘗試在無效目錄創建終端
2. 確認錯誤提示顯示
3. 嘗試輸入到已關閉的終端
4. 確認錯誤處理正確

**預期結果**:
- ✅ 錯誤訊息清晰
- ✅ 不會崩潰
- ✅ 可以恢復操作

**預計時間**: 10 分鐘

---

## 測試執行順序

### Day 1: 後端基礎
1. TerminalSession 單元測試（TDD）
2. TerminalSession 實作
3. TerminalManager 單元測試（TDD）
4. TerminalManager 實作

### Day 2: 後端整合
1. Socket.io 處理整合測試（TDD）
2. Socket.io 處理實作
3. HTTP 端點測試
4. 主入口整合

### Day 3: 前端基礎
1. Store 測試（TDD）
2. Store 實作
3. useSocket Hook 測試（TDD）
4. useSocket Hook 實作

### Day 4: 前端組件
1. Terminal 組件測試（TDD）
2. Terminal 組件實作
3. TerminalTabs 組件測試（TDD）
4. TerminalTabs 組件實作

### Day 5: 前端整合與 E2E
1. NewTerminalDialog 測試與實作
2. App 組件整合
3. E2E 測試（手動）
4. Bug 修復與優化

---

## 測試工具與配置

### 後端
- **測試框架**: Vitest
- **HTTP 測試**: Supertest
- **Mock**: vi.fn(), vi.mock()
- **覆蓋率**: v8 provider

### 前端
- **測試框架**: Vitest
- **組件測試**: React Testing Library
- **Mock**: vi.fn(), vi.mock()
- **覆蓋率**: v8 provider

---

## 成功標準

### 單元測試
- ✅ 所有測試通過
- ✅ 覆蓋率 >80%
- ✅ 沒有 skip 或 todo 測試

### 整合測試
- ✅ 關鍵流程 100% 覆蓋
- ✅ Socket.io 事件正確處理
- ✅ 終端生命週期正確管理

### E2E 測試
- ✅ 所有場景通過
- ✅ 無明顯 Bug
- ✅ 性能可接受（延遲 <100ms）

---

## 參考資源

- **Vitest 文檔**: https://vitest.dev/
- **React Testing Library**: https://testing-library.com/react
- **Socket.io 測試**: https://socket.io/docs/v4/testing/
- **xterm.js API**: https://xtermjs.org/docs/api/

---

**下一步**: 從 Day 1 開始執行 TDD 開發流程
