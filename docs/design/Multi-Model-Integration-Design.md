# 多模型整合設計

**日期**: 2026-02-05
**版本**: v1.0
**基於**: Async-Battle-System-Design.md

---

## 核心概念

### 為什麼需要多模型？

**單一模型的限制**:
- ❌ 成本固定（無法優化）
- ❌ 功能限制（某些任務不擅長）
- ❌ 依賴單一供應商（風險）
- ❌ 無法根據任務選擇最優

**多模型的優勢**:
- ✅ 成本優化（簡單任務用便宜模型）
- ✅ 功能互補（各取所長）
- ✅ 供應商分散（降低風險）
- ✅ 任務匹配（用最適合的模型）

### 設計原則

1. **模型無關（Model-Agnostic）**: 上層系統不關心底層用什麼模型
2. **統一接口（Unified Interface）**: 所有模型通過相同接口調用
3. **智能路由（Smart Routing）**: 自動選擇最適合的模型
4. **用戶可控（User Control）**: 用戶可以手動選擇或配置
5. **成本透明（Cost Transparency）**: 清晰顯示每個任務的成本

---

## 系統架構

### 多模型分層架構

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer (React)                          │
│                                                               │
│  用戶看到的是統一的體驗，不關心底層用什麼模型               │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   Bridge Layer (Node.js)                     │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           MultiModelRouter (多模型路由器)            │   │
│  │                                                       │   │
│  │  analyzePrompt() → selectBestModel() → execute()     │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                  │
│  ┌────────────────────────▼──────────────────────────────┐  │
│  │         ModelRegistry (模型註冊表)                    │  │
│  │                                                        │  │
│  │  註冊的模型:                                          │  │
│  │  • claude-sonnet → ClaudeAdapter                      │  │
│  │  • gemini-pro → GeminiAdapter                         │  │
│  │  • gpt-4 → OpenAIAdapter                              │  │
│  └────────────────────────┬──────────────────────────────┘  │
│                           │                                  │
│  ┌────────────────────────▼──────────────────────────────┐  │
│  │         ModelAbstraction (模型抽象層)                 │  │
│  │                                                        │  │
│  │  所有模型實現統一接口:                                │  │
│  │  • ask(prompt)                                        │  │
│  │  • executeTask(prompt)                                │  │
│  │  • stream(prompt, callback)                           │  │
│  │  • cancel()                                           │  │
│  └────────────────────────┬──────────────────────────────┘  │
│                           │                                  │
│           ┌───────────────┼───────────────┐                 │
│           │               │               │                 │
│           ▼               ▼               ▼                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ ClaudeAdapter│ │ GeminiAdapter│ │OpenAIAdapter │       │
│  │              │ │              │ │              │       │
│  │ 適配 Claude  │ │ 適配 Gemini  │ │ 適配 OpenAI  │       │
│  │ CLI 格式     │ │ CLI 格式     │ │ CLI 格式     │       │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘       │
└─────────┼────────────────┼────────────────┼───────────────┘
          │                │                │
          ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Claude CLI   │ │ Gemini CLI   │ │ OpenAI CLI   │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 模型抽象層

### 統一接口定義

```typescript
// 所有模型適配器必須實現此接口
interface IModelAdapter {
  // 基本資訊
  modelId: string;          // 'claude-sonnet', 'gemini-pro', etc.
  displayName: string;      // 顯示名稱
  icon: string;             // UI 圖標
  provider: string;         // 供應商 'anthropic', 'google', etc.

  // 能力標記
  capabilities: {
    dialog: boolean;        // 支持對話
    codeGeneration: boolean;// 代碼生成
    multimodal: boolean;    // 多模態（圖片、視頻）
    longContext: boolean;   // 長上下文
    toolUse: boolean;       // 工具調用
  };

  // 成本資訊
  pricing: {
    inputTokens: number;    // 每 1K tokens 價格（美元）
    outputTokens: number;   // 每 1K tokens 價格（美元）
  };

  // 性能特徵
  performance: {
    avgLatency: number;     // 平均延遲（毫秒）
    maxConcurrent: number;  // 最大並行數
  };

  // 方法
  start(): Promise<void>;                       // 啟動 CLI
  stop(): Promise<void>;                        // 停止 CLI
  ask(prompt: string): Promise<string>;         // 對話
  executeTask(prompt: string): Promise<Result>; // 執行任務
  stream(prompt: string, callback: (chunk: string) => void): Promise<void>; // 流式輸出
  cancel(): void;                               // 取消當前任務

  // 成本追蹤
  getUsage(): Usage;                            // 獲取使用統計
  estimateCost(prompt: string): number;         // 估算成本
}

// 使用統計
interface Usage {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;  // 美元
}

// 執行結果
interface Result {
  success: boolean;
  output: string;
  usage: Usage;
  duration: number;  // 毫秒
  error?: string;
}
```

