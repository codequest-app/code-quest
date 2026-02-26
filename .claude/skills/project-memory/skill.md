# Project Memory - Code Quest 專案記憶

> 這個 skill 記錄了 Code Quest 專案的所有重要決策、偏好、和知識
> 每次調用時，AI 會"記住"這裡的所有資訊

---

## 專案核心概念

### 專案定位
- **名稱**: Code Quest
- **本質**: 將 Claude Code CLI 遊戲化為 RPG 體驗
- **原則**: 不修改 Claude 核心功能，只在上層加 RPG 包裝

### RPG 映射關係
```
AI 元素         →  RPG 元素
用戶           →  冒險者/玩家
Claude AI      →  NPC 導師
Skills         →  技能/魔法
Subagents      →  戰鬥夥伴
API 配額       →  HP
Token 消耗     →  MP
經驗累積       →  EXP/等級
任務完成       →  戰鬥勝利
```

---

## 架構決策

### 三層架構
```
RPG UI Layer (React)
    ↓ WebSocket
Bridge Layer (Node.js)
    ↓ node-pty
Claude Code CLI
```

**為什麼這樣設計？**
- UI 層：遊戲化呈現
- Bridge 層：協調和轉換
- CLI 層：保持原始功能

### 技術選型

#### node-pty vs spawn()
**決策**: 使用 node-pty

**原因**:
- ✅ 完整 TTY 支援（spawn 沒有）
- ✅ ANSI 色彩輸出（spawn 無法）
- ✅ 可靠的暫停/恢復（spawn 不可靠）
- ✅ 動態終端調整（spawn 無法）
- ✅ 評分：9/10 vs 2/10

**參考**: vultuk/claude-code-web 的實作

#### Worktree 隔離
**決策**: 使用 Git Worktree 隔離多 AI 戰鬥

**原因**:
- 避免檔案衝突（多個 AI 同時修改同一檔案）
- 完全獨立的執行環境
- 節省空間（共享 .git 目錄）
- Git 原生支援

**實作決策**: 自己實作簡化版（約 100-200 行）
- 不用 agent-worktree CLI（避免 Rust 依賴）
- 只實作需要的功能
- 使用原生 git 命令

---

## 開發規範

### TDD 嚴格遵守

**循環**: RED → GREEN → REFACTOR

**測試金字塔**: Feature Test > Integration Test > Unit Test

**Test Double 優先順序**: Fake > Spy > Stub > Mock

**黃金法則**: ⚠️ 重構時 expect 絕對不可變更

**原則**:
- 先寫測試，逼出程式用法
- 不可憑空想象程式
- 不要過度設計
- 只實作當前需要的功能

### Git Commit 規範

```
feat: 新功能
fix: 修復 Bug
test: 測試相關
refactor: 重構（expect 不變）
docs: 文檔更新
```

**頻率**: 小而頻繁的 commit
- 每個 GREEN → commit
- 每個 REFACTOR → commit

---

## 用戶偏好（重要！）

### 開發風格
- ❌ 不喜歡過度設計
- ✅ 偏好簡單直接的解決方案
- ✅ 只實作當前需要的功能
- ❌ 不要添加"可能未來需要"的功能

### 測試偏好
- ✅ 嚴格 TDD，必須先寫測試
- ✅ Feature Test 最優先
- ✅ 偏好 Fake，避免 Mock
- ❌ 不測試實作細節

### 程式碼風格
- ✅ TypeScript
- ✅ 函數式風格優於 class
- ✅ 簡潔清晰
- ❌ 不要過度抽象

### 技術選擇
- ✅ 狀態管理：Zustand（不用 Redux）
  - 原因：更簡單，符合不過度設計原則

---

## 已知問題與解決方案

### PTY 權限問題
**問題**: `posix_spawnp failed`

**解決方案**:
```bash
chmod +x node_modules/node-pty/build/Release/spawn-helper
```

### WebSocket 重連循環
**問題**: React Strict Mode 導致無限重連

**解決方案**:
```typescript
useEffect(() => {
  connect();
  return () => disconnect();
}, []); // 空依賴陣列
```

### Worktree 殘留
**問題**: 清理失敗導致 worktree 殘留

**解決方案**:
```bash
git worktree list --porcelain | \
  grep '^worktree' | \
  xargs -I {} git worktree remove {} --force
```

---

## 實作進度

### 已完成
- [x] 專案架構設計
- [x] 技術選型（node-pty, Worktree）
- [x] 文檔撰寫
  - [x] vultuk 架構分析
  - [x] agent-worktree 整合方案
  - [x] TDD Guidelines
  - [x] Dev Workflow
  - [x] PTY Architecture

### 進行中
- [ ] WorktreeManager 實作
- [ ] BattleBridge 實作
- [ ] BattleOrchestrator 實作

### 待辦
- [ ] UI 層實作
- [ ] WebSocket 整合
- [ ] 完整系統測試

---

## 設計參考

### 參考專案
1. **vultuk/claude-code-web**: PTY 架構參考
2. **agent-worktree**: Worktree 管理思想參考

### 參考文檔
- `docs/ui-design/references/vultuk-architecture.md`
- `docs/ui-design/references/agent-worktree-integration.md`
- `docs/implementation-strategy.md`

---

## 快速決策參考

遇到問題時，快速查看這裡的決策：

| 問題 | 決策 | 原因 |
|------|------|------|
| 如何隔離多 AI？ | Worktree | 避免檔案衝突 |
| 用什麼管理 PTY？ | node-pty | 完整 TTY 支援 |
| 要用 agent-worktree CLI 嗎？ | 不用，自己實作 | 避免依賴，約 100 行 |
| 測試策略？ | TDD，Feature > Integration > Unit | 用戶偏好 |
| 過度設計？ | 不要 | 用戶明確偏好 |
| expect 可以改嗎？ | 絕對不行 | 黃金法則 |

---

## 更新日誌

### 2026-02-09
- 決定使用 Worktree 隔離
- 決定自己實作 Worktree 管理
- 確立 TDD 開發流程
- 確認用戶偏好（不過度設計）

---

> **使用方式**:
> 在對話中輸入 `/project-memory`，AI 就會"記住"這裡的所有資訊
> 這個文件應該持續更新，記錄新的決策和發現
