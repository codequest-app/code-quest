# Multi-Model Integration - UI Design

## Model Configuration Screen

### Main Configuration Panel

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

### Preference Mode Selection

**Radio Button Styles**:
```css
.preference-option {
  border: 2px solid #424242;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.preference-option:hover {
  border-color: #2196f3;
  background: rgba(33, 150, 243, 0.05);
}

.preference-option.selected {
  border-color: #2196f3;
  background: rgba(33, 150, 243, 0.1);
  box-shadow: 0 0 12px rgba(33, 150, 243, 0.3);
}

.preference-label {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
}

.preference-description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.preference-cost {
  font-size: 13px;
  color: #4caf50;
  font-weight: 500;
}
```

---

## Cost Statistics Display

### Main Cost Panel

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

### Cost Breakdown Chart

```css
.cost-panel {
  background: linear-gradient(135deg, #1e3a5f, #2d5a88);
  border: 2px solid #4a90e2;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.cost-total {
  font-size: 32px;
  font-weight: 700;
  color: #4caf50;
  text-align: center;
  margin-bottom: 16px;
}

.cost-budget {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  margin-bottom: 12px;
}

.usage-bar {
  width: 100%;
  height: 24px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
}

.usage-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.5s ease;
}

.usage-fill.warning {
  background: linear-gradient(90deg, #ff9800, #ffc107);
}

.usage-fill.danger {
  background: linear-gradient(90deg, #f44336, #ff5722);
}
```

### Model Usage Stats Card

```css
.model-stat-card {
  background: rgba(0, 0, 0, 0.3);
  border-left: 4px solid #2196f3;
  padding: 12px 16px;
  margin-bottom: 12px;
  border-radius: 4px;
}

.model-stat-card.claude {
  border-left-color: #9c27b0;
}

.model-stat-card.gemini {
  border-left-color: #4caf50;
}

.model-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.model-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.metric-label {
  font-weight: 500;
}

.metric-value {
  color: #fff;
  font-weight: 600;
}
```

---

## Model Selector Dropdown

### Dropdown Component

```
┌─────────────────────────────────────┐
│ [Claude Sonnet ▼]                   │
│                                     │
│ 當前選擇:                            │
│ 🤖 Claude Sonnet 4.5                │
│ 💰 成本: 中等                        │
│ ⚡ 質量: ⭐⭐⭐⭐⭐                   │
└─────────────────────────────────────┘

下拉展開時:

┌─────────────────────────────────────┐
│ 🤖 Claude Sonnet 4.5        [✓]     │
│ ⚡ 精準度高 | 代碼生成優秀          │
│ 💰 $3/$15 per 1M tokens            │
│                                     │
│ ✨ Gemini 2.0 Pro          [ ]     │
│ ⚡ 速度快 | 多模態 | 長上下文       │
│ 💰 $1.25/$5 per 1M (便宜 60%)      │
│                                     │
│ 🔥 GPT-4 (未配置)          [ ]     │
│ ⚡ 創意強 | 通用能力                │
│ 💰 $10/$30 per 1M (昂貴 3倍)       │
│ [需要配置 API Key]                  │
└─────────────────────────────────────┘
```

**CSS Styles**:
```css
.model-dropdown {
  position: relative;
  width: 100%;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #424242;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.3s;
}

.dropdown-trigger:hover {
  border-color: #2196f3;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #1e1e1e;
  border: 2px solid #424242;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
}

.model-option {
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: background 0.2s;
}

.model-option:hover {
  background: rgba(33, 150, 243, 0.1);
}

.model-option.selected {
  background: rgba(33, 150, 243, 0.2);
  border-left: 4px solid #2196f3;
}

.model-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.model-icon {
  font-size: 24px;
  margin-right: 12px;
}

.model-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.model-title {
  font-size: 16px;
  font-weight: 600;
}

.model-features {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.model-pricing {
  font-size: 12px;
  color: #4caf50;
}
```

---

## Real-time Cost Indicator

### In-Battle Cost Display

當用戶執行任務時，實時顯示成本：

```
┌─────────────────────────────────────┐
│ ⚔️ 戰鬥中: 重構認證系統              │
├─────────────────────────────────────┤
│                                     │
│ 🤖 使用模型: Claude Sonnet          │
│ 💰 預估成本: $0.35                  │
│ ⏱️ 已用時間: 3m 24s                 │
│                                     │
│ 【實時統計】                         │
│ Input Tokens: 8,420                 │
│ Output Tokens: 12,650               │
│ 總計: 21,070 tokens                 │
│                                     │
│ [取消] [切換模型]                    │
└─────────────────────────────────────┘
```

### Mini Cost Badge

在主界面右上角顯示的簡化版成本指示器：

```
┌──────────────┐
│ 💰 $0.42     │
│ 8.4% 今日    │
└──────────────┘
```

