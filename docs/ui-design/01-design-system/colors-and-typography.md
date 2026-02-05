# 顏色與字體規範

**日期**: 2026-02-05
**版本**: v1.0

---

## Pixel Art 風格定義

### 核心設計理念

RPG-CLI 採用復古 8-bit Pixel Art 風格，營造懷舊的 RPG 遊戲氛圍。

**風格特徵**:
- 像素化圖形和邊框
- 8-bit 風格字體
- 復古調色板
- 簡潔的圖標設計
- 塊狀進度條
- 閃爍和掃描線效果

**視覺參考**:
```
經典 RPG 遊戲風格
  ┌────────────────┐
  │ ████  ░░░░░░░░ │  ← 像素化進度條
  │                │
  │  ⚔️  💎  🏆   │  ← 像素圖標
  │                │
  │ Press Start 2P │  ← 8-bit 字體
  └────────────────┘
```

---

## 顏色系統

### 主色調（Primary Colors）

**探索模式（安全、平靜）**:
```
背景色:    #1a4d2e  ███  深綠色
主要色:    #4caf50  ███  綠色強調
文字色:    #e0e0e0  ███  淺灰文字
點綴色:    #81c784  ███  淺綠點綴

使用場景:
┌─────────────────────────────┐
│ 🏰 RPG-CLI - 探索模式        │  ← 深綠色背景
│ ━━━━━━━━━━━━━━━━━━━━━━━━━│
│ HP: ████████░░ 80/100       │  ← 綠色 HP 條
└─────────────────────────────┘
```

**戰鬥模式（緊張、危險）**:
```
背景色:    #4d1a1a  ███  深紅色
主要色:    #f44336  ███  紅色強調
文字色:    #e0e0e0  ███  淺灰文字
點綴色:    #ef5350  ███  淺紅點綴

使用場景:
┌─────────────────────────────┐
│ ⚔️ 戰鬥模式                  │  ← 深紅色背景
│ ━━━━━━━━━━━━━━━━━━━━━━━━━│
│ 敵人 HP: ███░░░░░░ 30/100   │  ← 紅色敵人 HP
└─────────────────────────────┘
```

---

### 功能性顏色（Functional Colors）

#### 1. 狀態顏色

**HP（生命值）**:
```
顏色:    #E74C3C  ███  (紅色)
用途:    生命值條、生命相關數值
變體:
  正常 (>50%):   #4caf50  ███  綠色
  警告 (20-50%): #ffc107  ███  黃色
  危險 (<20%):   #E74C3C  ███  紅色（閃爍）

示例:
HP: ████████░░ 80/100  ← 綠色
HP: ████░░░░░░ 40/100  ← 黃色
HP: ██░░░░░░░░ 20/100  ← 紅色（閃爍）
```

**MP（魔力值）**:
```
顏色:    #3498DB  ███  (藍色)
用途:    魔力值條、魔力相關數值
變體:
  正常:          #3498DB  ███  藍色
  消耗動畫:      #2980B9  ███  深藍色（過渡）

示例:
MP: ██████░░░░ 60/100  ← 藍色
消耗 -10 MP: 動畫從右向左減少
```

**EXP（經驗值）**:
```
顏色:    #F39C12  ███  (金色)
用途:    經驗值條、經驗相關數值
變體:
  正常:          #F39C12  ███  金色
  升級閃光:      #FFD700  ███  亮金色

示例:
EXP: ████░░░░░░ 400/1000  ← 金色
升級: ██████████ 1000/1000 → 閃光！
```

**Gold（金幣）**:
```
顏色:    #FFD700  ███  (亮金色)
用途:    金幣數量、金幣圖標

示例:
💰 350 金幣  ← 亮金色數字
```

#### 2. 反饋顏色

**成功（Success）**:
```
顏色:    #10b981  ███  (綠色)
用途:    成功提示、完成狀態、勝利

示例:
✅ 戰鬥勝利！
✓ 任務完成
```

