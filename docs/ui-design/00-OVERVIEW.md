# Code Quest UI 設計總覽

**版本**: v2.0
**更新日期**: 2026-02-06
**狀態**: 設計完成

---

## 文檔導航

本設計手冊包含以下主要部分：

### 核心架構文檔

| 檔案 | 說明 | 重點內容 |
|------|------|---------|
| [01-SYSTEM-ARCHITECTURE.md](./01-SYSTEM-ARCHITECTURE.md) | 系統架構與依賴 | 11系統的依賴關係、層級結構 |
| [02-WORLD-MAP.md](./02-WORLD-MAP.md) | 世界地圖設計 | 城鎮、野外、副本的空間結構 |
| [03-CORE-MECHANICS.md](./03-CORE-MECHANICS.md) | 核心遊戲機制 | 資源系統、戰鬥流程、場景切換 |
| [04-GAME-FLOW.md](./04-GAME-FLOW.md) | 遊戲流程設計 | 用戶旅程、操作流程、教學引導 |

### 系統設計文檔

| 檔案 | 系統名稱 | 核心功能 |
|------|---------|---------|
| [systems/01-map-system.md](./systems/01-map-system.md) | 地圖系統 | 3大區域、場所管理、遭遇戰 |
| [systems/02-scene-system.md](./systems/02-scene-system.md) | 場景系統 | 探索/戰鬥模式切換 |
| [systems/03-battle-system.md](./systems/03-battle-system.md) | 戰鬥系統 | 回合制戰鬥、敵人生成 |
| [systems/04-companion-system.md](./systems/04-companion-system.md) | 夥伴系統 | Subagent映射、協同戰鬥 |
| [systems/05-summon-beast-system.md](./systems/05-summon-beast-system.md) | 召喚獸系統 | 4種召喚、爆發支援 |
| [systems/06-shop-system.md](./systems/06-shop-system.md) | 商店系統 | 7大商店、功能管理 |
| [systems/07-interactive-events.md](./systems/07-interactive-events.md) | 互動事件 | 戰鬥事件、工具映射 |
| [systems/08-worktree-system.md](./systems/08-worktree-system.md) | Worktree系統 | 平行世界、分支管理 |
| [systems/09-async-battle-system.md](./systems/09-async-battle-system.md) | 非同步戰鬥 | 並發戰鬥、智能路由 |
| [systems/10-multi-model-system.md](./systems/10-multi-model-system.md) | 多模型整合 | Claude/Gemini切換 |
| [systems/11-ui-interaction.md](./systems/11-ui-interaction.md) | UI互動 | 完整UI規範、動畫 |

### 參考文檔

| 檔案 | 說明 |
|------|------|
| [references/tool-mappings.md](./references/tool-mappings.md) | 工具RPG化映射表 |
| [references/glossary.md](./references/glossary.md) | 術語對照表 |

---

## 設計理念

### 核心概念：RPG 化包裝

```
┌─────────────────────────────────────────┐
│   RPG UI Layer (React)                  │  ← 遊戲化呈現
│   - HP/MP/經驗值/等級                    │
│   - 技能冷卻、施放動畫                   │
│   - 角色成長、成就系統                   │
└─────────────────┬───────────────────────┘
                  │ WebSocket
┌─────────────────▼───────────────────────┐
│   Bridge Layer (Node.js)                │  ← 協調層
│   - 攔截 Claude Code 輸出                │
│   - 追蹤 Skill/Subagent 使用             │
│   - 計算遊戲數據 (MP/EXP/Gold)          │
└─────────────────┬───────────────────────┘
                  │ child_process
┌─────────────────▼───────────────────────┐
│   Claude Code CLI                       │  ← 標準 Claude
│   - 標準 Skills (符合官方格式)           │
│   - 標準 Subagents (符合官方格式)        │
│   - 真實的 AI 功能                       │
└─────────────────────────────────────────┘
```

### 設計原則

1. **分層架構**：遊戲化在 UI 層，不修改 Claude 核心
2. **尊重官方**：Skills/Subagents 符合官方規範
3. **漸進增強**：保持原始功能，添加遊戲化樂趣
4. **可擴展性**：Metadata 驅動，易於擴展

---

## 視覺風格：Pixel Art

### 為什麼選擇 Pixel Art？

- ✅ 復古、輕鬆、有趣的氛圍
- ✅ 開發資源相對容易製作
- ✅ 適合 RPG 主題
- ✅ 性能友好（小尺寸資源）

### 主要元素

```
像素化 UI 組件:
├── 8-bit/16-bit 風格圖形
├── 像素字體 (Press Start 2P)
├── 像素動畫（攻擊特效、升級動畫）
└── 像素進度條（HP/MP/EXP）
```

### 配色方案

**探索模式（安全區）**:
```
主色: #1a4d2e (深綠)
輔色: #4caf50 (綠色)
背景: #F5F5DC (米色)
```

