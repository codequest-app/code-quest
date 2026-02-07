# 多模型整合系統 (Multi-Model Integration System)

**創建日期**: 2026-02-06
**版本**: v1.0
**來源**: `/docs/design/multi-model-integration/requirements.md`

---

## 目錄

1. [系統概述](#系統概述)
2. [依賴關係](#依賴關係)
3. [核心規則](#核心規則)
4. [內部地圖](#內部地圖)
5. [系統整合](#系統整合)
6. [設計決策](#設計決策)

---

## 系統概述

### 核心概念

多模型整合系統實現多個 AI 模型（Claude, Gemini, GPT-4等）的統一管理和智能路由，提供成本優化和功能互補。

**為什麼需要多模型？**

單一模型的限制：
- ❌ 成本固定（無法優化）
- ❌ 功能限制（某些任務不擅長）
- ❌ 依賴單一供應商（風險）
- ❌ 無法根據任務選擇最優

多模型的優勢：
- ✅ 成本優化（簡單任務用便宜模型）
- ✅ 功能互補（各取所長）
- ✅ 供應商分散（降低風險）
- ✅ 任務匹配（用最適合的模型）

### 設計原則

**1. 模型無關（Model-Agnostic）**：
- 上層系統不關心底層用什麼模型
- UI 展示統一體驗
- 業務邏輯與模型解耦

**2. 統一接口（Unified Interface）**：
- 所有模型通過相同接口調用
- 標準化的輸入輸出格式
- 一致的錯誤處理

**3. 智能路由（Smart Routing）**：
- 自動選擇最適合的模型
- 基於任務特性的決策
- 可配置的路由策略

**4. 用戶可控（User Control）**：
- 用戶可以手動選擇模型
- 靈活的偏好配置
- 透明的決策過程

**5. 成本透明（Cost Transparency）**：
- 清晰顯示每個任務的成本
- 實時成本統計
- 預算控制機制

---

## 依賴關係

### 上游依賴

```
多模型整合系統依賴：
├─ Bridge Layer（L1）- 管理不同模型的 CLI 進程
├─ 成本追蹤系統（L1）- 記錄 token 使用和成本
└─ 用戶配置系統（L2）- 存儲用戶偏好
```

### 下游依賴

```
影響的系統：
├─ Async Battle System（L3）- 戰鬥實例可用不同模型
├─ Scene System（L2）- 探索/戰鬥都支持多模型
└─ UI System（L3）- 顯示模型選擇和成本統計
```

### 系統架構位置

```
L4: 展示層
    └─ 模型選擇 UI + 成本統計
L3: 業務層 ⭐
    └─ 多模型整合系統（本系統）
L2: 核心層
    └─ MultiModelRouter（路由器）
L1: 基礎層
    └─ ModelAdapters（適配器）
L0: 數據層
    └─ 模型 CLI 進程
```

---

## 核心規則

### 規則 1：模型註冊表

#### 1.1 Claude Sonnet 4.5

```
claudeSonnet = {
  modelId: 'claude-sonnet',
  displayName: 'Claude Sonnet 4.5',
  icon: '🤖',
  provider: 'Anthropic',

  capabilities: {
    dialog: true,
    codeGeneration: true,
    multimodal: true,
    longContext: true,
    toolUse: true
  },

  pricing: {
    inputTokens: 3,    // $3 per 1M tokens
    outputTokens: 15   // $15 per 1M tokens
  },

  performance: {
    avgLatency: 2000,  // 2 秒
    maxConcurrent: 5
  }
}
```

**適合場景**：
- 複雜代碼生成
- 需要精準對話
- 深度推理任務

#### 1.2 Gemini 2.0 Pro

```
geminiPro = {
  modelId: 'gemini-pro',
  displayName: 'Gemini 2.0 Pro',
  icon: '✨',
  provider: 'Google',

  capabilities: {
    dialog: true,
    codeGeneration: true,
    multimodal: true,        // 圖片/視頻
    longContext: true,        // 2M context
    toolUse: true
  },

  pricing: {
    inputTokens: 1.25,   // $1.25 per 1M (便宜 60%)
    outputTokens: 5      // $5 per 1M
  },

  performance: {
    avgLatency: 1500,    // 1.5 秒（稍快）
    maxConcurrent: 10
  }
}
```

**適合場景**：
- 多模態任務（圖片、視頻）
- 超長上下文
- 簡單到中等複雜度任務
- 成本敏感場景

---

### 規則 2：路由策略

#### 2.1 用戶偏好模式

**Balanced Mode（平衡模式）** - 推薦：
```
balanced = {
  dialog: 'claude',              // 對話用 Claude
  simpleTask: 'gemini',          // 簡單任務用 Gemini
  complexTask: 'claude',         // 複雜任務用 Claude
  multimodal: 'gemini',          // 多模態用 Gemini
  estimatedCost: '$0.50/day'
}
```

**Quality Mode（質量優先）**：
```
quality = {
  dialog: 'claude',
  simpleTask: 'claude',
  complexTask: 'claude',
  multimodal: 'claude',
  estimatedCost: '$0.80/day'
}
```

**Cost Mode（成本優先）**：
```
cost = {
  dialog: 'gemini',
  simpleTask: 'gemini',
  complexTask: 'gemini',
  multimodal: 'gemini',
  estimatedCost: '$0.25/day'
}
```

#### 2.2 路由決策表

| 場景 | 默認模型 | 原因 | 可替代 |
|------|---------|------|--------|
| 對話問答 | Claude | 精準度高 | Gemini (成本) |
| 代碼生成 | Claude | 質量最佳 | - |
| 簡單修復 | Gemini | 成本低 | Claude (質量) |
| 複雜重構 | Claude | 推理深度 | - |
| 多模態任務 | Gemini | 支持圖片/視頻 | - |
| 長上下文 | Gemini | 2M context | - |
| 成本優先 | Gemini | 價格便宜 60% | - |

#### 2.3 選擇邏輯

```
function selectModel(task) {
  // 1. 檢查特殊要求
  if (task.hasMedia) {
    return 'gemini';  // 多模態
  }

  if (task.contextLength > 100000) {
    return 'gemini';  // 長上下文
  }

  // 2. 根據用戶偏好
  const preference = user.preferences.modelMode;

  if (preference === 'cost') {
    return 'gemini';
  }

  if (preference === 'quality') {
    return 'claude';
  }

  // 3. Balanced 模式
  if (task.type === 'dialog') {
    return 'claude';
  }

  if (task.complexity < 8) {
    return 'gemini';
  }

  return 'claude';
}
```

---

### 規則 3：成本管理

#### 3.1 成本追蹤

```
costTracker = {
  session: {
    startTime: Date.now(),
    models: {
      claude: {
        calls: 0,
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalCost: 0
      },
      gemini: {
        calls: 0,
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalCost: 0
      }
    },
    totalCost: 0
  },

  trackCall: (model, usage) => {
    const modelStats = costTracker.session.models[model];

    modelStats.calls++;
    modelStats.inputTokens += usage.inputTokens;
    modelStats.outputTokens += usage.outputTokens;
    modelStats.totalTokens += usage.totalTokens;

    // 計算成本
    const pricing = modelRegistry[model].pricing;
    const cost = (
      (usage.inputTokens / 1000000) * pricing.inputTokens +
      (usage.outputTokens / 1000000) * pricing.outputTokens
    );

    modelStats.totalCost += cost;
    costTracker.session.totalCost += cost;

    return cost;
  }
}
```

#### 3.2 預算控制

```
budgetConfig = {
  dailyBudget: 5,          // $5/天
  warningThreshold: 0.8,   // 80% 警告
  exceedAction: 'switch'   // 'stop' | 'switch' | 'warn'
}

function checkBudget() {
  const used = costTracker.getDailyCost();
  const percentage = used / budgetConfig.dailyBudget;

  if (percentage >= 1.0) {
    if (budgetConfig.exceedAction === 'stop') {
      return { allowed: false, message: '已超出每日預算' };
    } else if (budgetConfig.exceedAction === 'switch') {
      // 切換到便宜模型
      return { allowed: true, forceModel: 'gemini' };
    } else {
      // 僅警告
      showWarning('已超出每日預算，但繼續使用');
      return { allowed: true };
    }
  } else if (percentage >= budgetConfig.warningThreshold) {
    showWarning(`已使用 ${Math.round(percentage * 100)}% 預算`);
  }

  return { allowed: true };
}
```

#### 3.3 成本估算

```
function estimateCost(prompt, model) {
  // 簡化估算：字符數 / 4
  const tokens = Math.ceil(prompt.length / 4);

  // 假設輸出是輸入的 2 倍
  const inputTokens = tokens;
  const outputTokens = tokens * 2;

  const pricing = modelRegistry[model].pricing;

  const cost = (
    (inputTokens / 1000000) * pricing.inputTokens +
    (outputTokens / 1000000) * pricing.outputTokens
  );

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    estimatedCost: cost
  };
}
```

---

### 規則 4：模型抽象層

```typescript
interface IModelAdapter {
  // 基本資訊
  modelId: string;
  displayName: string;
  icon: string;
  provider: string;

  // 能力標記
  capabilities: {
    dialog: boolean;
    codeGeneration: boolean;
    multimodal: boolean;
    longContext: boolean;
    toolUse: boolean;
  };

  // 成本資訊
  pricing: {
    inputTokens: number;
    outputTokens: number;
  };

  // 核心方法
  start(): Promise<void>;
  stop(): Promise<void>;
  ask(prompt: string): Promise<string>;
  executeTask(prompt: string): Promise<Result>;
  stream(prompt: string, callback: (chunk: string) => void): Promise<void>;
  cancel(): void;

  // 成本追蹤
  getUsage(): Usage;
  estimateCost(prompt: string): number;
}
```

---

### 規則 5：錯誤處理

#### 5.1 模型切換

```
modelFailover = {
  enabled: true,
  fallbackOrder: ['claude', 'gemini'],

  onError: async (model, error) => {
    logger.error(`Model ${model} failed:`, error);

    // 查找下一個可用模型
    const nextModel = findNextAvailableModel(model);

    if (nextModel) {
      logger.info(`Switching to ${nextModel}`);
      return { switched: true, model: nextModel };
    } else {
      return { switched: false, error: 'No fallback model available' };
    }
  }
}
```

#### 5.2 超時處理

```
modelTimeout = {
  claude: 30000,   // 30 秒
  gemini: 20000    // 20 秒
}

function executeWithTimeout(model, prompt) {
  return Promise.race([
    model.executeTask(prompt),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), modelTimeout[model.modelId])
    )
  ]);
}
```

---

## 內部地圖

### 模型選擇 UI

```
┌─────────────────────────────────────────────────────────┐
│  ⚙️ 模型設置                                            │
├─────────────────────────────────────────────────────────┤
│  模式選擇：                                              │
│                                                         │
│  ◉ ⚖️ 平衡模式（推薦）                                  │
│     對話和複雜任務用 Claude，簡單任務用 Gemini          │
│     預估每日成本: ~$0.50                                │
│                                                         │
│  ○ 🎯 質量優先                                          │
│     所有任務都用 Claude Sonnet                          │
│     預估每日成本: ~$0.80                                │
│                                                         │
│  ○ 💰 成本優先                                          │
│     盡可能使用 Gemini Pro                               │
│     預估每日成本: ~$0.25                                │
│                                                         │
│  ○ 🎛️ 自定義配置                                       │
│     手動配置每種任務類型使用的模型                      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  成本統計（今日）：                                      │
│                                                         │
│  🤖 Claude Sonnet: $0.18 (8 次調用)                    │
│  ✨ Gemini Pro:    $0.05 (12 次調用)                   │
│  ────────────────────────────                           │
│  總計: $0.23 / $5.00 (4.6%)                             │
│                                                         │
│  [查看詳細統計] [設置預算] [導出報告]                   │
└─────────────────────────────────────────────────────────┘
```

### 成本統計 UI

```
┌─────────────────────────────────────────────────────────┐
│  📊 成本統計                                            │
├─────────────────────────────────────────────────────────┤
│  時間範圍：[今日] [本週] [本月]                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  今日使用（2026-02-06）：                               │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🤖 Claude Sonnet 4.5                            │   │
│  │ ━━━━━━━━━━━━━━━━━━ 72%                         │   │
│  │                                                 │   │
│  │ 調用次數：8 次                                   │   │
│  │ 輸入 Token：15,234                              │   │
│  │ 輸出 Token：28,456                              │   │
│  │ 總成本：$0.18                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ✨ Gemini 2.0 Pro                               │   │
│  │ ━━━━━ 28%                                       │   │
│  │                                                 │   │
│  │ 調用次數：12 次                                  │   │
│  │ 輸入 Token：8,567                               │   │
│  │ 輸出 Token：16,234                              │   │
│  │ 總成本：$0.05                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  總成本：$0.23                                          │
│  預算：$5.00/天                                         │
│  剩餘：$4.77 (95.4%)                                    │
│                                                         │
│  節省：使用多模型策略比全用 Claude 節省了 ~$0.12 (34%)  │
│                                                         │
│  [導出 CSV] [設置預警] [查看歷史]                       │
└─────────────────────────────────────────────────────────┘
```

---

## 系統整合

### 與 Async Battle System 整合

```
// 戰鬥實例可以使用不同的模型
async function createBattle(config) {
  // 路由到合適的模型
  const model = multiModelRouter.selectModel(config);

  const battle = {
    id: generateId(),
    model: model.modelId,
    config: config,
    process: await model.start()
  };

  // 追蹤成本
  battle.cost = {
    startCost: costTracker.session.totalCost,
    model: model.modelId
  };

  return battle;
}

// 戰鬥完成時記錄成本
battlePool.on('battle_complete', (battle) => {
  battle.cost.endCost = costTracker.session.totalCost;
  battle.cost.totalCost = battle.cost.endCost - battle.cost.startCost;

  logger.info(`Battle #${battle.id} cost: $${battle.cost.totalCost.toFixed(4)} (${battle.cost.model})`);
});
```

---

## 設計決策

### 決策 1：為什麼需要多模型？

**理由**：
1. 成本優化：簡單任務用便宜模型，節省 60%+
2. 功能互補：Gemini 多模態強，Claude 代碼生成強
3. 風險分散：不依賴單一供應商
4. 靈活選擇：根據任務特性選擇最優

### 決策 2：為什麼默認推薦平衡模式？

**理由**：
- 關鍵任務（對話、複雜）用最好的模型（Claude）
- 簡單任務用便宜模型（Gemini）
- 兼顧質量和成本
- 適合大多數用戶

### 決策 3：為什麼需要成本透明？

**理由**：
- 用戶有權知道花費
- 幫助用戶做出明智選擇
- 預算控制避免超支
- 增加信任感

### 決策 4：為什麼允許用戶手動選擇？

**理由**：
- 用戶可能有特殊需求
- 尊重用戶選擇權
- 某些場景需要特定模型
- 高級用戶需要更多控制

### 決策 5：為什麼需要模型抽象層？

**理由**：
- 上層系統不關心底層模型
- 易於添加新模型
- 統一接口降低複雜度
- 業務邏輯與模型解耦

---

**文檔完成日期**: 2026-02-06
**總字數**: ~4,500
**章節**: 6
**來源文件**: `/docs/design/multi-model-integration/requirements.md` (674 lines)
