# 設計文檔重組計劃

**日期**: 2026-02-05
**版本**: v1.0
**目標**: 將所有設計文檔統一為 `requirements` / `ui-design` / `implementation` 三層結構

---

## 重組原則

### 文件結構標準

```
docs/design/{系統名稱}/
├─ requirements.md        (需求定義)
│  - 核心概念
│  - 功能需求
│  - 限制和規則
│  - 使用場景
│
├─ ui-design.md           (畫面設計)
│  - UI 組件設計
│  - 互動流程
│  - 視覺設計
│  - 動畫效果
│
└─ implementation.md      (實作細節)
   - 技術架構
   - API 設計
   - 數據結構
   - 實作優先級
```

### 文件大小建議

- Requirements: 300-500 行
- UI Design: 400-600 行
- Implementation: 500-800 行
- 總計: 1200-1900 行（拆分前可能 2000+ 行）

---

## 重組任務清單

### Phase 1: 新建核心系統（P0）

#### Task 1.1: 地圖系統設計 🆕
```
創建: docs/design/map-system/
├─ requirements.md       [新建]
│  - 地圖概念（城鎮、野外、副本）
│  - 場所列表和功能
│  - 限制規則（哪裡能做什麼）
│  - 遭遇戰機制
│
├─ ui-design.md          [新建]
│  - 地圖導航介面
│  - 鍵盤/滑鼠/觸控操作
│  - 場所進入/退出流程
│  - 地圖視覺設計
│
└─ implementation.md     [新建]
   - 地圖數據結構
   - 導航系統實作
   - 場所管理器
   - 遭遇戰觸發邏輯
```

**依賴**: 無
**預估**: 1200 行（400 + 400 + 400）

---

#### Task 1.2: Worktree-戰鬥整合設計 🆕
```
創建: docs/design/worktree-battle-integration/
├─ requirements.md       [新建]
│  - 整合概念（每個戰鬥 = 每個 worktree）
│  - 自動創建時機
│  - 手動 vs 自動 worktree
│  - 合併策略
│
├─ flow-design.md        [新建]
│  - 戰鬥開始流程（含 worktree 創建）
│  - 戰鬥進行中的 worktree 管理
│  - 戰鬥結束流程（合併/保留/放棄）
│  - 並行戰鬥管理
│
└─ implementation.md     [新建]
   - WorktreeBattleManager 設計
   - Git 操作封裝
   - 戰鬥實例與 worktree 綁定
   - 錯誤處理和恢復
```

**依賴**: Map System
**預估**: 1400 行（400 + 500 + 500）

---

### Phase 2: 重組現有大文件（P0）

#### Task 2.1: Interactive Events 重組
```
來源: Interactive-Battle-Events-Design.md (2260 行)

拆分為: docs/design/interactive-events/
├─ requirements.md       [重組]
│  - 互動事件類型（Plan Mode, AskUserQuestion, 錯誤, 權限）
│  - 事件觸發時機
│  - 處理規則
│
├─ ui-design.md          [重組]
│  - 事件彈窗設計（4種事件）
│  - 動畫效果
│  - 用戶操作流程
│
├─ tool-mappings.md      [重組]
│  - 工具 RPG 化映射表
│  - Bash 命令分類（12+ 種）
│  - 文件操作魔法
│  - MP 消耗速查表
│
└─ implementation.md     [重組]
   - BattleEventModal 組件
   - ToolDetector / ToolMapper
   - 並行操作偵測
   - 流式輸出處理
```

**依賴**: 無
**預估**: 2260 → 拆分為 (500 + 600 + 500 + 660)

---

#### Task 2.2: Async Battle System 重組
```
來源: Async-Battle-System-Design.md (1130 行)

整合到: docs/design/worktree-battle-integration/
（與 Worktree 設計合併）

部分獨立為: docs/design/battle-routing/
├─ requirements.md       [重組]
│  - SmartRouter 需求
│  - 複雜度分析算法
│  - 三條路由路徑（對話/簡單/複雜）
│
├─ ui-design.md          [重組]
│  - 三面板 UI（20% + 50% + 30%）
│  - 戰鬥列表顯示
│  - 戰鬥狀態更新
│
└─ implementation.md     [重組]
   - SmartRouter 實作
   - 戰鬥實例池管理
   - WebSocket 通訊協議
```