**CSS**:
```css
.cost-badge {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #4caf50;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 600;
  color: #4caf50;
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: transform 0.2s;
}

.cost-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.cost-badge.warning {
  border-color: #ff9800;
  color: #ff9800;
}

.cost-badge.danger {
  border-color: #f44336;
  color: #f44336;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

---

## Model Status Indicators

### Status Icons

```
✅ 已啟用  - 模型已啟動並可用
🟡 啟動中  - 模型正在啟動
⏸️ 暫停   - 模型暫時不可用
❌ 未配置  - 模型未設置 API Key
🔴 錯誤   - 模型出現錯誤
```

### Status Bar

```
┌─────────────────────────────────────┐
│ 📊 模型狀態                          │
├─────────────────────────────────────┤
│                                     │
│ 🤖 Claude Sonnet    ✅ 運行中       │
│    延遲: 1.2s | 負載: 低             │
│                                     │
│ ✨ Gemini Pro       ✅ 運行中       │
│    延遲: 0.8s | 負載: 中             │
│                                     │
│ 🔥 GPT-4            ❌ 未配置       │
│    [配置 API Key]                   │
│                                     │
└─────────────────────────────────────┘
```

---

## Budget Warning Dialogs

### Warning Dialog (80% 預算)

```
┌─────────────────────────────────────┐
│ ⚠️ 成本警告                          │
├─────────────────────────────────────┤
│                                     │
│ 今日成本已達到預算的 80%             │
│                                     │
│ 當前成本: $4.00                     │
│ 每日預算: $5.00                     │
│ 剩餘額度: $1.00                     │
│                                     │
│ 建議:                                │
│ • 切換到成本優先模式                 │
│ • 暫停非關鍵任務                     │
│ • 增加每日預算                       │
│                                     │
│ [切換到成本模式] [增加預算] [繼續]   │
└─────────────────────────────────────┘
```

### Exceed Dialog (超出預算)

```
┌─────────────────────────────────────┐
│ 🚫 預算超出                          │
├─────────────────────────────────────┤
│                                     │
│ 今日成本已超出設定的預算！           │
│                                     │
│ 當前成本: $5.24                     │
│ 每日預算: $5.00                     │
│ 超出: $0.24 (4.8%)                  │
│                                     │
│ 自動切換到: Gemini Pro (節省模式)    │
│                                     │
│ [了解] [調整預算]                    │
└─────────────────────────────────────┘
```

---

## Model Comparison View

### Side-by-Side Comparison

```
┌─────────────────────────────────────────────────────────┐
│ 📊 模型對比                                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│           🤖 Claude Sonnet    |    ✨ Gemini Pro        │
│ ────────────────────────────────────────────────────────│
│                                                          │
│ 對話質量   ⭐⭐⭐⭐⭐      |    ⭐⭐⭐⭐               │
│ 代碼生成   ⭐⭐⭐⭐⭐      |    ⭐⭐⭐⭐               │
│ 速度       ⭐⭐⭐⭐         |    ⭐⭐⭐⭐⭐             │
│ 多模態     ⭐⭐⭐⭐         |    ⭐⭐⭐⭐⭐             │
│ 長上下文   ⭐⭐⭐⭐         |    ⭐⭐⭐⭐⭐ (2M)        │
│                                                          │
│ 成本       $3/$15 per 1M     |    $1.25/$5 per 1M      │
│            (基準)             |    (便宜 60%)            │
│                                                          │
│ 適合場景:                                                │
│ • 複雜代碼生成            |    • 多模態任務              │
│ • 精準對話                |    • 成本敏感場景            │
│ • 深度推理                |    • 超長上下文              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Toast Notifications

### Model Switch Notification

```
┌─────────────────────────────────────┐
│ 🔄 模型切換                          │
│                                     │
│ 已從 Claude Sonnet 切換到          │
│ Gemini Pro (成本優化)               │
│                                     │
│ [3秒後自動關閉]                     │
└─────────────────────────────────────┘
```

**CSS**:
```css
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #2196f3;
  border-radius: 8px;
  padding: 16px 20px;
  min-width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast.success {
  border-color: #4caf50;
}

.toast.warning {
  border-color: #ff9800;
}

.toast.error {
  border-color: #f44336;
}
```

---

## Responsive Design

### Desktop (≥1200px)

```
┌───────────────────────────────────────────┐
│  主畫面 (70%)         │  側邊欄 (30%)      │
│                      │                    │
│  [任務執行區域]       │  💰 成本統計        │
│                      │  📊 模型狀態        │
│                      │  ⚙️ 快速設置        │
└───────────────────────────────────────────┘
```

### Tablet (768px - 1199px)

```
┌────────────────────────────┐
│  主畫面                     │
│  [任務執行區域]             │
│                            │
│  側邊欄（可折疊）           │
│  [▼ 展開成本/設置]         │
└────────────────────────────┘
```

### Mobile (<768px)

```
┌─────────────────┐
│  主畫面          │
│  [任務區域]      │
├─────────────────┤
│  💰 $0.42 (8%)  │
│  [詳情]          │
└─────────────────┘
```

---

## Summary

多模型整合 UI 設計重點：

**✅ 清晰的配置界面**:
- 預設模式選擇（平衡/質量/成本）
- 自定義配置選項
- 可用模型狀態顯示

**✅ 實時成本監控**:
- 主面板成本統計
- 迷你成本徽章
- 戰鬥中實時成本

**✅ 智能預警系統**:
- 預算警告（80% 閾值）
- 超出預算對話框
- Toast 通知

**✅ 模型對比視圖**:
- 並排對比
- 能力評分
- 成本差異

**✅ 響應式適配**:
- 桌面版完整顯示
- 平板版折疊優化
- 手機版精簡呈現

---

**Version**: v1.0
**Last Updated**: 2026-02-05