### Claude 適配器實作

```javascript
class ClaudeAdapter implements IModelAdapter {
  modelId = 'claude-sonnet';
  displayName = 'Claude Sonnet 4.5';
  icon = '🤖';
  provider = 'anthropic';

  capabilities = {
    dialog: true,
    codeGeneration: true,
    multimodal: true,
    longContext: true,
    toolUse: true
  };

  pricing = {
    inputTokens: 0.003,   // $3 per 1M tokens
    outputTokens: 0.015   // $15 per 1M tokens
  };

  performance = {
    avgLatency: 2000,
    maxConcurrent: 5
  };

  constructor() {
    this.process = null;
    this.usage = {
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0
    };
  }

  async start() {
    this.process = spawn('claude', ['code'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.process.stdout.on('data', (data) => {
      this.handleOutput(data);
    });

    console.log('✅ Claude CLI 已啟動');
  }

  async stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  async ask(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.process.stdin.write(prompt + '\n');

      this.onResponse = (response) => {
        // 追蹤使用量
        this.trackUsage(prompt, response);
        resolve(response);
      };
    });
  }

  async executeTask(prompt: string): Promise<Result> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      this.process.stdin.write(prompt + '\n');

      this.onTaskComplete = (output) => {
        const duration = Date.now() - startTime;
        const usage = this.trackUsage(prompt, output);

        resolve({
          success: true,
          output,
          usage,
          duration
        });
      };
    });
  }

  trackUsage(input: string, output: string): Usage {
    // 簡化版 token 計算（實際需要更精確）
    const inputTokens = Math.ceil(input.length / 4);
    const outputTokens = Math.ceil(output.length / 4);

    this.usage.inputTokens += inputTokens;
    this.usage.outputTokens += outputTokens;
    this.usage.totalTokens += (inputTokens + outputTokens);

    const cost =
      (inputTokens / 1000) * this.pricing.inputTokens +
      (outputTokens / 1000) * this.pricing.outputTokens;

    this.usage.estimatedCost += cost;

    return {
      totalTokens: inputTokens + outputTokens,
      inputTokens,
      outputTokens,
      estimatedCost: cost
    };
  }

  estimateCost(prompt: string): number {
    const inputTokens = Math.ceil(prompt.length / 4);
    // 假設輸出是輸入的 2 倍
    const outputTokens = inputTokens * 2;

    return (
      (inputTokens / 1000) * this.pricing.inputTokens +
      (outputTokens / 1000) * this.pricing.outputTokens
    );
  }

  getUsage(): Usage {
    return { ...this.usage };
  }
}
```

### Gemini 適配器實作

```javascript
class GeminiAdapter implements IModelAdapter {
  modelId = 'gemini-pro';
  displayName = 'Gemini 2.0 Pro';
  icon = '✨';
  provider = 'google';

  capabilities = {
    dialog: true,
    codeGeneration: true,
    multimodal: true,      // 支持圖片、視頻
    longContext: true,     // 2M context window
    toolUse: true
  };

  pricing = {
    inputTokens: 0.00125,  // $1.25 per 1M tokens (更便宜)
    outputTokens: 0.005    // $5 per 1M tokens
  };

  performance = {
    avgLatency: 1500,      // 稍快
    maxConcurrent: 10
  };

  constructor() {
    this.process = null;
    this.usage = {
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0
    };
  }

  async start() {
    // 假設 Gemini 有類似的 CLI 工具
    this.process = spawn('gemini', ['cli'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.process.stdout.on('data', (data) => {
      this.handleOutput(data);
    });

    console.log('✅ Gemini CLI 已啟動');
  }

  // 其他方法類似 ClaudeAdapter，但適配 Gemini CLI 格式
  async ask(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      // Gemini CLI 的特定格式
      this.process.stdin.write(JSON.stringify({
        type: 'chat',
        message: prompt
      }) + '\n');

      this.onResponse = (response) => {
        this.trackUsage(prompt, response);
        resolve(response);
      };
    });
  }

  // ... 其他方法實作
}
```

---

## 模型註冊表

### 註冊與管理

