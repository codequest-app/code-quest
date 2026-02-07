# 工具映射參考 (Tool Mappings Reference)

**創建日期**: 2026-02-06
**版本**: v1.0
**來源**: `/docs/design/interactive-events/requirements.md`

---

## 概述

本文檔提供 Claude Code CLI 工具到 RPG 魔法的完整映射表，用於互動事件系統的遊戲化呈現。

---

## 文件操作魔法

### Read 工具 → 讀心術

```
工具: Read
魔法名稱: 讀心術
圖標: 📖
MP消耗: 3
分類: 檔案魔法
動畫: 開書效果
效果: 讀取文件內容，了解代碼意圖
戰鬥效果: 獲得敵人資訊 (+10% 命中率，2 回合)
音效: 讀取聲音
```

### Write 工具 → 創造術

```
工具: 'Write',
魔法名稱: '創造術',
圖標: '✍️',
MP消耗: 8,
分類: '檔案魔法',
動畫: 'writing_feather',
效果: '創建或覆蓋文件',
戰鬥效果: '創造新代碼（造成 80 傷害）',
音效: 'write.wav'
```

### Edit 工具 → 改寫術

```
工具: 'Edit',
魔法名稱: '改寫術',
圖標: '✏️',
MP消耗: 6,
分類: '檔案魔法',
動畫: 'text_transform',
效果: '編輯文件內容，精確修改',
戰鬥效果: '修改敵人屬性（-15% 防禦，3 回合）',
音效: 'edit.wav'
```

---

## 搜索魔法

### Grep 工具 → 搜索之眼

```
工具: 'Grep',
魔法名稱: '搜索之眼',
圖標: '👁️',
MP消耗: 5,
分類: '探索魔法',
動畫: 'eye_scan',
效果: '在代碼中搜索字符串模式',
戰鬥效果: '找出敵人弱點（+20% 暴擊率，2 回合）',
音效: 'search.wav'
```

### Glob 工具 → 定位術

```
工具: 'Glob',
魔法名稱: '定位術',
圖標: '🔍',
MP消耗: 4,
分類: '探索魔法',
動畫: 'radar_scan',
效果: '搜索文件名模式',
戰鬥效果: '定位敵人位置（無法閃避，1 次攻擊）',
音效: 'locate.wav'
```

---

## Git 魔法系列

### git commit → 版本封印術

```
工具: 'git commit',
魔法名稱: '版本封印術',
圖標: '📦',
MP消耗: 5,
分類: 'Git 魔法',
動畫: 'seal_magic',
  castTime: 'fast',
效果: '保存當前代碼狀態',
戰鬥效果: '封存進度（創建檢查點）',
音效: 'commit.wav'
```

### git push → 遠程傳送術

```
工具: 'git push',
魔法名稱: '遠程傳送術',
圖標: '🚀',
MP消耗: 10,
分類: 'Git 魔法',
動畫: 'teleport',
  castTime: 'medium',
效果: '同步到遠程倉庫',
戰鬥效果: '傳送代碼（分享勝利成果）',
音效: 'push.wav'
```

### git pull → 同步魔法

```
工具: 'git pull',
魔法名稱: '同步魔法',
圖標: '🔄',
MP消耗: 8,
分類: 'Git 魔法',
動畫: 'sync_circle',
  castTime: 'medium',
效果: '獲取最新版本',
戰鬥效果: '學習新招式（獲得隊友更新）',
音效: 'pull.wav'
```

### git merge → 融合術

```
工具: 'git merge',
魔法名稱: '融合術',
圖標: '🔀',
MP消耗: 12,
分類: 'Git 魔法',
動畫: 'merge_vortex',
  castTime: 'medium',
效果: '合併分支代碼',
戰鬥效果: '融合力量（組合技能）',
音效: 'merge.wav'
```

### git checkout → 時空跳躍

