# Code Quest 系統內容衝突分析報告

**版本**: v1.0
**生成日期**: 2026-02-05
**分析範圍**: 11 個系統的 requirements.md 文件
**分析工具**: 深度依賴關係檢查

---

## 🔴 關鍵衝突匯總

| # | 衝突類型 | 涉及系統 | 嚴重程度 | 問題描述 |
|---|---------|--------|--------|--------|
| 1 | 功能定義 | 場景 ↔ 地圖 ↔ 戰鬥 | 🔴 高 | **複雜度觸發閾值不一致** |
| 2 | 命名規範 | Worktree ↔ 非同步戰鬥 | 🔴 高 | **Worktree 命名和路徑規範不統一** |
| 3 | 責任邊界 | 場景 ↔ 地圖 ↔ 戰鬥 | 🔴 高 | **Prompt 複雜度分析責任不明確** |
| 4 | 數據流 | 戰鬥 → 場景 | 🟠 中 | 獎勵應用的責任邊界模糊 |
| 5 | 接口定義 | 多模型 ↔ 商店 | 🟠 中 | 成本數據接口未定義 |
| 6 | 被依賴描述 | 非同步戰鬥 → 場景 | 🟠 中 | 未明確提及場景系統依賴 |
| 7 | 被依賴描述 | 互動事件 → 戰鬥 | 🟠 中 | 對戰鬥系統的依賴描述不足 |
| 8 | 依賴缺失 | 召喚獸 → 多模型 | 🟡 低 | MCP 工具召喚獸與多模型的關係未說明 |
| 9 | 反向引用 | 場景 → 地圖 | 🟡 低 | 場景系統未明確提及依賴地圖系統 |
| 10 | 整合說明 | 多模型 → 商店 | 🟡 低 | 與 Skill Forge 的整合未說明 |

**總計**: 10 個衝突（3 個高優先級、4 個中優先級、3 個低優先級）

---

## 🔴 P1 高優先級衝突（立即修正）

### 衝突 1: 複雜度觸發閾值不一致

**涉及系統**: 場景系統、地圖系統、戰鬥系統

**問題描述**:
- **場景系統 (requirements.md)**:
  ```markdown
  探索 → 戰鬥: 任務型 Prompt + 複雜度 ≥ 閾值
  ```
  - 提到「閾值」但**未指定具體數值**

- **地圖系統 (requirements.md, line 395-413)**:
  ```javascript
  if (complexity >= 8) {
    startBattle({...});
  }
  ```
  - 明確說明「複雜度 >= 8 觸發戰鬥」

- **戰鬥系統 (requirements.md)**:
  - 提到複雜度分級（1-15）但**沒有明確觸發點**

**影響**:
- 三個系統對「何時觸發戰鬥」的定義不一致
- 實作時可能出現邏輯分歧

**建議修正**:
```markdown
統一標準：

1. 場景系統 (requirements.md):
   明確閾值 = 8
   "探索 → 戰鬥: 任務型 Prompt + 複雜度 ≥ 8"

2. 地圖系統 (requirements.md):
   保持現狀（已正確使用 >= 8）

3. 戰鬥系統 (requirements.md):
   補充觸發條件說明
   "當 Prompt 複雜度 >= 8 時，生成敵人並初始化戰鬥"
```

---

### 衝突 2: Worktree 命名和路徑規範不統一

**涉及系統**: Worktree 手動管理系統、非同步戰鬥系統、地圖系統

**問題描述**:

**Worktree Manual System (requirements.md, line 72-118)**:
```
路徑: worktrees/<name>/
命名: feature/<name>, fix/<name>
```

**Async Battle System (requirements.md, line 153-194)**:
```
路徑: worktrees/battle_<id>/
命名: battle/<id>
```

**Map System (requirements.md, line 681-684)**:
```
路徑: /worktrees/user-login
命名: feature/user-login
```

**衝突點**:
1. 路徑格式不一致（`battle_<id>` vs `<name>`）
2. 分支命名規則不統一
3. 缺少統一的命名規範文檔