**依賴**: Worktree-Battle Integration
**預估**: 1130 → 整合到 Worktree (700) + 獨立 Battle Routing (430)

---

#### Task 2.3: Worktree System 重組
```
來源: Worktree-System-Design.md (1845 行)

整合到: docs/design/worktree-battle-integration/
（與 Async Battle 合併）

獨立保留: docs/design/worktree-manual-management/
├─ requirements.md       [重組]
│  - 手動 Worktree 管理
│  - 公會大廳功能
│  - Worktree 類型（feature/fix/experiment/hotfix）
│
├─ ui-design.md          [重組]
│  - 時空管理器介面
│  - 列表/時間線圖/看板視圖
│  - 創建/切換/合併流程
│  - Stash 管理介面
│
└─ implementation.md     [重組]
   - WorktreeManager API
   - 元數據管理
   - Git 命令封裝
```

**依賴**: Worktree-Battle Integration
**預估**: 1845 → 整合到 Worktree-Battle (400) + 獨立手動管理 (1445)

---

#### Task 2.4: Shop System 重組
```
來源: Shop-System-Design.md (1200+ 行)

整合到: docs/design/map-system/
（商店位於城鎮商業街）

拆分為: docs/design/shop-system/
├─ requirements.md       [重組]
│  - 7個商店功能需求
│  - 商店位置（城鎮商業街）
│  - 訪問限制（戰鬥中無法進入）
│
├─ ui-design.md          [重組]
│  - 7個商店 UI 設計
│  - 商店進入/退出動畫
│  - 購買/升級流程
│
└─ implementation.md     [重組]
   - ShopManager
   - 技能升級系統
   - Skill Forge 六步驟
   - MCP 工具商店整合
```

**依賴**: Map System
**預估**: 1200 → 拆分為 (400 + 450 + 350)

---

### Phase 3: 重組中型文件（P1）

#### Task 3.1: Scene System 重組（淘汰）
```
來源: Scene-System-Design.md (800 行)

處理方式:
- ❌ 刪除（概念被地圖系統取代）
- ✅ 部分內容遷移到 Map System
  - 探索模式 → 城鎮區域
  - 戰鬥模式 → 野外/副本區域
  - 場景切換 → 場所轉換
```

**依賴**: Map System
**動作**: 遷移後刪除

---

#### Task 3.2: Battle System 重組
```
來源: Battle-System-Design.md (行數未知，需確認)

拆分為: docs/design/battle-system/
├─ requirements.md       [重組]
│  - 戰鬥系統核心概念
│  - 回合制戰鬥規則
│  - 敵人生成規則
│  - 經驗值和升級
│
├─ ui-design.md          [重組]
│  - 戰鬥畫面設計
│  - 技能選擇介面
│  - 傷害數字動畫
│  - 戰鬥日誌
│
└─ implementation.md     [重組]
   - BattleManager 核心
   - 傷害計算公式
   - 回合系統
   - 戰鬥狀態管理
```

**依賴**: Worktree-Battle Integration
**預估**: 需先讀取檔案確認

---

#### Task 3.3: Agent Battle Companion 重組
```
來源: Agent-Battle-Companion-Design.md

拆分為: docs/design/companion-system/
├─ requirements.md       [重組]
│  - 夥伴系統概念
│  - Subagent 映射規則
│  - 夥伴成長系統
│  - 召喚條件和限制
│
├─ ui-design.md          [重組]
│  - 夥伴卡片設計
│  - 召喚動畫
│  - 夥伴狀態顯示
│  - 傭兵公會介面（整合到商店）
│
└─ implementation.md     [重組]
   - CompanionManager
   - 夥伴 AI 行為
   - 經驗值計算
   - Subagent 生命週期管理
```

**依賴**: Map System, Shop System
**預估**: 需先讀取檔案確認

---