**戰鬥模式（危險區）**:
```
主色: #4d1a1a (深紅)
輔色: #f44336 (紅色)
背景: #2C2C2C (暗色)
```

**通用資源色彩**:
```
HP: #4caf50 (綠色)
MP: #2196f3 (藍色)
EXP: #ffc107 (金色)
傷害: #ff5722 (紅色)
治療: #8bc34a (淺綠)
```

---

## 核心遊戲化映射

### AI 功能 → RPG 元素

| AI 交互元素 | RPG 元素 | 說明 |
|------------|---------|------|
| 用戶 | 冒險者/玩家 | 主角 |
| Claude AI | NPC 導師/魔法師 | AI 助手 |
| Skills | 技能/魔法 | 執行功能的方式 |
| Subagents | 戰鬥夥伴 | 協同作戰的 Agent |
| 對話任務 | Quest | 任務系統 |
| API 配額 | HP | 生命值 |
| Token 消耗 | MP | 魔力值 |
| 經驗累積 | EXP/等級 | 成長系統 |
| 任務完成 | 戰鬥勝利 | 獎勵機制 |

### 世界結構

```
CodeLand 世界
├── 🏰 城鎮區域（安全區）
│   ├── 商業街（7個商店）
│   ├── 酒館（AI對話）
│   ├── 靜止之間（Plan Mode）
│   ├── 公會大廳（Worktree管理）
│   └── 玩家住所（休息、設定）
│
├── 🌲 野外區域（危險區）
│   ├── 森林（Lv.5-8）
│   ├── 山脈（Lv.8-12）
│   ├── 荒野（Lv.12-15）
│   └── 火山（Lv.15+）
│
└── 🏔️ 副本區域（特殊任務）
    ├── Bug 洞窟
    ├── 架構迷宮
    ├── 測試試煉場
    └── 安全地牢
```

---

## 核心系統概覽

### 資源系統

**HP（生命值）**：
- 對應 API 配額
- 戰鬥中受傷消耗
- 探索模式：2 HP/秒恢復
- 戰鬥模式：0.1 HP/秒恢復（微量恢復）

**MP（魔力值）**：
- 施放技能消耗
- 召喚 Agent 消耗
- 探索模式：1 MP/秒恢復
- 戰鬥模式：0.1 MP/秒恢復

**EXP（經驗值）**：
- 完成任務獲得
- 使用技能獲得
- 達到升級要求時提升等級

**Gold（金幣）**：
- 完成任務獲得
- 在商店購買道具、升級技能

### 戰鬥系統

**回合制流程**：
```
玩家回合 → 夥伴回合 → 召喚獸行動 → 敵人回合 → 檢查結束
```

**敵人生成與戰鬥觸發**：
- 根據 Prompt 複雜度生成敵人
- 複雜度 0-2 分：對話型 Prompt → 不觸發戰鬥
- 複雜度 3-7 分：簡單任務 → 主目錄同步戰鬥
- 複雜度 8+ 分：複雜任務 → 創建 Worktree 異步戰鬥

**傷害計算**：
```
基礎傷害 = 固定值 + (技能MP消耗 × 倍數) + (玩家等級 × 倍數)
最終傷害 = 基礎傷害 × 相性倍率 × 弱點倍率 × 抗性倍率
```

### 成長系統

**升級公式**：
```
expToNextLevel = 100 * (1.5 ^ (level - 1))
```

**升級獎勵**：
- maxHp: +20
- maxMp: +15
- 解鎖新技能（特定等級）
- 解鎖新商店（特定等級）

---

## 操作方式

### PC 鍵盤操作

**移動**：
- W/↑: 向上
- A/←: 向左
- S/↓: 向下
- D/→: 向右

**場所快捷鍵**：
- 1-7: 商店直達
- H: 酒館
- G: 公會大廳
- P: 靜止之間
- B: 返回城鎮

**系統快捷鍵**：
- M: 地圖
- Tab: 快速選單
- I: 物品欄
- C: 角色面板
- Esc: 返回/取消

### 滑鼠操作

- 左鍵點擊建築 → 進入
- 左鍵點擊地面 → 移動
- 右鍵點擊 → 顯示資訊
- 滾輪 → 縮放地圖

### 觸控操作（平板/手機）

- 點擊建築 → 進入
- 點擊地面 → 移動
- 長按 → 顯示資訊
- 雙指縮放 → 地圖縮放
- 虛擬搖桿 → 移動控制

---

## 響應式設計

### 桌面版 (≥1200px)

```
┌─────────────────────────────────────┐
│  左側 (70%)    │  右側 (30%)        │
│                │                    │
│  主畫面        │  快速狀態          │
│  (探索/戰鬥)    │  快捷按鈕          │
│                │  歷史記錄          │
└─────────────────────────────────────┘
```

### 平板版 (768px - 1199px)

