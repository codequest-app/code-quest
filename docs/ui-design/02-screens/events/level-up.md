# Level Up Screen - 升級畫面

**分類**: Event & Modal Screens
**類型**: Celebration & Progression Overlay
**優先級**: High
**最後更新**: 2026-02-05

---

## 概述

升級畫面是當玩家累積足夠經驗值後觸發的慶祝動畫覆蓋層。此畫面以全螢幕閃光和華麗的視覺效果來慶祝玩家的進步，顯示屬性提升、新技能解鎖和成就獲得。

### 觸發條件

- 經驗值達到升級閾值
- 完成特殊任務或成就
- 達成里程碑（如第 10、25、50 級）
- 解鎖新的遊戲功能

---

## ASCII 佈局設計

### 基本升級動畫

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│                    【全螢幕閃光效果 - 300ms】                           │
│                                                                        │
│                                                                        │
│                        ✨✨✨✨✨✨✨                                   │
│                      ✨           ✨                                  │
│                    ✨               ✨                                │
│                   ✨                 ✨                               │
│                  ✨    🎉 升級了！🎉    ✨                           │
│                   ✨                 ✨                               │
│                    ✨    Lv.14 → 15    ✨                            │
│                      ✨           ✨                                  │
│                        ✨✨✨✨✨✨✨                                   │
│                                                                        │
│            ╔═══════════════════════════════════════════╗              │
│            ║         屬性提升                          ║              │
│            ╠═══════════════════════════════════════════╣              │
│            ║                                           ║              │
│            ║  HP    100 → 110  (+10) ❤️              ║              │
│            ║  MP    80  → 85   (+5)  💙              ║              │
│            ║  ATK   45  → 48   (+3)  ⚔️              ║              │
│            ║  DEF   35  → 37   (+2)  🛡️              ║              │
│            ║                                           ║              │
│            ╚═══════════════════════════════════════════╝              │
│                                                                        │
│                   按任意鍵繼續... (3s 後自動關閉)                      │
│                                                                        │
│                        ✨✨✨✨✨✨✨                                   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 升級 + 新技能解鎖

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│                        ✨✨✨✨✨✨✨                                   │
│                      ✨  🎊 升級了！🎊  ✨                            │
│                        ✨✨✨✨✨✨✨                                   │
│                                                                        │
│                          Lv.19 → 20                                    │
│                                                                        │
│            ╔═══════════════════════════════════════════╗              │
│            ║         屬性提升                          ║              │
│            ╠═══════════════════════════════════════════╣              │
│            ║                                           ║              │
│            ║  HP    190 → 200  (+10) ❤️              ║              │
│            ║  MP    155 → 160  (+5)  💙              ║              │
│            ║  ATK   90  → 93   (+3)  ⚔️              ║              │
│            ║  DEF   70  → 72   (+2)  🛡️              ║              │
│            ║                                           ║              │
│            ╚═══════════════════════════════════════════╝              │
│                                                                        │
│            ╔═══════════════════════════════════════════╗              │
│            ║  🎉 解鎖新技能！                          ║              │
│            ╠═══════════════════════════════════════════╣              │
│            ║                                           ║              │
│            ║  ┌──────────────────────────────────┐   ║              │
│            ║  │ 🔮 Git Rebase Master             │   ║              │
│            ║  │ ────────────────────────────────  │   ║              │
│            ║  │ 重新整理 Git 歷史的進階技能       │   ║              │
│            ║  │                                   │   ║              │
│            ║  │ MP 消耗: 40                       │   ║              │
│            ║  │ 效果: 重新組織 commit 順序        │   ║              │
│            ║  │ 相性: Git 操作 ×1.5               │   ║              │
│            ║  └──────────────────────────────────┘   ║              │
│            ║                                           ║              │
│            ║  💡 在技能選單中查看此技能                ║              │
│            ║                                           ║              │
│            ╚═══════════════════════════════════════════╝              │
│                                                                        │
│                   按任意鍵繼續... (5s 後自動關閉)                      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 里程碑升級（特殊等級）

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│                        🌟🌟🌟🌟🌟🌟🌟                                 │
│                      🌟  🏆 里程碑！🏆  🌟                              │
│                        🌟🌟🌟🌟🌟🌟🌟                                 │
│                                                                        │
│                     達到 Lv.25 - 資深開發者                            │
│                                                                        │
│            ╔═══════════════════════════════════════════╗              │
│            ║         大幅屬性提升！                    ║              │
│            ╠═══════════════════════════════════════════╣              │
│            ║                                           ║              │
│            ║  HP    240 → 270  (+30) ❤️❤️           ║              │
│            ║  MP    200 → 220  (+20) 💙💙           ║              │
│            ║  ATK   115 → 125  (+10) ⚔️⚔️           ║              │
│            ║  DEF   90  → 95   (+5)  🛡️              ║              │
│            ║                                           ║              │
│            ╚═══════════════════════════════════════════╝              │
│                                                                        │
│            ╔═══════════════════════════════════════════╗              │
│            ║  🎁 特殊獎勵                              ║              │
│            ╠═══════════════════════════════════════════╣              │
│            ║                                           ║              │
│            ║  • 🔮 解鎖 3 個進階技能                  ║              │
│            ║  • 💰 獲得 500 金幣                       ║              │
│            ║  • 🎫 獲得「資深開發者」稱號              ║              │
│            ║  • 🌲 解鎖 Worktree 系統                 ║              │
│            ║  • 🤝 可召喚 2 個 Agent                  ║              │
│            ║                                           ║              │
│            ╚═══════════════════════════════════════════╝              │
│                                                                        │
│            ╔═══════════════════════════════════════════╗              │
│            ║  🏆 成就獲得：「經驗豐富」                ║              │
│            ╠═══════════════════════════════════════════╣              │
│            ║  達到 25 級的證明                         ║              │
│            ║  獲得額外 +5% 經驗值加成                  ║              │
│            ╚═══════════════════════════════════════════╝              │
│                                                                        │
│                   按任意鍵繼續... (10s 後自動關閉)                     │
│                                                                        │
│                        🌟🌟🌟🌟🌟🌟🌟                                 │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 多重升級（跳級）

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│                        ⚡⚡⚡⚡⚡⚡⚡                                   │
│                      ⚡  🔥 連續升級！🔥  ⚡                            │
│                        ⚡⚡⚡⚡⚡⚡⚡                                   │
│                                                                        │
│                     Lv.8 → 9 → 10 → 11                                │
│                                                                        │
│            ╔═══════════════════════════════════════════╗              │
│            ║         累積屬性提升                      ║              │
│            ╠═══════════════════════════════════════════╣              │
│            ║                                           ║              │
│            ║  HP    80  → 110  (+30) ❤️❤️❤️         ║              │
│            ║  MP    65  → 80   (+15) 💙💙           ║              │
│            ║  ATK   36  → 45   (+9)  ⚔️⚔️           ║              │
│            ║  DEF   28  → 34   (+6)  🛡️              ║              │
│            ║                                           ║              │
│            ╚═══════════════════════════════════════════╝              │
│                                                                        │
│            ╔═══════════════════════════════════════════╗              │
│            ║  🎊 獲得獎勵                              ║              │
│            ╠═══════════════════════════════════════════╣              │
│            ║                                           ║              │
│            ║  • 💰 200 金幣                            ║              │
│            ║  • 🔮 解鎖 2 個新技能                    ║              │
│            ║  • 🏆 成就：「快速成長」                 ║              │
│            ║                                           ║              │
│            ╚═══════════════════════════════════════════╝              │
│                                                                        │
│               🎉 太厲害了！一次提升 4 級！🎉                          │
│                                                                        │
│                   按任意鍵繼續... (6s 後自動關閉)                      │
│                                                                        │
│                        ⚡⚡⚡⚡⚡⚡⚡                                   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 升級通知（最小化版本）

