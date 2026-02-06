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

```javascript
{
  tool: 'Read',
  spellName: '讀心術',
  icon: '📖',
  mpCost: 3,
  category: '檔案魔法',
  animation: 'book_open',
  effect: '讀取文件內容，了解代碼意圖',
  battleEffect: '獲得敵人資訊（+10% 命中率，2 回合）',
  soundEffect: 'read.wav'
}
```

### Write 工具 → 創造術

```javascript
{
  tool: 'Write',
  spellName: '創造術',
  icon: '✍️',
  mpCost: 8,
  category: '檔案魔法',
  animation: 'writing_feather',
  effect: '創建或覆蓋文件',
  battleEffect: '創造新代碼（造成 80 傷害）',
  soundEffect: 'write.wav'
}
```

### Edit 工具 → 改寫術

```javascript
{
  tool: 'Edit',
  spellName: '改寫術',
  icon: '✏️',
  mpCost: 6,
  category: '檔案魔法',
  animation: 'text_transform',
  effect: '編輯文件內容，精確修改',
  battleEffect: '修改敵人屬性（-15% 防禦，3 回合）',
  soundEffect: 'edit.wav'
}
```

---

## 搜索魔法

### Grep 工具 → 搜索之眼

```javascript
{
  tool: 'Grep',
  spellName: '搜索之眼',
  icon: '👁️',
  mpCost: 5,
  category: '探索魔法',
  animation: 'eye_scan',
  effect: '在代碼中搜索字符串模式',
  battleEffect: '找出敵人弱點（+20% 暴擊率，2 回合）',
  soundEffect: 'search.wav'
}
```

### Glob 工具 → 定位術

```javascript
{
  tool: 'Glob',
  spellName: '定位術',
  icon: '🔍',
  mpCost: 4,
  category: '探索魔法',
  animation: 'radar_scan',
  effect: '搜索文件名模式',
  battleEffect: '定位敵人位置（無法閃避，1 次攻擊）',
  soundEffect: 'locate.wav'
}
```

---

## Git 魔法系列

### git commit → 版本封印術

```javascript
{
  tool: 'git commit',
  spellName: '版本封印術',
  icon: '📦',
  mpCost: 5,
  category: 'Git 魔法',
  animation: 'seal_magic',
  castTime: 'fast',
  effect: '保存當前代碼狀態',
  battleEffect: '封存進度（創建檢查點）',
  soundEffect: 'commit.wav'
}
```

### git push → 遠程傳送術

```javascript
{
  tool: 'git push',
  spellName: '遠程傳送術',
  icon: '🚀',
  mpCost: 10,
  category: 'Git 魔法',
  animation: 'teleport',
  castTime: 'medium',
  effect: '同步到遠程倉庫',
  battleEffect: '傳送代碼（分享勝利成果）',
  soundEffect: 'push.wav'
}
```

### git pull → 同步魔法

```javascript
{
  tool: 'git pull',
  spellName: '同步魔法',
  icon: '🔄',
  mpCost: 8,
  category: 'Git 魔法',
  animation: 'sync_circle',
  castTime: 'medium',
  effect: '獲取最新版本',
  battleEffect: '學習新招式（獲得隊友更新）',
  soundEffect: 'pull.wav'
}
```

### git merge → 融合術

```javascript
{
  tool: 'git merge',
  spellName: '融合術',
  icon: '🔀',
  mpCost: 12,
  category: 'Git 魔法',
  animation: 'merge_vortex',
  castTime: 'medium',
  effect: '合併分支代碼',
  battleEffect: '融合力量（組合技能）',
  soundEffect: 'merge.wav'
}
```

### git checkout → 時空跳躍

```javascript
{
  tool: 'git checkout',
  spellName: '時空跳躍',
  icon: '⏰',
  mpCost: 4,
  category: 'Git 魔法',
  animation: 'time_warp',
  castTime: 'fast',
  effect: '切換分支或版本',
  battleEffect: '回到過去（恢復早期狀態）',
  soundEffect: 'checkout.wav'
}
```

---

## npm 魔法系列

### npm install → 依賴召喚術

```javascript
{
  tool: 'npm install',
  spellName: '依賴召喚術',
  icon: '📚',
  mpCost: 15,
  category: 'npm 魔法',
  animation: 'summoning_circle',
  castTime: 'slow',
  effect: '安裝項目依賴套件',
  battleEffect: '召喚支援（獲得外部力量）',
  soundEffect: 'install.wav'
}
```

### npm test → 試煉之法

```javascript
{
  tool: 'npm test',
  spellName: '試煉之法',
  icon: '🧪',
  mpCost: 8,
  category: 'npm 魔法',
  animation: 'test_flask',
  castTime: 'medium',
  effect: '執行測試套件',
  battleEffect: '驗證戰術（確保無漏洞）',
  soundEffect: 'test.wav'
}
```