```
工具: 'git checkout',
魔法名稱: '時空跳躍',
圖標: '⏰',
MP消耗: 4,
分類: 'Git 魔法',
動畫: 'time_warp',
  castTime: 'fast',
效果: '切換分支或版本',
戰鬥效果: '回到過去（恢復早期狀態）',
音效: 'checkout.wav'
```

---

## npm 魔法系列

### npm install → 依賴召喚術

```
工具: 'npm install',
魔法名稱: '依賴召喚術',
圖標: '📚',
MP消耗: 15,
分類: 'npm 魔法',
動畫: 'summoning_circle',
  castTime: 'slow',
效果: '安裝項目依賴套件',
戰鬥效果: '召喚支援（獲得外部力量）',
音效: 'install.wav'
```

### npm test → 試煉之法

```
工具: 'npm test',
魔法名稱: '試煉之法',
圖標: '🧪',
MP消耗: 8,
分類: 'npm 魔法',
動畫: 'test_flask',
  castTime: 'medium',
效果: '執行測試套件',
戰鬥效果: '驗證戰術（確保無漏洞）',
音效: 'test.wav'
```

### npm build → 構築魔法

```
工具: 'npm build',
魔法名稱: '構築魔法',
圖標: '🏗️',
MP消耗: 12,
分類: 'npm 魔法',
動畫: 'construction',
  castTime: 'slow',
效果: '構建生產版本',
戰鬥效果: '鍛造終極武器（最終版本）',
音效: 'build.wav'
```

### npm run dev → 開發召喚

```
工具: 'npm run dev',
魔法名稱: '開發召喚',
圖標: '🔥',
MP消耗: 10,
分類: 'npm 魔法',
動畫: 'flame_up',
  castTime: 'medium',
效果: '啟動開發服務器',
戰鬥效果: '激活訓練場（持續開發）',
音效: 'dev.wav'
```

---

## 系統魔法系列

### ls/pwd → 偵察術

```
工具: 'ls / pwd',
魔法名稱: '偵察術',
圖標: '👁️',
MP消耗: 2,
分類: '系統魔法',
動畫: 'eye_glow',
  castTime: 'instant',
效果: '查看文件和目錄結構',
戰鬥效果: '偵察地形（了解環境）',
音效: 'scout.wav'
```

### mkdir → 創造空間術

```
工具: 'mkdir',
魔法名稱: '創造空間術',
圖標: '📁',
MP消耗: 3,
分類: '系統魔法',
動畫: 'folder_appear',
  castTime: 'fast',
效果: '創建新目錄',
戰鬥效果: '開闢新領域（擴展空間）',
音效: 'mkdir.wav'
```

### rm/rm -rf → 抹除術

```
工具: 'rm / rm -rf',
魔法名稱: '抹除術',
圖標: '🗑️',
MP消耗: 5,
分類: '系統魔法',
動畫: 'disintegrate',
  castTime: 'fast',
效果: '刪除文件或目錄',
戰鬥效果: '毀滅打擊（清除目標）',
音效: 'delete.wav',
  warning: 'rm -rf 風險高，需要額外確認'
```

### cp/mv → 轉移術

```
工具: 'cp / mv',
魔法名稱: '轉移術',
圖標: '🚚',
MP消耗: 4,
分類: '系統魔法',
動畫: 'telekinesis',
  castTime: 'fast',
效果: '複製或移動文件',
戰鬥效果: '物品傳送（重新定位資源）',
音效: 'move.wav'
```

---

## 特殊工具

### Task 工具 → 召喚夥伴

```
工具: 'Task',
魔法名稱: '召喚夥伴',
圖標: '🌟',
MP消耗: 20,
分類: '召喚術',
動畫: 'summon_portal',
  castTime: 'medium',
效果: '創建子 Agent（Subagent）',
戰鬥效果: '召喚 Battle Companion 協助戰鬥',
音效: 'summon.wav',
  note: '整合夥伴系統'
```

### WebFetch → 資料抓取術