#### Task 3.4: Summon Beast System 重組
```
來源: Summon-Beast-System-Design.md (1230 行)

拆分為: docs/design/summon-system/
├─ requirements.md       [重組]
│  - 召喚獸 vs 夥伴差異
│  - 召喚獸分類（技能/組合技/MCP/道具）
│  - 行為類型（即時/自動/被動/互動）
│
├─ ui-design.md          [重組]
│  - 召喚獸顯示卡片
│  - 召喚動畫（魔法陣）
│  - 技能效果展示
│
└─ implementation.md     [重組]
   - SummonManager
   - 4種行為類型實作
   - 召喚獸元數據結構
   - 技能效果計算
```

**依賴**: Battle System, Companion System
**預估**: 1230 → 拆分為 (400 + 400 + 430)

---

#### Task 3.5: Multi-Model Integration 重組
```
來源: Multi-Model-Integration-Design.md (1000 行)

拆分為: docs/design/multi-model-system/
├─ requirements.md       [重組]
│  - 多模型支持需求
│  - 模型無關架構
│  - 智能路由策略
│  - 成本優化
│
├─ ui-design.md          [重組]
│  - 模型選擇介面
│  - 成本追蹤面板（錢莊整合）
│  - 使用模式切換（平衡/質量/成本）
│
└─ implementation.md     [重組]
   - IModelAdapter 介面
   - ModelRegistry
   - MultiModelRouter
   - 成本計算引擎
```

**依賴**: Battle Routing
**預估**: 1000 → 拆分為 (350 + 300 + 350)

---

### Phase 4: 重組概述文件（P2）

#### Task 4.1: Feature Overview 重組
```
來源: Feature-Overview.md (450 行)

更新為: docs/design/overview/
├─ feature-summary.md    [重組]
│  - 所有功能概述
│  - 10個使用場景
│  - 開發路線圖
│
└─ getting-started.md    [新建]
   - 快速入門
   - 基本操作教學
   - 常見問題
```

**依賴**: 所有系統完成後
**預估**: 450 → 拆分為 (300 + 150)

---

#### Task 4.2: System Flow Diagram 重組
```
來源: System-Flow-Diagram.md (1250 行)

更新為: docs/design/overview/
└─ system-flows.md       [重組]
   - 核心流程圖（基於新地圖系統）
   - 戰鬥流程（含 worktree）
   - 商店交互流程
   - 地圖導航流程
```

**依賴**: 所有系統完成後
**預估**: 1250 → 精簡為 (800)

---

## 重組執行順序

```
Week 1-2: Phase 1（新建核心）
├─ Day 1-3:   地圖系統設計（requirements → ui → implementation）
├─ Day 4-7:   Worktree-戰鬥整合（requirements → flow → implementation）
└─ Day 8-10:  與用戶確認核心設計

Week 3-4: Phase 2（重組大文件）
├─ Day 11-13: Interactive Events 重組
├─ Day 14-16: Async Battle + Worktree 整合
├─ Day 17-19: Shop System 整合到地圖
└─ Day 20-21: Scene System 淘汰和遷移

Week 5-6: Phase 3（重組中型文件）
├─ Day 22-24: Battle System 重組
├─ Day 25-27: Companion + Summon 重組
└─ Day 28-30: Multi-Model 重組

Week 7: Phase 4（重組概述文件）
├─ Day 31-32: Feature Overview 更新
└─ Day 33-35: System Flow Diagram 更新
```

---

## 文件追蹤

### 待處理文件狀態