```javascript
class ModelRegistry {
  constructor() {
    this.models = new Map();
    this.activeModels = new Map();
  }

  // 註冊模型
  register(adapter: IModelAdapter) {
    this.models.set(adapter.modelId, adapter);
    console.log(`✅ 註冊模型: ${adapter.displayName}`);
  }

  // 啟動模型
  async activate(modelId: string) {
    const adapter = this.models.get(modelId);

    if (!adapter) {
      throw new Error(`模型未註冊: ${modelId}`);
    }

    if (this.activeModels.has(modelId)) {
      return this.activeModels.get(modelId);
    }

    await adapter.start();
    this.activeModels.set(modelId, adapter);

    return adapter;
  }

  // 停用模型
  async deactivate(modelId: string) {
    const adapter = this.activeModels.get(modelId);

    if (adapter) {
      await adapter.stop();
      this.activeModels.delete(modelId);
    }
  }

  // 獲取模型
  get(modelId: string): IModelAdapter {
    return this.activeModels.get(modelId) || this.models.get(modelId);
  }

  // 列出所有模型
  list(): IModelAdapter[] {
    return Array.from(this.models.values());
  }

  // 列出活躍模型
  listActive(): IModelAdapter[] {
    return Array.from(this.activeModels.values());
  }
}

// 初始化註冊表
const registry = new ModelRegistry();

// 註冊所有支持的模型
registry.register(new ClaudeAdapter());
registry.register(new GeminiAdapter());
registry.register(new OpenAIAdapter());
```

---

## 多模型路由器

### 智能選擇策略

```javascript
class MultiModelRouter {
  constructor(registry: ModelRegistry) {
    this.registry = registry;

    // 默認配置
    this.config = {
      dialog: 'claude-sonnet',      // 對話用 Claude
      simpleTask: 'gemini-pro',     // 簡單任務用 Gemini（便宜）
      complexTask: 'claude-sonnet', // 複雜任務用 Claude（可靠）
      multimodal: 'gemini-pro',     // 多模態用 Gemini
      costSaving: 'gemini-pro'      // 成本優先用 Gemini
    };

    // 用戶偏好
    this.userPreference = 'balanced'; // balanced, quality, cost
  }

  // 分析並選擇最佳模型
  selectBestModel(prompt: string, analysis: Analysis): string {
    // 1. 檢查是否有特定要求
    if (analysis.hasImages || analysis.hasVideo) {
      return this.config.multimodal;
    }

    // 2. 根據用戶偏好
    if (this.userPreference === 'cost') {
      return this.config.costSaving;
    }

    if (this.userPreference === 'quality') {
      return 'claude-sonnet'; // 總是用最好的
    }

    // 3. 根據任務類型（balanced 模式）
    if (analysis.type === 'dialog') {
      return this.config.dialog;
    }

    if (analysis.complexity < 8) {
      return this.config.simpleTask;
    }

    return this.config.complexTask;
  }

  // 執行路由
  async route(prompt: string, analysis: Analysis) {
    // 選擇模型
    const modelId = this.selectBestModel(prompt, analysis);

    // 激活模型（如果尚未激活）
    const adapter = await this.registry.activate(modelId);

    // 估算成本
    const estimatedCost = adapter.estimateCost(prompt);

    console.log(`📍 路由到: ${adapter.displayName}`);
    console.log(`💰 估算成本: $${estimatedCost.toFixed(4)}`);

    // 根據分析類型執行
    if (analysis.type === 'dialog') {
      return await adapter.ask(prompt);
    } else {
      return await adapter.executeTask(prompt);
    }
  }

  // 用戶配置模型
  setModelForType(type: string, modelId: string) {
    this.config[type] = modelId;
  }

  // 設置用戶偏好
  setUserPreference(preference: 'balanced' | 'quality' | 'cost') {
    this.userPreference = preference;
  }

  // 獲取成本統計
  getTotalCost(): number {
    let total = 0;

    this.registry.listActive().forEach(adapter => {
      total += adapter.getUsage().estimatedCost;
    });

    return total;
  }

  // 獲取使用統計
  getUsageStats() {
    const stats = {};

    this.registry.listActive().forEach(adapter => {
      stats[adapter.modelId] = adapter.getUsage();
    });

    return stats;
  }
}
```

### 路由決策表