```
工具: 'WebFetch',
魔法名稱: '資料抓取術',
圖標: '🌐',
MP消耗: 10,
分類: '遠程通訊術',
動畫: 'web_spiral',
  castTime: 'medium',
效果: '發送 HTTP 請求獲取資料',
戰鬥效果: '遠程獲取情報（外部資源）',
音效: 'fetch.wav'
```

### WebSearch → 知識搜尋術

```
工具: 'WebSearch',
魔法名稱: '知識搜尋術',
圖標: '🔎',
MP消耗: 12,
分類: '遠程通訊術',
動畫: 'search_wave',
  castTime: 'medium',
效果: '搜索網絡知識',
戰鬥效果: '尋求古老智慧（查詢資料庫）',
音效: 'search_web.wav'
```

---

## 並行操作 → 多重施法

當檢測到 Claude 同時執行 2+ 個工具時觸發：

```javascript
{
  type: 'combo_cast',
魔法名稱: '多重施法',
圖標: '🔮',
MP消耗: (toolCount - 1) * 5,  // 額外消耗
分類: '組合魔法',
動畫: 'multi_magic_circle',
  castTime: 'varies',
效果: '同時施放多個魔法',
戰鬥效果: '連擊加成',
  bonusMultiplier: {
    2: 1.2,   // +20% 傷害
    3: 1.5,   // +50% 傷害
    4: 2.0,   // +100% 傷害
    5: 3.0    // +200% 傷害
  },
音效: 'multi_cast.wav'
```

---

## 施法時間對照表

| 施法時間 | 動畫時長 | 適用工具 |
|---------|---------|---------|
| instant | 0.5s | ls, pwd |
| fast | 0.8s | mkdir, cp, mv, rm, checkout |
| medium | 1.2s | commit, pull, merge, test, run |
| slow | 1.8s | install, build, push |

---

## MP 消耗等級

| MP 範圍 | 等級 | 複雜度 | 示例工具 |
|--------|------|-------|---------|
| 2-3 | 低 | 簡單查詢 | ls, pwd, mkdir |
| 4-6 | 中低 | 基礎操作 | cp, mv, rm, checkout, Read, Glob |
| 7-10 | 中 | 標準操作 | Edit, commit, pull, test, run, fetch |
| 11-15 | 中高 | 複雜操作 | Write, merge, build, install, search |
| 16-20 | 高 | 特殊操作 | Task（召喚夥伴）|
| 20+ | 超高 | 組合操作 | 多重施法 |

---

## 戰鬥效果類型

### 1. 傷害型
- Write（創造術）：80 傷害
- 多重施法：傷害加成（1.2x - 3.0x）

### 2. 增益型（Buff）
- Read（讀心術）：+10% 命中率
- Grep（搜索之眼）：+20% 暴擊率
- 戰術規劃（Plan Mode）：+10% 傷害

### 3. 減益型（Debuff）
- Edit（改寫術）：-15% 防禦
- 敵人發問攻擊（錯誤回答）：-15 HP

### 4. 實用型
- git commit：創建檢查點
- Task：召喚夥伴
- Glob：無法閃避

---

## 音效文件命名規範

```
{tool_name}.wav

例如：
- read.wav
- write.wav
- commit.wav
- summon.wav
- multi_cast.wav
```

---

## 使用示例

```javascript
// 工具執行時
function onToolExecute(tool) {
  const mapping = toolMappings[tool.name];

  // 顯示魔法名稱
  battleLog.add(`🧙 施放「${mapping.spellName}」(${tool.name})`);

  // 播放動畫
  playAnimation(mapping.animation);

  // 播放音效
  playSound(mapping.soundEffect);

  // 扣除 MP
  player.mp -= mapping.mpCost;

  // 應用戰鬥效果
  applyBattleEffect(mapping.battleEffect);
```

---

**文檔完成日期**: 2026-02-06
**總映射數量**: 20+ 工具
**覆蓋率**: 100%（所有常用 Claude CLI 工具）
