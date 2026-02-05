# Multi-Model Integration - Implementation

## Architecture Overview

```
實作架構:

rpg-config/
└─ model-config.json          # 模型配置

bridge/model/
├─ IModelAdapter.ts            # 統一接口定義
├─ ClaudeAdapter.js            # Claude 適配器
├─ GeminiAdapter.js            # Gemini 適配器
├─ OpenAIAdapter.js            # OpenAI 適配器（未來）
├─ ModelRegistry.js            # 模型註冊表
├─ MultiModelRouter.js         # 多模型路由器
└─ CostTracker.js              # 成本追蹤器

bridge/battle/
└─ IntegratedBattleSystem.js   # 整合戰鬥系統

ui/src/components/Model/
├─ ModelSelector.tsx           # 模型選擇器
├─ CostPanel.tsx               # 成本面板
├─ ModelConfigPanel.tsx        # 配置面板
└─ ModelStatusBar.tsx          # 狀態欄

ui/src/store/
└─ modelSlice.ts               # 模型 Redux Store
```

---

## Interface Definitions

### IModelAdapter Interface

**File**: `bridge/model/IModelAdapter.ts`

```typescript
/**
 * 所有模型適配器必須實現此接口
 */
export interface IModelAdapter {
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

  // 生命週期方法
  start(): Promise<void>;
  stop(): Promise<void>;

  // 核心方法
  ask(prompt: string): Promise<string>;
  executeTask(prompt: string): Promise<Result>;
  stream(prompt: string, callback: (chunk: string) => void): Promise<void>;
  cancel(): void;

  // 成本追蹤
  getUsage(): Usage;
  estimateCost(prompt: string): number;
}

export interface Usage {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;  // 美元
}

export interface Result {
  success: boolean;
  output: string;
  usage: Usage;
  duration: number;  // 毫秒
  error?: string;
}
```

---

## Model Adapters

### ClaudeAdapter

**File**: `bridge/model/ClaudeAdapter.js`

```javascript
const { spawn } = require('child_process');
const EventEmitter = require('events');

class ClaudeAdapter extends EventEmitter {
  constructor() {
    super();

    // 基本資訊
    this.modelId = 'claude-sonnet';
    this.displayName = 'Claude Sonnet 4.5';
    this.icon = '🤖';
    this.provider = 'anthropic';

    // 能力
    this.capabilities = {
      dialog: true,
      codeGeneration: true,
      multimodal: true,
      longContext: true,
      toolUse: true
    };

    // 定價
    this.pricing = {
      inputTokens: 0.003,   // $3 per 1M tokens
      outputTokens: 0.015   // $15 per 1M tokens
    };

    // 性能
    this.performance = {
      avgLatency: 2000,
      maxConcurrent: 5
    };

    // 內部狀態
    this.process = null;
    this.currentPromise = null;
    this.usage = {
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0
    };
  }

  /**
   * 啟動 Claude CLI
   */
  async start() {
    if (this.process) {
      console.log('⚠️ Claude CLI already running');
      return;
    }

    this.process = spawn('claude', ['code'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.process.stdout.on('data', (data) => {
      this.handleOutput(data);
    });

    this.process.stderr.on('data', (data) => {
      console.error(`Claude stderr: ${data}`);
    });

    this.process.on('close', (code) => {
      console.log(`Claude CLI exited with code ${code}`);
      this.process = null;
    });

    // 等待啟動完成
    await this.waitForReady();
    console.log('✅ Claude CLI 已啟動');
  }

  /**
   * 停止 Claude CLI
   */
  async stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
      console.log('🛑 Claude CLI 已停止');
    }
  }

  /**
   * 對話
   */
  async ask(prompt) {
    if (!this.process) {
      throw new Error('Claude CLI not started');
    }

    return new Promise((resolve, reject) => {
      this.currentPromise = { resolve, reject };
      this.process.stdin.write(prompt + '\n');

      // 超時處理
      setTimeout(() => {
        if (this.currentPromise) {
          this.currentPromise.reject(new Error('Timeout'));
          this.currentPromise = null;
        }
      }, 60000); // 60秒超時
    });
  }

  /**
   * 執行任務
   */
  async executeTask(prompt) {
    const startTime = Date.now();

    try {
      const output = await this.ask(prompt);
      const duration = Date.now() - startTime;
      const usage = this.trackUsage(prompt, output);

      return {
        success: true,
        output,
        usage,
        duration
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        usage: this.getUsage(),
        duration: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * 流式輸出
   */
  async stream(prompt, callback) {
    if (!this.process) {
      throw new Error('Claude CLI not started');
    }

    this.onStreamChunk = callback;
    this.process.stdin.write(prompt + '\n');
  }

  /**
   * 取消當前任務
   */
  cancel() {
    if (this.currentPromise) {
      this.currentPromise.reject(new Error('Cancelled'));
      this.currentPromise = null;
    }

    // 發送取消信號
    if (this.process) {
      this.process.stdin.write('\x03'); // Ctrl+C
    }
  }

  /**
   * 處理輸出
   */
  handleOutput(data) {
    const output = data.toString();

    // 流式輸出
    if (this.onStreamChunk) {
      this.onStreamChunk(output);
    }

    // 完整響應
    if (this.currentPromise) {
      this.currentPromise.resolve(output);
      this.currentPromise = null;
    }
  }

  /**
   * 追蹤使用量
   */
  trackUsage(input, output) {
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

  /**
   * 估算成本
   */
  estimateCost(prompt) {
    const inputTokens = Math.ceil(prompt.length / 4);
    // 假設輸出是輸入的 2 倍
    const outputTokens = inputTokens * 2;

    return (
      (inputTokens / 1000) * this.pricing.inputTokens +
      (outputTokens / 1000) * this.pricing.outputTokens
    );
  }

  /**
   * 獲取使用統計
   */
  getUsage() {
    return { ...this.usage };
  }

  /**
   * 等待 CLI 準備就緒
   */
  async waitForReady() {
    return new Promise((resolve) => {
      setTimeout(resolve, 1000); // 簡化版
    });
  }
}

module.exports = ClaudeAdapter;
```