| 場景 | 默認模型 | 原因 | 可替代 |
|------|---------|------|--------|
| 對話問答 | Claude | 精準度高 | Gemini (成本) |
| 代碼生成 | Claude | 質量最佳 | - |
| 簡單修復 | Gemini | 成本低 | Claude (質量) |
| 複雜重構 | Claude | 推理深度 | - |
| 多模態任務 | Gemini | 支持圖片/視頻 | - |
| 長上下文 | Gemini | 2M context | - |
| 成本優先 | Gemini | 價格便宜 60% | - |

---

## 成本追蹤系統

### 成本監控

```javascript
class CostTracker {
  constructor() {
    this.sessions = [];
    this.currentSession = this.createSession();
  }

  createSession() {
    return {
      id: Date.now(),
      startTime: Date.now(),
      models: {},
      totalCost: 0
    };
  }

  // 記錄使用
  track(modelId: string, usage: Usage) {
    if (!this.currentSession.models[modelId]) {
      this.currentSession.models[modelId] = {
        calls: 0,
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalCost: 0
      };
    }

    const stats = this.currentSession.models[modelId];
    stats.calls++;
    stats.totalTokens += usage.totalTokens;
    stats.inputTokens += usage.inputTokens;
    stats.outputTokens += usage.outputTokens;
    stats.totalCost += usage.estimatedCost;

    this.currentSession.totalCost += usage.estimatedCost;
  }

  // 獲取今日統計
  getTodayStats() {
    return this.currentSession;
  }

  // 獲取模型對比
  getModelComparison() {
    const models = this.currentSession.models;
    const comparison = [];

    for (const [modelId, stats] of Object.entries(models)) {
      comparison.push({
        modelId,
        ...stats,
        avgCostPerCall: stats.totalCost / stats.calls,
        avgTokensPerCall: stats.totalTokens / stats.calls
      });
    }

    return comparison;
  }

  // 成本警告
  checkBudget(dailyBudget: number) {
    if (this.currentSession.totalCost > dailyBudget) {
      return {
        exceeded: true,
        current: this.currentSession.totalCost,
        budget: dailyBudget,
        percentage: (this.currentSession.totalCost / dailyBudget) * 100
      };
    }

    return { exceeded: false };
  }
}
```

### 成本顯示 UI

```
┌─────────────────────────────────────┐
│ 💰 成本統計（今日）                 │
├─────────────────────────────────────┤
│                                     │
│ 總成本: $0.42                       │
│ 預算: $5.00                         │
│ 使用率: ████░░░░░░ 8.4%             │
│                                     │
│ 【模型使用統計】                     │
│                                     │
│ 🤖 Claude Sonnet                   │
│ 調用次數: 15                        │
│ 總 Tokens: 45,230                  │
│ 成本: $0.28                         │
│ 平均: $0.019/次                     │
│                                     │
│ ✨ Gemini Pro                      │
│ 調用次數: 42                        │
│ 總 Tokens: 68,500                  │
│ 成本: $0.14                         │
│ 平均: $0.003/次                     │
│                                     │
│ 【成本節省】                         │
│ 如果全用 Claude: $0.61              │
│ 實際成本: $0.42                     │
│ 節省: $0.19 (31%)                   │
│                                     │
│ [查看詳情] [設置預算]               │
└─────────────────────────────────────┘
```

---

## 用戶配置 UI

### 模型設定畫面

