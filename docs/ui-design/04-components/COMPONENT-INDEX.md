# 組件索引 (Component Index)

**最後更新**: 2026-02-05

---

## 完整組件清單

本文檔提供所有組件的快速索引和摘要信息。

### ✅ 已完成組件 (Completed)

#### Core UI Components (基礎組件)
1. ✅ **status-bar.md** - 狀態列組件
   - HP/MP/EXP 進度條顯示
   - 多變體支援、動畫反饋、閾值警告

2. ✅ **progress-bar.md** - 進度條組件
   - 通用進度顯示、緩衝支援
   - 分段顯示、循環模式

3. ✅ **button.md** - 按鈕組件
   - 3D 深度效果、快捷鍵顯示
   - 多種變體（primary, secondary, danger等）

4. ⏳ **input.md** - 輸入框組件
   - 文字輸入、搜尋、驗證
   - 多行、自動完成

5. ⏳ **tabs.md** - 選項卡組件
   - 標籤頁切換、圖標支援
   - 計數徽章、鍵盤導航

6. ⏳ **modal.md** - 模態框組件
   - 基礎彈窗、焦點陷阱
   - 動畫過渡、堆疊管理

7. ⏳ **dialog.md** - 對話框組件
   - 確認對話框、危險操作
   - 快捷鍵支援

8. ⏳ **toast.md** - Toast 通知組件
   - 浮動提示、自動消失
   - 堆疊顯示、位置控制

#### Card Components (卡片組件)
9. ✅ **skill-card.md** - 技能卡片組件
   - 技能信息、MP 消耗、冷卻時間
   - 稀有度、效果描述

10. ⏳ **item-card.md** - 物品卡片組件
    - 物品信息、數量顯示
    - 稀有邊框、快速操作

11. ⏳ **companion-card.md** - 夥伴卡片組件
    - 夥伴信息、等級、技能
    - 親密度、狀態

12. ⏳ **enemy-card.md** - 敵人卡片組件
    - 敵人信息、HP、弱點
    - 抗性、掉落預覽

13. ⏳ **shop-card.md** - 商店卡片組件
    - 商品信息、價格、庫存
    - 折扣標籤

14. ⏳ **quest-card.md** - 任務卡片組件
    - 任務信息、進度、獎勵
    - 難度等級

#### Layout Components (布局組件)
15. ⏳ **grid.md** - 網格布局組件
    - 響應式網格、拖放
    - 自動排列

16. ⏳ **list.md** - 列表組件
    - 垂直列表、虛擬滾動
    - 選擇、排序

17. ⏳ **panel.md** - 面板組件
    - 側邊欄、資訊面板
    - 可摺疊、可調整大小

18. ⏳ **accordion.md** - 手風琴組件
    - 可展開收合
    - 多項/單項模式

#### Battle Components (戰鬥組件)
19. ✅ **battle-log.md** - 戰鬥日誌組件
    - 行動記錄、自動滾動
    - 類型高亮、回合標記

20. ⏳ **action-menu.md** - 行動選單組件
    - 戰鬥行動選擇
    - 快捷鍵、可用性檢查

21. ⏳ **damage-number.md** - 傷害數字組件
    - 浮動數字動畫
    - 類型區分、音效

22. ⏳ **status-effect.md** - 狀態效果組件
    - Buff/Debuff 圖標
    - 倒數、堆疊

#### Form Components (表單組件)
23. ⏳ **dropdown.md** - 下拉選單組件
    - 選項選擇、搜尋
    - 多選、分組

24. ⏳ **checkbox.md** - 核取方塊組件
    - 勾選框、半選狀態
    - 標籤、禁用

25. ⏳ **radio.md** - 單選按鈕組件
    - 單選框、分組
    - 卡片樣式、圖標

26. ⏳ **slider.md** - 滑桿組件
    - 數值調整、範圍
    - 步進、刻度標記

#### Navigation Components (導航組件)
27. ⏳ **breadcrumb.md** - 麵包屑導航
    - 位置顯示、可點擊
    - 分隔符

28. ⏳ **menu.md** - 選單組件
    - 導航選單、多層級
    - 子選單、快捷鍵