### GeminiAdapter

**File**: `bridge/model/GeminiAdapter.js`

```javascript
const { spawn } = require('child_process');
const EventEmitter = require('events');

class GeminiAdapter extends EventEmitter {
  constructor() {
    super();

    // 基本資訊
    this.modelId = 'gemini-pro';
    this.displayName = 'Gemini 2.0 Pro';
    this.icon = '✨';
    this.provider = 'google';

    // 能力
    this.capabilities = {
      dialog: true,
      codeGeneration: true,
      multimodal: true,      // 支持圖片、視頻
      longContext: true,     // 2M context window
      toolUse: true
    };

    // 定價（更便宜）
    this.pricing = {
      inputTokens: 0.00125,  // $1.25 per 1M tokens
      outputTokens: 0.005    // $5 per 1M tokens
    };

    // 性能（稍快）
    this.performance = {
      avgLatency: 1500,
      maxConcurrent: 10
    };

    // 內部狀態
    this.process = null;
    this.currentPromise = null;
    this.usage = {
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0
    };
  }

  /**
   * 啟動 Gemini CLI
   */
  async start() {
    if (this.process) {
      console.log('⚠️ Gemini CLI already running');
      return;
    }

    // 假設 Gemini 有類似的 CLI 工具
    this.process = spawn('gemini', ['cli'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.process.stdout.on('data', (data) => {
      this.handleOutput(data);
    });

    this.process.stderr.on('data', (data) => {
      console.error(`Gemini stderr: ${data}`);
    });

    this.process.on('close', (code) => {
      console.log(`Gemini CLI exited with code ${code}`);
      this.process = null;
    });

    await this.waitForReady();
    console.log('✅ Gemini CLI 已啟動');
  }

  /**
   * 停止 Gemini CLI
   */
  async stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
      console.log('🛑 Gemini CLI 已停止');
    }
  }

  /**
   * 對話（Gemini 特定格式）
   */
  async ask(prompt) {
    if (!this.process) {
      throw new Error('Gemini CLI not started');
    }

    return new Promise((resolve, reject) => {
      this.currentPromise = { resolve, reject };

      // Gemini CLI 使用 JSON 格式
      this.process.stdin.write(JSON.stringify({
        type: 'chat',
        message: prompt
      }) + '\n');

      setTimeout(() => {
        if (this.currentPromise) {
          this.currentPromise.reject(new Error('Timeout'));
          this.currentPromise = null;
        }
      }, 60000);
    });
  }

  /**
   * 執行任務
   */
  async executeTask(prompt) {
    const startTime = Date.now();

    try {
      const output = await this.ask(prompt);
      const duration = Date.now() - startTime;
      const usage = this.trackUsage(prompt, output);

      return {
        success: true,
        output,
        usage,
        duration
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        usage: this.getUsage(),
        duration: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * 流式輸出
   */
  async stream(prompt, callback) {
    if (!this.process) {
      throw new Error('Gemini CLI not started');
    }

    this.onStreamChunk = callback;

    this.process.stdin.write(JSON.stringify({
      type: 'stream',
      message: prompt
    }) + '\n');
  }

  /**
   * 取消當前任務
   */
  cancel() {
    if (this.currentPromise) {
      this.currentPromise.reject(new Error('Cancelled'));
      this.currentPromise = null;
    }

    if (this.process) {
      this.process.stdin.write(JSON.stringify({
        type: 'cancel'
      }) + '\n');
    }
  }

  /**
   * 處理輸出
   */
  handleOutput(data) {
    const output = data.toString();

    // 嘗試解析 JSON
    try {
      const json = JSON.parse(output);

      if (json.type === 'chunk') {
        // 流式輸出
        if (this.onStreamChunk) {
          this.onStreamChunk(json.content);
        }
      } else if (json.type === 'complete') {
        // 完整響應
        if (this.currentPromise) {
          this.currentPromise.resolve(json.content);
          this.currentPromise = null;
        }
      }
    } catch (e) {
      // 非 JSON 輸出，直接處理
      if (this.currentPromise) {
        this.currentPromise.resolve(output);
        this.currentPromise = null;
      }
    }
  }

  /**
   * 追蹤使用量
   */
  trackUsage(input, output) {
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

  /**
   * 估算成本
   */
  estimateCost(prompt) {
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = inputTokens * 2;

    return (
      (inputTokens / 1000) * this.pricing.inputTokens +
      (outputTokens / 1000) * this.pricing.outputTokens
    );
  }

  /**
   * 獲取使用統計
   */
  getUsage() {
    return { ...this.usage };
  }

  /**
   * 等待準備就緒
   */
  async waitForReady() {
    return new Promise((resolve) => {
      setTimeout(resolve, 800);
    });
  }
}

module.exports = GeminiAdapter;
```

