# 互動戰鬥事件 UI 設計

**文檔創建日期**: 2026-02-05
**版本**: v1.0
**狀態**: 設計階段
**來源**: Interactive-Battle-Events-Design.md

---

## 目錄

1. [設計概覽](#設計概覽)
2. [核心組件](#核心組件)
3. [事件類型UI](#事件類型ui)
4. [動畫效果](#動畫效果)
5. [響應式設計](#響應式設計)

---

## 設計概覽

### UI 設計原則

1. **一致性**: 所有互動事件使用統一的 Modal 組件
2. **清晰性**: 事件類型一目了然（圖標 + 標題）
3. **沉浸感**: RPG 化視覺元素（魔法效果、戰鬥狀態）
4. **響應性**: 流暢的動畫和即時反饋

### 視覺層次

```
┌────────────────────────────────────────────┐
│  戰鬥畫面 (Background - 50% 透明度)       │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │  BattleEventModal (Foreground)     │   │
│  │                                    │   │
│  │  ┌──────────────────────────────┐ │   │
│  │  │ 圖標 + 標題                  │ │   │
│  │  ├──────────────────────────────┤ │   │
│  │  │ 描述文字                     │ │   │
│  │  ├──────────────────────────────┤ │   │
│  │  │ 事件內容區                   │ │   │
│  │  │ (根據事件類型動態渲染)       │ │   │
│  │  ├──────────────────────────────┤ │   │
│  │  │ 行動按鈕                     │ │   │
│  │  │ [主要] [次要] [危險]         │ │   │
│  │  └──────────────────────────────┘ │   │
│  └────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

---

## 核心組件

### 1. BattleEventModal

**用途**: 統一的事件彈窗組件，處理所有互動事件

**結構**:

```tsx
interface BattleEvent {
  eventType: 'plan_mode' | 'enemy_question' | 'skill_backlash' | 'permission_request';
  icon: string;          // 事件圖標（emoji）
  title: string;         // 事件標題
  description: string;   // 事件描述
  content?: any;         // 事件內容（可選）
  actions: ActionButton[];  // 行動按鈕列表
  priority?: 'low' | 'normal' | 'high' | 'critical';  // 優先級
}

interface ActionButton {
  id: string;
  label: string;
  style: 'primary' | 'secondary' | 'danger';
  mpCost?: number;      // MP 消耗（可選）
  disabled?: boolean;
}
```

**視覺設計**:

```
┌──────────────────────────────────────────┐
│  🧙 戰術規劃                  [X 關閉]  │  ← Header (Gradient)
├──────────────────────────────────────────┤
│  魔法師正在制定戰術...                   │  ← Description
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  📋 計劃內容                       │ │  ← Content Area
│  │                                    │ │
│  │  [根據事件類型動態渲染]            │ │
│  │                                    │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌─────────────┐  ┌─────────────┐      │
│  │ ✅ 批准戰術  │  │ ❌ 重新規劃  │      │  ← Actions
│  │   -10 MP    │  │             │      │
│  └─────────────┘  └─────────────┘      │
└──────────────────────────────────────────┘
```

**React 組件**:

```tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BattleEventModal: React.FC<BattleEventModalProps> = ({
  event,
  onAction,
  onClose
}) => {
  if (!event) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="battle-event-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="battle-event-modal"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          transition={{ type: 'spring', damping: 15 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`event-header priority-${event.priority || 'normal'}`}>
            <span className="event-icon">{event.icon}</span>
            <h2 className="event-title">{event.title}</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>

          {/* Description */}
          <p className="event-description">{event.description}</p>

          {/* Content */}
          <div className="event-content">
            <EventContent event={event} />
          </div>

          {/* Actions */}
          <div className="event-actions">
            {event.actions.map(action => (
              <button
                key={action.id}
                className={`event-action ${action.style}`}
                onClick={() => onAction(action.id)}
                disabled={action.disabled}
              >
                {action.label}
                {action.mpCost && action.mpCost > 0 && (
                  <span className="mp-cost">-{action.mpCost} MP</span>
                )}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
```

---

## 事件類型UI

### 1. Plan Mode - 戰術規劃

**視覺設計**:

```
┌──────────────────────────────────────────┐
│  🧙 戰術規劃                             │
├──────────────────────────────────────────┤
│  敵人太過強大，需要制定戰術！             │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  📋 戰術計劃                       │ │
│  │                                    │ │
│  │  目標: 重構認證系統                │ │
│  │                                    │ │
│  │  步驟:                             │ │
│  │  1. 分析現有結構                   │ │
│  │  2. 設計新架構                     │ │
│  │  3. 實作核心功能                   │ │
│  │  4. 測試與驗證                     │ │
│  │                                    │ │
│  │  風險:                             │ │
│  │  • 向後兼容性問題                  │ │
│  │  • Session 管理複雜度              │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌─────────────┐  ┌─────────────┐      │
│  │ ✅ 批准戰術  │  │ ❌ 重新規劃  │      │
│  │   -10 MP    │  │             │      │
│  └─────────────┘  └─────────────┘      │
└──────────────────────────────────────────┘
```

**組件實現**:

```tsx
const PlanModeContent: React.FC<{ content: PlanModeData }> = ({ content }) => (
  <div className="plan-mode-content">
    <div className="plan-header">
      <span className="plan-icon">📋</span>
      <h3>戰術計劃</h3>
    </div>

    <div className="plan-body">
      <section className="plan-section">
        <h4>目標</h4>
        <p>{content.goal}</p>
      </section>

      <section className="plan-section">
        <h4>步驟</h4>
        <ol>
          {content.steps.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>
      </section>

      {content.risks && content.risks.length > 0 && (
        <section className="plan-section risks">
          <h4>⚠️ 風險</h4>
          <ul>
            {content.risks.map((risk, idx) => (
              <li key={idx}>{risk}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  </div>
);
```

**狀態變化**:
```
戰鬥畫面:
- 敵人 HP 條變為黃色（警戒狀態）
- 顯示 "⚠️ 警戒中..." 標籤
- 魔法師周圍浮現符文動畫
```

---

### 2. AskUserQuestion - 敵人發問攻擊

**視覺設計**:

```
┌──────────────────────────────────────────┐
│  ❓ 敵人的發問攻擊！                      │
├──────────────────────────────────────────┤
│  敵人發動「困惑之問」，你必須正確回答！   │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  問題：                            │ │
│  │  應該使用哪種資料庫？              │ │
│  │                                    │ │
│  │  ○ MySQL                          │ │
│  │    關聯式資料庫，適合結構化數據    │ │
│  │                                    │ │
│  │  ○ PostgreSQL (推薦)              │ │
│  │    功能強大，支援進階特性          │ │
│  │                                    │ │
│  │  ○ MongoDB                        │ │
│  │    NoSQL，適合文檔型數據           │ │
│  │                                    │ │
│  │  ○ 其他 (自定義輸入)              │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ⚠️ 提示：選擇影響戰術方向               │
│                                          │
│  ┌─────────────┐  ┌─────────────┐      │
│  │ ✅ 確認選擇  │  │ ⏸️ 稍後決定  │      │
│  └─────────────┘  └─────────────┘      │
└──────────────────────────────────────────┘
```

**組件實現**:

```tsx
const QuestionContent: React.FC<{ questions: Question[] }> = ({ questions }) => {
  const [answers, setAnswers] = React.useState<Record<string, string>>({});

  return (
    <div className="question-content">
      {questions.map((q, idx) => (
        <div key={idx} className="question-item">
          <div className="question-header">
            <span className="header-badge">{q.header}</span>
          </div>

          <h3 className="question-text">{q.question}</h3>

          <div className="question-options">
            {q.options.map((opt, optIdx) => (
              <label
                key={optIdx}
                className={`option-label ${
                  answers[idx] === opt.label ? 'selected' : ''
                }`}
              >
                <input
                  type={q.multiSelect ? 'checkbox' : 'radio'}
                  name={`question-${idx}`}
                  value={opt.label}
                  onChange={(e) => {
                    setAnswers({ ...answers, [idx]: e.target.value });
                  }}
                />
                <span className="option-content">
                  <strong className="option-label-text">{opt.label}</strong>
                  <p className="option-description">{opt.description}</p>
                </span>
              </label>
            ))}

            {/* "Other" option (always present) */}
            <label className="option-label other-option">
              <input
                type="radio"
                name={`question-${idx}`}
                value="other"
              />
              <span className="option-content">
                <strong>其他 (自定義輸入)</strong>
                <input
                  type="text"
                  className="custom-input"
                  placeholder="輸入你的答案..."
                />
              </span>
            </label>
          </div>
        </div>
      ))}

      <div className="question-hint">
        ⚠️ 提示：選擇影響戰術方向
      </div>
    </div>
  );
};
```

**狀態變化**:
```
戰鬥畫面:
- 敵人進入蓄力狀態（發光效果）
- 顯示 "💭 思考中..." 泡泡
- 玩家角色周圍出現問號動畫
```

---

### 3. 錯誤/警告 - 技能反噬

**視覺設計**:

```
┌──────────────────────────────────────────┐
│  ⚠️ 技能反噬！                           │
├──────────────────────────────────────────┤
│  施法失敗，魔法反彈！                     │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  錯誤原因:                         │ │
│  │  ──────────────────────────────   │ │
│  │  Syntax Error at line 42          │ │
│  │  Unexpected token ';'             │ │
│  │                                    │ │
│  │  ────────────────────────────────  │ │
│  │  💔 反噬傷害: -15 HP               │ │
│  │  ────────────────────────────────  │ │
│  │  當前 HP: 80 → 65                  │ │
│  │                                    │ │
│  │  [生命值條動畫]                    │ │
│  │  ████████████░░░░ 65/100          │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────┐  ┌────────┐  ┌────────┐   │
│  │ 🔄 重試 │  │ 🛡️ 防禦 │  │ ❌ 取消 │   │
│  │  -5 MP │  │        │  │        │   │
│  └────────┘  └────────┘  └────────┘   │
└──────────────────────────────────────────┘
```

**組件實現**:

```tsx
const ErrorContent: React.FC<{ error: ErrorData }> = ({ error }) => {
  const damageAmount = calculateBacklashDamage(error.severity);

  return (
    <div className="error-content">
      <div className="error-header">
        <h4>錯誤原因:</h4>
      </div>

      <div className="error-message">
        <pre>{error.message}</pre>
      </div>

      <div className="damage-section">
        <div className="damage-info">
          <span className="damage-icon">💔</span>
          <span className="damage-text">反噬傷害: -{damageAmount} HP</span>
        </div>

        <div className="hp-change">
          <span className="hp-before">{error.currentHP}</span>
          <span className="arrow">→</span>
          <span className="hp-after">{error.currentHP - damageAmount}</span>
        </div>

        <HealthBar
          current={error.currentHP - damageAmount}
          max={error.maxHP}
          animated
          flash="red"
        />
      </div>

      {error.stackTrace && (
        <details className="stack-trace">
          <summary>詳細堆棧追蹤</summary>
          <pre>{error.stackTrace}</pre>
        </details>
      )}
    </div>
  );
};
```

**狀態變化**:
```
戰鬥畫面:
- HP 條閃爍紅色
- 螢幕震動效果
- 紅色波紋從角色擴散
- 顯示 "-15 HP" 飄字
```

---

### 4. 權限請求 - 力量借用

**視覺設計**:

```
┌──────────────────────────────────────────┐
│  🔐 力量借用請求                         │
├──────────────────────────────────────────┤
│  魔法師需要借用額外的力量來施放這個       │
│  強大的魔法！                             │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  請求的力量:                       │ │
│  │                                    │ │
│  │  🔓 修改系統文件                   │ │
│  │  ⚡ 執行管理員命令                 │ │
│  │  🗑️ 刪除重要數據                  │ │
│  │                                    │ │
│  │  ────────────────────────────────  │ │
│  │  風險等級: ⚠️⚠️⚠️ 高              │ │
│  │  ────────────────────────────────  │ │
│  │                                    │ │
│  │  ℹ️ 此操作需要你的明確授權         │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌─────────────┐  ┌─────────────┐      │
│  │ ✅ 授予力量  │  │ ❌ 拒絕請求  │      │
│  │             │  │             │      │
│  └─────────────┘  └─────────────┘      │
│                                          │
│  [ ] 記住此決定（不再詢問）               │
└──────────────────────────────────────────┘
```

**組件實現**:

```tsx
const PermissionContent: React.FC<{ permission: PermissionRequest }> = ({
  permission
}) => {
  const [remember, setRemember] = React.useState(false);

  const riskLevel = permission.riskLevel || 'medium';
  const riskIcons = {
    low: '⚠️',
    medium: '⚠️⚠️',
    high: '⚠️⚠️⚠️',
    critical: '🚨🚨🚨'
  };

  return (
    <div className="permission-content">
      <div className="permission-list">
        <h4>請求的力量:</h4>
        <ul>
          {permission.capabilities.map((cap, idx) => (
            <li key={idx}>
              <span className="cap-icon">{cap.icon}</span>
              <span className="cap-text">{cap.description}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={`risk-level level-${riskLevel}`}>
        <span>風險等級: {riskIcons[riskLevel]} {riskLevel.toUpperCase()}</span>
      </div>

      <div className="permission-info">
        ℹ️ 此操作需要你的明確授權
      </div>

      <div className="remember-option">
        <label>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span>記住此決定（不再詢問）</span>
        </label>
      </div>
    </div>
  );
};
```

**狀態變化**:
```
戰鬥畫面:
- 金色光環環繞角色
- 顯示權限圖標浮動動畫
- 播放神聖音效
```

---

## 動畫效果

### 1. 入場動畫

**彈窗出現**:
```typescript
const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 50
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 15,
      stiffness: 100
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: {
      duration: 0.2
    }
  }
};
```

**背景遮罩**:
```typescript
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 }
  }
};
```

---

### 2. 狀態變化動畫

**HP 條變化**:
```typescript
const HealthBar: React.FC<HealthBarProps> = ({ current, max, flash }) => {
  return (
    <motion.div className="health-bar">
      <motion.div
        className="health-fill"
        initial={{ width: `${(current / max) * 100}%` }}
        animate={{
          width: `${(current / max) * 100}%`,
          backgroundColor: flash === 'red' ? '#FF4444' : '#4CAF50'
        }}
        transition={{
          width: { duration: 0.5, ease: 'easeOut' },
          backgroundColor: { duration: 0.1, repeat: 3, repeatType: 'reverse' }
        }}
      />
    </motion.div>
  );
};
```

**選項高亮**:
```css
.option-label {
  transition: all 0.2s ease;
}

.option-label:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.option-label.selected {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
}
```

---

### 3. 錯誤反噬動畫

**螢幕震動**:
```typescript
const shakeAnimation = {
  x: [0, -10, 10, -10, 10, 0],
  transition: {
    duration: 0.5,
    ease: 'easeInOut'
  }
};
```

**波紋擴散**:
```typescript
const Ripple: React.FC = () => (
  <motion.div
    className="damage-ripple"
    initial={{ scale: 0, opacity: 1 }}
    animate={{
      scale: 3,
      opacity: 0
    }}
    transition={{ duration: 0.8, ease: 'easeOut' }}
  />
);
```

---

## 響應式設計

### 桌面版 (PC)

```
寬度: 600px
高度: 自動（最大 80vh）
位置: 螢幕中央
```

### 平板版 (iPad)

```
寬度: 80vw（最大 500px）
高度: 自動（最大 75vh）
位置: 螢幕中央
字體: 稍大
按鈕: 稍大（方便觸控）
```

### 手機版 (iPhone)

```
寬度: 90vw
高度: 自動（最大 70vh）
位置: 螢幕中央偏上
字體: 更大
按鈕: 更大（最小 44px）
滾動: 內容區域可滾動
```

**CSS 實現**:

```css
.battle-event-modal {
  width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .battle-event-modal {
    width: 80vw;
    max-width: 500px;
    max-height: 75vh;
    font-size: 1.1em;
  }

  .event-action {
    min-height: 48px;
    font-size: 1.1em;
  }
}

@media (max-width: 480px) {
  .battle-event-modal {
    width: 90vw;
    max-height: 70vh;
    font-size: 1.2em;
  }

  .event-action {
    min-height: 52px;
    font-size: 1.2em;
    width: 100%;
    margin-bottom: 8px;
  }

  .event-actions {
    flex-direction: column;
  }
}
```

---

## 樣式設計

### 顏色方案

```css
/* 事件優先級顏色 */
.priority-low {
  border-top: 4px solid #4CAF50;
}

.priority-normal {
  border-top: 4px solid #2196F3;
}

.priority-high {
  border-top: 4px solid #FF9800;
}

.priority-critical {
  border-top: 4px solid #F44336;
}

/* 按鈕樣式 */
.event-action.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.event-action.secondary {
  background: #F5F5F5;
  color: #333;
  border: 1px solid #DDD;
}

.event-action.danger {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}
```

### 完整樣式表

```css
/* battle-events.css */

.battle-event-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.battle-event-modal {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.event-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  border-radius: 16px 16px 0 0;
  position: relative;
}

.event-icon {
  font-size: 2em;
}

.event-title {
  flex: 1;
  font-size: 1.5em;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.close-btn:hover {
  opacity: 1;
}

.event-description {
  padding: 0 24px 16px;
  color: #666;
  font-size: 1em;
  line-height: 1.5;
}

.event-content {
  padding: 0 24px 20px;
  max-height: 400px;
  overflow-y: auto;
}

.event-actions {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #EEE;
}

.event-action {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.event-action:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.event-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mp-cost {
  font-size: 0.85em;
  opacity: 0.8;
}
```

---

## 總結

### 設計亮點

1. ✅ **統一組件**: BattleEventModal 處理所有事件類型
2. ✅ **流暢動畫**: Framer Motion 提供專業動畫效果
3. ✅ **清晰層次**: 視覺元素層次分明
4. ✅ **響應式**: 支持 PC、平板、手機

### 實作檢查清單

**Phase 2.5**:
- [ ] 實作 BattleEventModal 基礎組件
- [ ] 實作 4 種事件內容組件
- [ ] 基礎樣式（無動畫）
- [ ] 基礎響應式設計

**Phase 3**:
- [ ] 完整動畫效果
- [ ] 狀態變化動畫
- [ ] 音效整合
- [ ] 完善響應式設計

**Phase 4**:
- [ ] 自定義主題支持
- [ ] 更多動畫變化
- [ ] 性能優化
