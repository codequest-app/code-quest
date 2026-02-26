# Character & Visual Asset System - Requirements

## 核心概念

### 視覺素材系統映射

將 Code Quest 的各個場景配備可切換的視覺外觀：

| 場景 | 視覺需求 | 說明 |
|------|---------|------|
| 地圖移動 | 角色 Sprite (俯視/4 方向行走) | 16x16 或 32x32 像素，含行走動畫 |
| 戰鬥場景 | 角色戰鬥 Sprite (側面/正面) | idle、attack、damaged、victory 等狀態 |
| 戰鬥背景 | 場景背景圖 | 根據地點切換 (城鎮/野外/地城) |
| 地圖外觀 | 地圖 Tileset | 地磚、建築、地形等圖塊 |

### 設計哲學

**✅ 版權安全**:
- 不直接使用任何受版權保護的角色（包括神龍之謎/Dragon Quest 系列）
- Square Enix 對 DQ 系列版權保護嚴格，即使非商業專案也有法律風險
- 使用 DQ 風格的原創角色或開源素材

**✅ 可切換主題**:
- 角色外觀、地圖 Tileset、戰鬥背景皆可獨立切換
- 支援多套主題包 (Theme Pack)，一鍵切換視覺風格
- 預設提供至少一套完整的免費/開源素材主題

**✅ 保持輕量**:
- 素材以 Sprite Sheet + JSON Atlas 格式管理
- 按需載入（Lazy Load），切換主題時動態載入新素材
- 不引入重型遊戲引擎，優先用 CSS animation + Canvas 2D

---

## 角色外觀需求

### 地圖角色 (Overworld Sprite)

- **尺寸**: 16x16 或 32x32 像素
- **方向**: 4 方向（上、下、左、右）
- **動畫幀**: 每方向 3 幀（靜止、左腳、右腳）
- **格式**: 單張 Sprite Sheet（行 = 方向，列 = 動畫幀）
- **角色種類**:
  - 玩家角色（勇者/主角）
  - 夥伴角色（對應 companion-system 中的 Haiku/Sonnet/Opus）
  - NPC（城鎮居民、商店老闆等）

### 戰鬥角色 (Battle Sprite)

- **尺寸**: 48x48 或 64x64 像素（比地圖角色大）
- **狀態動畫**:
  - `idle` — 待機（微幅晃動，2-4 幀循環）
  - `attack` — 攻擊（3-5 幀）
  - `damaged` — 受傷（2 幀 + 閃爍效果）
  - `victory` — 勝利姿態（3 幀）
  - `dead` — 倒下（2 幀）
- **敵人 Sprite**: 正面大圖（DQ 經典風格），可比角色更大（64x64 ~ 128x128）

### 戰鬥背景 (Battle Background)

- **尺寸**: 480x270 或等比例
- **種類**: 每個地點類型至少一張
  - 草原/野外
  - 森林
  - 城鎮街道
  - 地城/洞窟
  - Boss 房間
- **可選**: 視差捲動（Parallax）效果，2 層背景

### 地圖 Tileset

- **尺寸**: 16x16 像素（與角色一致）
- **內容**: 地面、牆壁、水面、樹木、建築物、路徑等
- **格式**: Tileset PNG + JSON（相容 Tiled Map Editor 格式）

---

## 主題切換系統

### Theme Pack 結構

```
assets/themes/
  classic/                    ← 預設主題
    manifest.json             ← 主題描述、作者、授權
    characters/
      hero.json + hero.png    ← 主角 sprite atlas
      companion-haiku.json    ← Haiku 夥伴
      companion-sonnet.json   ← Sonnet 夥伴
      companion-opus.json     ← Opus 夥伴
      enemies/
        code-golem.png
        syntax-wyrm.png
        ...
    maps/
      tileset.json + tileset.png
    battles/
      background-plains.png
      background-forest.png
      background-dungeon.png
      background-boss.png
  pixel-fantasy/              ← 替代主題
    manifest.json
    characters/...
    maps/...
    battles/...
```

### manifest.json 規格

```json
{
  "name": "Classic Quest",
  "version": "1.0.0",
  "author": "Code Quest Team",
  "license": "CC0",
  "description": "經典 JRPG 像素風格",
  "spriteSize": { "map": 32, "battle": 64, "enemy": 128 },
  "characters": {
    "hero": { "atlas": "characters/hero.json", "sheet": "characters/hero.png" },
    "companion-haiku": { "atlas": "characters/companion-haiku.json", "sheet": "characters/companion-haiku.png" },
    "companion-sonnet": { "atlas": "characters/companion-sonnet.json", "sheet": "characters/companion-sonnet.png" },
    "companion-opus": { "atlas": "characters/companion-opus.json", "sheet": "characters/companion-opus.png" }
  },
  "enemies": { "code-golem": "characters/enemies/code-golem.png" },
  "tileset": { "atlas": "maps/tileset.json", "sheet": "maps/tileset.png" },
  "battleBackgrounds": {
    "plains": "battles/background-plains.png",
    "forest": "battles/background-forest.png",
    "dungeon": "battles/background-dungeon.png",
    "boss": "battles/background-boss.png"
  }
}
```

### 切換機制

1. Zustand store 持有 `currentTheme: string`
2. 切換主題時 → 載入新主題的 `manifest.json` → 預載所有素材
3. 素材載入完成 → 更新 store → 所有使用素材的元件自動重渲染
4. 支援在設定頁面切換主題，即時預覽

---

