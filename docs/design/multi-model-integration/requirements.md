# Multi-Model Integration - Requirements

**Date**: 2026-02-05
**Version**: v1.0
**Based on**: Async-Battle-System-Design.md

---

## Core Concept

### Why Multi-Model?

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

### Design Principles

多模型系統設計遵循以下核心原則：

1. **模型無關（Model-Agnostic）**
   - 上層系統不關心底層用什麼模型
   - UI 展示統一體驗
   - 業務邏輯與模型解耦

2. **統一接口（Unified Interface）**
   - 所有模型通過相同接口調用
   - 標準化的輸入輸出格式
   - 一致的錯誤處理

3. **智能路由（Smart Routing）**
   - 自動選擇最適合的模型
   - 基於任務特性的決策
   - 可配置的路由策略

4. **用戶可控（User Control）**
   - 用戶可以手動選擇模型
   - 靈活的偏好配置
   - 透明的決策過程

5. **成本透明（Cost Transparency）**
   - 清晰顯示每個任務的成本
   - 實時成本統計
   - 預算控制機制

---

## System Architecture

### Multi-Model Layered Architecture

```
多模型分層架構:

┌─────────────────────────────────────────┐
│         UI Layer (React)                │
│                                         │
│  用戶看到統一的體驗                      │
│  不關心底層用什麼模型                    │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│       Bridge Layer (Node.js)            │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  MultiModelRouter (路由器)       │  │
│  │  - analyzePrompt()               │  │
│  │  - selectBestModel()             │  │
│  │  - execute()                     │  │
│  └─────────────┬────────────────────┘  │
│                │                        │
│  ┌─────────────▼────────────────────┐  │
│  │  ModelRegistry (註冊表)          │  │
│  │  - Claude Sonnet → ClaudeAdapter │  │
│  │  - Gemini Pro → GeminiAdapter    │  │
│  │  - GPT-4 → OpenAIAdapter         │  │
│  └─────────────┬────────────────────┘  │
│                │                        │
│  ┌─────────────▼────────────────────┐  │
│  │  ModelAbstraction (抽象層)       │  │
│  │  - ask(prompt)                   │  │
│  │  - executeTask(prompt)           │  │
│  │  - stream(prompt, callback)      │  │
│  │  - cancel()                      │  │
│  └─────────────┬────────────────────┘  │
│                │                        │
│       ┌────────┼────────┐              │
│       │        │        │              │
│       ▼        ▼        ▼              │
│  ┌────────┐┌────────┐┌────────┐       │
│  │Claude  ││Gemini  ││OpenAI  │       │
│  │Adapter ││Adapter ││Adapter │       │
│  └────┬───┘└────┬───┘└────┬───┘       │
└───────┼─────────┼─────────┼───────────┘
        │         │         │
        ▼         ▼         ▼
   ┌────────┐┌────────┐┌────────┐
   │Claude  ││Gemini  ││OpenAI  │
   │  CLI   ││  CLI   ││  CLI   │
   └────────┘└────────┘└────────┘
```

---

## Model Abstraction Layer

### Unified Interface Definition

所有模型適配器必須實現以下統一接口：

```typescript
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

  // 核心方法
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
```

### Usage Statistics

```typescript
interface Usage {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;  // 美元
}
```

### Execution Result

```typescript
interface Result {
  success: boolean;
  output: string;
  usage: Usage;
  duration: number;  // 毫秒
  error?: string;
}
```

---

## Model Registry

### Registration Requirements

**模型註冊表負責**:
- 註冊所有可用模型
- 管理模型生命週期（啟動/停止）
- 提供模型查詢接口
- 追蹤活躍模型狀態

**核心功能**:
```typescript
interface IModelRegistry {
  // 註冊模型
  register(adapter: IModelAdapter): void;

  // 啟動模型
  activate(modelId: string): Promise<IModelAdapter>;

  // 停用模型
  deactivate(modelId: string): Promise<void>;

  // 獲取模型
  get(modelId: string): IModelAdapter;

  // 列出所有模型
  list(): IModelAdapter[];

  // 列出活躍模型
  listActive(): IModelAdapter[];
}
```

---

## Multi-Model Router

### Routing Strategy

路由器根據以下因素選擇模型：

**1. 任務特性分析**:
- 任務類型（對話 vs 任務）
- 複雜度（1-12 分）
- 是否包含多模態內容（圖片、視頻）
- 預期上下文長度