---

## Model Registry

**File**: `bridge/model/ModelRegistry.js`

```javascript
class ModelRegistry {
  constructor() {
    this.models = new Map();       // 所有註冊的模型
    this.activeModels = new Map(); // 活躍的模型
  }

  /**
   * 註冊模型
   */
  register(adapter) {
    this.models.set(adapter.modelId, adapter);
    console.log(`✅ 註冊模型: ${adapter.displayName}`);
  }

  /**
   * 啟動模型
   */
  async activate(modelId) {
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

  /**
   * 停用模型
   */
  async deactivate(modelId) {
    const adapter = this.activeModels.get(modelId);

    if (adapter) {
      await adapter.stop();
      this.activeModels.delete(modelId);
    }
  }

  /**
   * 獲取模型
   */
  get(modelId) {
    return this.activeModels.get(modelId) || this.models.get(modelId);
  }

  /**
   * 列出所有模型
   */
  list() {
    return Array.from(this.models.values());
  }

  /**
   * 列出活躍模型
   */
  listActive() {
    return Array.from(this.activeModels.values());
  }

  /**
   * 檢查模型是否活躍
   */
  isActive(modelId) {
    return this.activeModels.has(modelId);
  }
}

module.exports = ModelRegistry;
```

---

## Multi-Model Router

**File**: `bridge/model/MultiModelRouter.js`