```
┌────────────────────────────────┐
│        主畫面 (全屏)            │
│                                │
│  快速狀態浮動在右上角           │
└────────────────────────────────┘
```

### 手機版 (<768px)

```
┌─────────────────┐
│  精簡主畫面      │
│  緊湊布局        │
│  可折疊區域      │
│  底部導航        │
└─────────────────┘
```

---

## 動畫系統

### 動畫時序規範

**快速動畫** (0.1-0.3s)：
- 按鈕點擊反饋
- 小型 UI 切換
- Hover 效果

**標準動畫** (0.3-0.5s)：
- 場景切換
- 面板開啟/關閉
- 傷害數字飄出

**長動畫** (0.5-1.0s)：
- 敵人出現
- 技能施放
- 升級慶祝

**特殊動畫** (1.0s+)：
- 勝利畫面
- 完整戰鬥序列
- 教學引導

### 性能要求

- 目標幀率：60 FPS
- 最低幀率：30 FPS
- 使用 CSS Transform（GPU 加速）
- 使用 RAF (requestAnimationFrame)
- 低端設備自動降低特效

---

## 音效系統

### 音效分類

**UI 音效**：
- 點擊、確認、取消
- 懸停、切換
- 通知、警告

**戰鬥音效**：
- 攻擊、受傷
- 技能施放
- 勝利、失敗

**環境音效**：
- 城鎮背景音
- 野外環境音
- 戰鬥背景音樂

### 音效配置

```
音效設定:
• 主音量控制
• 背景音樂音量
• 音效音量
• 背景音樂開關
• 音效開關
```

---

## 無障礙設計

### 鍵盤導航

- 所有功能可用鍵盤操作
- Tab 切換焦點
- Enter 確認
- Esc 返回
- 清晰的焦點指示器

### 螢幕閱讀器支援

- 語義化 HTML
- ARIA 標籤完整
- 圖標有 alt 文字
- 狀態變化播報

### 色盲模式

- 不僅依賴顏色區分
- 使用圖標輔助
- 文字標籤清晰
- 高對比模式

### WCAG AA 級

- 文字對比度 ≥ 4.5:1
- 互動元素 ≥ 44×44 像素
- 焦點可見
- 無僅依賴顏色的資訊

---

## 技術堆疊

### 前端

```
React 18 + TypeScript
├── Vite (構建工具)
├── Tailwind CSS (樣式)
├── Framer Motion (動畫)
├── Zustand (狀態管理)
└── Socket.io-client (實時通訊)
```

### 後端

```
Node.js + Express
├── Socket.io (WebSocket)
├── child_process (Claude CLI)
└── Chokidar (文件監聽)
```

### 數據存儲

```
數據層:
├── LocalStorage (玩家狀態)
├── IndexedDB (對話歷史)
└── JSON files (Skills/Agents metadata)
```

---

## 開發階段

### Phase 1: 核心基礎 (Week 1-2)
- Bridge Layer 實作
- React UI 基礎
- 標準 Skills 創建

### Phase 2: 遊戲化核心 (Week 3-4)
- Skill 系統完善
- Agent 召喚基礎
- 等級成長

### Phase 2.5: 戰鬥系統 (Week 5-6)
- 敵人生成與戰鬥管理
- 夥伴系統
- 召喚獸基礎

### Phase 3: 進階功能 (Week 7-10)
- 組合技系統
- 成就系統
- Worktree "平行世界"
- 持久化儲存
- MCP 工具整合

---

## 參考資源

### 遊戲參考

- **Final Fantasy (IV-VI)**: 經典 JRPG 像素風格
- **Stardew Valley**: 現代像素風格
- **Undertale**: 簡潔有趣的像素 UI

### 技術文檔

- [Claude Code 官方文檔](https://docs.anthropic.com/en/docs/agents)
- [React 18 文檔](https://react.dev/)
- [Framer Motion 文檔](https://www.framer.com/motion/)

---

## 閱讀建議

### 新手

1. 先閱讀本總覽文檔
2. 閱讀 [02-WORLD-MAP.md](./02-WORLD-MAP.md) 了解世界結構
3. 閱讀 [03-CORE-MECHANICS.md](./03-CORE-MECHANICS.md) 了解核心機制
4. 按需要閱讀各系統文檔

### 開發者

1. 閱讀 [01-SYSTEM-ARCHITECTURE.md](./01-SYSTEM-ARCHITECTURE.md) 了解架構
2. 根據開發目標查看對應系統文檔
3. 參考 [references/tool-mappings.md](./references/tool-mappings.md) 了解工具映射

### 設計師

1. 閱讀本總覽的視覺風格章節
2. 查看各系統的 UI 設計部分
3. 參考 [04-GAME-FLOW.md](./04-GAME-FLOW.md) 了解用戶流程

---

**維護者**: Code Quest Team
**許可證**: MIT（待確定）
**專案狀態**: 設計階段完成，準備進入實作階段