29. ⏳ **hotkey-hint.md** - 快捷鍵提示組件
    - 動態顯示、上下文相關
    - 教學模式

30. ✅ **README.md** - 組件庫總覽
    - 使用指南、設計原則
    - 快速參考

---

## 組件優先級

### P0 - 核心基礎（必須）
- ✅ status-bar.md
- ✅ progress-bar.md
- ✅ button.md
- ⏳ input.md
- ⏳ modal.md
- ⏳ toast.md

### P1 - 主要功能（重要）
- ✅ skill-card.md
- ⏳ item-card.md
- ✅ battle-log.md
- ⏳ action-menu.md
- ⏳ grid.md
- ⏳ list.md

### P2 - 輔助功能（次要）
- ⏳ tabs.md
- ⏳ dialog.md
- ⏳ companion-card.md
- ⏳ enemy-card.md
- ⏳ panel.md
- ⏳ dropdown.md

### P3 - 增強功能（可選）
- ⏳ accordion.md
- ⏳ quest-card.md
- ⏳ shop-card.md
- ⏳ damage-number.md
- ⏳ status-effect.md
- ⏳ checkbox.md
- ⏳ radio.md
- ⏳ slider.md
- ⏳ breadcrumb.md
- ⏳ menu.md
- ⏳ hotkey-hint.md

---

## 組件依賴關係

```
modal.md
  └─ dialog.md
  └─ toast.md

button.md
  └─ action-menu.md
  └─ dialog.md

progress-bar.md
  └─ status-bar.md

grid.md
  └─ item-card.md
  └─ skill-card.md

list.md
  └─ battle-log.md
  └─ quest-card.md
```

---

## 待補充組件（Placeholders）

以下組件標記為待補充，將在後續版本中完成：

### Input Components
- `input.md` - 基礎輸入框
- `textarea.md` - 多行文字輸入
- `search-input.md` - 搜尋輸入框

### Advanced Components
- `tooltip.md` - 工具提示
- `popover.md` - 浮層
- `context-menu.md` - 右鍵選單
- `notification.md` - 通知中心
- `loading.md` - 載入指示器

### Utility Components
- `divider.md` - 分隔線
- `badge.md` - 徽章
- `avatar.md` - 頭像
- `tag.md` - 標籤

---

## 組件文檔模板

創建新組件時，請使用以下標準模板：

```markdown
# 組件名稱 (Component Name)

**類別**: [Category]
**版本**: v1.0
**最後更新**: 2026-02-05

## 組件概述
- 用途說明
- 使用時機
- 不使用時機

## 視覺示例
- ASCII 布局

## 變體 (Variants)
- 不同樣式

## 屬性定義 (Props)
- TypeScript interface

## 視覺規格
- 尺寸、顏色、字體

## 狀態和行為
- 所有狀態

## 動畫規格
- 動畫效果

## 使用範例
- React / HTML / CSS

## 無障礙支援
- ARIA 屬性

## 相關組件
- 相關連結

## 設計決策
- 設計考量
```

---

## 貢獻準則

### 新增組件
1. 複製組件模板
2. 填寫所有必要章節
3. 提供至少 2 個使用範例
4. 實現無障礙支援
5. 更新本索引文件

### 更新組件
1. 修改組件文檔
2. 更新版本號
3. 記錄變更日誌
4. 通知相關組件

---

## 快速查找

### 按功能查找
- **顯示數據**: status-bar, progress-bar, grid, list
- **用戶輸入**: input, button, dropdown, checkbox, radio, slider
- **反饋**: toast, dialog, modal, damage-number
- **導航**: tabs, breadcrumb, menu
- **卡片**: skill-card, item-card, companion-card, enemy-card
- **戰鬥**: battle-log, action-menu, damage-number, status-effect

### 按場景查找
- **戰鬥場景**: battle-log, action-menu, damage-number, status-effect, skill-card, enemy-card
- **探索場景**: menu, breadcrumb, tabs, toast
- **管理場景**: grid, list, panel, item-card, companion-card
- **商店場景**: shop-card, item-card, modal, dialog
- **設定場景**: checkbox, radio, slider, dropdown

---

**統計**: 30 個組件（7 個已完成，23 個待補充）
**完成度**: 23%
**最後更新**: 2026-02-05