```javascript
class MultiModelRouter {
  constructor(registry) {
    this.registry = registry;

    // 默認配置
    this.config = {
      dialog: 'claude-sonnet',
      simpleTask: 'gemini-pro',
      complexTask: 'claude-sonnet',
      multimodal: 'gemini-pro',
      costSaving: 'gemini-pro'
    };

    // 用戶偏好
    this.userPreference = 'balanced'; // balanced, quality, cost
  }

  /**
   * 選擇最佳模型
   */
  selectBestModel(prompt, analysis) {
    // 1. 檢查特殊要求
    if (analysis.hasImages || analysis.hasVideo) {
      return this.config.multimodal;
    }

    // 2. 根據用戶偏好
    if (this.userPreference === 'cost') {
      return this.config.costSaving;
    }

    if (this.userPreference === 'quality') {
      return 'claude-sonnet';
    }

    // 3. 根據任務類型（balanced 模式）
    if (analysis.type === 'dialog') {
      return this.config.dialog;
    }

    // 根據複雜度
    if (analysis.complexity < 8) {
      return this.config.simpleTask;
    }

    return this.config.complexTask;
  }

  /**
   * 執行路由
   */
  async route(prompt, analysis) {
    // 選擇模型
    const modelId = this.selectBestModel(prompt, analysis);

    // 激活模型
    const adapter = await this.registry.activate(modelId);

    // 估算成本
    const estimatedCost = adapter.estimateCost(prompt);

    console.log(`📍 路由到: ${adapter.displayName}`);
    console.log(`💰 估算成本: $${estimatedCost.toFixed(4)}`);

    // 執行
    if (analysis.type === 'dialog') {
      return await adapter.ask(prompt);
    } else {
      return await adapter.executeTask(prompt);
    }
  }

  /**
   * 用戶配置模型
   */
  setModelForType(type, modelId) {
    this.config[type] = modelId;
  }

  /**
   * 設置用戶偏好
   */
  setUserPreference(preference) {
    if (!['balanced', 'quality', 'cost'].includes(preference)) {
      throw new Error('Invalid preference');
    }

    this.userPreference = preference;
    console.log(`✅ 用戶偏好已設置: ${preference}`);
  }

  /**
   * 獲取配置
   */
  getConfig() {
    return {
      ...this.config,
      userPreference: this.userPreference
    };
  }
}

module.exports = MultiModelRouter;
```

---

## Cost Tracker

**File**: `bridge/model/CostTracker.js`

```javascript
class CostTracker {
  constructor() {
    this.sessions = [];
    this.currentSession = this.createSession();
  }

  /**
   * 創建新會話
   */
  createSession() {
    return {
      id: Date.now(),
      startTime: Date.now(),
      models: {},
      totalCost: 0
    };
  }

  /**
   * 記錄使用
   */
  track(modelId, usage) {
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

  /**
   * 獲取今日統計
   */
  getTodayStats() {
    return this.currentSession;
  }

  /**
   * 獲取模型對比
   */
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

  /**
   * 成本警告
   */
  checkBudget(dailyBudget) {
    const current = this.currentSession.totalCost;

    if (current > dailyBudget) {
      return {
        exceeded: true,
        current,
        budget: dailyBudget,
        percentage: (current / dailyBudget) * 100
      };
    }

    if (current > dailyBudget * 0.8) {
      return {
        warning: true,
        current,
        budget: dailyBudget,
        percentage: (current / dailyBudget) * 100
      };
    }

    return { exceeded: false, warning: false };
  }

  /**
   * 計算節省金額
   */
  calculateSavings(registry) {
    // 假設全用 Claude 的成本
    const claudeAdapter = registry.get('claude-sonnet');
    if (!claudeAdapter) return 0;

    let hypotheticalCost = 0;

    for (const [modelId, stats] of Object.entries(this.currentSession.models)) {
      // 使用 Claude 的價格重新計算
      const cost =
        (stats.inputTokens / 1000) * claudeAdapter.pricing.inputTokens +
        (stats.outputTokens / 1000) * claudeAdapter.pricing.outputTokens;

      hypotheticalCost += cost;
    }

    return hypotheticalCost - this.currentSession.totalCost;
  }
}

module.exports = CostTracker;
```

---

## Integrated Battle System

**File**: `bridge/battle/IntegratedBattleSystem.js`

