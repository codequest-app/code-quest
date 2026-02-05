# 畫面轉場流程圖

**日期**: 2026-02-05
**版本**: v1.0

---

## 總覽

本文檔定義所有畫面轉場的完整流程、動畫規格、觸發條件和特殊轉場效果。

---

## 完整畫面轉場流程圖

```
                        ┌─────────────────────┐
                        │                     │
                        │   啟動畫面           │
                        │   (Loading)         │
                        │                     │
                        └──────────┬──────────┘
                                   │
                            3s 淡入動畫
                                   │
                                   ▼
        ┌──────────────────────────────────────────────────┐
        │                                                  │
        │              探索模式（Explore）                  │
        │              - 主對話區                          │
        │              - 角色狀態                          │
        │              - 技能列表                          │
        │                                                  │
        └────┬─────┬──────────┬─────────┬─────────┬───────┘
             │     │          │         │         │
             │     │          │         │         │
   ┌─────────┘     │          │         │         └─────────────┐
   │               │          │         │                       │
   │               │          │         │                       │
任務型    快捷鍵    快捷鍵   快捷鍵    點擊                 快捷鍵
Prompt   1-7      H        G       場所圖標                P
   │               │          │         │                       │
   ▼               ▼          ▼         ▼                       ▼
┌───────┐    ┌─────────┐ ┌──────┐ ┌─────────┐         ┌────────────┐
│戰鬥模式│    │ 商業街  │ │ 酒館 │ │公會大廳 │         │ 靜止之間   │
│(Battle)│    │(7 商店) │ │(對話)│ │(Worktree│         │(Plan Mode) │
│        │    │         │ │      │ │ 管理)   │         │            │
└───┬────┘    └────┬────┘ └──┬───┘ └────┬────┘         └─────┬──────┘
    │              │         │          │                    │
    │              │         │          │                    │
    │         ┌────┴─────┐   │          │                    │
    │         ▼          ▼   ▼          ▼                    │
    │    ┌─────────┐ ┌──────────┐ ┌──────────┐              │
    │    │技能商店 │ │NPC 對話  │ │時間線列表│              │
    │    │工匠鋪   │ │快速問答  │ │創建世界  │              │
    │    │圖書館   │ │不消耗MP  │ │切換世界  │              │
    │    │傭兵公會 │ │          │ │合併世界  │              │
    │    │寶物庫   │ │          │ │          │              │
    │    │訓練場   │ │          │ │          │              │
    │    │錢莊     │ │          │ │          │              │
    │    └─────────┘ └──────────┘ └──────────┘              │
    │                                                        │
    │                                                        │
戰鬥結束                                                      │
(勝利/逃跑)                                                   │
    │                                                        │
    └────────────────────────────────────────────────────────┘
                            │
                            ▼
                    返回探索模式
```

---

## 場景轉場動畫規格

### 1. 啟動畫面 → 探索模式

**時間軸**:
```
0.0s  ├─ Logo 像素化淡入
0.5s  ├─ "連接魔法師中..." 文字閃爍
1.0s  ├─ 進度條開始填充
2.0s  ├─ 連接成功提示音
2.5s  ├─ 啟動畫面淡出
3.0s  ├─ 探索模式淡入
3.5s  └─ UI 元素依序滑入
```

**動畫效果**:
```css
/* Logo 像素化淡入 */
@keyframes pixelFadeIn {
  0% {
    opacity: 0;
    filter: blur(10px);
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    filter: blur(0);
    transform: scale(1);
  }
}

/* UI 元素滑入 */
@keyframes slideInFromBottom {
  0% {
    transform: translateY(50px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
```

**觸發條件**:
- 應用程式啟動
- WebSocket 連接成功
- 玩家數據載入完成

---

### 2. 探索模式 → 戰鬥模式