**影響**:
- Git worktree 管理混亂
- 用戶無法區分手動創建 vs 自動創建的 worktree
- 可能導致命名衝突

**建議修正**:
```markdown
統一 Worktree 命名規範：

【手動創建】（Worktree Manual System）
分支命名:
  - feature/<feature-name>    # 特性世界
  - fix/<bug-name>            # 修復世界
  - experiment/<exp-name>     # 實驗世界
  - hotfix/<hotfix-name>      # 熱修復世界

路徑:
  - worktrees/<branch-name>/

【自動創建】（Async Battle System）
分支命名:
  - battle/<battle-id>        # 戰鬥分支（UUID）

路徑:
  - worktrees/battle-<battle-id>/

【統一規則】
1. 所有 worktree 都在 worktrees/ 目錄下
2. 手動創建使用語義化命名
3. 自動創建使用 battle/ 前綴 + UUID
4. 避免命名衝突
```

需要更新的文件:
- `worktree-manual-system/requirements.md`
- `async-battle-system/requirements.md`
- `map-system/requirements.md`（如有提及）

---

### 衝突 3: Prompt 複雜度分析責任邊界不明確

**涉及系統**: 場景系統、地圖系統、戰鬥系統

**問題描述**:

**場景系統** (requirements.md, line 98-109):
```
用戶輸入任務型 Prompt
    ↓
分析複雜度 ≥ 閾值
    ↓
生成敵人
    ↓
自動切換到戰鬥模式
```

**地圖系統** (requirements.md, line 396-412):
```javascript
if (currentZone === 'wilderness' && promptType === 'task') {
  const complexity = analyzeComplexity(prompt);  // 地圖系統分析複雜度
  if (complexity >= 8) {
    startBattle({
      prompt,
      complexity,
      zone: currentSubZone
    });
  }
}
```

**戰鬥系統** (requirements.md, line 42-74):
```
用戶輸入 Prompt
    ↓
[敵人生成器] 分析 Prompt
    ├─ 複雜度計算           # 戰鬥系統也計算複雜度？
    ├─ 任務分類
    └─ 生成敵人數據
```

**衝突點**:
1. **誰負責複雜度計算**？
   - 場景系統：提到「分析複雜度」
   - 地圖系統：明確呼叫 `analyzeComplexity(prompt)`
   - 戰鬥系統：「敵人生成器」也有複雜度計算

2. **數據如何傳遞**？
   - 場景 → 地圖 → 戰鬥的數據流不清晰
   - `complexity` 是由誰計算並傳遞的？

**影響**:
- 重複計算複雜度（效能浪費）
- 不同系統可能得出不同結果
- 責任邊界模糊，難以維護

**建議修正**:
```markdown
明確責任邊界和數據流：

【場景系統】負責:
1. 識別 Prompt 類型（任務型 vs 對話型）
2. 初步複雜度預估（可選，用於快速路由）
3. 將 Prompt 轉發給地圖系統

【地圖系統】負責:
1. 檢查當前區域（城鎮/野外/副本）
2. 如果在野外或副本：
   - 呼叫複雜度分析器（唯一分析點）
   - 判斷是否觸發戰鬥（>= 8）
   - 傳遞 (prompt, complexity, zone) 給戰鬥系統
3. 如果在城鎮：
   - 不觸發戰鬥
   - 返回提示訊息

【戰鬥系統】負責:
1. 接收 (prompt, complexity, zone)
2. 基於已計算的 complexity 生成敵人
3. 不再重新計算複雜度
4. 初始化戰鬥實例

數據流：
用戶 Prompt
  → Scene System (類型識別)
  → Map System (區域檢查 + 複雜度計算)
  → Battle System (敵人生成)
```

需要更新的文件:
- `scene-system/requirements.md`：移除複雜度計算描述，改為「轉發」
- `map-system/requirements.md`：明確為唯一複雜度計算點
- `battle-system/requirements.md`：明確接收已計算的 complexity

---

## 🟠 P2 中優先級衝突（需要澄清）

### 衝突 4: 戰鬥獎勵應用的責任邊界模糊

**涉及系統**: 戰鬥系統、場景系統、Worktree 系統

