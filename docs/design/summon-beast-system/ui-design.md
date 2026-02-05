# Summon Beast System - UI Design

## Summon Display Panel

### Layout Overview

召喚獸顯示在戰鬥畫面的專用區域，與夥伴分開顯示。

```
┌────────────────────────────────────────────────────────┐
│  ⚔️ 戰鬥模式                                            │
├────────────────────────────────────────────────────────┤
│                                                        │
│  【敵人】                  🐛 Bug怪物 Lv.5             │
│                           HP: ███████░░░ 350/500      │
│                                                        │
│  ─────────────────────────────────────────────────────│
│                                                        │
│  【我方】                                               │
│                                                        │
│  👤 你 (CodeMaster Lv.10)                              │
│     HP: ████████░░ 85/100                              │
│     MP: ████░░░░░░ 42/100                              │
│                                                        │
│  🛡️ CodeGuard Lv.3          ⚡ Speedy Lv.5           │
│     HP: ████ 50/50              HP: ███░ 70/100       │
│     MP: ██░░ 15/40              MP: ███░ 60/120       │
│                                                        │
│  【召喚獸】                                             │
│  🐉 代碼之龍 (1回合)                                   │
│     ⚡ 待命中...                                       │
│                                                        │
│  ─────────────────────────────────────────────────────│
│                                                        │
│  【行動選項】                                           │
│  [⚔️ 玩家技能] [🤝 夥伴指令] [🐉 召喚] [🎒 道具]      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**區域配置**:
- 敵人區域：頂部
- 玩家區域：中上
- 夥伴區域：中部（並排顯示，最多2個）
- 召喚獸區域：中下（獨立顯示，最多1個）
- 行動選單：底部

---

## Summon Card Component

### Basic Card Layout

```
┌─────────────────────────┐
│  🐉                      │
│  代碼之龍                 │
│  ━━━━━━━━━━━━━━━━━      │
│  剩餘: 1 回合             │
│  元素: 奧術 🔮            │
│  ⚡ 待命中                │
└─────────────────────────┘
```

### Rarity Styles

**Common（常見）**:
```css
.summon-card.common {
  border: 2px solid #9e9e9e;
  box-shadow: 0 0 10px rgba(158, 158, 158, 0.3);
}
```

**Uncommon（罕見）**:
```css
.summon-card.uncommon {
  border: 2px solid #4caf50;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}
```

**Rare（稀有）**:
```css
.summon-card.rare {
  border: 2px solid #2196f3;
  box-shadow: 0 0 15px rgba(33, 150, 243, 0.6);
}
```

**Epic（史詩）**:
```css
.summon-card.epic {
  border: 3px solid #9c27b0;
  box-shadow: 0 0 20px rgba(156, 39, 176, 0.7);
  background: linear-gradient(135deg, #4a148c, #6a1b9a);
}
```

**Legendary（傳說）**:
```css
.summon-card.legendary {
  border: 3px solid #ff9800;
  box-shadow: 0 0 25px rgba(255, 152, 0, 0.8);
  background: linear-gradient(135deg, #e65100, #ff6f00);
  animation: legendary-glow 2s ease-in-out infinite;
}

@keyframes legendary-glow {
  0%, 100% { box-shadow: 0 0 25px rgba(255, 152, 0, 0.8); }
  50% { box-shadow: 0 0 35px rgba(255, 152, 0, 1.0); }
}
```

### Element Badges

```css
.element-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
}

.element-arcane {
  background: linear-gradient(135deg, #7b1fa2, #9c27b0);
  color: #fff;
}

.element-life {
  background: linear-gradient(135deg, #388e3c, #4caf50);
  color: #fff;
}

.element-temporal {
  background: linear-gradient(135deg, #1976d2, #2196f3);
  color: #fff;
}

.element-data {
  background: linear-gradient(135deg, #455a64, #607d8b);
  color: #fff;
}

.element-rebirth {
  background: linear-gradient(135deg, #d84315, #ff5722);
  color: #fff;
}

.element-structure {
  background: linear-gradient(135deg, #5d4037, #795548);
  color: #fff;
}
```

---

## Summon Animations

### 1. Summon Appearance Animation

**Timeline**:
```
0.0s  ├─ 魔法陣出現（從小到大）
0.3s  ├─ 魔法陣旋轉加速
0.5s  ├─ 召喚獸從陣中升起
0.8s  ├─ 閃光效果
1.0s  ├─ 召喚獸落地
1.2s  ├─ 魔法陣消失
1.5s  ├─ 顯示召喚台詞
2.0s  ├─ 動畫完成
```

**CSS Animation**:
```css
/* 魔法陣出現 */
@keyframes magic-circle-appear {
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1) rotate(180deg);
    opacity: 1;
  }
  100% {
    transform: scale(1.5) rotate(360deg);
    opacity: 1;
  }
}

.magic-circle {
  animation: magic-circle-appear 1s ease-out;
}

/* 召喚獸升起 */
@keyframes summon-emerge {
  0% {
    transform: translateY(100px) scale(0);
    opacity: 0;
  }
  50% {
    transform: translateY(-20px) scale(1.2);
    opacity: 1;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.summon-emergence {
  animation: summon-emerge 0.8s ease-out 0.5s;
}
```

### 2. Skill Execution Animation

**Dragon Breath（龍息）**:
```
0.0s  ├─ 龍頭向後仰
0.3s  ├─ 蓄力特效（火焰聚集）
0.5s  ├─ 龍息噴發
0.8s  ├─ 火焰擊中敵人
1.0s  ├─ 爆炸特效
1.3s  ├─ 傷害數字彈出
1.8s  ├─ 敵人受傷動畫
```

**CSS Animation**:
```css
@keyframes dragon-breath-charge {
  0% { transform: scale(1); }
  50% {
    transform: scale(1.2);
    filter: brightness(1.5);
  }
  100% {
    transform: scale(1.3);
    filter: brightness(2.0);
  }
}

@keyframes fire-blast {
  0% {
    transform: translateX(0) scale(0.5);
    opacity: 1;
  }
  50% {
    transform: translateX(50%) scale(1.5);
    opacity: 0.8;
  }
  100% {
    transform: translateX(100%) scale(2);
    opacity: 0;
  }
}
```

**Phoenix Rebirth（浴火重生）**:
```
0.0s  ├─ 不死鳥展翅
0.3s  ├─ 火焰環繞全身
0.5s  ├─ 閃光爆發
0.8s  ├─ 治療光波擴散
1.0s  ├─ 玩家/夥伴閃爍（治療）
1.3s  ├─ 治療數字彈出
1.5s  ├─ Buff 圖標顯示
```

**Time Rewind（時間倒流）**:
```
0.0s  ├─ 時鐘圖案出現
0.3s  ├─ 時針逆時針旋轉
0.5s  ├─ 畫面閃爍（黑白）
0.8s  ├─ 時間波紋擴散
1.0s  ├─ 冷卻重置特效
1.3s  ├─ 技能圖標閃爍
1.5s  ├─ HP/MP 恢復動畫
```

### 3. Exit Animation

**Fade Out（淡出）**:
```css
@keyframes summon-fade-out {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
  100% {
    opacity: 0;
    transform: scale(0);
  }
}
```

**Dissolve（溶解）**:
```css
@keyframes summon-dissolve {
  0% {
    opacity: 1;
    filter: blur(0px);
  }
  50% {
    opacity: 0.6;
    filter: blur(5px);
  }
  100% {
    opacity: 0;
    filter: blur(10px);
    transform: translateY(-50px);
  }
}
```

---

## Summon Skill Buttons

當召喚獸是互動型（Interactive）時，顯示技能按鈕。

### Available State

```
┌───────────────────────┐
│ 🗄️ 資料護盾           │
│ 獲得 100 點護盾        │
│ [施放]                │
└───────────────────────┘
```

**CSS**:
```css
.summon-skill-btn {
  background: linear-gradient(135deg, #1976d2, #2196f3);
  border: 2px solid #1565c0;
  color: #fff;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.summon-skill-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(33, 150, 243, 0.5);
}

.summon-skill-btn:active {
  transform: scale(0.95);
}
```

### Used State

```
┌───────────────────────┐
│ 🗄️ 資料護盾 (灰色)     │
│ 已使用                 │
│ [冷卻中]              │
└───────────────────────┘
```

**CSS**:
```css
.summon-skill-btn.used {
  background: #757575;
  border: 2px solid #616161;
  cursor: not-allowed;
  opacity: 0.6;
}
```

---

## Summon Quote Display

### Quote Bubble

```
┌─────────────────────────────────────┐
│  🐉                                 │
│  ┌─────────────────────────────┐  │
│  │ 吾乃代碼之龍！                │  │
│  │ 汝之問題將化為灰燼！          │  │
│  └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

**CSS**:
```css
.summon-quote {
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #ffc107;
  border-radius: 12px;
  padding: 12px 16px;
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  position: relative;
  animation: quote-appear 0.5s ease-out;
}

.summon-quote::before {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #ffc107;
}

@keyframes quote-appear {
  0% {
    opacity: 0;
    transform: translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## Particle Effects

### Summon Particles

```jsx
<div className="particles">
  {[...Array(20)].map((_, i) => (
    <motion.div
      key={i}
      className="particle"
      initial={{
        x: 0,
        y: 0,
        opacity: 1
      }}
      animate={{
        x: Math.random() * 400 - 200,
        y: Math.random() * 400 - 200,
        opacity: 0
      }}
      transition={{
        duration: 1.5,
        delay: Math.random() * 0.5
      }}
    />
  ))}
</div>
```

**CSS**:
```css
.particles {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 6px;
  height: 6px;
  background: radial-gradient(circle, #ffeb3b, #ff9800);
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(255, 152, 0, 0.8);
}
```

### Fire Effect

```css
.fire-particle {
  position: absolute;
  width: 4px;
  height: 10px;
  background: linear-gradient(to top, #ff5722, #ffeb3b);
  border-radius: 50% 50% 0 0;
  animation: fire-flicker 0.3s ease-in-out infinite;
}

@keyframes fire-flicker {
  0%, 100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
  50% {
    transform: scale(1.2) translateY(-5px);
    opacity: 0.8;
  }
}
```

### Healing Light

```css
.healing-light {
  position: absolute;
  width: 20px;
  height: 20px;
  background: radial-gradient(circle, #4caf50, transparent);
  border-radius: 50%;
  animation: healing-pulse 1s ease-in-out infinite;
}

@keyframes healing-pulse {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.5;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}
```

---

## Damage Numbers

### Summon Damage Display

召喚獸造成的傷害使用特殊樣式，與普通傷害區分。

```css
.damage-number.summon-damage {
  font-size: 36px;
  font-weight: bold;
  color: #ff9800;
  text-shadow:
    0 0 10px #ff5722,
    0 0 20px #ff9800,
    2px 2px 4px rgba(0, 0, 0, 0.8);
  animation: summon-damage-pop 1s ease-out;
}

@keyframes summon-damage-pop {
  0% {
    transform: scale(0) translateY(0);
    opacity: 0;
  }
  30% {
    transform: scale(1.5) translateY(-30px);
    opacity: 1;
  }
  70% {
    transform: scale(1.2) translateY(-50px);
    opacity: 1;
  }
  100% {
    transform: scale(1) translateY(-80px);
    opacity: 0;
  }
}
```

### Critical Summon Damage

```css
.damage-number.summon-damage.critical {
  font-size: 48px;
  color: #ffeb3b;
  text-shadow:
    0 0 15px #ff5722,
    0 0 30px #ff9800,
    0 0 45px #ffeb3b,
    3px 3px 6px rgba(0, 0, 0, 0.8);
  animation: critical-summon-damage 1.2s ease-out;
}

@keyframes critical-summon-damage {
  0% {
    transform: scale(0) rotate(-15deg);
    opacity: 0;
  }
  20% {
    transform: scale(2) rotate(5deg);
    opacity: 1;
  }
  40% {
    transform: scale(1.8) rotate(-5deg);
  }
  60% {
    transform: scale(1.5) rotate(0deg) translateY(-60px);
    opacity: 1;
  }
  100% {
    transform: scale(1.2) rotate(0deg) translateY(-100px);
    opacity: 0;
  }
}
```

---

## Responsive Design

### Desktop (≥1200px)

```
┌───────────────────────────────────────────┐
│  戰鬥主畫面 (70%)    │  詳細面板 (30%)    │
│                     │                    │
│  [敵人]             │  [召喚獸詳細]       │
│  [玩家]             │  - 剩餘回合         │
│  [夥伴1] [夥伴2]     │  - 可用技能         │
│  [召喚獸: 代碼之龍]  │  - 元素屬性         │
│  [日誌]             │  - 技能說明         │
│  [行動選單]          │                    │
└───────────────────────────────────────────┘
```

### Tablet (768px - 1199px)

```
┌────────────────────────────┐
│  戰鬥主畫面                 │
│  [敵人]                    │
│  [玩家] [夥伴1] [夥伴2]     │
│  [召喚獸: 代碼之龍]         │
│  [日誌]                    │
│  [行動選單]                 │
│                            │
│  召喚獸面板（可折疊）        │
│  [▼ 展開召喚獸詳情]        │
└────────────────────────────┘
```

### Mobile (<768px)

```
┌─────────────────┐
│  [敵人]          │
│  HP: ████░      │
├─────────────────┤
│  [玩家]          │
│  HP: ███░       │
│  [夥][夥][召]    │
│  (圖標顯示)      │
├─────────────────┤
│  [精簡日誌]      │
│  最新 2 條       │
├─────────────────┤
│  [技][伴][召][道] │
│  (圖標按鈕)      │
└─────────────────┘
```

---

## Visual Style Guide

### Color Palette

**召喚系統主色**:
```css
--summon-primary: #ff9800;      /* 橙色 */
--summon-secondary: #ff5722;    /* 深橙色 */
--summon-accent: #ffc107;       /* 琥珀色 */
--summon-dark: #e65100;         /* 深橙 */
```

**元素顏色**:
```css
--element-arcane: #9c27b0;      /* 奧術：紫色 */
--element-life: #4caf50;        /* 生命：綠色 */
--element-temporal: #2196f3;    /* 時間：藍色 */
--element-data: #607d8b;        /* 資料：灰藍 */
--element-rebirth: #ff5722;     /* 重生：深橙 */
--element-structure: #795548;   /* 結構：棕色 */
```

### Typography

```css
.summon-name {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.summon-quote {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.6;
}

.summon-description {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.8);
}
```

---

## Summary

召喚獸系統 UI 設計重點：

**✅ 視覺震撼**:
- 華麗的召喚動畫（魔法陣、粒子效果）
- 強力技能特效（火焰、閃光、波紋）
- 稀有度視覺區分（邊框、光暈、動畫）

**✅ 清晰的資訊呈現**:
- 剩餘回合數明確顯示
- 元素屬性一目了然
- 技能狀態清楚標示

**✅ 流暢的動畫效果**:
- 召喚動畫有儀式感
- 技能施放有打擊感
- 離去動畫有餘韻

**✅ 響應式適配**:
- 桌面版詳細展示
- 平板版折疊優化
- 手機版圖標呈現

---

**Version**: v1.0
**Last Updated**: 2026-02-05
