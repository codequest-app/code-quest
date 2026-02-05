# 組件庫總覽 (Component Library Overview)

**版本**: v1.0
**最後更新**: 2026-02-05

---

## 簡介

RPG-CLI 組件庫是一套完整的 UI 組件系統，採用 Pixel Art 風格設計，專為 RPG 遊戲體驗優化。所有組件遵循統一的設計系統，確保視覺一致性和可維護性。

### 設計原則

1. **一致性** - 所有組件遵循相同的視覺語言和互動模式
2. **可訪問性** - 支援完整的鍵盤導航和螢幕閱讀器
3. **響應式** - 自適應桌面、平板和手機螢幕
4. **性能優化** - 使用 CSS 動畫和 GPU 加速
5. **Pixel Art 風格** - 復古 8-bit 風格與現代 UX 的完美結合

### 核心設計系統

【參考】
- `01-design-system/colors-and-typography.md` - 顏色和字體規範
- `01-design-system/animation-timing.md` - 動畫時序規範

---

## 組件分類

### 🎯 Core UI Components (基礎組件)
基礎互動組件，構成 UI 的核心元素。

| 組件 | 文件 | 用途 | 關鍵特性 |
|------|------|------|----------|
| Status Bar | `status-bar.md` | 玩家 HP/MP/EXP 顯示 | 多變體、動畫反饋、閾值警告 |
| Progress Bar | `progress-bar.md` | 通用進度顯示 | 緩衝支援、分段顯示、循環模式 |
| Button | `button.md` | 按鈕操作 | 3D 深度、快捷鍵顯示、多種變體 |
| Input | `input.md` | 文字輸入 | 驗證、搜尋、多行、自動完成 |
| Tabs | `tabs.md` | 選項卡切換 | 圖標支援、計數徽章、鍵盤導航 |
| Modal | `modal.md` | 模態框基礎 | 焦點陷阱、動畫過渡、堆疊管理 |
| Dialog | `dialog.md` | 確認對話框 | 確認/取消、危險操作、快捷鍵 |
| Toast | `toast.md` | 浮動通知 | 自動消失、堆疊顯示、位置控制 |

### 🃏 Card Components (卡片組件)
用於展示結構化信息的卡片組件。

| 組件 | 文件 | 用途 | 關鍵特性 |
|------|------|------|----------|
| Skill Card | `skill-card.md` | 技能卡片 | MP 消耗、冷卻時間、稀有度 |
| Item Card | `item-card.md` | 物品卡片 | 數量顯示、稀有邊框、快速操作 |
| Companion Card | `companion-card.md` | 夥伴卡片 | 等級、技能、親密度 |
| Enemy Card | `enemy-card.md` | 敵人卡片 | 弱點、抗性、掉落預覽 |
| Shop Card | `shop-card.md` | 商店卡片 | 價格、庫存、折扣標籤 |
| Quest Card | `quest-card.md` | 任務卡片 | 進度、獎勵、難度等級 |

### 📐 Layout Components (布局組件)
用於組織和排列內容的布局組件。

| 組件 | 文件 | 用途 | 關鍵特性 |
|------|------|------|----------|
| Grid | `grid.md` | 網格布局 | 響應式、拖放、自動排列 |
| List | `list.md` | 列表組件 | 虛擬滾動、選擇、排序 |
| Panel | `panel.md` | 面板組件 | 可摺疊、可調整大小、側邊欄 |
| Accordion | `accordion.md` | 手風琴組件 | 展開/收合、多項/單項 |

### ⚔️ Battle Components (戰鬥組件)
專為戰鬥場景設計的組件。

| 組件 | 文件 | 用途 | 關鍵特性 |
|------|------|------|----------|
| Battle Log | `battle-log.md` | 戰鬥日誌 | 自動滾動、類型高亮、回合標記 |
| Action Menu | `action-menu.md` | 行動選單 | 快捷鍵、可用性檢查、工具提示 |
| Damage Number | `damage-number.md` | 傷害數字 | 浮動動畫、類型區分、音效 |
| Status Effect | `status-effect.md` | 狀態效果 | Buff/Debuff、倒數、堆疊 |

### 📝 Form Components (表單組件)
用於用戶輸入和數據收集的組件。

| 組件 | 文件 | 用途 | 關鍵特性 |
|------|------|------|----------|
| Dropdown | `dropdown.md` | 下拉選單 | 搜尋、多選、分組 |
| Checkbox | `checkbox.md` | 核取方塊 | 半選狀態、標籤、禁用 |
| Radio | `radio.md` | 單選按鈕 | 分組、卡片樣式、圖標 |
| Slider | `slider.md` | 滑桿組件 | 範圍、步進、刻度標記 |

### 🧭 Navigation Components (導航組件)
用於應用程序內導航的組件。