**問題描述**:

**戰鬥系統** (requirements.md, line 391-434):
```
獎勵計算:
- 經驗值 = 敵人等級 × 20
- 金幣 = 敵人等級 × 10
```
- 只計算，但**未說明如何應用到玩家**

**場景系統** (requirements.md, line 138-151):
```
戰鬥結束時:
- 經驗值累加 → 檢查升級
- 顯示升級動畫（如果升級）
- 返回探索模式
```
- 提到「經驗值累加」，但**未說明數據來源**

**Worktree 系統** (requirements.md, line 695-699):
```
戰鬥結束後處理:
- 勝利：提示合併/保留/放棄 worktree
- 失敗：worktree 保留
```
- Worktree 合併與獎勵發放的**時序關係不明**

**影響**:
- 不清楚誰負責將獎勵應用到玩家狀態
- Worktree 合併時機可能影響獎勵發放
- 經驗值升級邏輯的歸屬不明

**建議澄清**:
```markdown
統一責任邊界：

【戰鬥系統】
1. 計算獎勵 (exp, gold)
2. 返回獎勵對象給場景系統
   ```javascript
   return {
     victory: true,
     rewards: {
       exp: 200,
       gold: 100,
       items: [...]
     }
   };
   ```

【場景系統】
1. 接收戰鬥結果和獎勵
2. 應用到玩家狀態
   - player.exp += rewards.exp
   - player.gold += rewards.gold
3. 檢查升級條件
   - if (player.exp >= nextLevelExp) { levelUp(); }
4. 顯示升級動畫
5. 返回探索模式

【Worktree 系統】
1. 戰鬥完成後（獎勵已發放）
2. 詢問用戶 Worktree 處理方式
3. 執行相應操作（合併/保留/刪除）

時序：
戰鬥結束 → 獎勵發放 → 升級檢查 → Worktree 處理 → 返回探索
```

---

### 衝突 5: 成本數據接口未定義

**涉及系統**: 多模型整合系統、商店系統（錢莊）

**問題描述**:

**多模型整合** (requirements.md, line 280-324):
```
CostTracker 追蹤:
- token 使用
- 計算成本
- 按模型統計
```
- 追蹤成本，但**未定義數據格式**

**商店系統 - 錢莊** (requirements.md, line 284-327):
```
核心功能:
- 資源統計
- 模型成本統計
- 收入/支出明細
- 預算管理
```
- 顯示成本，但**未說明數據來源接口**

**影響**:
- 兩個系統如何通信不明確
- 數據格式、更新頻率未定義
- 可能導致數據不一致

**建議澄清**:
```markdown
定義成本數據接口：

【數據結構】
```typescript
interface CostReport {
  sessionId: number;
  battleId?: string;        // 如果是戰鬥觸發
  model: string;            // 'claude-sonnet-4-5' | 'gemini-pro'
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;    // USD
  timestamp: number;
}
```

【多模型整合系統】
1. 每次 API 調用完成後
2. 生成 CostReport
3. 發出成本事件
   ```javascript
   EventBus.emit('cost:update', costReport);
   ```

【商店系統 - 錢莊】
1. 訂閱成本事件
   ```javascript
   EventBus.on('cost:update', (report) => {
     this.aggregateCost(report);
     this.updateUI();
   });
   ```
2. 按模型聚合統計
3. 計算日/週/月統計
4. 警告超支情況

【更新頻率】
- 實時更新（每次 API 調用）
- UI 防抖更新（500ms）
```

需要更新的文件:
- `multi-model-integration/requirements.md`：補充接口定義
- `shop-system/requirements.md`：補充錢莊數據訂閱說明

---

### 衝突 6: 非同步戰鬥系統未明確提及場景系統

**涉及系統**: 非同步戰鬥系統 → 場景系統

**問題描述**:
- 非同步戰鬥系統的 README 聲明依賴「戰鬥系統、Worktree 系統」
- 但實際上需要依賴場景系統來判斷：
  - 對話軌道應保持在探索模式
  - 主線戰鬥進入戰鬥模式
  - 後台戰鬥時主軌道的狀態管理