**時間軸**:
```
0.0s  ├─ 用戶輸入任務型 Prompt
0.1s  ├─ 系統識別為戰鬥任務
0.2s  ├─ 畫面震動效果開始
      │   ⬅️⬆️➡️⬇️ 震動方向隨機
0.5s  ├─ 畫面淡出（黑屏）
      │   opacity: 1 → 0
0.8s  ├─ 背景切換為戰鬥場景
      │   暗紅色濾鏡疊加
0.8s  ├─ 敵人出現動畫開始
      │   從屏幕上方飛入
      │   旋轉 + 放大
1.3s  ├─ 敵人定位完成
1.4s  ├─ 戰鬥場景淡入
      │   opacity: 0 → 1
1.7s  ├─ "⚔️ 戰鬥開始！" 文字閃爍
      │   縮放動畫 + 彈跳
2.7s  └─ 戰鬥正式開始
```

**動畫效果**:
```css
/* 畫面震動 */
@keyframes screenShake {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-5px, 2px); }
  20% { transform: translate(5px, -2px); }
  30% { transform: translate(-5px, -2px); }
  40% { transform: translate(5px, 2px); }
  50% { transform: translate(-5px, 2px); }
  60% { transform: translate(5px, -2px); }
  70% { transform: translate(-5px, -2px); }
  80% { transform: translate(5px, 2px); }
  90% { transform: translate(-5px, 2px); }
}

/* 敵人出現 */
@keyframes enemyAppear {
  0% {
    transform: translateY(-200px) scale(0.5) rotate(180deg);
    opacity: 0;
  }
  60% {
    transform: translateY(20px) scale(1.1) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(0) scale(1) rotate(0deg);
    opacity: 1;
  }
}

/* 戰鬥開始文字 */
@keyframes battleStartText {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  20% {
    transform: scale(1.2);
    opacity: 1;
  }
  40% {
    transform: scale(0.9);
  }
  60% {
    transform: scale(1.1);
  }
  80%, 100% {
    transform: scale(1);
    opacity: 1;
  }
}
```

**觸發條件**:
- 用戶輸入任務型 Prompt
- 系統判定需要進入戰鬥
- 敵人生成完成

**音效**:
- `battle_start.wav` (1.7s)
- `enemy_appear.wav` (0.8s)

---

### 3. 戰鬥模式 → 探索模式（勝利）

**時間軸**:
```
0.0s  ├─ 敵人 HP = 0
0.0s  ├─ 敵人閃爍動畫開始
      │   快速切換透明度
0.5s  ├─ 敵人消失（淡出 + 縮小 + 旋轉）
1.0s  ├─ 勝利音效播放
1.0s  ├─ "✨ 勝利！" 文字出現
      │   縮放 + 旋轉入場
2.0s  ├─ 獎勵面板從下方滑入
2.5s  ├─ EXP 數字彈出
      │   +100 (綠色，向上飄)
2.6s  ├─ Gold 數字彈出
      │   +50 (金色，向上飄)
3.5s  ├─ [如果升級] 升級動畫
      │   閃光粒子效果
5.5s  ├─ 畫面淡出
5.8s  ├─ 切換到探索場景
6.1s  ├─ 畫面淡入
6.4s  └─ 探索模式完成
```

**動畫效果**:
```css
/* 敵人消失 */
@keyframes enemyDefeat {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  20%, 40%, 60%, 80% {
    opacity: 0.3; /* 閃爍 */
  }
  10%, 30%, 50%, 70%, 90% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(0.2) rotate(360deg);
  }
}

/* 勝利文字 */
@keyframes victoryText {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.3) rotate(10deg);
    opacity: 1;
  }
  70% {
    transform: scale(0.9) rotate(-5deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

/* 獎勵彈出 */
@keyframes rewardPop {
  0% {
    transform: scale(0) translateY(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.3) translateY(-10px);
    opacity: 1;
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

/* 升級動畫 */
@keyframes levelUp {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 215, 0, 1);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 20px 10px rgba(255, 215, 0, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 215, 0, 0);
  }
}

/* 閃光粒子 */
@keyframes sparkle {
  0% {
    transform: translate(0, 0) scale(0);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translate(var(--x), var(--y)) scale(1);
    opacity: 0;
  }
}
```

**觸發條件**:
- 敵人 HP 歸零
- 戰鬥任務完成
- 獲得獎勵計算完成

**音效**:
- `victory.wav` (1.0s)
- `coin.wav` (2.6s)
- `exp_gain.wav` (2.5s)
- `level_up.wav` (3.5s, 如果升級)

---

### 4. 戰鬥模式 → 探索模式（逃跑）