**2. 用戶偏好**:
- **Balanced（平衡）**: 對話和複雜任務用 Claude，簡單任務用 Gemini
- **Quality（質量）**: 所有任務都用 Claude Sonnet
- **Cost（成本）**: 盡可能使用 Gemini Pro

**3. 模型能力匹配**:
- 多模態任務 → Gemini（支持圖片/視頻）
- 長上下文任務 → Gemini（2M context）
- 代碼生成任務 → Claude（質量最佳）
- 簡單對話 → Gemini（成本低）

### Routing Decision Table

| 場景 | 默認模型 | 原因 | 可替代 |
|------|---------|------|--------|
| 對話問答 | Claude | 精準度高 | Gemini (成本) |
| 代碼生成 | Claude | 質量最佳 | - |
| 簡單修復 | Gemini | 成本低 | Claude (質量) |
| 複雜重構 | Claude | 推理深度 | - |
| 多模態任務 | Gemini | 支持圖片/視頻 | - |
| 長上下文 | Gemini | 2M context | - |
| 成本優先 | Gemini | 價格便宜 60% | - |

### Selection Logic

```
選擇流程:

1. 檢查特殊要求
   ├─ 有圖片/視頻? → Gemini (multimodal)
   ├─ 超長上下文? → Gemini (2M context)
   └─ 都沒有 → 繼續

2. 根據用戶偏好
   ├─ Cost 模式 → Gemini
   ├─ Quality 模式 → Claude
   └─ Balanced 模式 → 繼續

3. 根據任務類型 (Balanced)
   ├─ Dialog → Claude
   ├─ Complexity < 8 → Gemini
   └─ Complexity >= 8 → Claude
```

---

## Cost Management

### Cost Tracking Requirements

**成本追蹤系統需要**:
- 實時記錄每次 API 調用的 token 使用
- 計算估算成本（基於 token 價格）
- 按模型統計使用量
- 按時間段統計（今日、本週、本月）
- 成本預算警告

### Cost Data Structure

```typescript
interface CostSession {
  id: number;
  startTime: number;
  models: {
    [modelId: string]: {
      calls: number;
      totalTokens: number;
      inputTokens: number;
      outputTokens: number;
      totalCost: number;
    }
  };
  totalCost: number;
}
```

### Budget Control

**預算控制機制**:
```typescript
interface BudgetConfig {
  dailyBudget: number;        // 每日預算（美元）
  warningThreshold: number;   // 警告閾值（百分比，如 0.8 = 80%）
  exceedAction: 'stop' | 'switch' | 'warn';

  // 超出預算時的行為
  // - stop: 停止使用
  // - switch: 切換到便宜模型
  // - warn: 僅警告，繼續使用
}
```

### Cost Estimation

**成本估算要求**:
- 在執行任務前估算成本
- 顯示給用戶確認（如果超過閾值）
- Token 計算方法：
  - 初期：字符數 / 4（簡化估算）
  - Phase 3：整合官方 tokenizer（精確計算）

---

## User Preferences

### Preference Modes

**1. Balanced Mode（平衡模式）** - 推薦
- 對話和複雜任務用 Claude
- 簡單任務用 Gemini
- 預估每日成本: ~$0.50
- 適合：大多數用戶

**2. Quality Mode（質量優先）**
- 所有任務都用 Claude Sonnet
- 預估每日成本: ~$0.80
- 適合：對質量要求極高的場景

**3. Cost Mode（成本優先）**
- 盡可能使用 Gemini Pro
- 預估每日成本: ~$0.25
- 適合：預算有限的用戶

**4. Custom Mode（自定義配置）**
- 用戶手動配置每種任務類型使用的模型
- 靈活度最高
- 適合：高級用戶

### Custom Configuration Options

```typescript
interface CustomConfig {
  dialog: string;          // 對話模式使用的模型
  simpleTask: string;      // 簡單任務 (complexity 3-7)
  complexTask: string;     // 複雜任務 (complexity 8+)
  multimodal: string;      // 多模態任務 (圖片/視頻)
}
```

---

## Model Specifications

### Claude Sonnet 4.5

**基本信息**:
- Model ID: `claude-sonnet`
- Provider: Anthropic
- Icon: 🤖

**能力**:
- ✅ Dialog（對話）
- ✅ Code Generation（代碼生成）
- ✅ Multimodal（多模態）
- ✅ Long Context（長上下文）
- ✅ Tool Use（工具調用）

**定價**:
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens

**性能**:
- 平均延遲: 2000ms
- 最大並行: 5

**適合場景**:
- 複雜代碼生成
- 需要精準對話
- 深度推理任務

### Gemini 2.0 Pro

