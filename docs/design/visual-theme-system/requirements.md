# 視覺主題系統（Visual Theme System）

**日期**: 2026-02-23
**版本**: v0.1
**狀態**: 設計階段

---

## 1. 系統概要

提供可切換的視覺主題系統，涵蓋角色外觀、地圖外觀、戰鬥背景三大類別。玩家可自由切換主題包，改變整體遊戲視覺風格。

---

## 2. 核心需求

### 2.1 三大視覺類別

| 類別 | 說明 | 使用場景 |
|------|------|----------|
| **角色外觀** | 玩家角色、夥伴、敵人的 sprite | 地圖移動 + 戰鬥畫面 |
| **地圖外觀** | 場景 tileset、地圖背景、建築物 | 地圖探索模式 |
| **戰鬥背景** | 戰鬥場景背景圖、UI 框架 | 戰鬥模式 |

### 2.2 角色外觀需求

角色在**兩種場景**下需要不同的 sprite：

#### 地圖模式（Map Sprite）
- 尺寸：16×16 或 32×32 像素
- 方向：上、下、左、右（各 2-3 幀行走動畫）
- 用途：地圖移動、NPC 互動

#### 戰鬥模式（Battle Sprite）
- 尺寸：32×32 或 64×64 像素（較大、更精細）
- 動作：待機、攻擊、受傷、施法、防禦、勝利、倒下
- 用途：戰鬥畫面角色呈現

### 2.3 主題包結構

一個完整主題包（Theme Pack）包含：

```
theme-pack-{name}/
├── manifest.json          ← 主題元資料（名稱、作者、授權）
├── characters/
│   ├── hero/
│   │   ├── map.png        ← 地圖 sprite sheet
│   │   └── battle.png     ← 戰鬥 sprite sheet
│   ├── companion-warrior/
│   │   ├── map.png
│   │   └── battle.png
│   └── enemies/
│       ├── slime.png
│       ├── dragon.png
│       └── ...
├── maps/
│   ├── town.png           ← 城鎮 tileset
│   ├── wilderness.png     ← 野外 tileset
│   └── dungeon.png        ← 副本 tileset
└── battles/
    ├── bg-plains.png      ← 平原戰鬥背景
    ├── bg-forest.png      ← 森林戰鬥背景
    ├── bg-cave.png        ← 洞窟戰鬥背景
    └── bg-castle.png      ← 城堡戰鬥背景
```

### 2.4 切換需求

- 玩家可隨時在設定中切換主題包
- 切換即時生效，無需重新載入
- 預設主題內建於遊戲中
- 支援社群製作的自訂主題包

---

## 3. 角色設計方針

### 3.1 版權安全策略

> **重要**：不可直接使用《神龍之謎》（ダイの大冒険）或 Dragon Quest 系列的角色素材。
> Square Enix 持有全部版權，保留 takedown 權利。

**建議做法**：設計**致敬風格的原創角色**

| 原作角色 | 致敬設計 | 職業 | 說明 |
|----------|----------|------|------|
| 達伊 (ダイ) | 勇者少年 | 勇者 | 紅披風、劍士少年，但自創外觀 |
| 波普 (ポップ) | 魔法師夥伴 | 魔法師 | 藍袍法師，但不同髮型/臉型 |
| 瑪姆 (マァム) | 武鬥家夥伴 | 武鬥家 | 格鬥家風格，但完全原創設計 |
| 修拉爾 (ヒュンケル) | 暗騎士 | 黑騎士 | 暗系騎士風格 |
| 克洛克達因 | 獸王夥伴 | 守護者 | 獸人戰士風格 |

### 3.2 確認外觀的方法