```
┌─────────────────────────────────────────────────────────┐
│ ⚙️ 模型配置                                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 【使用偏好】                                             │
│ ◉ 平衡模式（推薦）                                       │
│   對話和複雜任務用 Claude，簡單任務用 Gemini             │
│   預估每日成本: ~$0.50                                   │
│                                                          │
│ ○ 質量優先                                               │
│   所有任務都用 Claude Sonnet                             │
│   預估每日成本: ~$0.80                                   │
│                                                          │
│ ○ 成本優先                                               │
│   盡可能使用 Gemini Pro                                  │
│   預估每日成本: ~$0.25                                   │
│                                                          │
│ ○ 自定義配置 ▼                                           │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 【自定義配置】                                           │
│                                                          │
│ 對話模式:                                                │
│ [Claude Sonnet ▼] 💰 中等成本 | ⚡ 精準度高              │
│                                                          │
│ 簡單任務 (複雜度 3-7):                                   │
│ [Gemini Pro ▼]    💰 低成本   | ⚡ 速度快                │
│                                                          │
│ 複雜任務 (複雜度 8+):                                    │
│ [Claude Sonnet ▼] 💰 中等成本 | ⚡ 質量最佳              │
│                                                          │
│ 多模態任務 (圖片/視頻):                                  │
│ [Gemini Pro ▼]    💰 低成本   | ⚡ 支持多模態            │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 【可用模型】                                             │
│                                                          │
│ ✅ 🤖 Claude Sonnet 4.5                                 │
│    能力: 對話、代碼、推理、工具調用、多模態               │
│    成本: $3/$15 per 1M tokens                            │
│    狀態: 已啟用                                          │
│                                                          │
│ ✅ ✨ Gemini 2.0 Pro                                    │
│    能力: 對話、代碼、多模態、長上下文(2M)                │
│    成本: $1.25/$5 per 1M tokens (便宜 60%)               │
│    狀態: 已啟用                                          │
│                                                          │
│ ❌ 🔥 GPT-4                                             │
│    能力: 對話、創意、通用                                │
│    成本: $10/$30 per 1M tokens                           │
│    狀態: 未配置                                          │
│    [配置]                                                │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 【成本控制】                                             │
│                                                          │
│ 每日預算: [$5.00]                                        │
│ 超出預算時: [切換到便宜模型 ▼]                           │
│              ○ 停止使用                                  │
│              ◉ 切換到 Gemini                             │
│              ○ 僅警告，繼續使用                          │
│                                                          │
│ [保存配置] [重置為默認] [取消]                           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 與異步戰鬥系統整合

### 整合架構

```javascript
class IntegratedBattleSystem {
  constructor() {
    // 模型系統
    this.modelRegistry = new ModelRegistry();
    this.modelRouter = new MultiModelRouter(this.modelRegistry);
    this.costTracker = new CostTracker();

    // 戰鬥系統（原有）
    this.smartRouter = new SmartRouter();
    this.mainCLI = null;  // 將被模型適配器替代
    this.battleQueue = new BattleInstancePool();
  }

  async initialize() {
    // 註冊模型
    this.modelRegistry.register(new ClaudeAdapter());
    this.modelRegistry.register(new GeminiAdapter());

    // 啟動默認模型（用於對話和簡單任務）
    const dialogModel = await this.modelRegistry.activate('claude-sonnet');
    const taskModel = await this.modelRegistry.activate('gemini-pro');

    console.log('✅ 多模型系統已啟動');
  }

  async handleUserPrompt(prompt: string) {
    // 1. 分析 Prompt（原有邏輯）
    const analysis = this.smartRouter.analyzePrompt(prompt);

    // 2. 選擇最佳模型（新增）
    const modelId = this.modelRouter.selectBestModel(prompt, analysis);
    const adapter = this.modelRegistry.get(modelId);

    // 3. 根據複雜度路由
    switch (analysis.route) {
      case 'dialog':
        // 對話 - 使用選定的模型
        const response = await adapter.ask(prompt);
        this.costTracker.track(modelId, adapter.getUsage());
        return { type: 'dialog', response };

      case 'main_sync':
        // 簡單任務 - 同步執行
        const result = await adapter.executeTask(prompt);
        this.costTracker.track(modelId, adapter.getUsage());
        return { type: 'task_completed', result };

      case 'battle_async':
        // 複雜任務 - 啟動戰鬥實例
        const battleId = await this.startBattle(prompt, analysis, modelId);
        return {
          type: 'battle_started',
          battleId,
          model: adapter.displayName
        };
    }
  }

  async startBattle(prompt: string, analysis: Analysis, modelId: string) {
    const battleId = this.battleQueue.generateBattleId();

    // 創建戰鬥實例（使用指定的模型）
    const adapter = this.modelRegistry.get(modelId);

    // 如果是 Claude/Gemini，需要新的實例
    const battleAdapter = await this.createBattleInstance(modelId);

    const battle = {
      id: battleId,
      prompt,
      analysis,
      modelId,
      adapter: battleAdapter,
      status: 'pending'
    };

    // 加入戰鬥隊列
    await this.battleQueue.addBattle(battle);

    return battleId;
  }

  async createBattleInstance(modelId: string) {
    // 創建新的模型實例用於戰鬥
    if (modelId === 'claude-sonnet') {
      return new ClaudeAdapter();
    } else if (modelId === 'gemini-pro') {
      return new GeminiAdapter();
    }
  }
}
```

---

## 實際使用場景

### 場景 1：成本優化模式

```
用戶配置: 成本優先

10:00 用戶: "什麼是閉包？"
      → 路由: Gemini (對話)
      → 成本: $0.001
      → 響應: < 1.5 秒