**警告（Warning）**:
```
顏色:    #F59E0B  ███  (橙色)
用途:    警告提示、注意事項

示例:
⚠️ MP 不足
⚠️ 文件未保存
```

**錯誤（Error）**:
```
顏色:    #EF4444  ███  (紅色)
用途:    錯誤提示、失敗狀態

示例:
❌ 連接失敗
❌ 戰鬥失敗
```

**信息（Info）**:
```
顏色:    #3B82F6  ███  (藍色)
用途:    一般信息、提示

示例:
💡 提示：可以使用快捷鍵
ℹ️ 系統更新
```

#### 3. 元素類型顏色

**戰鬥元素顏色**:
```
code-task:        #00ccff  ███  藍色
bug-hunt:         #ff0066  ███  紅色
architecture:     #9900ff  ███  紫色
documentation:    #ffcc00  ███  黃色
testing:          #00ff99  ███  綠色
optimization:     #ff9900  ███  橙色
general:          #999999  ███  灰色

使用場景:
🐛 Bug怪物 (bug-hunt)       ← 紅色圖標
📐 架構魔王 (architecture)  ← 紫色圖標
```

#### 4. 異步戰鬥狀態顏色

```
運行中:   #ff6b6b  ███  紅色   🔴
暫停:     #ffd93d  ███  黃色   🟡
排隊:     #6bcfff  ███  藍色   🔵
完成:     #51cf66  ███  綠色   🟢
失敗:     #868e96  ███  灰色   ⚫

示例:
🔴 戰鬥 #1 - 運行中
🟡 戰鬥 #2 - 暫停
🔵 戰鬥 #3 - 排隊
```

---

### 中性色（Neutral Colors）

**背景層次**:
```
主背景:    #1a1a1a  ███  深黑
次背景:    #2a2a2a  ███  深灰
三級背景:  #3a3a3a  ███  中灰

示例:
┌─────────────────┐  #1a1a1a
│ ┌─────────────┐ │  #2a2a2a
│ │ ┌─────────┐ │ │  #3a3a3a
│ │ │ 內容    │ │ │
│ │ └─────────┘ │ │
│ └─────────────┘ │
└─────────────────┘
```

**文字層次**:
```
主文字:    #ffffff  ███  純白
次文字:    #b8b8b8  ███  淺灰
三級文字:  #808080  ███  中灰
禁用文字:  #4a4a4a  ███  深灰

示例:
標題文字       ← #ffffff
描述文字       ← #b8b8b8
輔助信息       ← #808080
禁用按鈕文字   ← #4a4a4a
```

**邊框**:
```
主邊框:    #404040  ███  深灰邊框
次邊框:    #606060  ███  中灰邊框
高亮邊框:  #ffffff  ███  白色邊框（焦點時）

示例:
普通輸入框: border: 2px solid #404040
焦點輸入框: border: 2px solid #ffffff
```

---

## 顏色使用規則

### 1. 對比度要求

**文字可讀性**:
```
標準文字:  4.5:1 (WCAG AA)
大文字:    3:1   (WCAG AA)
高對比:    7:1   (WCAG AAA)

示例:
✅ #ffffff on #1a1a1a (16.9:1) - 優秀
✅ #e0e0e0 on #2a2a2a (10.5:1) - 良好
⚠️ #808080 on #3a3a3a (2.8:1)  - 不足
```

### 2. 色盲友好

**除了顏色，還使用**:
- 圖標區分（✓ 成功, ✗ 失敗）
- 文字標籤
- 紋理/圖案差異

**示例**:
```
不佳設計:
HP: ████████░░  ← 僅用顏色

良好設計:
HP: ████████░░ 80/100  ← 顏色 + 數字
✓ 完成  ❌ 失敗       ← 顏色 + 圖標
```

### 3. 語義化使用