```
┌────────────────────────────────────────┐
│  ✨ 升級了！Lv.14 → 15                 │
│  HP +10, MP +5, ATK +3, DEF +2         │
│  [查看詳情] [繼續]                     │
└────────────────────────────────────────┘
   (右下角通知，5秒後自動消失)
```

---

## 組件規格

### Level Up Overlay

**屬性**:
- 顯示模式: 全螢幕覆蓋層
- 背景: 半透明黑色 (60%)
- Z-index: 3000（最高優先級）
- 自動關閉: 是（3-10 秒，依內容而定）
- 手動關閉: 按任意鍵
- 焦點陷阱: 啟用（防止誤操作）

### Level Up Data

```typescript
interface LevelUpData {
  oldLevel: number;
  newLevel: number;
  isMultiLevel: boolean;        // 是否跳級
  levelCount?: number;           // 跳級數量
  isMilestone: boolean;          // 是否里程碑
  statIncreases: {
    hp: number;
    mp: number;
    atk: number;
    def: number;
  };
  newSkills: Skill[];            // 解鎖的新技能
  achievements: Achievement[];   // 獲得的成就
  rewards: {
    gold?: number;
    items?: Item[];
    titles?: string[];
    features?: string[];         // 解鎖的新功能
  };
  totalExp: number;
  nextLevelExp: number;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  mpCost: number;
  compatibility?: string;
  effect: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  reward?: string;
}
```