**基本信息**:
- Model ID: `gemini-pro`
- Provider: Google
- Icon: ✨

**能力**:
- ✅ Dialog（對話）
- ✅ Code Generation（代碼生成）
- ✅ Multimodal（多模態，圖片/視頻）
- ✅ Long Context（2M context window）
- ✅ Tool Use（工具調用）

**定價**:
- Input: $1.25 per 1M tokens（便宜 60%）
- Output: $5 per 1M tokens

**性能**:
- 平均延遲: 1500ms（稍快）
- 最大並行: 10

**適合場景**:
- 多模態任務（圖片、視頻分析）
- 超長上下文
- 簡單到中等複雜度任務
- 成本敏感場景

### GPT-4（未來支持）

**基本信息**:
- Model ID: `gpt-4`
- Provider: OpenAI
- Icon: 🔥

**能力**:
- ✅ Dialog
- ✅ Code Generation
- ⚠️ Multimodal（有限支持）
- ✅ Tool Use

**定價**:
- Input: $10 per 1M tokens
- Output: $30 per 1M tokens

---

## Integration with Battle System

### Async Battle Integration

**整合要求**:
- 戰鬥實例可以使用不同的模型
- SmartRouter 分析後，路由到合適的模型
- 每個戰鬥實例獨立追蹤成本

**整合流程**:
```
1. 用戶輸入 Prompt
2. SmartRouter 分析複雜度
3. MultiModelRouter 選擇模型
4. 如果是異步戰鬥:
   4.1 創建戰鬥實例
   4.2 使用選定的模型
   4.3 追蹤成本
   4.4 返回戰鬥ID
5. 如果是同步任務:
   5.1 直接執行
   5.2 追蹤成本
   5.3 返回結果
```

### Scene System Integration

**探索模式**:
- 對話使用配置的對話模型（默認 Claude）
- 資源恢復期間不消耗 token

**戰鬥模式**:
- 複雜任務根據路由策略選擇模型
- 戰鬥中可以看到使用的模型
- 戰鬥結束顯示成本統計

---

## Technical Challenges

### Challenge 1: CLI 格式不統一

**問題**: 不同 AI 的 CLI 格式可能完全不同

**解決方案**:
- 使用適配器模式統一接口
- 每個適配器負責轉換格式
- 上層系統只用統一接口

### Challenge 2: 成本計算不精確

**問題**: Token 計算需要調用官方 API

**解決方案**:
1. 初期使用估算（字符數 / 4）
2. Phase 3 整合官方 tokenizer
3. 定期校準估算公式

### Challenge 3: 模型切換延遲

**問題**: 啟動新模型需要時間

**解決方案**:
- 預啟動常用模型
- 延遲加載不常用模型
- 5 分鐘無活動自動關閉

### Challenge 4: 質量差異

**問題**: 不同模型質量可能差異大

**解決方案**:
- 關鍵任務默認用最好的模型
- 用戶可以手動切換
- 收集反饋優化策略

---

## Implementation Priority

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

## Use Case Scenarios

### Scenario 1: 成本優化模式

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

今日總成本: $0.196
節省: 65% (vs 全用 Claude)
```

### Scenario 2: 質量優先模式

```
用戶配置: 質量優先

所有任務都用 Claude Sonnet

10:00 對話: $0.003
10:01 簡單任務: $0.042
10:02 複雜任務: $0.52

今日總成本: $0.565
質量: ⭐⭐⭐⭐⭐
```

### Scenario 3: 平衡模式（推薦）

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

### Scenario 4: 多模態任務

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

## Summary

### Core Advantages

**1. 成本優化**
- ✅ 簡單任務用便宜模型（節省 60%+）
- ✅ 複雜任務用最優模型（質量保證）
- ✅ 用戶可控預算

**2. 功能互補**
- ✅ 多模態任務用 Gemini
- ✅ 代碼生成用 Claude
- ✅ 長上下文用 Gemini

**3. 風險分散**
- ✅ 不依賴單一供應商
- ✅ 一個掛了可切換另一個
- ✅ 靈活應對價格變化

**4. 用戶友好**
- ✅ 透明的成本顯示
- ✅ 靈活的配置選項
- ✅ 智能默認配置

### Integration Summary

- **Async-Battle-System** → 戰鬥實例可用不同模型
- **Scene-System** → 探索/戰鬥都支持多模型
- **Interactive-Battle-Events** → 工具 RPG 化適用所有模型

完美兼容，無縫整合！✅

---

**Version**: v1.0
**Last Updated**: 2026-02-05
