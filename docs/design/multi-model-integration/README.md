# 多模型整合系統（Multi-Model Integration）

**依賴**: 戰鬥系統、商店系統（錢莊）
**被依賴**: 無

---

## 📖 系統概要

多模型整合系統支持 Claude 和 Gemini 多模型，提供統一抽象層讓系統無需關心底層模型差異。智能路由根據任務類型、成本和能力選擇最適合的模型，實時追蹤成本並提供預算警告，幫助用戶優化 API 使用成本。

---

## 🎯 核心功能

### 1. 模型抽象層

**IModelAdapter 介面**：
```typescript
interface IModelAdapter {
  modelId: string;
  displayName: string;
  capabilities: ModelCapabilities;
  pricing: {
    inputTokens: number;   // 每 1K tokens 價格
    outputTokens: number;
  };

  start(): Promise<void>;
  ask(prompt: string): Promise<string>;
  executeTask(prompt: string): Promise<Result>;
  getUsage(): Usage;
  estimateCost(prompt: string): number;
}
```

**支持的模型**：
- Claude Opus 4.5：最強能力，最高成本
- Claude Sonnet 4.5：平衡質量和成本
- Claude Haiku：快速簡單任務
- Gemini Pro：高質量，中等成本
- Gemini Flash：低成本，快速響應

### 2. 智能路由（MultiModelRouter）

**路由策略**：
```javascript
任務分析 → 模型選擇

對話型任務：
├─ 簡單閒聊 → Gemini Flash（最低成本）
├─ 知識問答 → Gemini Pro
└─ 深度討論 → Claude Sonnet

代碼型任務：
├─ 簡單代碼生成 → Claude Haiku
├─ 複雜代碼生成 → Claude Sonnet
├─ 架構設計 → Claude Opus
└─ 代碼審查 → Claude Sonnet

特殊任務：
├─ 多模態（圖片）→ Claude Sonnet/Opus
├─ 長文本 → Claude Sonnet（200K context）
└─ 工具使用 → Claude 系列（優先）
```

### 3. 成本追蹤（CostTracker）

**實時追蹤**：
- 每個請求的 token 使用量
- 輸入/輸出 token 分別計算
- 實時成本累計
- 按模型分類統計

**預算管理**：
- 設定每日/每月預算
- 達到 80% 時警告
- 達到 100% 時限制使用
- 成本報表生成

### 4. UI 整合

**錢莊（Cost Exchange）**：
- 實時成本面板
- 模型比較和切換
- 使用統計圖表
- 預算設定介面

**模型選擇器**：
- 手動選擇特定模型
- 查看模型能力和價格
- 切換使用模式（平衡/質量/成本）

---

## 📂 文件結構

```
multi-model-integration/
├── README.md           ← 你在這裡
├── requirements.md     ← 多模型需求
├── ui-design.md        ← 成本面板和選擇器
└── implementation.md   ← Adapter 和 Router 實作
```

### 文件說明

**requirements.md** (~650 行)
- 模型抽象需求
- 智能路由策略
- 成本管理規則
- 模型無關架構設計
- 容錯和降級策略

**ui-design.md** (~550 行)
- 錢莊成本面板設計
- 模型配置 UI
- 模型選擇器
- 成本警告提示
- 使用統計圖表

**implementation.md** (~750 行)
- IModelAdapter 介面定義
- ClaudeAdapter 實作
- GeminiAdapter 實作
- ModelRegistry 註冊機制
- MultiModelRouter 路由邏輯
- CostTracker 成本追蹤

---

## 📖 建議閱讀順序

### 快速了解（10 分鐘）
1. 閱讀本 README
2. 瀏覽 `requirements.md` 的「模型抽象層」和「路由策略」

### 完整理解（45 分鐘）
1. **requirements.md** - 了解多模型架構和路由策略
2. **ui-design.md** - 了解成本面板和模型選擇器
3. **implementation.md** - 了解 Adapter 模式和 Router 實作

### 開發實作
1. 完整閱讀 `implementation.md` 的 IModelAdapter 介面
2. 參考 `requirements.md` 的路由策略
3. 參考 `ui-design.md` 實作成本面板

---

## 🔗 與其他系統的關係

### 依賴關係

- **戰鬥系統** → 模型執行任務
- **商店系統** → 錢莊顯示成本和切換模型

### 整合點

- **所有 AI 請求** → 通過 MultiModelRouter
- **成本顯示** → 錢莊實時更新
- **模型切換** → 錢莊介面操作

---

## 💡 設計要點

### 設計目標

1. **模型無關**：系統不依賴特定模型
2. **成本優化**：自動選擇性價比最高的模型
3. **易於擴展**：新增模型只需實作 Adapter
4. **透明可控**：用戶可查看和控制模型選擇

### 關鍵設計決策

1. **Adapter 模式**
   - 統一介面隔離模型差異
   - 易於新增新模型
   - 便於測試和模擬

2. **智能路由**
   - 根據任務類型自動選擇
   - 考慮成本和能力平衡
   - 可手動覆蓋

3. **成本優先**
   - 默認選擇低成本模型
   - 必要時才用高成本模型
   - 實時成本追蹤和警告

---

## 🚀 快速參考

### 模型比較

| 模型 | 輸入成本* | 輸出成本* | 能力 | 適用場景 |
|-----|----------|----------|------|---------|
| **Claude Opus 4.5** | $15 | $75 | ⭐⭐⭐⭐⭐ | 複雜架構、深度分析 |
| **Claude Sonnet 4.5** | $3 | $15 | ⭐⭐⭐⭐ | 代碼生成、審查 |
| **Claude Haiku** | $0.25 | $1.25 | ⭐⭐⭐ | 簡單代碼、快速回應 |
| **Gemini Pro** | $1.25 | $5 | ⭐⭐⭐⭐ | 知識問答、文案 |
| **Gemini Flash** | $0.075 | $0.30 | ⭐⭐⭐ | 閒聊、簡單問答 |

*每 1M tokens 價格（USD）

### 路由決策樹

```
用戶 Prompt
    ↓
Prompt 分類
    ├─ 閒聊/簡單問答
    │  └─ Gemini Flash（最低成本）
    │
    ├─ 知識問答
    │  └─ Gemini Pro（平衡）
    │
    ├─ 簡單代碼生成
    │  └─ Claude Haiku（快速）
    │
    ├─ 複雜代碼生成/審查
    │  └─ Claude Sonnet（高質量）
    │
    └─ 架構設計/複雜分析
       └─ Claude Opus（最強）
```

### 使用模式切換

**平衡模式（默認）**：
- 自動路由，平衡質量和成本
- 適合大部分用戶

**質量模式**：
- 優先使用高質量模型
- 不考慮成本
- 適合重要任務

**成本模式**：
- 優先使用低成本模型
- 犧牲一些質量
- 適合預算有限用戶

### 成本追蹤範例

```javascript
// 單次請求成本計算
const request = {
  model: 'claude-sonnet-4-5',
  inputTokens: 1500,
  outputTokens: 800
};

const cost =
  (1500 / 1000000) * 3 +      // 輸入成本
  (800 / 1000000) * 15;       // 輸出成本
// = $0.0045 + $0.012 = $0.0165

// 每日累計
todayCost: $2.45
monthCost: $48.90
budget: $100/month
remaining: $51.10 (51%)
```

---

**版本**: v1.0
**更新日期**: 2026-02-05
**狀態**: 設計完成，待實作