### Milestone Levels

```typescript
const MILESTONE_LEVELS = [
  { level: 5, title: '新手畢業', rewards: ['解鎖 Git 進階操作'] },
  { level: 10, title: '初級開發者', rewards: ['解鎖 Agent 召喚'] },
  { level: 25, title: '資深開發者', rewards: ['解鎖 Worktree 系統'] },
  { level: 50, title: '專家級開發者', rewards: ['解鎖並行戰鬥'] },
  { level: 100, title: '大師級開發者', rewards: ['解鎖所有功能'] }
];

function isMilestone(level: number): boolean {
  return MILESTONE_LEVELS.some(m => m.level === level);
}
```

### Stat Calculation

```typescript
// 屬性增長公式
interface StatGrowth {
  base: number;
  perLevel: number;
  milestone?: number;  // 里程碑額外加成
}

const STAT_GROWTH: Record<string, StatGrowth> = {
  hp: { base: 100, perLevel: 10, milestone: 20 },
  mp: { base: 50, perLevel: 5, milestone: 15 },
  atk: { base: 10, perLevel: 3, milestone: 7 },
  def: { base: 8, perLevel: 2, milestone: 3 }
};

function calculateStatIncrease(
  stat: string,
  oldLevel: number,
  newLevel: number,
  isMilestone: boolean
): number {
  const growth = STAT_GROWTH[stat];
  let increase = (newLevel - oldLevel) * growth.perLevel;

  if (isMilestone && growth.milestone) {
    increase += growth.milestone;
  }

  return increase;
}
```

---

## 動畫效果

### 入場動畫序列

【參考：01-design-system/animation-timing.md】

```
階段 1: 閃光效果 (0.0s - 0.3s)
├─ 0.0s: 全螢幕白色閃光（亮度 100%）
├─ 0.1s: 淡化到 50%
└─ 0.3s: 淡化到背景遮罩（60% 黑色）

階段 2: 標題動畫 (0.3s - 0.8s)
├─ 0.3s: 「升級了！」文字從中心爆炸進入
│         (scale: 0 → 2.0 → 1.0, duration: 500ms)
├─ 0.5s: 星星粒子擴散動畫
└─ 0.8s: 等級數字滾動動畫 (Lv.14 → 15)

階段 3: 屬性提升 (0.8s - 2.0s)
├─ 0.8s: 屬性框從下方滑入 (translateY: 50px → 0)
├─ 1.0s: 屬性數字依序彈出（stagger 100ms）
│         HP → MP → ATK → DEF
├─ 1.0s: 數字增長動畫（數字滾動效果）
└─ 2.0s: 所有屬性動畫完成

階段 4: 新技能/成就 (2.0s - 3.5s)
├─ 2.0s: 新技能卡片滑入（如果有）
├─ 2.5s: 成就通知彈出（如果有）
└─ 3.5s: 所有動畫完成

階段 5: 持續效果 (3.5s - 自動關閉)
├─ 背景閃光粒子持續飄動
├─ 星星閃爍動畫
└─ 「按任意鍵繼續」文字閃爍
```

