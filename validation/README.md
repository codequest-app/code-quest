# Code Quest - node-pty 驗證腳本

## 目的

驗證 node-pty 是否能滿足 Code Quest 的核心需求。

## 安裝

```bash
cd validation
pnpm install
```

## 使用方法

### 單獨測試

```bash
# 測試 1: node-pty 基礎能力
pnpm test:01

# 測試 2: Claude CLI 輸出格式
pnpm test:02

# 測試 3: 事件解析能力
pnpm test:03

# 測試 4: 互動模式處理
pnpm test:04

# 測試 5: 並行多進程
pnpm test:05

# 測試 6: Worktree 整合
pnpm test:06
```

### 執行所有測試

```bash
pnpm test:all
```

### 清理日誌

```bash
pnpm clean
```

## 輸出

所有測試的詳細輸出會儲存在 `logs/` 目錄：

- `logs/01-basic-pty.log` - 基礎能力測試輸出
- `logs/02-output-format.log` - 輸出格式測試輸出
- `logs/03-event-parsing.log` - 事件解析測試輸出
- `logs/04-interaction.log` - 互動模式測試輸出
- `logs/05-parallel.log` - 並行測試輸出
- `logs/06-worktree.log` - Worktree 測試輸出

## 驗證腳本說明

### 01-basic-pty.ts
驗證 node-pty 的基礎功能：
- 能否啟動 Claude CLI
- 能否接收輸出
- 能否發送輸入
- 能否捕獲退出事件

### 02-output-format.ts
分析 Claude CLI 的輸出格式：
- 測試不同的 CLI 參數
- 記錄完整的原始輸出
- 識別輸出結構

### 03-event-parsing.ts
測試能否解析出需要的資訊：
- Tool use 事件
- Token usage
- Thinking blocks
- 對話內容

### 04-interaction.ts
測試互動模式：
- 用戶確認提示
- 問答互動
- Plan Mode

### 05-parallel.ts
測試並行多進程：
- 同時啟動多個 Claude CLI
- 驗證隔離性
- 監控資源使用

### 06-worktree.ts
測試 Worktree 整合：
- 不同 worktree 中的 Claude CLI
- Git 狀態隔離
- Skills 可用性

## 驗證清單

詳細的驗證清單請參考：`docs/implementation/node-pty-validation-checklist.md`

## 注意事項

1. 確保已安裝 Claude Code CLI
2. 確保有足夠的 API 配額（測試會消耗 tokens）
3. 某些測試需要 git 環境
4. 測試 06 需要先創建測試 worktree

## 相關文檔

- `docs/implementation/node-pty-validation-checklist.md` - 完整驗證清單
- `docs/ui-design/references/vultuk-architecture.md` - vultuk 架構參考
- `docs/implementation/poc-plan.md` - POC 實作計畫