## 素材來源建議（版權安全）

### 推薦的免費開源資源

| 資源 | 授權 | 用途 | 連結 |
|------|------|------|------|
| **Kenney Roguelike/RPG Pack** | CC0 (免歸屬) | Tileset、地圖元素 | https://kenney.nl/assets/roguelike-rpg-pack |
| **Universal LPC Spritesheet Generator** | GPL3/CC-BY-SA | 自訂角色行走動畫 | https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/ |
| **Cute Fantasy RPG (Kenmi)** | 免費包 | 16x16 角色、敵人、動畫 | https://kenmi-art.itch.io/cute-fantasy-rpg |
| **Anokolisa Topdown Tileset** | 免費包 | 500+ sprites、英雄、敵人 | https://anokolisa.itch.io/free-pixel-art-asset-pack-topdown-tileset-rpg-16x16-sprites |
| **ansimuz Battle Backgrounds** | 免費 | 戰鬥場景背景 | https://ansimuz.itch.io/battle-backgrounds-pack-2 |
| **OpenGameArt JRPG Collection** | CC0/GPL | 各類 RPG 素材 | https://opengameart.org/content/pixel-art-jrpg |

### 自製素材工具

| 工具 | 說明 |
|------|------|
| **Aseprite** | 像素畫業界標準，$20 或 GPL 原始碼自行編譯，可匯出 Sprite Sheet + JSON Atlas |
| **LibreSprite** | Aseprite 免費開源分支 |
| **Piskel** | 免費瀏覽器版像素畫工具，可匯出 PNG/Sprite Sheet |
| **FreeTexPacker** | 免費開源 Texture Atlas 打包工具 |
| **Tiled Map Editor** | 免費地圖編輯器，匯出 JSON 格式 |

---

## 技術方案

### 渲染方案比較

| 方案 | 優點 | 缺點 | 適用場景 |
|------|------|------|---------|
| **CSS `animation` + `steps()`** | 零依賴、與 React 完美整合 | 複雜動畫受限 | 地圖角色行走、簡單戰鬥動畫 |
| **Canvas 2D API** | 輕量、完全控制 | 需手寫渲染邏輯 | 戰鬥場景、特效 |
| **PixiJS 8** | WebGL 加速、內建 AnimatedSprite | 增加 bundle 體積 | 如需完整遊戲級渲染 |

### 建議方案：CSS + Canvas 混合

- **地圖場景**: CSS `steps()` 動畫驅動角色行走，CSS Grid/背景圖渲染地圖
- **戰鬥場景**: Canvas 2D 渲染戰鬥背景 + 角色動畫 + 特效（已有 DamageNumber、SkillCastEffect 等元件）
- **主題切換**: CSS Custom Properties + Zustand store

```css
/* 主題切換範例 */
[data-theme="classic"] .hero-sprite {
  --sprite-sheet: url('/assets/themes/classic/characters/hero.png');
}
[data-theme="pixel-fantasy"] .hero-sprite {
  --sprite-sheet: url('/assets/themes/pixel-fantasy/characters/hero.png');
}
.hero-sprite {
  background-image: var(--sprite-sheet);
  width: 32px;
  height: 32px;
  animation: walk-down 0.4s steps(3) infinite;
}
```

---

## 與現有系統的整合

### 影響的系統

| 系統 | 整合方式 |
|------|---------|
| **map-system** | 地圖 Tileset + 角色 Overworld Sprite |
| **battle-system** | 戰鬥背景 + 角色/敵人 Battle Sprite |
| **companion-system** | 夥伴角色外觀（Haiku/Sonnet/Opus 各有獨立 sprite） |
| **scene-system** | 對話場景中的角色立繪（可選） |
| **shop-system** | 可購買/解鎖新主題包 |

### 新增的 Shared Types

```typescript
// packages/shared/src/rpg/theme-types.ts

interface ThemeManifest {
  name: string;
  version: string;
  author: string;
  license: string;
  description: string;
  spriteSize: { map: number; battle: number; enemy: number };
  characters: Record<string, SpriteRef>;
  enemies: Record<string, string>;
  tileset: SpriteRef;
  battleBackgrounds: Record<string, string>;
}

interface SpriteRef {
  atlas: string;  // JSON atlas 路徑
  sheet: string;  // PNG sprite sheet 路徑
}

interface SpriteAtlas {
  frames: Record<string, SpriteFrame>;
  meta: { image: string; size: { w: number; h: number } };
}

interface SpriteFrame {
  frame: { x: number; y: number; w: number; h: number };
  duration?: number;  // 動畫幀持續時間 (ms)
}
```

---

## 優先級

| 優先級 | 項目 | 說明 |
|--------|------|------|
| P0 | Theme Pack 結構與 manifest 規格 | 定義資料格式 |
| P0 | 主角 Overworld Sprite（地圖行走） | 最基礎的視覺元素 |
| P0 | 主角 Battle Sprite（戰鬥場景） | 戰鬥系統已存在 |
| P1 | 戰鬥背景切換 | 增加場景沉浸感 |
| P1 | 敵人 Sprite | 替換現有文字/圖標敵人顯示 |
| P1 | 夥伴角色 Sprite | companion-system 整合 |
| P2 | 地圖 Tileset 主題切換 | 地圖視覺多樣性 |
| P2 | 主題切換 UI（設定頁面） | 使用者自選主題 |
| P3 | 商店購買/解鎖主題 | shop-system 整合 |
| P3 | 自訂角色外觀編輯器 | 進階個人化 |