**時間軸**:
```
0.0s  ├─ 用戶確認逃跑
0.0s  ├─ 畫面煙霧效果
      │   多層煙霧從中心擴散
0.5s  ├─ "逃跑成功！" 文字顯示
      │   黃色警告色
1.0s  ├─ MP 扣除動畫（30%）
1.5s  ├─ 畫面淡出
1.8s  ├─ 切換到探索場景
2.1s  └─ 畫面淡入
```

**動畫效果**:
```css
/* 煙霧效果 */
@keyframes escapeSmoke {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
    filter: blur(10px);
  }
}

/* 逃跑文字 */
@keyframes escapeText {
  0% {
    transform: translateX(-100px);
    opacity: 0;
  }
  50% {
    transform: translateX(10px);
    opacity: 1;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}
```

**觸發條件**:
- 用戶點擊逃跑按鈕
- 確認逃跑對話框
- MP 足夠扣除

**音效**:
- `escape.wav` (0.0s)
- `mp_down.wav` (1.0s)

---

### 5. 探索模式 → 商業街

**時間軸**:
```
0.0s  ├─ 用戶點擊商業街或按快捷鍵
0.1s  ├─ 當前畫面淡出
0.3s  ├─ 商業街背景淡入
0.5s  ├─ 7 個商店圖標依序彈出
      │   技能商店 (0.5s)
      │   工匠鋪 (0.6s)
      │   圖書館 (0.7s)
      │   傭兵公會 (0.8s)
      │   寶物庫 (0.9s)
      │   訓練場 (1.0s)
      │   錢莊 (1.1s)
1.2s  └─ 轉場完成
```

**動畫效果**:
```css
/* 商店圖標彈出 */
@keyframes shopIconPop {
  0% {
    transform: scale(0) translateY(50px);
    opacity: 0;
  }
  60% {
    transform: scale(1.2) translateY(-10px);
    opacity: 1;
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}
```

**觸發條件**:
- 點擊城鎮地圖的商業街建築
- 按下快捷鍵（數字鍵 1-7）
- 從其他場所切換

**音效**:
- `enter_shop.wav` (0.3s)

---

### 6. 探索模式 → 酒館（NPC 對話）

**時間軸**:
```
0.0s  ├─ 用戶點擊酒館或按快捷鍵 H
0.1s  ├─ 當前畫面向左滑出
0.5s  ├─ 酒館場景從右滑入
0.8s  ├─ NPC 老闆淡入出現
1.0s  ├─ 對話框彈出
1.2s  └─ 轉場完成
```

**動畫效果**:
```css
/* 場景滑動 */
@keyframes slideOutLeft {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-100%);
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

/* NPC 出現 */
@keyframes npcAppear {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
```

**觸發條件**:
- 點擊酒館建築
- 按下快捷鍵 H
- 探索模式中選擇對話

**音效**:
- `door_open.wav` (0.1s)
- `tavern_ambient.mp3` (背景音樂，循環)

---

### 7. 探索模式 → 公會大廳（Worktree 管理）

**時間軸**:
```
0.0s  ├─ 用戶點擊公會大廳或按快捷鍵 G
0.1s  ├─ 當前畫面淡出
0.3s  ├─ 公會大廳背景淡入
0.5s  ├─ Worktree 卡片列表從下滑入
      │   主世界 (0.5s)
      │   冒險世界 1 (0.6s)
      │   冒險世界 2 (0.7s)
      │   ...
1.0s  └─ 轉場完成
```

**動畫效果**:
```css
/* Worktree 卡片滑入 */
@keyframes worktreeCardSlideIn {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

**觸發條件**:
- 點擊公會大廳建築
- 按下快捷鍵 G
- 管理 Worktree 需求

**音效**:
- `enter_guild.wav` (0.3s)

---

### 8. 探索模式 → 靜止之間（Plan Mode）⭐

**特殊轉場：時間凍結效果**

**時間軸**:
```
0.0s  ├─ 用戶按下快捷鍵 P 或進入複雜任務
0.0s  ├─ 時間減速效果開始
      │   所有動畫速度 × 0.5
      │   音頻降調
0.5s  ├─ 顏色飽和度逐漸降低
      │   彩色 → 灰階
      │   filter: saturate(1 → 0)