```javascript
const ModelRegistry = require('../model/ModelRegistry');
const MultiModelRouter = require('../model/MultiModelRouter');
const CostTracker = require('../model/CostTracker');
const ClaudeAdapter = require('../model/ClaudeAdapter');
const GeminiAdapter = require('../model/GeminiAdapter');

class IntegratedBattleSystem {
  constructor() {
    // 模型系統
    this.modelRegistry = new ModelRegistry();
    this.modelRouter = new MultiModelRouter(this.modelRegistry);
    this.costTracker = new CostTracker();

    // 戰鬥系統（原有）
    this.smartRouter = null; // 需要從原有系統引入
    this.mainCLI = null;
    this.battleQueue = null;
  }

  /**
   * 初始化
   */
  async initialize() {
    // 註冊模型
    this.modelRegistry.register(new ClaudeAdapter());
    this.modelRegistry.register(new GeminiAdapter());

    // 啟動默認模型
    await this.modelRegistry.activate('claude-sonnet');
    await this.modelRegistry.activate('gemini-pro');

    console.log('✅ 多模型系統已啟動');
  }

  /**
   * 處理用戶 Prompt
   */
  async handleUserPrompt(prompt) {
    // 1. 分析 Prompt
    const analysis = this.smartRouter.analyzePrompt(prompt);

    // 2. 選擇最佳模型
    const modelId = this.modelRouter.selectBestModel(prompt, analysis);
    const adapter = this.modelRegistry.get(modelId);

    // 3. 根據複雜度路由
    switch (analysis.route) {
      case 'dialog':
        // 對話
        const response = await adapter.ask(prompt);
        const usage = adapter.getUsage();
        this.costTracker.track(modelId, usage);

        return { type: 'dialog', response };

      case 'main_sync':
        // 簡單任務
        const result = await adapter.executeTask(prompt);
        this.costTracker.track(modelId, result.usage);

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

  /**
   * 啟動戰鬥
   */
  async startBattle(prompt, analysis, modelId) {
    const battleId = this.generateBattleId();

    // 創建戰鬥適配器
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

  /**
   * 創建戰鬥實例
   */
  async createBattleInstance(modelId) {
    // 為戰鬥創建新的模型實例
    if (modelId === 'claude-sonnet') {
      const adapter = new ClaudeAdapter();
      await adapter.start();
      return adapter;
    } else if (modelId === 'gemini-pro') {
      const adapter = new GeminiAdapter();
      await adapter.start();
      return adapter;
    }
  }

  /**
   * 獲取成本統計
   */
  getCostStats() {
    return {
      today: this.costTracker.getTodayStats(),
      comparison: this.costTracker.getModelComparison(),
      savings: this.costTracker.calculateSavings(this.modelRegistry)
    };
  }

  /**
   * 設置用戶偏好
   */
  setPreference(preference) {
    this.modelRouter.setUserPreference(preference);
  }

  /**
   * 生成戰鬥 ID
   */
  generateBattleId() {
    return `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = IntegratedBattleSystem;
```

---

## React Components

### ModelSelector Component

**File**: `ui/src/components/Model/ModelSelector.tsx`

```tsx
import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setActiveModel } from '../../store/modelSlice';