### 閃光效果

```typescript
const flashAnimation = {
  initial: {
    opacity: 1,
    backgroundColor: '#FFFFFF',
    filter: 'brightness(3)'
  },
  animate: {
    opacity: [1, 0.5, 0],
    backgroundColor: ['#FFFFFF', '#FFFF99', 'rgba(0,0,0,0.6)'],
    filter: ['brightness(3)', 'brightness(1.5)', 'brightness(1)']
  },
  transition: {
    duration: 0.3,
    ease: 'easeOut'
  }
}
```

### 標題爆炸動畫

```typescript
const titleAnimation = {
  initial: {
    scale: 0,
    rotate: -180,
    opacity: 0
  },
  animate: {
    scale: [0, 2.0, 1.0],
    rotate: [-180, 180, 0],
    opacity: [0, 1, 1]
  },
  transition: {
    duration: 0.5,
    times: [0, 0.6, 1],
    ease: [0.34, 1.56, 0.64, 1] // easeOutBack
  }
}
```

### 等級數字滾動

```typescript
function animateNumberRoll(
  from: number,
  to: number,
  duration: number = 500
): void {
  const startTime = Date.now();

  function update() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // 緩動函數
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic

    const current = Math.floor(from + (to - from) * eased);
    displayNumber(current);

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  update();
}
```

### 屬性數字彈出

```typescript
const statPopAnimation = {
  initial: {
    scale: 0,
    y: 20,
    opacity: 0
  },
  animate: {
    scale: [0, 1.3, 1.0],
    y: [20, -5, 0],
    opacity: [0, 1, 1]
  },
  transition: {
    duration: 0.4,
    times: [0, 0.6, 1],
    ease: 'easeOut'
  }
}

// 依序彈出（stagger）
const statsList = ['hp', 'mp', 'atk', 'def'];
statsList.forEach((stat, index) => {
  setTimeout(() => {
    animateStat(stat, statPopAnimation);
  }, index * 100); // 每個間隔 100ms
});
```

### 粒子效果

```typescript
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

function createParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 2 + Math.random() * 3;

    particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 5,
      alpha: 1,
      color: ['#FFD700', '#FFA500', '#FFFFFF'][Math.floor(Math.random() * 3)]
    });
  }

  return particles;
}

function animateParticles(particles: Particle[]) {
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1; // 重力
    p.alpha -= 0.01; // 淡出
  });

  // 移除完全透明的粒子
  return particles.filter(p => p.alpha > 0);
}
```

### 音效

【參考：01-design-system/sound-effects.md】

```typescript
const LEVEL_UP_SOUNDS = {
  fanfare: 'sounds/level-up-fanfare.mp3',     // 主旋律
  flash: 'sounds/flash.wav',                   // 閃光音效
  statIncrease: 'sounds/stat-up.wav',          // 屬性提升
  skillUnlock: 'sounds/skill-unlock.wav',      // 技能解鎖
  achievement: 'sounds/achievement.wav',       // 成就獲得
  milestone: 'sounds/milestone-fanfare.mp3'    // 里程碑特殊音效
};

function playLevelUpSounds(data: LevelUpData) {
  // 主音效
  playSound(data.isMilestone ?
    LEVEL_UP_SOUNDS.milestone :
    LEVEL_UP_SOUNDS.fanfare
  );

  // 閃光音效
  setTimeout(() => playSound(LEVEL_UP_SOUNDS.flash), 0);

  // 屬性提升音效（依序播放）
  setTimeout(() => playSound(LEVEL_UP_SOUNDS.statIncrease), 800);

  // 技能解鎖音效
  if (data.newSkills.length > 0) {
    setTimeout(() => playSound(LEVEL_UP_SOUNDS.skillUnlock), 2000);
  }

  // 成就音效
  if (data.achievements.length > 0) {
    setTimeout(() => playSound(LEVEL_UP_SOUNDS.achievement), 2500);
  }
}
```

---

## 戰鬥畫面整合