1.0s  ├─ 靜止粒子出現
      │   白色微粒浮動但不移動
1.5s  ├─ 時鐘指針停止
      │   transition: none
1.5s  ├─ 靜止之間界面淡入
2.0s  ├─ Plan Mode 看板滑入
2.5s  └─ 轉場完成
```

**動畫效果**:
```css
/* 時間減速 */
@keyframes timeSlowdown {
  from {
    animation-play-state: running;
    filter: saturate(1);
  }
  to {
    animation-play-state: paused;
    filter: saturate(0);
  }
}

/* 靜止粒子 */
@keyframes frozenParticle {
  0%, 100% {
    transform: translate(0, 0);
    opacity: 0.8;
  }
  50% {
    transform: translate(2px, -2px);
    opacity: 1;
  }
}

/* 顏色去飽和 */
@keyframes desaturate {
  from {
    filter: saturate(1) brightness(1);
  }
  to {
    filter: saturate(0) brightness(0.7);
  }
}
```

**觸發條件**:
- 按下快捷鍵 P
- 系統偵測到複雜任務需要規劃
- 用戶主動進入 Plan Mode

**音效**:
- `time_stop.wav` (0.0s) - 時間停止音效
- `stasis_ambient.mp3` (背景音樂，極緩慢、回音)

**退出動畫**:
```
0.0s  ├─ 用戶完成規劃或取消
0.0s  ├─ 靜止之間淡出
0.5s  ├─ 顏色飽和度恢復
      │   灰階 → 彩色
1.0s  ├─ 時間加速效果
      │   所有動畫速度 × 2
1.5s  ├─ 時鐘指針恢復
2.0s  └─ 返回探索模式
```

---

### 9. 商業街內部 → 單一商店

**時間軸**:
```
0.0s  ├─ 用戶點擊商店圖標
0.1s  ├─ 商店圖標放大並發光
0.3s  ├─ 商業街場景縮小淡出
0.5s  ├─ 商店內部從中心展開
0.8s  ├─ 商店內容依序顯示
      │   標題 (0.8s)
      │   物品列表 (0.9s - 1.2s)