| 組件 | 文件 | 用途 | 關鍵特性 |
|------|------|------|----------|
| Breadcrumb | `breadcrumb.md` | 麵包屑導航 | 當前位置、可點擊、分隔符 |
| Menu | `menu.md` | 選單組件 | 多層級、子選單、快捷鍵 |
| Hotkey Hint | `hotkey-hint.md` | 快捷鍵提示 | 動態顯示、上下文相關、教學 |

---

## 快速參考表

### 互動組件優先級

```
Primary Actions    → Button (primary variant)
Secondary Actions  → Button (secondary/ghost variant)
Destructive        → Button (danger variant)
Navigation         → Link / Menu
Selection          → Checkbox / Radio / Dropdown
Input              → Input / Textarea
Toggle             → Switch / Checkbox
```

### 反饋組件選擇

```
即時反饋     → Toast (自動消失)
需要確認     → Dialog (必須互動)
詳細信息     → Modal (全螢幕/大內容)
進度顯示     → Progress Bar
狀態變化     → Animation + Sound
錯誤處理     → Toast (error) + Input validation
```

### 佈局組件選擇

```
卡片網格     → Grid (item-grid, skill-grid)
垂直列表     → List (battle-log, quest-list)
側邊欄       → Panel (collapsible)
可展開內容   → Accordion
主要內容區   → Container (max-width)
固定頂部     → Status Bar / Header
```

---

## 組件使用指南

### 1. 選擇合適的組件

**問自己：**
- 這是什麼類型的互動？（按鈕、輸入、選擇）
- 內容是什麼結構？（列表、網格、卡片）
- 需要什麼反饋？（即時、確認、通知）
- 在什麼場景？（戰鬥、探索、管理）

**範例：**
```
需求：顯示背包物品
→ 結構化數據 → 使用 Grid
→ 物品信息 → 使用 Item Card
→ 選擇物品 → 使用 Modal (詳情)
→ 操作確認 → 使用 Dialog (丟棄確認)
```

### 2. 組合組件

組件設計為可組合使用：

```tsx
// 背包畫面範例
<Panel title="背包" collapsible>
  <ProgressBar
    label="容量"
    value={25}
    max={50}
  />
  <Tabs
    items={['全部', '消耗品', '裝備']}
    activeTab={activeTab}
  />
  <Grid
    columns={6}
    items={items}
    renderItem={(item) => (
      <ItemCard
        item={item}
        onClick={() => showItemModal(item)}
      />
    )}
  />
</Panel>
```

### 3. 遵循設計系統

**必須：**
- ✅ 使用設計系統定義的顏色變數
- ✅ 使用標準字體和字號
- ✅ 遵循動畫時序規範
- ✅ 實現無障礙支援（ARIA）
- ✅ 支援鍵盤導航

**避免：**
- ❌ 自定義顏色（使用 CSS 變數）
- ❌ 自定義字體（使用設計系統字體）
- ❌ 過長動畫（參考標準時序）
- ❌ 缺少 ARIA 標籤
- ❌ 僅支援滑鼠操作

---

## 命名規範

### 組件命名
```
PascalCase: Button, StatusBar, ItemCard
文件名: button.md, status-bar.md, item-card.md
```

### Props 命名
```typescript
// ✅ 好
interface ButtonProps {
  variant: 'primary' | 'secondary';
  disabled: boolean;
  onClick: () => void;
}

// ❌ 壞
interface ButtonProps {
  type: string;
  isDisabled: boolean;
  handleClick: () => void;
}
```

### CSS 類名
```css
/* ✅ 好 - BEM 命名 */
.button { }
.button--primary { }
.button--disabled { }
.button__icon { }

/* ❌ 壞 */
.btn { }
.primaryBtn { }
.button-primary { }
```

---

## 主題系統

### 探索模式 vs 戰鬥模式

```typescript
const themes = {
  explore: {
    primary: '#4caf50',
    background: '#1a4d2e',
    text: '#e0e0e0',
  },
  battle: {
    primary: '#f44336',
    background: '#4d1a1a',
    text: '#e0e0e0',
  },
};
```

**使用：**
```tsx
<Button theme="explore">探索</Button>
<Button theme="battle">攻擊</Button>
```

---

## 響應式設計

### 斷點定義
```css
/* Mobile */
@media (max-width: 767px) { }

/* Tablet */
@media (min-width: 768px) and (max-width: 1199px) { }

/* Desktop */
@media (min-width: 1200px) { }
```

### 組件適配策略
```
Desktop:  完整功能，所有細節
Tablet:   簡化佈局，保留核心功能
Mobile:   單欄佈局，手勢操作，放大觸控目標
```

---

## 性能優化

### 動畫性能
```css
/* ✅ 好 - 使用 transform 和 opacity */
.element {
  transform: translateX(100px);
  opacity: 0.5;
}

/* ❌ 壞 - 觸發重排 */
.element {
  left: 100px;
  visibility: hidden;
}
```