interface ModelSelectorProps {
  taskType: 'dialog' | 'simpleTask' | 'complexTask' | 'multimodal';
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ taskType }) => {
  const dispatch = useAppDispatch();
  const { models, activeModel } = useAppSelector(state => state.model);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (modelId: string) => {
    dispatch(setActiveModel({ taskType, modelId }));
    setIsOpen(false);
  };

  return (
    <div className="model-dropdown">
      <button
        className="dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="selected-model">
          <span className="icon">{activeModel.icon}</span>
          <span className="name">{activeModel.displayName}</span>
        </div>
        <span className="arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          {models.map(model => (
            <div
              key={model.modelId}
              className={`model-option ${model.modelId === activeModel.modelId ? 'selected' : ''}`}
              onClick={() => handleSelect(model.modelId)}
            >
              <span className="icon">{model.icon}</span>
              <div className="info">
                <div className="name">{model.displayName}</div>
                <div className="features">{model.features}</div>
                <div className="pricing">
                  ${model.pricing.inputTokens}/${model.pricing.outputTokens} per 1M tokens
                </div>
              </div>
              {model.modelId === activeModel.modelId && (
                <span className="check">✓</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
```

### CostPanel Component

**File**: `ui/src/components/Model/CostPanel.tsx`

```tsx
import React from 'react';
import { useAppSelector } from '../../store/hooks';

const CostPanel: React.FC = () => {
  const { todayStats, budget } = useAppSelector(state => state.model.cost);

  const usagePercentage = (todayStats.totalCost / budget) * 100;

  return (
    <div className="cost-panel">
      <h3>💰 成本統計（今日）</h3>

      <div className="cost-total">${todayStats.totalCost.toFixed(2)}</div>
      <div className="cost-budget">預算: ${budget.toFixed(2)}</div>

      <div className="usage-bar">
        <div
          className={`usage-fill ${usagePercentage > 80 ? 'warning' : ''} ${usagePercentage > 100 ? 'danger' : ''}`}
          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
        />
      </div>

      <div className="model-stats">
        <h4>模型使用統計</h4>
        {Object.entries(todayStats.models).map(([modelId, stats]) => (
          <div key={modelId} className={`model-stat-card ${modelId}`}>
            <div className="model-name">{stats.displayName}</div>
            <div className="model-metrics">
              <div>調用次數: {stats.calls}</div>
              <div>成本: ${stats.totalCost.toFixed(3)}</div>
              <div>總 Tokens: {stats.totalTokens.toLocaleString()}</div>
              <div>平均: ${stats.avgCostPerCall.toFixed(4)}/次</div>
            </div>
          </div>
        ))}
      </div>

      {todayStats.savings > 0 && (
        <div className="cost-savings">
          <h4>成本節省</h4>
          <div>如果全用 Claude: ${todayStats.hypotheticalCost.toFixed(2)}</div>
          <div>實際成本: ${todayStats.totalCost.toFixed(2)}</div>
          <div className="savings-amount">
            節省: ${todayStats.savings.toFixed(2)} ({todayStats.savingsPercentage.toFixed(0)}%)
          </div>
        </div>
      )}
    </div>
  );
};

export default CostPanel;
```

---

## Redux Store

**File**: `ui/src/store/modelSlice.ts`

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ModelState {
  models: Model[];
  activeModels: Record<string, string>; // taskType -> modelId
  preference: 'balanced' | 'quality' | 'cost';
  cost: {
    todayStats: CostStats;
    budget: number;
  };
}

const initialState: ModelState = {
  models: [],
  activeModels: {
    dialog: 'claude-sonnet',
    simpleTask: 'gemini-pro',
    complexTask: 'claude-sonnet',
    multimodal: 'gemini-pro'
  },
  preference: 'balanced',
  cost: {
    todayStats: {
      totalCost: 0,
      models: {}
    },
    budget: 5.0
  }
};

const modelSlice = createSlice({
  name: 'model',
  initialState,
  reducers: {
    setModels(state, action: PayloadAction<Model[]>) {
      state.models = action.payload;
    },

    setActiveModel(state, action: PayloadAction<{ taskType: string; modelId: string }>) {
      state.activeModels[action.payload.taskType] = action.payload.modelId;
    },

    setPreference(state, action: PayloadAction<'balanced' | 'quality' | 'cost'>) {
      state.preference = action.payload;
    },

    updateCostStats(state, action: PayloadAction<CostStats>) {
      state.cost.todayStats = action.payload;
    },

    setBudget(state, action: PayloadAction<number>) {
      state.cost.budget = action.payload;
    }
  }
});

export const {
  setModels,
  setActiveModel,
  setPreference,
  updateCostStats,
  setBudget
} = modelSlice.actions;

export default modelSlice.reducer;
```

---

## Summary

多模型整合實作重點：

**✅ 統一抽象層**:
- IModelAdapter 接口定義
- ClaudeAdapter 和 GeminiAdapter 實作
- 模型無關的上層系統

**✅ 智能路由**:
- MultiModelRouter 智能選擇
- 基於任務特性和用戶偏好
- 成本和質量平衡

**✅ 成本追蹤**:
- CostTracker 實時監控
- Token 和成本計算
- 預算警告機制

**✅ 無縫整合**:
- IntegratedBattleSystem 整合戰鬥系統
- 支持同步和異步任務
- React 組件完整實作

---

**Version**: v1.0
**Last Updated**: 2026-02-05