1.3s  └─ 轉場完成
```

**動畫效果**:
```css
/* 商店展開 */
@keyframes shopExpand {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* 物品列表依序顯示 */
@keyframes itemStagger {
  from {
    transform: translateX(-30px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

**觸發條件**:
- 點擊商店圖標
- 按下對應數字快捷鍵

**音效**:
- `shop_open.wav` (0.3s)

---

### 10. 城鎮 ↔ 野外（雙向切換）

**時間軸**:
```
0.0s  ├─ 用戶移動到野外入口
0.0s  ├─ 場景旋轉效果開始
      │   整體 3D 旋轉
0.3s  ├─ 背景淡出
0.5s  ├─ 旋轉粒子效果
0.8s  ├─ 新場景淡入
1.0s  └─ 轉場完成
```

**動畫效果**:
```css
/* 場景旋轉 */
@keyframes sceneRotate {
  from {
    transform: perspective(1000px) rotateY(0deg);
    opacity: 1;
  }
  to {
    transform: perspective(1000px) rotateY(90deg);
    opacity: 0;
  }
}

/* 旋轉粒子 */
@keyframes rotateParticle {
  from {
    transform: rotate(0deg) translateX(0);
    opacity: 1;
  }
  to {
    transform: rotate(360deg) translateX(100px);
    opacity: 0;
  }
}
```

**觸發條件**:
- 移動到城鎮邊界
- 點擊野外入口
- 使用傳送道具

**音效**:
- `scene_transition.wav` (0.5s)

---

### 11. 野外 → 副本入口

**時間軸**:
```
0.0s  ├─ 用戶靠近副本入口
0.0s  ├─ 提示框出現
      │   "按 E 進入副本"
0.5s  ├─ 用戶按下 E
0.5s  ├─ 副本門發光
1.0s  ├─ 畫面閃白
1.2s  ├─ 副本資訊面板滑入
      │   難度、Boss、獎勵
1.5s  ├─ 確認按鈕出現
      │   [挑戰副本] [返回]
```

**動畫效果**:
```css
/* 副本門發光 */
@keyframes dungeonGlow {
  0%, 100% {
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 30px rgba(255, 255, 255, 1);
  }
}

/* 閃白效果 */
@keyframes flashWhite {
  0% {
    background: rgba(255, 255, 255, 0);
  }
  50% {
    background: rgba(255, 255, 255, 1);
  }
  100% {
    background: rgba(255, 255, 255, 0);
  }
}
```

**觸發條件**:
- 移動到副本入口
- 滿足進入條件（等級、任務）

**音效**:
- `dungeon_entrance.wav` (0.5s)

---

### 12. 快捷鍵直接傳送（任意場所）

**時間軸**:
```
0.0s  ├─ 用戶按下快捷鍵
0.0s  ├─ 閃光效果
      │   白色閃光從中心爆發
0.1s  ├─ 粒子爆發
      │   金色粒子向外擴散
0.2s  ├─ 當前場景淡出
0.3s  ├─ 目標場景淡入
0.4s  └─ 轉場完成
```

**動畫效果**:
```css
/* 快速傳送閃光 */
@keyframes quickTeleport {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  50% {
    transform: scale(2);
    opacity: 0.5;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}

/* 粒子爆發 */
@keyframes particleBurst {
  from {
    transform: scale(0);
    opacity: 1;
  }
  to {
    transform: scale(3);
    opacity: 0;
  }
}
```

**觸發條件**:
- 按下快捷鍵（1-7, H, G, P）
- 快速傳送道具
- 記憶點傳送

**音效**:
- `teleport_flash.wav` (0.0s)

---

### 13. Async Battle：主對話區 → 戰鬥卡片（右側面板）

**時間軸**:
```
0.0s  ├─ 用戶輸入複雜任務
0.1s  ├─ 系統識別為異步戰鬥
0.2s  ├─ 主對話區顯示啟動通知
      │   "🎮 戰鬥 #1 已開始！"
0.5s  ├─ 右側面板出現新戰鬥卡片
      │   從右側滑入
0.8s  ├─ 卡片進度條開始填充
1.0s  └─ 用戶可繼續輸入
```

**動畫效果**:
```css
/* 戰鬥卡片滑入 */
@keyframes battleCardSlideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 進度條脈動 */
@keyframes progressPulse {
  0%, 100% {
    box-shadow: 0 0 5px rgba(255, 107, 107, 0.5);
  }
  50% {
    box-shadow: 0 0 15px rgba(255, 107, 107, 1);
  }
}
```

**觸發條件**:
- 任務複雜度 > 10
- 預計時間 > 5 分鐘
- 用戶選擇異步執行

**音效**:
- `battle_async_start.wav` (0.5s)

---

## 轉場觸發條件總覽

| 轉場類型 | 觸發條件 | 優先級 | 可中斷 |
|---------|---------|--------|-------|
| 啟動 → 探索 | 應用啟動 + 連接成功 | 最高 | 否 |
| 探索 → 戰鬥 | 任務型 Prompt | 高 | 否 |
| 戰鬥 → 探索（勝利） | 敵人 HP = 0 | 高 | 否 |
| 戰鬥 → 探索（逃跑） | 用戶確認逃跑 | 高 | 否 |
| 探索 → 商業街 | 點擊/快捷鍵 | 中 | 是 |
| 探索 → 酒館 | 點擊/快捷鍵 H | 中 | 是 |
| 探索 → 公會 | 點擊/快捷鍵 G | 中 | 是 |
| 探索 → 靜止之間 | 快捷鍵 P / 複雜任務 | 高 | 否 |
| 商業街 → 商店 | 點擊商店 | 低 | 是 |
| 城鎮 ↔ 野外 | 移動到邊界 | 中 | 是 |
| 野外 → 副本 | 靠近入口 + 按 E | 中 | 是 |
| 快捷鍵傳送 | 按下快捷鍵 | 中 | 否 |
| 主對話 → 戰鬥卡片 | 異步任務啟動 | 高 | 否 |

---

## 動畫時序標準

### 速度分級

| 級別 | 持續時間 | 適用場景 | 緩動函數 |
|-----|---------|---------|---------|
| 極快 | 100-200ms | 微交互、懸停 | ease-out |
| 快速 | 200-400ms | 按鈕、開關 | ease-in-out |
| 標準 | 400-800ms | 場景轉場 | ease |
| 緩慢 | 800-1500ms | 特殊效果 | cubic-bezier |
| 極慢 | 1500ms+ | 劇情動畫 | custom |

### 緩動函數

```css
/* 標準緩動 */
--ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1);

/* 進入 */
--ease-in: cubic-bezier(0.4, 0.0, 1, 1);

/* 離開 */
--ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);

/* 進入並離開 */
--ease-in-out: cubic-bezier(0.4, 0.0, 0.6, 1);

/* 彈跳 */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

---

## 特殊轉場效果

### 1. 時間凍結（進入靜止之間）

**視覺效果**:
- 顏色飽和度降至 0（灰階）
- 亮度降至 70%
- 所有動畫速度減半
- 靜止粒子浮動但不移動
- 時鐘指針停止

**實現代碼**:
```css
.freeze-time {
  animation: freezeTime 1.5s ease-out forwards;
}

@keyframes freezeTime {
  0% {
    filter: saturate(1) brightness(1);
  }
  100% {
    filter: saturate(0) brightness(0.7);
  }
}

/* 所有子元素動畫減速 */
.freeze-time * {
  animation-play-state: paused !important;
}
```

---

### 2. 升級閃光

**視覺效果**:
- 全屏金色閃光
- 角色周圍粒子爆發
- HP/MP 條閃爍
- 等級數字放大縮小

**實現代碼**:
```css
@keyframes levelUpFlash {
  0%, 100% {
    background: rgba(255, 215, 0, 0);
  }
  10%, 30%, 50% {
    background: rgba(255, 215, 0, 0.8);
  }
  20%, 40%, 60% {
    background: rgba(255, 215, 0, 0);
  }
}

/* 粒子 */
@keyframes levelUpParticle {
  0% {
    transform: translate(0, 0) scale(0);
    opacity: 1;
  }
  100% {
    transform: translate(var(--x), var(--y)) scale(1);
    opacity: 0;
  }
}
```

---

### 3. 副本入口特效

**視覺效果**:
- 副本門持續發光脈動
- 靠近時強度增加
- 進入時閃白效果
- 粒子被吸入門內

**實現代碼**:
```css
@keyframes dungeonPortal {
  0%, 100% {
    box-shadow:
      0 0 20px rgba(138, 43, 226, 0.5),
      inset 0 0 20px rgba(138, 43, 226, 0.3);
  }
  50% {
    box-shadow:
      0 0 40px rgba(138, 43, 226, 1),
      inset 0 0 40px rgba(138, 43, 226, 0.6);
  }
}

/* 粒子吸入 */
@keyframes particleSuckIn {
  from {
    transform: translate(var(--start-x), var(--start-y)) scale(1);
    opacity: 1;
  }
  to {
    transform: translate(0, 0) scale(0);
    opacity: 0;
  }
}
```

---

## 轉場性能優化

### 1. GPU 加速

**使用 transform 和 opacity**:
```css
/* ✅ 好 - 使用 GPU */
.transition {
  transform: translateX(100px);
  opacity: 0.5;
}

/* ❌ 壞 - 觸發重排 */
.transition {
  left: 100px;
  display: none;
}
```

### 2. will-change 提示

```css
.scene-transition {
  will-change: transform, opacity;
}

/* 轉場完成後移除 */
.scene-transition.complete {
  will-change: auto;
}
```

### 3. 圖層分離

```css
.layer {
  transform: translateZ(0);
  backface-visibility: hidden;
}
```

### 4. 減少重繪

```css
/* 使用 contain */
.scene {
  contain: layout style paint;
}
```

---

## 音效規格

### 音效文件列表

| 音效名稱 | 文件名 | 時長 | 觸發時機 | 音量 |
|---------|--------|------|---------|------|
| 戰鬥開始 | battle_start.wav | 1.0s | 進入戰鬥 | 80% |
| 敵人出現 | enemy_appear.wav | 0.8s | 敵人登場 | 70% |
| 勝利 | victory.wav | 2.0s | 戰鬥勝利 | 90% |
| 升級 | level_up.wav | 1.5s | 等級提升 | 100% |
| 金幣 | coin.wav | 0.3s | 獲得金幣 | 60% |
| 經驗值 | exp_gain.wav | 0.5s | 獲得經驗 | 60% |
| 逃跑 | escape.wav | 0.8s | 逃跑成功 | 70% |
| 時間停止 | time_stop.wav | 1.2s | 進入靜止之間 | 85% |
| 傳送 | teleport.wav | 0.4s | 快速傳送 | 75% |
| 進入商店 | shop_open.wav | 0.5s | 進入商店 | 65% |
| 開門 | door_open.wav | 0.6s | 進入建築 | 60% |
| 副本入口 | dungeon_entrance.wav | 1.0s | 副本提示 | 80% |
| 異步戰鬥 | battle_async_start.wav | 0.7s | 異步戰鬥啟動 | 70% |

### 背景音樂

| 音樂名稱 | 文件名 | 場景 | 循環 | 音量 |
|---------|--------|------|------|------|
| 探索主題 | explore_theme.mp3 | 探索模式 | 是 | 40% |
| 戰鬥主題 | battle_theme.mp3 | 戰鬥模式 | 是 | 50% |
| 酒館環境音 | tavern_ambient.mp3 | 酒館 | 是 | 30% |
| 靜止之間 | stasis_ambient.mp3 | Plan Mode | 是 | 25% |
| 商店音樂 | shop_theme.mp3 | 商業街 | 是 | 35% |
| 野外探索 | wilderness_theme.mp3 | 野外 | 是 | 45% |

### 音效淡入淡出

```javascript
// 場景切換時音樂淡出淡入
function crossfadeMusic(fromMusic, toMusic, duration = 1000) {
  // 淡出當前音樂
  fadeOut(fromMusic, duration / 2);

  // 延遲後淡入新音樂
  setTimeout(() => {
    fadeIn(toMusic, duration / 2);
  }, duration / 2);
}

function fadeOut(audio, duration) {
  const steps = 20;
  const stepTime = duration / steps;
  const volumeStep = audio.volume / steps;

  const interval = setInterval(() => {
    if (audio.volume > volumeStep) {
      audio.volume -= volumeStep;
    } else {
      audio.volume = 0;
      audio.pause();
      clearInterval(interval);
    }
  }, stepTime);
}

function fadeIn(audio, duration) {
  audio.volume = 0;
  audio.play();

  const targetVolume = 0.4; // 目標音量
  const steps = 20;
  const stepTime = duration / steps;
  const volumeStep = targetVolume / steps;

  const interval = setInterval(() => {
    if (audio.volume < targetVolume - volumeStep) {
      audio.volume += volumeStep;
    } else {
      audio.volume = targetVolume;
      clearInterval(interval);
    }
  }, stepTime);
}
```

---

## 實現優先級

### Phase 1（基礎轉場）
- ✅ 探索 ↔ 戰鬥
- ✅ 淡入淡出
- ✅ 基礎音效

### Phase 2（場所轉場）
- ✅ 商業街、酒館、公會
- ✅ 滑動動畫
- ✅ 背景音樂

### Phase 3（特殊效果）
- ✅ 靜止之間（時間凍結）
- ✅ 升級閃光
- ✅ 副本入口

### Phase 4（優化）
- ✅ 性能優化
- ✅ 動畫流暢度
- ✅ 音效淡入淡出

---

## 測試檢查清單

### 功能測試
- [ ] 所有轉場觸發正確
- [ ] 動畫時序準確
- [ ] 音效播放正常
- [ ] 快捷鍵響應

### 性能測試
- [ ] 轉場 FPS ≥ 60
- [ ] 無掉幀現象
- [ ] 記憶體使用穩定
- [ ] CPU 使用合理

### 視覺測試
- [ ] 動畫流暢
- [ ] 顏色正確
- [ ] 特效完整
- [ ] 無閃爍或撕裂

### 音效測試
- [ ] 音效同步
- [ ] 音量平衡
- [ ] 淡入淡出順暢
- [ ] 無爆音或失真

### 邊界測試
- [ ] 快速連續切換
- [ ] 網路延遲情況
- [ ] 低端設備表現
- [ ] 多窗口切換

---

**版本**: v1.0
**最後更新**: 2026-02-05