### 渲染優化
```tsx
// ✅ 好 - 使用 React.memo
const ItemCard = React.memo(({ item }) => {
  return <div>{item.name}</div>;
});

// ✅ 好 - 虛擬滾動（長列表）
<VirtualList
  items={items}
  rowHeight={80}
  renderRow={(item) => <ItemCard item={item} />}
/>
```

---

## 無障礙檢查清單

所有組件必須：

- [ ] 支援鍵盤導航（Tab, Enter, Esc, 方向鍵）
- [ ] 提供適當的 ARIA 屬性
- [ ] 可被螢幕閱讀器正確朗讀
- [ ] 顏色對比度符合 WCAG AA 標準（4.5:1）
- [ ] 不只依賴顏色區分狀態
- [ ] 焦點指示器清晰可見
- [ ] 支援高對比模式
- [ ] 錯誤訊息明確易懂

---

## 測試指南

### 視覺測試
```
1. 檢查所有變體是否正確渲染
2. 測試不同尺寸（small, medium, large）
3. 驗證主題切換（explore, battle）
4. 測試響應式佈局（desktop, tablet, mobile）
5. 檢查動畫流暢度（60 FPS）
```

### 互動測試
```
1. 鍵盤導航測試（Tab, Enter, Esc）
2. 滑鼠操作測試（Click, Hover, Drag）
3. 觸控操作測試（Tap, Long press, Swipe）
4. 快捷鍵測試
5. 邊界情況測試（禁用、載入、錯誤）
```

### 無障礙測試
```
1. 使用螢幕閱讀器（NVDA, JAWS, VoiceOver）
2. 純鍵盤操作（無滑鼠）
3. 高對比模式
4. 色盲模擬
5. ARIA 屬性驗證
```

---

## 貢獻指南

### 新增組件流程

1. **設計階段**
   - 確認需求和使用場景
   - 設計 ASCII 原型
   - 定義組件 API (Props)

2. **開發階段**
   - 創建組件文件（參考模板）
   - 實現基本功能
   - 添加動畫和互動
   - 實現無障礙支援

3. **文檔階段**
   - 撰寫組件文檔（參考現有組件）
   - 提供使用範例
   - 記錄設計決策

4. **測試階段**
   - 視覺測試
   - 互動測試
   - 無障礙測試
   - 瀏覽器兼容性測試

### 組件文檔模板

```markdown
# 組件名稱 (Component Name)

## 組件概述
- 用途說明
- 使用時機
- 不使用時機

## 視覺示例
- ASCII 圖示

## 變體 (Variants)
- 不同樣式和模式

## 屬性定義 (Props)
- TypeScript interface

## 視覺規格
- 尺寸、顏色、字體

## 狀態和行為
- 所有可能的狀態

## 動畫規格
- 動畫時序和效果

## 使用範例
- React / HTML / CSS 範例

## 無障礙支援
- ARIA 屬性
- 鍵盤導航

## 相關組件
- 相關組件連結

## 設計決策
- 為什麼這樣設計
```

---

## 工具和資源

### 開發工具
- **Storybook** - 組件開發和測試
- **Figma** - 設計原型
- **Chrome DevTools** - 性能分析

### 測試工具
- **Jest** - 單元測試
- **React Testing Library** - 組件測試
- **Playwright** - E2E 測試
- **axe DevTools** - 無障礙測試

### 設計資源
- Google Fonts (Press Start 2P, VT323, Roboto Mono)
- Emoji 圖標庫
- SVG 圖標集

---

## 常見問題 (FAQ)

### Q: 何時創建新組件 vs 使用現有組件？
**A:** 如果現有組件通過 props 可以滿足需求，優先使用現有組件。只有在需要完全不同的結構或行為時才創建新組件。

### Q: 如何處理組件間的狀態共享？
**A:** 使用 React Context 或狀態管理工具（Zustand, Redux）。避免通過多層 props 傳遞。

### Q: 移動端需要單獨的組件嗎？
**A:** 不需要。所有組件都應該響應式設計，通過 CSS 媒體查詢適配不同螢幕。

### Q: 如何確保動畫性能？
**A:** 使用 `transform` 和 `opacity` 屬性，啟用 GPU 加速，使用 `will-change` 提示瀏覽器。

### Q: 組件應該多細粒度？
**A:** 遵循單一職責原則。一個組件只做一件事，但做好。可以通過組合小組件構建複雜功能。

---

## 更新日誌

### v1.0 (2026-02-05)
- ✨ 初始版本發布
- 📦 30 個核心組件
- 📚 完整文檔系統
- ♿ 無障礙支援
- 📱 響應式設計
- 🎨 Pixel Art 風格

---

## 聯絡和支援

- **文檔倉庫**: `docs/ui-design/04-components/`
- **設計系統**: `docs/ui-design/01-design-system/`
- **問題回報**: 在項目倉庫創建 Issue

---

**版本**: v1.0
**創建日期**: 2026-02-05
**最後更新**: 2026-02-05
**狀態**: ✅ 完成