### 升級觸發時機

```
戰鬥勝利後:
1. 顯示經驗值增加動畫
2. 經驗條填滿
3. 如果達到升級條件:
   ├─ 播放升級音效
   ├─ 觸發全螢幕閃光
   ├─ 暫停戰鬥畫面
   ├─ 顯示升級覆蓋層
   └─ 更新玩家狀態
```

### 戰鬥中升級

```
特殊情況（罕見）:
- 在戰鬥進行中獲得足夠經驗值
- 觸發升級動畫
- 戰鬥暫停
- 升級完成後戰鬥繼續
- HP/MP 自動補滿（升級獎勵）
```

### 升級後狀態

```
戰鬥畫面更新:
- 玩家頭像閃光效果（持續 3 秒）
- HP/MP 條顯示新的最大值
- 等級數字更新
- 如有新技能，技能列表閃光提示
- 戰鬥日誌更新：「升級到 Lv.15！」
```

---

## 互動設計

### 鍵盤操作

| 按鍵 | 功能 |
|------|------|
| `任意鍵` | 關閉升級畫面 |
| `Space` | 快速跳過動畫 |
| `Enter` | 關閉並繼續 |
| `S` | 查看技能詳情（如果有新技能） |
| `A` | 查看成就詳情（如果有成就） |

### 滑鼠操作

- **點擊任意位置**: 關閉升級畫面
- **點擊技能卡片**: 查看技能詳細資訊
- **點擊成就圖標**: 查看成就說明
- **點擊「查看詳情」**: 開啟詳細統計畫面

### 觸控手勢

- **點擊螢幕**: 關閉升級畫面
- **向下滑動**: 關閉升級畫面
- **長按技能/成就**: 顯示詳細資訊

### 自動關閉

```typescript
interface AutoCloseConfig {
  enabled: boolean;
  duration: number;  // 毫秒
}

function getAutoCloseConfig(data: LevelUpData): AutoCloseConfig {
  let duration = 3000; // 預設 3 秒

  // 有新技能：延長 2 秒
  if (data.newSkills.length > 0) {
    duration += 2000;
  }

  // 有成就：延長 2 秒
  if (data.achievements.length > 0) {
    duration += 2000;
  }

  // 里程碑：延長 5 秒
  if (data.isMilestone) {
    duration += 5000;
  }

  // 多重升級：延長 3 秒
  if (data.isMultiLevel) {
    duration += 3000;
  }

  return {
    enabled: true,
    duration: Math.min(duration, 10000) // 最多 10 秒
  };
}
```

---

## 無障礙設計

### 螢幕閱讀器

```html
<div role="dialog"
     aria-labelledby="levelup-title"
     aria-describedby="levelup-description"
     aria-live="assertive"
     aria-modal="true">

  <h1 id="levelup-title">升級了！</h1>

  <div id="levelup-description">
    <p>從等級 14 升級到等級 15</p>

    <section aria-label="屬性提升">
      <h2>屬性提升</h2>
      <ul>
        <li>生命值從 100 增加到 110，提升 10 點</li>
        <li>魔力值從 80 增加到 85，提升 5 點</li>
        <li>攻擊力從 45 增加到 48，提升 3 點</li>
        <li>防禦力從 35 增加到 37，提升 2 點</li>
      </ul>
    </section>

    <section aria-label="新技能" aria-live="polite">
      <h2>解鎖新技能</h2>
      <article>
        <h3>Git Rebase Master</h3>
        <p>重新整理 Git 歷史的進階技能</p>
        <p>魔力消耗：40 點</p>
        <p>效果：重新組織 commit 順序</p>
      </article>
    </section>

    <p>按任意鍵繼續，或等待 5 秒後自動關閉</p>
  </div>
</div>
```

### 動畫控制

```typescript
// 尊重用戶的動畫偏好設定
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if (prefersReducedMotion) {
  // 簡化動畫
  disableFlashEffect();
  disableParticleEffect();
  reduceAnimationDuration();
  showStaticVersion();
}
```

### 對比度與可讀性