```
✅ 正確:
  - 綠色用於成功、HP
  - 紅色用於錯誤、敵人 HP
  - 藍色用於 MP、信息
  - 金色用於 EXP、金幣

❌ 錯誤:
  - 紅色用於成功
  - 綠色用於錯誤
  - 混淆功能性顏色
```

---

## 字體系統

### 字體族（Font Families）

#### 1. 標題字體（Heading Font）

**Press Start 2P**:
```
字體:      'Press Start 2P', monospace
風格:      8-bit 像素字體
用途:      標題、Logo、重要提示
大小:      16px - 32px
粗細:      400 (Regular)
行高:      1.5

CDN:
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">

示例:
┌────────────────────────┐
│  RPG-CLI               │  ← Press Start 2P, 24px
│  🎮 Code Quest         │
└────────────────────────┘
```

#### 2. 正文字體（Body Font）

**VT323**:
```
字體:      'VT323', monospace
風格:      像素化終端字體
用途:      對話內容、描述文字
大小:      18px - 24px
粗細:      400 (Regular)
行高:      1.3

CDN:
<link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet">

示例:
┌────────────────────────┐
│ 你使用了代碼生成術！    │  ← VT323, 20px
│ 造成 45 點傷害！        │
└────────────────────────┘
```

#### 3. UI 字體（Interface Font）

**Roboto Mono**:
```
字體:      'Roboto Mono', monospace
風格:      現代等寬字體
用途:      按鈕、標籤、數據顯示
大小:      12px - 16px
粗細:      400 (Regular), 700 (Bold)
行高:      1.4

CDN:
<link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap" rel="stylesheet">

示例:
┌────────────────────────┐
│ [確定]  [取消]          │  ← Roboto Mono, 14px
│ HP: 80/100             │
└────────────────────────┘
```

#### 4. 代碼字體（Code Font）

**JetBrains Mono**:
```
字體:      'JetBrains Mono', monospace
風格:      專業代碼字體
用途:      代碼區塊、終端輸出
大小:      14px
粗細:      400 (Regular), 700 (Bold)
行高:      1.6
連字:      啟用 (font-feature-settings: 'liga' 1)

CDN:
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">

示例:
┌────────────────────────┐
│ ```javascript          │
│ const hp = 100;        │  ← JetBrains Mono, 14px
│ ```                    │
└────────────────────────┘
```

---

### 字體大小階梯（Type Scale）

**標準階梯**:
```
h1:  32px  (2.0rem)   Press Start 2P  主標題
h2:  24px  (1.5rem)   Press Start 2P  次標題
h3:  20px  (1.25rem)  Press Start 2P  小標題
h4:  18px  (1.125rem) VT323          區塊標題

body:     16px (1.0rem)  VT323       正文
small:    14px (0.875rem) Roboto Mono 輔助文字
caption:  12px (0.75rem)  Roboto Mono 註釋

code:     14px (0.875rem) JetBrains Mono 代碼

示例:
┌────────────────────────────────┐
│ RPG-CLI                        │  32px (h1)
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                │
│ 探索模式                        │  24px (h2)
│ ────────────────               │
│                                │
│ 你: 修復 login bug              │  16px (body)
│                                │
│ Claude: 開始戰鬥...             │  16px (body)
│                                │
│ [確定]                          │  14px (small)
└────────────────────────────────┘
```

---

### 字體粗細（Font Weights）

**Press Start 2P**:
```
Regular (400):  所有使用情況
```

**VT323**:
```
Regular (400):  所有使用情況
```

**Roboto Mono**:
```
Regular (400):  正常文字
Bold (700):     強調、按鈕
```

**JetBrains Mono**:
```
Regular (400):  正常代碼
Bold (700):     關鍵字、強調
```

---

### 行高（Line Height）