**影響**:
- 依賴關係不完整
- 實作時可能遺漏場景狀態同步

**建議澄清**:
```markdown
在 async-battle-system/requirements.md 補充：

### 與場景系統的整合

非同步戰鬥系統需要場景系統協調三種軌道的狀態：

【對話軌道】
- 場景狀態：探索模式
- 用戶可以自由對話、訪問商店等

【主線戰鬥】
- 場景狀態：戰鬥模式
- 阻塞式，用戶專注於戰鬥

【後台戰鬥】
- 主軌道場景：探索模式（不受影響）
- 後台戰鬥在獨立 Worktree 執行
- 完成時通知用戶，不打斷當前場景

實作要點：
- Scene System 追蹤主軌道和後台軌道狀態
- 後台戰鬥完成時，Scene System 負責通知 UI
```

同時更新 README 依賴聲明：
```markdown
**依賴**: 戰鬥系統、Worktree 系統、場景系統
```

---

### 衝突 7: 互動事件系統對戰鬥系統的依賴描述不足

**涉及系統**: 互動事件系統 → 戰鬥系統

**問題描述**:
- 互動事件系統 requirements.md 提到「在戰鬥中」觸發事件
- 但未詳細說明與戰鬥系統的具體整合方式
- 戰鬥生命週期的哪些階段會觸發哪些事件？

**影響**:
- 整合點不明確
- 戰鬥系統實作時可能遺漏事件觸發

**建議澄清**:
```markdown
在 interactive-events/requirements.md 補充：

### 與戰鬥系統的整合

互動事件在戰鬥生命週期中的觸發點：

【戰鬥前】
- Plan Mode：當戰鬥複雜度 >= 60 時，進入「靜止之間」制定策略
- 觸發時機：敵人生成後，戰鬥開始前

【戰鬥中】
- AskUserQuestion：敵人發動「困惑攻擊」，詢問戰術選擇
- 錯誤/警告：技能施放失敗、MP 不足
- 權限請求：使用需要特殊權限的技能

【戰鬥後】
- 無互動事件（直接進入獎勵結算）

整合接口：
```javascript
BattleManager.on('complexity-high', () => {
  InteractiveEvents.triggerPlanMode(battleContext);
});

BattleManager.on('skill-failed', (error) => {
  InteractiveEvents.triggerError(error);
});
```
```

---

## 🟡 P3 低優先級衝突（建議補充）

### 衝突 8: MCP 工具召喚獸與多模型的關係未說明

**涉及系統**: 召喚獸系統、多模型整合系統

**問題描述**:
- 召喚獸系統提到「MCP 工具召喚獸」
- 但未說明與多模型整合系統的關係
- MCP 工具使用是否會影響模型選擇？

**建議補充**:
```markdown
在 summon-beast-system/requirements.md 補充：

### MCP 工具召喚獸與多模型整合

當使用 MCP 工具時：
1. 多模型整合系統根據工具類型選擇合適模型
2. 工具執行成功後觸發召喚獸生成
3. 召喚獸能力與工具功能對應

範例：
- 使用 GitHub MCP → 自動召喚 "GitHub Guardian"
- 使用 Database MCP → 自動召喚 "Data Sentinel"

參見：multi-model-integration/requirements.md 的工具路由策略
```

---

### 衝突 9: 場景系統未明確提及依賴地圖系統

**涉及系統**: 場景系統 → 地圖系統

**問題描述**:
- 場景系統 README 聲明依賴「地圖系統」
- 但 requirements.md 中只提到「城鎮」「野外」等概念
- 未明確說明這些是地圖系統定義的區域

**建議補充**:
```markdown
在 scene-system/requirements.md 補充：

### 與地圖系統的整合

場景系統的「探索模式」和「戰鬥模式」與地圖系統的區域綁定：

| 地圖區域 | 場景模式 | 說明 |
|---------|---------|------|
| 城鎮區域 | 探索模式（強制） | 不觸發戰鬥 |
| 野外區域 | 探索模式（可切換） | 任務型 Prompt 觸發戰鬥 |
| 副本區域 | 戰鬥模式（強制） | 劇情戰鬥 |

參見：map-system/requirements.md 的區域定義
```

