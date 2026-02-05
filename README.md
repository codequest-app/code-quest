# Code Quest

> 🎮 RPG 遊戲化的 Claude Code CLI - 將開發工作轉變為史詩般的冒險

## 📖 專案簡介

**Code Quest** 是一個將 Claude Code CLI 完全 RPG 化的創新專案。透過戰鬥、技能、召喚獸、商店等遊戲機制，讓開發工作變得有趣且充滿成就感。

### 核心特性

- ⚔️ **戰鬥系統**: 每個開發任務都是一場戰鬥，工具執行造成傷害
- 🔮 **技能系統**: 將 CLI 命令和 Skills 轉化為 RPG 技能（MP 消耗、冷卻時間、升級）
- 🧙 **召喚系統**: Subagents 成為可召喚的夥伴，協助戰鬥
- 🏪 **商店系統**: 7 大商店管理技能、工具、成就、資源
- 🗺️ **地圖探索**: 視覺化的世界地圖，探索不同區域
- 🌲 **Worktree 系統**: Git worktree 與戰鬥系統整合，並行開發
- 🏆 **成就系統**: 豐富的成就和收藏品，解鎖隱藏內容
- 💰 **資源管理**: 金幣、經驗值、AI 模型成本統計

## 🎯 設計理念

1. **沉浸式體驗**: 所有功能都融入 RPG 世界，不破壞遊戲感
2. **保持實用**: RPG 元素是錦上添花，不影響開發效率
3. **引導式學習**: 透過遊戲機制降低 CLI 工具學習曲線
4. **可視化成長**: 技能升級、等級提升，讓進步看得見

## 🏗️ 專案結構

```
code-quest/
├── docs/                                   # 設計文檔
│   ├── design/                            # 詳細設計文檔
│   │   ├── map-system/                    # 地圖系統設計
│   │   │   ├── requirements.md
│   │   │   ├── ui-design.md
│   │   │   └── implementation.md
│   │   ├── shop-system/                   # 商店系統設計
│   │   │   ├── requirements.md
│   │   │   ├── ui-design.md
│   │   │   └── implementation.md
│   │   ├── interactive-events/            # 互動事件系統設計
│   │   │   ├── requirements.md
│   │   │   ├── ui-design.md
│   │   │   ├── tool-mappings.md
│   │   │   └── implementation.md
│   │   ├── worktree-battle-integration/   # Worktree 戰鬥整合
│   │   │   ├── requirements.md
│   │   │   ├── flow-design.md
│   │   │   └── implementation.md
│   │   ├── RESTRUCTURE_PLAN.md            # 文檔重組計劃
│   │   └── ...                            # 其他設計文檔
│   └── README.md                          # 文檔說明
└── README.md                              # 本文件
```

## 📚 設計文檔

### 核心系統

#### 1. 🗺️ 地圖系統（Map System）
- **requirements.md**: 地圖設計需求、區域定義、整合方案
- **ui-design.md**: 地圖 UI、圖例、動畫效果
- **implementation.md**: 技術實現、數據結構、API 設計

#### 2. 🏪 商店系統（Shop System）
七大商店完整設計：
- 🔮 技能商店 - 查看、解鎖、升級技能
- ⚒️ 工匠鋪 - 創建自定義技能（6 步驟引導）
- 📚 魔法圖書館 - 管理 MCP 工具
- 🧙 傭兵公會 - 管理 Subagents
- 🏆 寶物庫 - 成就和收藏品
- 🎯 訓練場 - 新手教學、模擬戰鬥
- 💰 錢莊 - 資源統計、成本分析

#### 3. ⚔️ 互動事件系統（Interactive Events）
- 戰鬥中的互動事件（Plan Mode、AskUserQuestion、錯誤處理）
- 工具到魔法的完整映射（30+ CLI 工具）
- 連擊系統（並行工具執行獎勵）
- **特殊文件**: `tool-mappings.md` - 詳細的工具 RPG 化映射表

#### 4. 🌲 Worktree 戰鬥整合
- Git worktree 與戰鬥系統整合
- 並行開發的 RPG 化體驗
- 戰場切換和資源管理

### 文檔規範

所有設計文檔遵循**三層結構**：
1. **requirements.md** - 需求和設計決策
2. **ui-design.md** - UI/UX 設計和界面原型
3. **implementation.md** - 技術實現和代碼架構

特殊情況會增加額外文件（如 `tool-mappings.md`、`flow-design.md`）。

## 🚀 開發階段

### Phase 1: 基礎系統 ✅
- 場景系統（探索模式、戰鬥模式）
- 基礎戰鬥機制
- 工具檢測和映射

### Phase 2: 核心功能 🚧
- 地圖系統
- Worktree 整合
- 互動事件系統

### Phase 2.5: 商店基礎 📋
- 城鎮廣場
- 技能商店（查看、解鎖）
- 工匠鋪（基礎創建流程）
- 簡單成就系統

### Phase 3: 完整體驗 📋
- 完整商店系統（7 大商店）
- 成就和收藏品系統
- 訓練場和新手教學
- 統計和預算管理

### Phase 4: 優化擴展 💡
- 社區功能
- 進階 Combo 系統
- 個性化推薦
- 季節性活動

## 🛠️ 技術棧（規劃）

- **前端**: React 18 + TypeScript + Framer Motion
- **後端**: Node.js + TypeScript
- **數據**: JSON 文件 + SQLite（統計）
- **集成**: Claude Code API + MCP Protocol

## 📖 快速開始（文檔）

瀏覽設計文檔：

```bash
# 地圖系統
docs/design/map-system/

# 商店系統
docs/design/shop-system/

# 互動事件
docs/design/interactive-events/

# Worktree 整合
docs/design/worktree-battle-integration/
```

## 🎮 遊戲示例

### 技能使用
```
你使用了 📦 版本封印術！
MP: 95/100 (-5)

✨ 施法效果...
[執行 git commit...]

造成 30 點傷害！
Bug怪物 HP: 70/100

冷卻時間: 30 秒
```

### 連擊系統
```
🔥 雙重施法！
你同時使用了：
  • 📝 代碼編寫術
  • 🧪 試煉之法

傷害加成: +15%
造成 69 點傷害！(60 * 1.15)

額外消耗: +5 MP
```

### 成就解鎖
```
🏆 成就解鎖！

🌟 初出茅廬
完成首次戰鬥

獎勵: 技能「快速修復」
      +50 金幣
```

## 🤝 貢獻

這個專案目前處於設計階段，歡迎：
- 💡 提供設計建議
- 📝 改進文檔
- 🎨 UI/UX 設計
- 🐛 發現設計問題

## 📄 授權

[待定]

## 🌟 致謝

感謝 Claude 和 Anthropic 提供強大的 AI 能力，讓這個創新的專案成為可能。

---

**Code Quest** - 讓每一次 commit 都成為一場勝利！ ⚔️✨