1. **Pixel Art 編輯器**：使用 [Aseprite](https://www.aseprite.org/) 製作 sprite sheet
2. **免費 Sprite 生成器**：[Memao Sprite Sheet Creator](https://sleeping-robot-games.itch.io/sprite-sheet-creator) — 無需手繪，用 paper doll 系統組合角色
3. **AI 生成 + 手修**：用 AI 圖像生成初稿 pixel art，再手動修正
4. **itch.io 免費素材**：採用 CC0/CC-BY 授權的現成素材包

---

## 4. 素材來源策略

### 4.1 推薦免費素材

| 素材 | 來源 | 授權 | 說明 |
|------|------|------|------|
| 角色 sprite | [Tiny RPG Character Pack](https://itch.io/game-assets/free/tag-pixel-art/tag-sprite-sheet) | 依各包授權 | 16x16 角色動畫 |
| 地圖 tileset | [Anokolisa 16x16 Pack](https://anokolisa.itch.io/free-pixel-art-asset-pack-topdown-tileset-rpg-16x16-sprites) | 免費 | 500+ sprites |
| 戰鬥背景 | itch.io RPG battleback | 依各包授權 | 多種場景 |

### 4.2 開發分期策略

| 階段 | 內容 | 方式 |
|------|------|------|
| **Phase 1 — 佔位** | 純色方塊 / ASCII 字符代替 sprite | 快速驗證邏輯 |
| **Phase 2 — 免費素材** | 使用 itch.io 免費素材包 | 視覺原型 |
| **Phase 3 — 原創設計** | 委託或自製原創 pixel art | 最終成品 |

---

## 5. 技術實作方案

### 5.1 Sprite Sheet 管理

```typescript
// 主題配置介面
interface ThemePack {
  id: string;
  name: string;
  author: string;
  license: string;
  characters: Record<string, CharacterSprites>;
  maps: Record<string, string>;      // location → tileset URL
  battleBgs: Record<string, string>; // scene → background URL
}

interface CharacterSprites {
  map: SpriteSheet;    // 地圖 sprite（小尺寸、行走動畫）
  battle: SpriteSheet; // 戰鬥 sprite（大尺寸、多動作）
}

interface SpriteSheet {
  src: string;
  frameWidth: number;
  frameHeight: number;
  animations: Record<string, AnimationDef>;
}

interface AnimationDef {
  row: number;
  frames: number;
  fps: number;
  loop: boolean;
}
```

### 5.2 React Sprite 元件

使用 CSS `background-position` + `steps()` 動畫實現 sprite sheet 播放：

- 地圖角色：`<MapSprite character="hero" direction="down" walking={true} />`
- 戰鬥角色：`<BattleSprite character="hero" action="attack" />`

參考實作：
- [Animating Sprites with CSS and React](https://alechorner.com/blog/animating-pixel-sprites-with-css)
- [react-responsive-spritesheet](https://github.com/danilosetra/react-responsive-spritesheet)

### 5.3 主題切換架構

```
ThemeProvider (React Context)
  ├── useTheme() → 取得當前主題
  ├── useCharacterSprite(id) → 取得角色 sprite
  ├── useMapTileset(location) → 取得地圖素材
  └── useBattleBg(scene) → 取得戰鬥背景
```

- 主題資料存於 Zustand store
- 切換時替換 Context 內的主題包引用
- 所有 sprite 元件自動響應更新（無需重載）

### 5.4 效能考量

- **Sprite Atlas**：打包多張小圖為單一 atlas，減少 HTTP 請求
- **Lazy Loading**：非當前場景的素材延遲載入
- **Preload**：切換主題前預載所有素材
- **Cache**：瀏覽器快取 + service worker 離線快取

---

## 6. 開放問題

- [ ] 預設主題的 pixel art 尺寸規範（16×16 or 32×32）
- [ ] 是否支援動態像素縮放（1x, 2x, 3x）
- [ ] 自訂主題包的上傳/分享機制
- [ ] 敵人 sprite 是否也需要地圖版本（目前敵人只出現在戰鬥中）

---

## 7. 相關系統

- [地圖系統](../map-system/requirements.md) — 地圖外觀的使用場景
- [戰鬥系統](../battle-system/requirements.md) — 戰鬥 sprite 和背景的使用場景
- [場景系統](../scene-system/requirements.md) — 探索/戰鬥模式切換
- [UI 互動系統](../ui-interaction/requirements.md) — Pixel Art 視覺風格規範