### npm build → 構築魔法

```javascript
{
  tool: 'npm build',
  spellName: '構築魔法',
  icon: '🏗️',
  mpCost: 12,
  category: 'npm 魔法',
  animation: 'construction',
  castTime: 'slow',
  effect: '構建生產版本',
  battleEffect: '鍛造終極武器（最終版本）',
  soundEffect: 'build.wav'
}
```

### npm run dev → 開發召喚

```javascript
{
  tool: 'npm run dev',
  spellName: '開發召喚',
  icon: '🔥',
  mpCost: 10,
  category: 'npm 魔法',
  animation: 'flame_up',
  castTime: 'medium',
  effect: '啟動開發服務器',
  battleEffect: '激活訓練場（持續開發）',
  soundEffect: 'dev.wav'
}
```

---

## 系統魔法系列

### ls/pwd → 偵察術

```javascript
{
  tool: 'ls / pwd',
  spellName: '偵察術',
  icon: '👁️',
  mpCost: 2,
  category: '系統魔法',
  animation: 'eye_glow',
  castTime: 'instant',
  effect: '查看文件和目錄結構',
  battleEffect: '偵察地形（了解環境）',
  soundEffect: 'scout.wav'
}
```

### mkdir → 創造空間術

```javascript
{
  tool: 'mkdir',
  spellName: '創造空間術',
  icon: '📁',
  mpCost: 3,
  category: '系統魔法',
  animation: 'folder_appear',
  castTime: 'fast',
  effect: '創建新目錄',
  battleEffect: '開闢新領域（擴展空間）',
  soundEffect: 'mkdir.wav'
}
```

### rm/rm -rf → 抹除術

```javascript
{
  tool: 'rm / rm -rf',
  spellName: '抹除術',
  icon: '🗑️',
  mpCost: 5,
  category: '系統魔法',
  animation: 'disintegrate',
  castTime: 'fast',
  effect: '刪除文件或目錄',
  battleEffect: '毀滅打擊（清除目標）',
  soundEffect: 'delete.wav',
  warning: 'rm -rf 風險高，需要額外確認'
}
```

### cp/mv → 轉移術

```javascript
{
  tool: 'cp / mv',
  spellName: '轉移術',
  icon: '🚚',
  mpCost: 4,
  category: '系統魔法',
  animation: 'telekinesis',
  castTime: 'fast',
  effect: '複製或移動文件',
  battleEffect: '物品傳送（重新定位資源）',
  soundEffect: 'move.wav'
}
```

---

## 特殊工具

### Task 工具 → 召喚夥伴

```javascript
{
  tool: 'Task',
  spellName: '召喚夥伴',
  icon: '🌟',
  mpCost: 20,
  category: '召喚術',
  animation: 'summon_portal',
  castTime: 'medium',
  effect: '創建子 Agent（Subagent）',
  battleEffect: '召喚 Battle Companion 協助戰鬥',
  soundEffect: 'summon.wav',
  note: '整合夥伴系統'
}
```

### WebFetch → 資料抓取術

```javascript
{
  tool: 'WebFetch',
  spellName: '資料抓取術',
  icon: '🌐',
  mpCost: 10,
  category: '遠程通訊術',
  animation: 'web_spiral',
  castTime: 'medium',
  effect: '發送 HTTP 請求獲取資料',
  battleEffect: '遠程獲取情報（外部資源）',
  soundEffect: 'fetch.wav'
}
```

### WebSearch → 知識搜尋術

```javascript
{
  tool: 'WebSearch',
  spellName: '知識搜尋術',
  icon: '🔎',
  mpCost: 12,
  category: '遠程通訊術',
  animation: 'search_wave',
  castTime: 'medium',
  effect: '搜索網絡知識',
  battleEffect: '尋求古老智慧（查詢資料庫）',
  soundEffect: 'search_web.wav'
}
```

---

## 並行操作 → 多重施法

當檢測到 Claude 同時執行 2+ 個工具時觸發：

```javascript
{
  type: 'combo_cast',
  spellName: '多重施法',
  icon: '🔮',
  mpCost: (toolCount - 1) * 5,  // 額外消耗
  category: '組合魔法',
  animation: 'multi_magic_circle',
  castTime: 'varies',
  effect: '同時施放多個魔法',
  battleEffect: '連擊加成',
  bonusMultiplier: {
    2: 1.2,   // +20% 傷害
    3: 1.5,   // +50% 傷害
    4: 2.0,   // +100% 傷害
    5: 3.0    // +200% 傷害
  },
  soundEffect: 'multi_cast.wav'
}
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
}
```

---

**文檔完成日期**: 2026-02-06
**總映射數量**: 20+ 工具
**覆蓋率**: 100%（所有常用 Claude CLI 工具）