```
標題:    1.2 - 1.3  緊湊，視覺衝擊
正文:    1.4 - 1.5  舒適閱讀
代碼:    1.6 - 1.8  清晰對齊

示例:
標題 (line-height: 1.2):
RPG-CLI
探索模式

正文 (line-height: 1.5):
你使用了代碼生成術！
造成 45 點傷害！
Bug怪物剩餘 HP: 55/100

代碼 (line-height: 1.6):
function attack() {
  damage = 45;
  enemyHP -= damage;
}
```

---

## 圖標規範

### 圖標來源

**Emoji（首選）**:
```
優點:  跨平台、無需載入、即時可用
缺點:  樣式不統一（依賴系統）

常用 Emoji:
⚔️  戰鬥、攻擊
🛡️  防禦、保護
🔮  技能、魔法
💰  金幣、經濟
⚡  MP、能量
❤️  HP、生命
⭐  EXP、經驗
🏰  城鎮、主世界
🌲  Worktree、分支
🐛  Bug、錯誤
📦  Commit、版本
🧪  測試、試煉
```

**SVG Icons（輔助）**:
```
用途:  需要統一風格的 UI 圖標
大小:  16px, 24px, 32px
風格:  像素化、單色、簡潔

示例:
<svg width="24" height="24">
  <!-- 劍圖標 -->
  <path d="M..." fill="#ffffff"/>
</svg>
```

---

### 圖標大小

```
極小:  16px  輔助圖標、狀態指示
小:    24px  按鈕圖標、列表項
中:    32px  卡片圖標、功能區
大:    48px  主要功能、特色展示
巨大:  64px+ 敵人圖標、場景裝飾

示例:
16px: ⚡ (MP 圖標)
24px: 🔮 (技能按鈕)
32px: 🏰 (場所入口)
48px: 🐛 (敵人頭像)
```

---

### 圖標顏色

**單色圖標**:
```
默認:    #ffffff  白色
禁用:    #808080  灰色
高亮:    #00ccff  青色
警告:    #ff9900  橙色
錯誤:    #ff0000  紅色

示例:
✓ 完成  (#00ff00)
✗ 失敗  (#ff0000)
⏸️ 暫停  (#ffd93d)
```

**全彩圖標（Emoji）**:
```
保持原色，無需修改

示例:
⚔️  劍（保持系統顏色）
💰  金幣（保持系統顏色）
```

---

## 實際應用示例

### 1. 探索模式 UI

```css
/* 背景 */
.explore-mode {
  background: #1a4d2e;
  color: #e0e0e0;
  font-family: 'VT323', monospace;
  font-size: 16px;
}

/* 標題 */
.explore-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 24px;
  color: #4caf50;
  text-shadow: 2px 2px 0 #1a4d2e;
}

/* HP 條 */
.hp-bar {
  background: linear-gradient(to right, #4caf50, #8bc34a);
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
  border: 2px solid #2e7d32;
  color: #ffffff;
}

/* HP 條（低生命） */
.hp-bar.low {
  background: linear-gradient(to right, #f44336, #ff7961);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

### 2. 戰鬥模式 UI

```css
/* 背景 */
.battle-mode {
  background: #4d1a1a;
  color: #e0e0e0;
  font-family: 'VT323', monospace;
  font-size: 16px;
}

/* 標題 */
.battle-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 24px;
  color: #f44336;
  text-shadow: 2px 2px 0 #7f0000;
}

/* 敵人 HP 條 */
.enemy-hp-bar {
  background: linear-gradient(to right, #f44336, #ef5350);
  box-shadow: 0 0 10px rgba(244, 67, 54, 0.5);
  border: 2px solid #b71c1c;
}

/* 傷害數字 */
.damage-number {
  font-family: 'Press Start 2P', monospace;
  font-size: 20px;
  color: #ffffff;
  text-shadow: 2px 2px 4px #000;
  animation: floatUp 1s ease-out;
}

@keyframes floatUp {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-80px);
    opacity: 0;
  }
}
```

### 3. 按鈕樣式

```css
/* 探索模式按鈕 */
.button-explore {
  background: linear-gradient(to bottom, #4caf50, #388e3c);
  border: 3px solid #2e7d32;
  color: white;
  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  padding: 10px 20px;
  text-shadow: 2px 2px 0 #1b5e20;
  box-shadow: 0 4px 0 #1b5e20;
  cursor: pointer;
  transition: all 0.1s;
}

.button-explore:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 #1b5e20;
}