10:01 用戶: "修復登入 Bug"
      → 路由: Gemini (簡單任務)
      → 成本: $0.015
      → 時間: 20 秒

10:02 用戶: "重構整個認證系統"
      → 複雜度: 12
      → 路由: Gemini (戰鬥實例)
      → 成本: $0.18
      → 時間: 8 分鐘

今日總成本: $0.196 (相比全用 Claude 節省 65%)
```

### 場景 2：質量優先模式

```
用戶配置: 質量優先

所有任務都用 Claude Sonnet

10:00 對話: $0.003
10:01 簡單任務: $0.042
10:02 複雜任務: $0.52

今日總成本: $0.565
質量: ⭐⭐⭐⭐⭐
```

### 場景 3：平衡模式（推薦）

```
用戶配置: 平衡模式

10:00 對話 → Claude ($0.002)
      理由: 對話精準度重要

10:01 簡單任務 → Gemini ($0.015)
      理由: 簡單任務，成本優先

10:02 複雜任務 → Claude ($0.48)
      理由: 複雜任務，質量重要

10:03 圖片分析 → Gemini ($0.025)
      理由: 多模態任務，Gemini 更強

今日總成本: $0.522
成本節省: 8% (vs 全用 Claude)
質量保證: 關鍵任務用最好的模型
```

### 場景 4：多模態任務

```
10:00 用戶: "分析這張架構圖並生成代碼"
      → 檢測: 包含圖片
      → 自動路由: Gemini (多模態能力)
      → 步驟:
         1. Gemini 分析圖片
         2. 理解架構設計
         3. 生成對應代碼
      → 成本: $0.08
      → 如果用 Claude: $0.22 (節省 64%)
```

---

## 實作優先級

### Phase 2.5: 基礎多模型支持

- [ ] 模型抽象層接口定義
- [ ] ClaudeAdapter 實作
- [ ] GeminiAdapter 基礎實作
- [ ] ModelRegistry 基礎功能
- [ ] 簡單的模型選擇邏輯

### Phase 3: 完整整合

- [ ] MultiModelRouter 完整實作
- [ ] 智能選擇策略
- [ ] CostTracker 實作
- [ ] 用戶配置 UI
- [ ] 成本統計顯示
- [ ] 與戰鬥系統整合

### Phase 4: 優化和擴展

- [ ] OpenAI 適配器
- [ ] 更多模型支持
- [ ] 機器學習優化路由
- [ ] A/B 測試不同策略
- [ ] 成本預測

---

## 技術挑戰與解決方案

### 挑戰 1: CLI 格式不統一

**問題**: 不同 AI 的 CLI 格式可能完全不同

**解決方案**:
- 使用適配器模式統一接口
- 每個適配器負責轉換格式
- 上層系統只用統一接口

### 挑戰 2: 成本計算不精確

**問題**: Token 計算需要調用官方 API

**解決方案**:
1. 初期使用估算（字符數 / 4）
2. Phase 3 整合官方 tokenizer
3. 定期校準估算公式

### 挑戰 3: 模型切換延遲

**問題**: 啟動新模型需要時間

**解決方案**:
- 預啟動常用模型
- 延遲加載不常用模型
- 5 分鐘無活動自動關閉

### 挑戰 4: 質量差異

**問題**: 不同模型質量可能差異大

**解決方案**:
- 關鍵任務默認用最好的模型
- 用戶可以手動切換
- 收集反饋優化策略

---

## 總結

### 核心優勢

1. **成本優化**
   - ✅ 簡單任務用便宜模型（節省 60%+）
   - ✅ 複雜任務用最優模型（質量保證）
   - ✅ 用戶可控預算

2. **功能互補**
   - ✅ 多模態任務用 Gemini
   - ✅ 代碼生成用 Claude
   - ✅ 長上下文用 Gemini

3. **風險分散**
   - ✅ 不依賴單一供應商
   - ✅ 一個掛了可切換另一個
   - ✅ 靈活應對價格變化

4. **用戶友好**
   - ✅ 透明的成本顯示
   - ✅ 靈活的配置選項
   - ✅ 智能默認配置

### 與現有系統整合

- **Async-Battle-System-Design.md** → 戰鬥實例可用不同模型
- **Scene-System-Design.md** → 探索/戰鬥都支持多模型
- **Interactive-Battle-Events-Design.md** → 工具 RPG 化適用所有模型

完美兼容，無縫整合！✅

---

**版本**: v1.0
**最後更新**: 2026-02-05
