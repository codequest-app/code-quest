# Dragon Quest 風格 RPG UI 開發工具研究報告

**研究日期**: 2026-02-09
**研究目的**: 為 Code Quest 專案選擇最適合的 DQ 風格 UI 開發工具

---

## 📋 目錄

1. [方案總覽](#方案總覽)
2. [純 CSS 框架方案](#純-css-框架方案)
3. [遊戲引擎方案](#遊戲引擎方案)
4. [渲染引擎方案](#渲染引擎方案)
5. [方案比較與建議](#方案比較與建議)
6. [實作路線圖](#實作路線圖)

---

## 方案總覽

根據研究結果，適合 DQ 風格 RPG 的開發工具可分為三大類：

| 類別 | 代表工具 | 適用場景 | 學習曲線 |
|------|---------|---------|----------|
| **純 CSS 框架** | RPGUI, NES.css, SNES.css | UI 主導的應用 | ⭐ 簡單 |
| **遊戲引擎** | Phaser + React, RPG-JS | 完整遊戲開發 | ⭐⭐⭐⭐ 複雜 |
| **渲染引擎** | PixiJS + PixiUI | 高效能動畫 | ⭐⭐⭐ 中等 |

---

## 純 CSS 框架方案

### 1. RPGUI ⭐⭐⭐⭐⭐ (最推薦 DQ 風格)

**GitHub**: [RonenNess/RPGUI](https://github.com/RonenNess/RPGUI)
**官網**: [RPGUI Demo](https://ronenness.github.io/RPGUI/)

#### 核心特點

**專為 RPG GUI 設計**：
- ✅ **零依賴** - 純 CSS + 少量 JavaScript
- ✅ **輕量級** - 僅 25KB (CSS + JS) + 1.35MB (圖片資源)
- ✅ **開箱即用** - 不需要寫任何 JavaScript

**技術實作**：
```html
<!-- 引入 RPGUI -->
<link href="dist/rpgui.css" rel="stylesheet" type="text/css">
<script src="dist/rpgui.js"></script>

<!-- 包裝內容 -->
<div class="rpgui-content">
  <!-- 使用 RPGUI 類別 -->
  <div class="rpgui-container framed-golden">
    <h1>戰鬥系統</h1>
    <button class="rpgui-button">攻擊</button>
  </div>
</div>
```

#### 提供的組件

**容器與框架**：
- `framed` - 基礎木質框架
- `framed-golden` - 金色框架（DQ 風格！）
- `framed-golden-2` - 雙層金框
- `framed-grey` - 灰色石質框架

**UI 元素**：
- 可拖曳容器（視窗）
- 滑桿與進度條（紅/綠/藍/紫色）
- 內建 RPG 圖標（劍、盾、藥水、護甲槽）
- 表單元素（下拉選單、清單、核取方塊、單選按鈕）
- 生命值 / 魔力條
- 像素風格游標

#### JavaScript API

```javascript
// 動態創建元素
RPGUI.create('button', { text: '攻擊', onclick: handleAttack });

// 設定值（觸發 change 事件）
RPGUI.set_value(element, newValue);

// 獲取值
const value = RPGUI.get_value(element);
```

#### 瀏覽器支援

- ✅ Chrome, Firefox, Opera - 完整支援
- ⚠️ Internet Explorer Edge - 游標和濾鏡有小問題，但可用

#### 優點

- ✅ **完美匹配 DQ 風格** - 金色框架、復古 UI
- ✅ **極輕量** - 不會增加顯著的 bundle size
- ✅ **零學習曲線** - 只需要套用 CSS 類別
- ✅ **React 友好** - 純 CSS，完美整合
- ✅ **自帶圖片資源** - 不需要自己找素材

#### 缺點

- ❌ **有限的動畫** - CSS 動畫為主
- ❌ **靜態風格** - 客製化需要覆寫 CSS
- ❌ **無粒子效果** - 需要額外的動畫庫

---

### 2. NES.css ⭐⭐⭐ (8-bit 風格)

**GitHub**: [nostalgic-css/NES.css](https://github.com/nostalgic-css/NES.css)
**官網**: [NES.css](https://nostalgic-css.github.io/NES.css/)

#### 核心特點

**8-bit 懷舊風格**：
- ✅ **純 CSS** - 零 JavaScript
- ✅ **豐富組件** - 按鈕、對話框、清單、表格、圖標
- ✅ **推薦字體** - Press Start 2P

**使用方式**：
```html
<!-- 安裝 -->
<link href="https://unpkg.com/nes.css@latest/css/nes.min.css" rel="stylesheet">

<!-- 使用 -->
<button class="nes-btn is-primary">Primary</button>
<button class="nes-btn is-warning">Warning</button>

<label>
  <input type="checkbox" class="nes-checkbox">
  <span>同意條款</span>
</label>

<progress class="nes-progress is-success" value="80" max="100"></progress>
```

#### 組件類別

**按鈕變化**：
- `nes-btn` - 基礎按鈕
- `is-primary` - 藍色
- `is-success` - 綠色
- `is-warning` - 黃色
- `is-error` - 紅色

**表單元素**：
- `nes-radio` - 單選按鈕
- `nes-checkbox` - 核取方塊
- `nes-select` - 下拉選單
- `nes-input` - 文字輸入框

**其他元素**：
- `nes-container` - 容器
- `nes-balloon` - 對話框
- `nes-table` - 表格
- 內建 8-bit 圖標

#### 優點

- ✅ **經典 8-bit 美學** - 適合復古 RPG
- ✅ **簡單易用** - 只需套用類別
- ✅ **活躍社群** - 超過 20k GitHub stars
- ✅ **完整文檔** - 範例豐富

#### 缺點

- ❌ **偏向 NES 而非 DQ** - 風格不完全匹配
- ❌ **不包含佈局** - 需要自己處理 layout
- ❌ **英文優先** - 其他語言需要換字體

---

### 3. SNES.css ⭐⭐⭐⭐ (16-bit 風格)

**GitHub**: [devMiguelCarrero/snes.css](https://github.com/devMiguelCarrero/snes.css)
**官網**: [SNES.css](https://snes-css.sadlative.com/)

#### 核心特點

**16-bit Super Nintendo 美學**：
- ✅ **像素藝術 UI** - 回歸 SNES 時代
- ✅ **復古配色** - 16-bit 時代的色彩
- ✅ **響應式設計** - 適應各種螢幕尺寸
- ✅ **可客製化** - 元件可調整

**安裝方式**：
```bash
# NPM
npm install snes.css

# CDN
<link rel="stylesheet" href="https://unpkg.com/snes.css@latest/dist/snes.css">
```

#### 哲學理念

**框架理念**：
- 只提供元件樣式，不包含佈局
- 無 JavaScript 依賴
- 適合與 React、Tailwind 等框架整合

#### 優點

- ✅ **DQ 時代美學** - Dragon Quest 是 SNES 黃金時期作品
- ✅ **現代框架友好** - 易於整合
- ✅ **16-bit 精緻度** - 比 8-bit 更細緻

#### 缺點

- ❌ **元件較少** - 相對 NES.css 較新
- ❌ **社群較小** - 資源較少
- ❌ **文檔較簡略** - 需要自己摸索

---

## 遊戲引擎方案

### 1. Phaser + React ⭐⭐⭐⭐ (完整遊戲引擎)

**GitHub**: [phaserjs/template-react](https://github.com/phaserjs/template-react)
**官網**: [Phaser.io](https://phaser.io/)

#### 核心特點

**完整的 HTML5 遊戲框架**：
- ✅ **官方 React 模板** - 無縫整合
- ✅ **熱重載支援** - Vite 驅動的開發體驗
- ✅ **事件總線** - React ↔ Phaser 通訊
- ✅ **場景系統** - 完整的遊戲狀態管理

#### 專案結構

```
project/
├── src/
│   ├── main.jsx              # React 入口
│   ├── PhaserGame.jsx        # Bridge 組件
│   ├── game/
│   │   ├── main.jsx          # Phaser 入口
│   │   ├── scenes/           # 遊戲場景
│   │   │   ├── Boot.js
│   │   │   ├── MainMenu.js
│   │   │   └── Game.js
│   └── App.jsx               # React App
├── public/
│   └── assets/               # 遊戲資源
└── vite/                     # 建構配置
```

#### React ↔ Phaser 通訊

**方法 1: EventBus (推薦)**
```javascript
// Phaser 場景中
import { EventBus } from '../EventBus';

class BattleScene extends Phaser.Scene {
  create() {
    // 通知 React 場景已準備
    EventBus.emit('scene-ready', this);

    // 監聽 React 事件
    EventBus.on('attack-command', this.handleAttack, this);
  }

  handleAttack(target) {
    // 執行攻擊邏輯
    this.playAttackAnimation(target);
  }
}

// React 組件中
import { EventBus } from './game/EventBus';

function BattleUI() {
  useEffect(() => {
    // 監聽 Phaser 事件
    EventBus.on('battle-complete', handleBattleComplete);

    return () => {
      EventBus.off('battle-complete', handleBattleComplete);
    };
  }, []);

  const handleAttackClick = () => {
    // 發送到 Phaser
    EventBus.emit('attack-command', selectedEnemy);
  };
}
```

**方法 2: ForwardRef**
```javascript
// PhaserGame.jsx
const PhaserGame = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({
    game,           // Phaser.Game 實例
    scene           // 當前場景
  }));
});

// App.jsx
function App() {
  const phaserRef = useRef();

  const attackEnemy = () => {
    // 直接訪問 Phaser 場景
    phaserRef.current.scene.attackEnemy(target);
  };
}
```

#### 開發體驗

**熱重載**：
```bash
npm run dev  # 啟動 Vite dev server (http://localhost:8080)
```
- ✅ 程式碼變更自動重載
- ✅ 保持遊戲狀態（可選）
- ✅ 快速迭代

**生產建構**：
```bash
npm run build  # 輸出到 dist/
```

#### Phaser 功能

**物理引擎**：
- Arcade Physics（簡單快速）
- Matter.js（進階物理）

**輸入系統**：
- 鍵盤、滑鼠、觸控
- 遊戲手把支援

**音效系統**：
- Web Audio API
- 音效池管理

**動畫系統**：
- Sprite 動畫
- Tween 系統
- 時間軸控制

#### 適用場景

- ✅ **2D 俯視地圖** - Phaser 的強項
- ✅ **複雜動畫** - 角色移動、戰鬥特效
- ✅ **地圖編輯器** - 支援 Tiled Map Editor
- ✅ **碰撞檢測** - 物理引擎內建

#### 優點

- ✅ **成熟穩定** - 10+ 年開發歷史
- ✅ **官方 React 整合** - 不是第三方 hack
- ✅ **豐富生態系** - 大量插件和教程
- ✅ **完整功能** - 涵蓋遊戲開發各方面
- ✅ **優秀效能** - WebGL 渲染

#### 缺點

- ❌ **學習曲線陡峭** - 需要理解遊戲引擎概念
- ❌ **Bundle Size 較大** - 完整引擎約 1MB+
- ❌ **過度設計風險** - 如果只需要 UI，Phaser 太重

---

### 2. RPG-JS ⭐⭐⭐ (專業 RPG 框架)

**GitHub**: [RSamaium/RPG-JS](https://github.com/RSamaium/RPG-JS)

#### 核心特點

**專為 RPG 設計的框架**：
- ✅ **TypeScript 原生支援** - 94.3% TypeScript 代碼
- ✅ **PixiJS 渲染** - 高效能 WebGL
- ✅ **MMORPG 支援** - 可擴展為多人遊戲
- ❌ **僅支援 Vue.js** - 不支援 React

#### 技術棧

```typescript
// TypeScript 為主
TypeScript: 94.3%
JavaScript: 4.6%
Vue: 1.1%
```

**渲染引擎**: WebGL + PixiJS

#### RPG 專屬功能

**事件系統**：
- NPC 創建與對話
- 怪物生成
- 任務觸發

**地圖系統**：
- **Tiled Map Editor 整合** - 可視化地圖編輯
- 多圖層支援
- 形狀與碰撞檢測

**角色系統**：
- 外觀客製化
- 動畫系統
- 屬性管理

**輸入系統**：
- 行動裝置
- 遊戲手把
- 鍵盤

#### 架構理念

**統一代碼庫**：
```
同一套代碼 → 可製作單機 RPG 或 MMORPG
                    ↓
              使用 Agones + Kubernetes
                    ↓
              擴展至數千玩家
```

**模組化設計**：
- 插件系統
- 內建單元測試

#### 為何不適合 Code Quest？

- ❌ **Vue.js 限制** - Code Quest 使用 React
- ❌ **完整遊戲引擎** - 對我們來說太重
- ❌ **MMORPG 導向** - 我們不需要多人功能
- ❌ **學習成本高** - 需要理解完整框架

#### 適用場景

- ✅ 想要製作傳統 RPG 遊戲
- ✅ 需要地圖編輯器整合
- ✅ 計畫擴展為 MMORPG
- ✅ 使用 Vue.js 技術棧

---

## 渲染引擎方案

### 1. PixiJS + PixiUI ⭐⭐⭐⭐⭐ (高效能方案)

**PixiJS 官網**: [pixijs.com](https://pixijs.com/)
**PixiUI 文檔**: [pixijs.io/ui](https://pixijs.io/ui/)

#### 核心特點

**最快的 2D WebGL 渲染器**：
- ✅ **極致效能** - WebGL 硬體加速
- ✅ **靈活彈性** - 完全控制渲染
- ✅ **React 整合友好** - 可用 react-pixi

#### PixiUI 組件庫

**可用組件**：

| 組件 | 說明 | 適用場景 |
|------|------|----------|
| `Button` | 基礎按鈕 | 攻擊、技能按鈕 |
| `FancyButton` | 多狀態按鈕 | 互動式按鈕 |
| `CheckBox` | 核取方塊 | 設定選項 |
| `RadioGroup` | 單選按鈕組 | 選擇 AI 模型 |
| `Slider` | 滑桿 | 音量、速度調整 |
| `DoubleSlider` | 雙滑桿 | 範圍選擇 |
| `Input` | 文字輸入 | Prompt 輸入 |
| `List` | 清單 | 技能清單 |
| `ScrollBox` | 滾動容器 | 戰鬥日誌 |
| `Select` | 下拉選單 | 選項選擇 |
| `Dialog` | 對話框 | 確認視窗 |
| `ProgressBar` | 進度條 | HP/MP 條 |
| `CircularProgressBar` | 圓形進度 | 技能冷卻 |
| `Switcher` | 切換器 | 場景切換 |
| `MaskedFrame` | 遮罩容器 | 特效區域 |
| `Trackpad` | 觸控板 | 觸控輸入 |

**安裝與使用**：
```bash
npm install pixi.js @pixi/ui
```

```javascript
import { Application } from 'pixi.js';
import { Button, ProgressBar } from '@pixi/ui';

// 創建 PixiJS 應用
const app = new Application();
await app.init({ width: 800, height: 600 });

// 創建按鈕
const button = new Button();
button.text = '攻擊';
button.onPress.connect(() => {
  console.log('攻擊！');
});

// 創建 HP 條
const hpBar = new ProgressBar({
  value: 80,
  maxValue: 100,
  width: 200,
  height: 20
});

app.stage.addChild(button, hpBar);
```

#### 客製化能力

**完全可擴展**：
```javascript
// 客製化按鈕
const customButton = new FancyButton({
  defaultView: 'button-normal.png',
  hoverView: 'button-hover.png',
  pressedView: 'button-pressed.png',
  text: new Text({
    text: 'Attack',
    style: { fontFamily: 'Press Start 2P', fontSize: 16 }
  }),
  padding: 12
});

// 事件處理
customButton.onPress.connect(() => {
  // 自訂行為
});

customButton.onHover.connect(() => {
  // Hover 效果
});
```

#### 與 React 整合

**使用 react-pixi**：
```bash
npm install @pixi/react
```

```jsx
import { Stage, Container, Sprite, Text } from '@pixi/react';

function BattleScene() {
  return (
    <Stage width={800} height={600}>
      <Container x={100} y={100}>
        <Sprite image="hero.png" />
        <Text
          text="HP: 100/100"
          style={{ fontFamily: 'Press Start 2P', fontSize: 14 }}
        />
      </Container>
    </Stage>
  );
}
```

#### 版本相容性

| PixiUI 版本 | PixiJS 版本 | 備註 |
|------------|------------|------|
| v1.x | v7.x | 需要 v7.1.1+ (pointer events) |
| v2.x | v8.x | 最新版本 |

#### 動畫能力

**Sprite 動畫**：
```javascript
import { AnimatedSprite, Texture } from 'pixi.js';

// 角色走路動畫
const textures = [
  Texture.from('walk-1.png'),
  Texture.from('walk-2.png'),
  Texture.from('walk-3.png'),
  Texture.from('walk-4.png')
];

const character = new AnimatedSprite(textures);
character.animationSpeed = 0.1;
character.play();
```

**技能特效**：
```javascript
// 粒子系統（需要額外插件）
import { Emitter } from '@pixi/particle-emitter';

const emitter = new Emitter(
  container,
  {
    lifetime: { min: 0.5, max: 0.5 },
    frequency: 0.001,
    spawnChance: 1,
    particlesPerWave: 1,
    emitterLifetime: 0.31,
    maxParticles: 1000,
    pos: { x: 0, y: 0 },
    behaviors: [
      // 行為配置
    ]
  }
);
```

#### 優點

- ✅ **最佳效能** - WebGL 硬體加速
- ✅ **完全控制** - 精確控制每個像素
- ✅ **豐富動畫** - 適合戰鬥特效
- ✅ **React 整合** - react-pixi 成熟穩定
- ✅ **活躍社群** - 大量資源和插件

#### 缺點

- ❌ **學習曲線** - 需要理解渲染概念
- ❌ **需要素材** - 不像 CSS 框架有內建樣式
- ❌ **較複雜** - 相比純 CSS 需要更多代碼

---

## 方案比較與建議

### 完整對比表

| 方案 | 複雜度 | 效能 | DQ風格 | React整合 | 動畫能力 | Bundle Size | 推薦度 |
|------|-------|------|--------|----------|----------|-------------|--------|
| **RPGUI** | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | 25KB + 1.35MB | ⭐⭐⭐⭐⭐ |
| **NES.css** | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ | ~30KB | ⭐⭐⭐ |
| **SNES.css** | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ~20KB | ⭐⭐⭐⭐ |
| **Phaser+React** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 1MB+ | ⭐⭐⭐ |
| **RPG-JS** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ❌ Vue | ⭐⭐⭐⭐⭐ | 1MB+ | ⭐ |
| **PixiJS+UI** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 500KB+ | ⭐⭐⭐⭐ |

### 使用場景建議

#### 場景 1: 靜態 UI（選單、對話框、狀態面板）

**推薦**: RPGUI + SNES.css

**理由**：
- ✅ 完美的 DQ 風格
- ✅ 零學習曲線
- ✅ 極小 bundle size
- ✅ React 完美整合

**實作方式**：
```jsx
import 'rpgui/dist/rpgui.css';
import 'snes.css/dist/snes.css';

function BattleMenu() {
  return (
    <div className="rpgui-content">
      <div className="rpgui-container framed-golden">
        <h3>選擇行動</h3>
        <button className="rpgui-button">⚔️ 攻擊</button>
        <button className="rpgui-button">🛡️ 防禦</button>
        <button className="rpgui-button">✨ 魔法</button>
      </div>
    </div>
  );
}
```

---

#### 場景 2: 動態動畫（戰鬥特效、技能施放）

**推薦**: PixiJS + PixiUI

**理由**：
- ✅ 最佳效能
- ✅ 豐富動畫能力
- ✅ 粒子系統
- ✅ 完全控制

**實作方式**：
```jsx
import { Stage, Container, AnimatedSprite } from '@pixi/react';
import { useEffect } from 'react';

function BattleAnimation({ skill }) {
  return (
    <Stage width={800} height={600}>
      <Container x={400} y={300}>
        {/* 技能動畫 */}
        <SkillEffect skill={skill} />
        {/* 傷害數字 */}
        <DamageNumber value={150} />
      </Container>
    </Stage>
  );
}
```

---

#### 場景 3: 2D 俯視地圖（可選功能）

**推薦**: Phaser + React

**理由**：
- ✅ 內建地圖系統
- ✅ 物理引擎
- ✅ Tiled Map Editor 整合
- ✅ 碰撞檢測

**實作方式**：
```jsx
import { PhaserGame } from './PhaserGame';
import { EventBus } from './game/EventBus';

function MapExplorer() {
  const phaserRef = useRef();

  useEffect(() => {
    EventBus.on('location-changed', handleLocationChange);
  }, []);

  return (
    <PhaserGame ref={phaserRef} />
  );
}
```

---

### 🎯 Code Quest 最佳方案

基於 Code Quest 的需求分析，建議採用**混合方案**：

```
┌─────────────────────────────────────────┐
│  UI Layer (React)                       │
│  ├─ 靜態 UI → RPGUI + SNES.css          │
│  │   • 選單系統                         │
│  │   • 對話框                           │
│  │   • 狀態面板                         │
│  │                                      │
│  ├─ 動畫層 → PixiJS (可選)              │
│  │   • 戰鬥特效                         │
│  │   • 技能動畫                         │
│  │   • 粒子系統                         │
│  │                                      │
│  └─ 地圖系統 → Phaser (可選，Phase 4)   │
│      • 2D 俯視地圖                       │
│      • 角色移動                         │
└─────────────────────────────────────────┘
```

### 實作優先級

**Phase 1: 核心 UI（Week 1-3）**
```typescript
✅ RPGUI - 基礎框架與容器
✅ SNES.css - 補充樣式
✅ React 組件封裝
✅ DQ 風格主題色
```

**Phase 2: 動畫增強（Week 4-6，可選）**
```typescript
⚠️ PixiJS - 戰鬥動畫
⚠️ Framer Motion - 過場動畫
⚠️ 粒子特效系統
```

**Phase 3: 2D 地圖（Week 7-10，可選）**
```typescript
🔮 Phaser - 地圖引擎
🔮 Tiled 地圖編輯
🔮 角色移動系統
```

---

## 實作路線圖

### Week 1-2: RPGUI 基礎整合

**目標**: 建立基礎 DQ 風格 UI

**任務**：
```bash
# 1. 安裝依賴
npm install rpgui

# 2. 引入樣式
# packages/ui/src/index.css
@import 'rpgui/dist/rpgui.css';

# 3. 創建基礎組件
# packages/ui/src/components/RPG/
├── Container.tsx      # 容器組件
├── Button.tsx         # 按鈕組件
├── ProgressBar.tsx    # 進度條組件
└── Dialog.tsx         # 對話框組件
```

**範例組件**：
```tsx
// packages/ui/src/components/RPG/Container.tsx
import { ReactNode } from 'react';

interface RPGContainerProps {
  variant?: 'framed' | 'framed-golden' | 'framed-golden-2' | 'framed-grey';
  children: ReactNode;
  draggable?: boolean;
}

export function RPGContainer({
  variant = 'framed-golden',
  children,
  draggable = false
}: RPGContainerProps) {
  const classes = [
    'rpgui-container',
    variant,
    draggable && 'rpgui-draggable'
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
}
```

**驗收標準**：
- ✅ 顯示金色框架容器
- ✅ 按鈕有 DQ 風格
- ✅ HP/MP 條正確顯示
- ✅ 可拖曳視窗運作

---

### Week 3-4: SNES.css 樣式補充

**目標**: 增強 16-bit 美學

**任務**：
```bash
# 1. 安裝 SNES.css
npm install snes.css

# 2. 創建主題配置
# packages/ui/src/theme/dq-theme.ts
export const dqTheme = {
  colors: {
    gold: '#f4d03f',
    darkGold: '#c39c43',
    blue: '#2196f3',
    red: '#dc3545',
    green: '#4caf50',
  },
  fonts: {
    pixel: 'Press Start 2P, monospace'
  }
};

# 3. 整合 Tailwind（可選）
# tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        pixel: ['Press Start 2P', 'monospace']
      },
      colors: {
        'dq-gold': '#f4d03f',
        'dq-blue': '#2196f3'
      }
    }
  }
};
```

**驗收標準**：
- ✅ 16-bit 配色應用
- ✅ 像素字體正確渲染
- ✅ 響應式佈局運作

---

### Week 5-8: 動畫系統（可選）

**目標**: 戰鬥動畫與特效

**選項 A: Framer Motion（輕量）**
```bash
npm install framer-motion
```

```tsx
// 簡單的技能施放動畫
import { motion } from 'framer-motion';

function SkillCast() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      ⚔️ 攻擊！
    </motion.div>
  );
}
```

**選項 B: PixiJS（完整）**
```bash
npm install pixi.js @pixi/react @pixi/ui
```

```tsx
// 複雜的戰鬥特效
import { Stage, Container, AnimatedSprite } from '@pixi/react';

function BattleEffect({ skill }) {
  return (
    <Stage width={800} height={600}>
      <Container>
        <SkillAnimation skill={skill} />
        <ParticleEffect type="explosion" />
        <DamageNumber value={150} />
      </Container>
    </Stage>
  );
}
```

**決策點**：
- 如果只需要簡單動畫 → Framer Motion
- 如果需要複雜特效 → PixiJS

---

### Week 9-12: 2D 地圖（可選，Phase 4）

**目標**: 實作俯視地圖模式

**技術選擇**: Phaser + React

```bash
npm install phaser
npm install --save-dev @phaserjs/template-react
```

**專案結構**：
```
packages/ui/src/game/
├── main.ts                    # Phaser 配置
├── scenes/
│   ├── TownScene.ts          # 城鎮場景
│   ├── WildernessScene.ts    # 野外場景
│   └── DungeonScene.ts       # 副本場景
├── components/
│   ├── Player.ts             # 玩家角色
│   ├── NPC.ts                # NPC
│   └── Building.ts           # 建築物
└── maps/
    ├── town.json             # Tiled 地圖
    └── wilderness.json
```

**決策點**：
- ⚠️ 是否實作 2D 地圖？
  - 優點：沉浸式體驗
  - 缺點：開發時間長、複雜度高
- 💡 建議：Phase 1-3 先用對話模式，Phase 4 再評估

---

## 程式碼範例集

### 範例 1: 完整的戰鬥 UI

```tsx
// packages/ui/src/components/Battle/BattleScreen.tsx
import { RPGContainer } from '../RPG/Container';
import { RPGButton } from '../RPG/Button';
import { ProgressBar } from '../RPG/ProgressBar';
import { motion, AnimatePresence } from 'framer-motion';

interface BattleScreenProps {
  player: {
    name: string;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
  };
  enemy: {
    name: string;
    hp: number;
    maxHp: number;
  };
  onAttack: () => void;
  onDefend: () => void;
  onSkill: () => void;
}

export function BattleScreen({ player, enemy, onAttack, onDefend, onSkill }: BattleScreenProps) {
  return (
    <div className="rpgui-content flex flex-col items-center justify-center min-h-screen bg-black">
      {/* 敵人區域 */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-12"
      >
        <RPGContainer variant="framed-grey">
          <h2 className="text-2xl mb-4">{enemy.name}</h2>
          <ProgressBar
            current={enemy.hp}
            max={enemy.maxHp}
            color="red"
            label="HP"
          />
        </RPGContainer>
      </motion.div>

      {/* 戰鬥日誌 */}
      <AnimatePresence>
        <BattleLog messages={battleMessages} />
      </AnimatePresence>

      {/* 玩家區域 */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mt-12"
      >
        <RPGContainer variant="framed-golden">
          <h2 className="text-xl mb-4">{player.name}</h2>
          <ProgressBar
            current={player.hp}
            max={player.maxHp}
            color="green"
            label="HP"
          />
          <ProgressBar
            current={player.mp}
            max={player.maxMp}
            color="blue"
            label="MP"
          />
        </RPGContainer>
      </motion.div>

      {/* 行動選單 */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <RPGContainer variant="framed-golden-2">
          <div className="grid grid-cols-2 gap-4">
            <RPGButton onClick={onAttack}>
              ⚔️ 攻擊
            </RPGButton>
            <RPGButton onClick={onDefend}>
              🛡️ 防禦
            </RPGButton>
            <RPGButton onClick={onSkill}>
              ✨ 技能
            </RPGButton>
            <RPGButton onClick={onItem}>
              🎒 道具
            </RPGButton>
          </div>
        </RPGContainer>
      </motion.div>
    </div>
  );
}
```

---

### 範例 2: DQ 風格彈出選單

```tsx
// packages/ui/src/components/Battle/BattleMenu.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { RPGContainer } from '../RPG/Container';

interface Battle {
  id: string;
  model: 'haiku' | 'sonnet' | 'opus';
  status: 'active' | 'paused' | 'completed';
  hp: number;
  progress: string;
  lastAction: string;
  needsDecision: boolean;
}

interface BattleMenuProps {
  isOpen: boolean;
  battles: Battle[];
  onSelect: (battleId: string) => void;
  onClose: () => void;
}

export function BattleMenu({ isOpen, battles, onSelect, onClose }: BattleMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />

          {/* 選單 */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
          >
            <RPGContainer variant="framed-golden-2">
              <h2 className="text-xl mb-6 text-center">🎯 活躍戰鬥列表</h2>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {battles.map((battle, index) => (
                  <motion.button
                    key={battle.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => onSelect(battle.id)}
                    className="w-full text-left p-4 bg-black border-2 border-gold hover:bg-gold hover:text-black transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg">
                        {battle.model === 'haiku' && '🌸'}
                        {battle.model === 'sonnet' && '🎵'}
                        {battle.model === 'opus' && '👑'}
                        {' '}[{battle.model}]
                      </span>
                      {battle.needsDecision && (
                        <span className="text-yellow-400">⚠️</span>
                      )}
                    </div>

                    <div className="text-sm space-y-1">
                      <div>HP: {'█'.repeat(Math.floor(battle.hp / 10))}{'░'.repeat(10 - Math.floor(battle.hp / 10))} {battle.hp}%</div>
                      <div>進度: {battle.progress}</div>
                      <div className="text-gray-400">最後動作: {battle.lastAction}</div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="mt-6 text-center text-sm text-gray-400">
                [選擇戰鬥 1-{battles.length}] [ESC 關閉]
              </div>
            </RPGContainer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

---

## 資料來源

### CSS 框架
- [RPGUI GitHub](https://github.com/RonenNess/RPGUI) - 輕量 RPG GUI 框架
- [RPGUI Demo](https://ronenness.github.io/RPGUI/) - 線上示範
- [NES.css](https://nostalgic-css.github.io/NES.css/) - 8-bit 風格框架
- [NES.css GitHub](https://github.com/nostalgic-css/NES.css)
- [SNES.css](https://snes-css.sadlative.com/) - 16-bit 風格框架
- [SNES.css GitHub](https://github.com/devMiguelCarrero/snes.css)

### 遊戲引擎
- [Phaser.io](https://phaser.io/) - HTML5 遊戲框架
- [Phaser React Template](https://github.com/phaserjs/template-react) - 官方 React 整合
- [RPG-JS](https://github.com/RSamaium/RPG-JS) - TypeScript RPG 框架

### 渲染引擎
- [PixiJS](https://pixijs.com/) - WebGL 渲染引擎
- [PixiUI](https://pixijs.io/ui/) - PixiJS UI 組件庫
- [PixiUI GitHub](https://github.com/pixijs/ui)

### 社群資源
- [Game UI Database](https://www.gameuidatabase.com/) - 遊戲 UI 參考資料庫
- [Retro CSS Frameworks](https://github.com/matt-auckland/retro-css) - 復古 CSS 框架清單

---

## 結論與建議

### 🎯 Code Quest 最佳選擇

**基礎 UI**: RPGUI + SNES.css
- ✅ 完美 DQ 風格
- ✅ 零學習曲線
- ✅ 最小 bundle size
- ✅ React 無縫整合

**動畫增強（可選）**: Framer Motion
- ✅ 輕量 (50KB gzipped)
- ✅ 簡單易用
- ✅ 足夠的動畫能力

**進階動畫（可選）**: PixiJS + PixiUI
- ✅ 最佳效能
- ✅ 複雜特效
- ✅ 粒子系統

**2D 地圖（可選，Phase 4）**: Phaser + React
- ✅ 完整遊戲引擎
- ✅ 地圖編輯器整合
- ✅ 物理引擎

### 實作建議

1. **Phase 1-2**: 先用 RPGUI + SNES.css 建立基礎 UI
2. **Phase 3**: 評估是否需要 Framer Motion 增強動畫
3. **Phase 4**: 如果需要 2D 地圖，再整合 Phaser

### 下一步

- [ ] 建立 RPGUI POC (概念驗證)
- [ ] 設計 DQ 風格組件庫
- [ ] 實作基礎戰鬥 UI
- [ ] 測試動畫效能