.button-explore:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #1b5e20;
}

/* 戰鬥模式按鈕 */
.button-battle {
  background: linear-gradient(to bottom, #f44336, #d32f2f);
  border: 3px solid #b71c1c;
  color: white;
  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  padding: 10px 20px;
  text-shadow: 2px 2px 0 #7f0000;
  box-shadow: 0 4px 0 #7f0000;
}
```

### 4. 進度條樣式

```css
/* HP 條 */
.progress-hp {
  background: #2a2a2a;
  border: 2px solid #404040;
  height: 20px;
  border-radius: 4px;
  overflow: hidden;
}

.progress-hp-fill {
  background: linear-gradient(to right, #4caf50, #8bc34a);
  height: 100%;
  transition: width 0.5s ease-out;
  box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.3);
}

/* MP 條 */
.progress-mp-fill {
  background: linear-gradient(to right, #2196f3, #64b5f6);
  box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.3);
}

/* EXP 條 */
.progress-exp-fill {
  background: linear-gradient(to right, #ffc107, #ffd54f);
  box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.3);
}
```

### 5. 代碼區塊樣式

```css
.code-block {
  background: #1a1a1a;
  border: 2px solid #404040;
  border-radius: 4px;
  padding: 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #e0e0e0;
  overflow-x: auto;
}

.code-block .keyword {
  color: #ff79c6;
  font-weight: 700;
}

.code-block .string {
  color: #50fa7b;
}

.code-block .number {
  color: #bd93f9;
}

.code-block .comment {
  color: #6272a4;
  font-style: italic;
}
```

---

## CSS 變量定義

```css
:root {
  /* 探索模式 */
  --explore-bg: #1a4d2e;
  --explore-primary: #4caf50;
  --explore-text: #e0e0e0;
  --explore-accent: #81c784;

  /* 戰鬥模式 */
  --battle-bg: #4d1a1a;
  --battle-primary: #f44336;
  --battle-text: #e0e0e0;
  --battle-accent: #ef5350;

  /* 功能性顏色 */
  --hp-color: #E74C3C;
  --mp-color: #3498DB;
  --exp-color: #F39C12;
  --gold-color: #FFD700;

  /* 反饋顏色 */
  --success-color: #10b981;
  --warning-color: #F59E0B;
  --error-color: #EF4444;
  --info-color: #3B82F6;

  /* 中性色 */
  --bg-primary: #1a1a1a;
  --bg-secondary: #2a2a2a;
  --bg-tertiary: #3a3a3a;
  --text-primary: #ffffff;
  --text-secondary: #b8b8b8;
  --text-tertiary: #808080;
  --border-color: #404040;

  /* 字體 */
  --font-title: 'Press Start 2P', monospace;
  --font-body: 'VT323', monospace;
  --font-ui: 'Roboto Mono', monospace;
  --font-code: 'JetBrains Mono', monospace;
}
```

---

## 可訪問性檢查清單

### 顏色對比度
- [ ] 所有文字 ≥ 4.5:1
- [ ] 大文字 ≥ 3:1
- [ ] UI 元素 ≥ 3:1
- [ ] 焦點指示器清晰可見

### 色盲友好
- [ ] 不僅依賴顏色區分
- [ ] 使用圖標輔助
- [ ] 提供文字標籤
- [ ] 紋理/圖案差異

### 字體可讀性
- [ ] 最小字體 ≥ 12px
- [ ] 行高適當（1.4-1.6）
- [ ] 字間距合理
- [ ] 對齊清晰

---

**版本**: v1.0
**最後更新**: 2026-02-05