| 文件名 | 原始行數 | 重組狀態 | 新位置 | 預估行數 |
|-------|---------|---------|--------|---------|
| Scene-System-Design.md | 800 | ❌ 淘汰 | → Map System | 0 |
| Interactive-Battle-Events-Design.md | 2260 | 📋 待重組 | interactive-events/ | 2260 |
| Async-Battle-System-Design.md | 1130 | 📋 待整合 | worktree-battle-integration/ + battle-routing/ | 1130 |
| Worktree-System-Design.md | 1845 | 📋 待整合 | worktree-battle-integration/ + worktree-manual-management/ | 1845 |
| Shop-System-Design.md | 1200 | 📋 待重組 | shop-system/ | 1200 |
| Battle-System-Design.md | ??? | 📋 待確認 | battle-system/ | ??? |
| Agent-Battle-Companion-Design.md | ??? | 📋 待確認 | companion-system/ | ??? |
| Summon-Beast-System-Design.md | 1230 | 📋 待重組 | summon-system/ | 1230 |
| Multi-Model-Integration-Design.md | 1000 | 📋 待重組 | multi-model-system/ | 1000 |
| Feature-Overview.md | 450 | 📋 待重組 | overview/ | 450 |
| System-Flow-Diagram.md | 1250 | 📋 待重組 | overview/ | 800 |

### 新建文件計劃

| 系統 | Requirements | UI Design | Implementation | 總計 |
|-----|-------------|-----------|----------------|------|
| Map System | 400 | 400 | 400 | 1200 |
| Worktree-Battle Integration | 400 | 500 | 500 | 1400 |
| Battle Routing | 150 | 130 | 150 | 430 |
| Worktree Manual Management | 450 | 600 | 395 | 1445 |
| Interactive Events | 500 | 600 | 1160 | 2260 |
| Shop System | 400 | 450 | 350 | 1200 |
| Battle System | TBD | TBD | TBD | TBD |
| Companion System | TBD | TBD | TBD | TBD |
| Summon System | 400 | 400 | 430 | 1230 |
| Multi-Model System | 350 | 300 | 350 | 1000 |

---

## 重組檢查清單

### 每個系統完成後檢查

- [ ] Requirements 文件完整（概念、需求、限制、場景）
- [ ] UI Design 包含所有介面和流程圖
- [ ] Implementation 包含技術架構和 API 設計
- [ ] 文件間引用關係正確
- [ ] 總行數控制在合理範圍（1200-1900 行）
- [ ] 與用戶確認設計正確

### 全部完成後檢查

- [ ] 所有舊文件已遷移或刪除
- [ ] 新文件結構清晰一致
- [ ] Feature Overview 和 Flow Diagram 已更新
- [ ] README 已更新文件索引
- [ ] 所有 TODO 已完成
- [ ] Git commit 記錄清晰

---

## 附錄：文件模板

### Requirements 模板
```markdown
# {系統名稱} - 需求定義

**日期**: YYYY-MM-DD
**版本**: v1.0
**狀態**: 設計階段

---

## 核心概念

### 設計理念
[說明為什麼需要這個系統]

### 概念映射
[如果是 RPG 化，說明映射關係]

---

## 功能需求

### 需求 1: [名稱]
- 描述: ...
- 使用場景: ...
- 限制: ...

### 需求 2: [名稱]
...

---

## 限制和規則

### 規則 1: [名稱]
...

---

## 使用場景

### 場景 1: [描述]
```
步驟...
```

---

## 與其他系統的關係

- 依賴: ...
- 整合點: ...
```

### UI Design 模板
```markdown
# {系統名稱} - UI 設計

**日期**: YYYY-MM-DD
**版本**: v1.0

---

## 主介面設計

### 介面 1: [名稱]

```
[ASCII 或文字描述]
```

**功能**:
- ...

**互動**:
- ...

---

## 流程設計

### 流程 1: [名稱]

```
步驟1 → 步驟2 → 步驟3
```

---

## 視覺設計

### 顏色方案
...

### 動畫效果
...

### 音效
...
```

### Implementation 模板
```markdown
# {系統名稱} - 實作設計

**日期**: YYYY-MM-DD
**版本**: v1.0

---

## 技術架構

### 架構圖
```
[架構說明]
```

---

## 核心 API 設計

### Class: {ClassName}

```javascript
class {ClassName} {
  // ...
}
```

---

## 數據結構

### {DataStructure}

```javascript
{
  // ...
}
```

---

## 實作優先級

### Phase 1 (Week X-Y)
- [ ] 功能 A
- [ ] 功能 B

### Phase 2 (Week Z)
- [ ] 功能 C
```

---

**版本**:
- v1.0 (2026-02-05): 初始重組計劃