---

### 衝突 10: 多模型整合與 Skill Forge 的整合未說明

**涉及系統**: 多模型整合系統、商店系統（Skill Forge）

**問題描述**:
- Skill Forge 允許用戶自定義技能
- 但未說明是否可以為不同技能指定不同模型
- 多模型系統是否支持技能級別的模型選擇？

**建議補充**:
```markdown
在 multi-model-integration/requirements.md 補充：

### 與技能系統的整合

用戶在 Skill Forge 自定義技能時，可以指定模型偏好：

【技能元數據擴展】
```typescript
interface SkillMetadata {
  name: string;
  mpCost: number;
  cooldown: number;
  modelPreference?: {
    preferred: 'claude-opus' | 'claude-sonnet' | 'gemini-pro';
    fallback: string[];
  };
}
```

【模型選擇邏輯】
1. 檢查技能是否有 modelPreference
2. 如果有，優先使用 preferred 模型
3. 如果不可用，嘗試 fallback 列表
4. 最後回退到智能路由

範例：
- 「架構設計師」技能 → 強制使用 Claude Opus
- 「快速代碼生成」技能 → 優先使用 Claude Haiku
```

---

## 📋 修正優先級建議

### 立即修正（P1）- 阻塞實作
1. ✅ 統一複雜度觸發閾值 = 8
2. ✅ 統一 Worktree 命名和路徑規範
3. ✅ 明確 Prompt 複雜度分析責任邊界

### 短期澄清（P2）- 影響整合
4. ✅ 定義戰鬥獎勵應用流程
5. ✅ 定義成本數據接口
6. ✅ 補充場景系統依賴說明
7. ✅ 補充互動事件整合說明

### 長期補充（P3）- 提升完整性
8. ⭕ MCP 工具召喚獸說明
9. ⭕ 場景系統引用地圖系統
10. ⭕ 多模型與 Skill Forge 整合

---

## 🎯 驗收標準

修正完成後應驗證：

### ✅ 依賴一致性
- [ ] 所有依賴關係在兩個方向都有說明（A 依賴 B，B 的文檔也提到被 A 依賴）
- [ ] 複雜度閾值在所有相關系統中統一為 8
- [ ] Worktree 命名規範在所有系統中一致

### ✅ 責任邊界
- [ ] Prompt 複雜度分析只在地圖系統執行
- [ ] 戰鬥獎勵應用流程清晰（戰鬥計算 → 場景應用）
- [ ] 成本數據接口明確定義

### ✅ 數據流
- [ ] Prompt → Complexity → Battle 的完整鏈路文檔化
- [ ] Battle Rewards → Player State 的流程明確
- [ ] Cost Data → Bank System 的接口清晰

### ✅ 無遺漏
- [ ] 所有被依賴系統都有反向說明
- [ ] 所有整合點都有雙向描述
- [ ] 特殊關係（如夥伴 vs 召喚獸）都有明確說明

---

**報告生成時間**: 2026-02-05
**分析工具**: Explore Agent (深度依賴分析)
**發現衝突數**: 10 個（3P1 + 4P2 + 3P3）
**建議修正文件數**: 9 個 requirements.md 文件

---

## 📂 需要修正的文件列表

### P1 立即修正
1. `scene-system/requirements.md` - 複雜度閾值、責任邊界
2. `map-system/requirements.md` - Worktree 命名、複雜度分析
3. `battle-system/requirements.md` - 複雜度閾值、接收參數
4. `worktree-manual-system/requirements.md` - 命名規範統一
5. `async-battle-system/requirements.md` - Worktree 命名、場景依賴

### P2 短期澄清
6. `multi-model-integration/requirements.md` - 成本接口、錢莊整合
7. `shop-system/requirements.md` - 成本數據訂閱
8. `interactive-events/requirements.md` - 戰鬥整合說明

### P3 長期補充
9. `summon-beast-system/requirements.md` - MCP 工具說明