- 所有文字與背景對比度 ≥ 7:1（AAA 級）
- 閃光效果不超過 3 次/秒（防止癲癇發作）
- 提供高對比度模式選項

---

## 響應式設計

### 桌面版 (≥ 1024px)

```
覆蓋層: 全螢幕
標題字體: 48px
屬性框寬度: 600px
技能卡片: 完整顯示
粒子數量: 50 個
```

### 平板版 (768px - 1023px)

```
覆蓋層: 全螢幕
標題字體: 40px
屬性框寬度: 500px
技能卡片: 稍微簡化
粒子數量: 30 個
```

### 手機版 (< 768px)

```
覆蓋層: 全螢幕
標題字體: 32px
屬性框寬度: 90vw
技能卡片: 簡化顯示（僅圖標+名稱）
粒子數量: 20 個
自動關閉時間: 減半（避免等待太久）
```

---

## 實作注意事項

### 效能優化

```typescript
// 使用 Canvas 繪製粒子（比 DOM 元素快）
class ParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx = this.canvas.getContext('2d')!;
  }

  update() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles = animateParticles(this.particles);

    this.particles.forEach(p => {
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.update());
    }
  }
}
```

### 狀態持久化

```typescript
// 記錄已顯示的升級（防止重複）
interface LevelUpHistory {
  level: number;
  timestamp: Date;
  shown: boolean;
}

function markLevelUpAsShown(level: number) {
  const history = getLevelUpHistory();
  history.push({
    level,
    timestamp: new Date(),
    shown: true
  });
  saveLevelUpHistory(history);
}

function hasShownLevelUp(level: number): boolean {
  const history = getLevelUpHistory();
  return history.some(h => h.level === level && h.shown);
}
```

### 離線升級處理

```typescript
// 如果玩家在離線時獲得經驗值並升級
function handleOfflineLevelUps(offlineLevels: number[]) {
  if (offlineLevels.length === 0) return;

  if (offlineLevels.length === 1) {
    // 單次升級：正常顯示
    showLevelUpScreen(offlineLevels[0]);
  } else {
    // 多次升級：彙總顯示
    showMultiLevelUpScreen(offlineLevels);
  }
}
```

### 跳過動畫

```typescript
// 允許用戶快速跳過動畫
let animationSkipped = false;

function skipAnimation() {
  if (animationSkipped) return;

  animationSkipped = true;

  // 立即跳到最終狀態
  cancelAllAnimations();
  showFinalState();

  // 縮短自動關閉時間
  setTimeout(closeLevelUpScreen, 1000);
}

// 監聽按鍵/點擊
window.addEventListener('keydown', skipAnimation);
window.addEventListener('click', skipAnimation);
```

---

## 相關畫面連結

- **Battle Victory**: `02-screens/battle/victory-screen.md`
- **Player Stats**: `02-screens/management/status-screen.md`
- **Skills Menu**: `02-screens/management/skill-menu.md`
- **Achievement**: `02-screens/management/achievement.md`
- **Notifications**: `02-screens/events/notifications.md`
- **Animation Timing**: `01-design-system/animation-timing.md`
- **Sound Effects**: `01-design-system/sound-effects.md`

---

## 設計決策記錄

### 為什麼使用全螢幕覆蓋層？

升級是重要的里程碑，值得全螢幕慶祝。全螢幕覆蓋層確保玩家不會錯過這個重要時刻。

### 為什麼需要自動關閉？

避免玩家在 AFK（離開鍵盤）時被升級畫面卡住。自動關閉確保遊戲可以繼續進行。

### 為什麼里程碑升級有特殊動畫？

里程碑（如 25、50 級）是重要的成就，值得更華麗的慶祝。特殊動畫增加遊戲的儀式感。

### 為什麼允許跳過動畫？

尊重玩家的時間。有些玩家可能想快速繼續遊戲，允許跳過動畫提升使用體驗。

### 為什麼需要音效？

音效增強慶祝的氛圍，讓升級時刻更加印象深刻。不同的音效（一般升級 vs 里程碑）也增加變化性。

---

**最後更新**: 2026-02-05
**作者**: UI Design Team
**版本**: 1.0
