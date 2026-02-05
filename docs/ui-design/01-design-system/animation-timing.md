# 動畫時序規範

**日期**: 2026-02-05
**版本**: v1.0

---

## 動畫設計原則

### 核心理念

RPG-CLI 的動畫設計遵循「即時回饋、流暢過渡、視覺愉悅」的原則。

**設計目標**:
- 提供即時的視覺反饋
- 增強沉浸感和遊戲體驗
- 保持 60 FPS 流暢度
- 符合 Pixel Art 風格

**動畫類型**:
```
1. 微交互動畫（Micro-interactions）
   - 按鈕懸停/點擊
   - 輸入框焦點
   - 開關切換

2. 狀態變化動畫（State Changes）
   - HP/MP/EXP 變化
   - 升級效果
   - 獲得獎勵

3. 場景轉場動畫（Transitions）
   - 探索 ↔ 戰鬥
   - 進入商店
   - 場所切換

4. 特效動畫（Effects）
   - 技能施放
   - 傷害數字
   - 粒子效果
```

---

## 標準動畫時序

### 打字機效果（Typewriter）

**用途**: AI 回應顯示、對話呈現

**時序**:
```
標準速度:  50ms/字元
快速模式:  20ms/字元
慢速模式:  100ms/字元

示例:
"你使用了代碼生成術！"
字數: 10
總時間: 10 × 50ms = 500ms

時間軸:
0ms    ├─ "你"
50ms   ├─ "你使"
100ms  ├─ "你使用"
150ms  ├─ "你使用了"
...
500ms  └─ "你使用了代碼生成術！"
```

**實現代碼**:
```javascript
// 打字機效果
function typewriter(text, element, speed = 50) {
  let index = 0;
  element.textContent = '';

  const interval = setInterval(() => {
    if (index < text.length) {
      element.textContent += text[index];
      index++;

      // 播放打字音效（可選）
      if (index % 3 === 0) {
        playSound('typewriter_tick.wav', 0.3);
      }
    } else {
      clearInterval(interval);
    }
  }, speed);

  return interval; // 返回以支持中斷
}

// 使用
const textElement = document.querySelector('.ai-response');
typewriter('你使用了代碼生成術！', textElement, 50);
```

**CSS 輔助**:
```css
/* 閃爍游標 */
.typewriter-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: currentColor;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
```

---

### MP 變化動畫

**用途**: MP 消耗、MP 恢復

**時序**:
```
持續時間:  300ms
緩動函數:  ease-out
方向:      從右到左（消耗）/ 從左到右（恢復）

示例:
消耗 10 MP: 60/100 → 50/100

時間軸:
0ms    ├─ MP: ██████░░░░ 60/100
100ms  ├─ MP: █████▓░░░░ 55/100  (過渡)
200ms  ├─ MP: █████▒░░░░ 53/100  (過渡)
300ms  └─ MP: █████░░░░░ 50/100  (完成)
```

**實現代碼**:
```javascript
// MP 變化動畫
function animateMPChange(fromValue, toValue, maxValue, duration = 300) {
  const startTime = performance.now();
  const diff = toValue - fromValue;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // 使用 ease-out 緩動
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const currentValue = fromValue + diff * easedProgress;

    // 更新 UI
    updateMPBar(currentValue, maxValue);
    updateMPText(Math.round(currentValue), maxValue);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      // 動畫完成，播放完成音效
      playSound('mp_change_complete.wav', 0.5);
    }
  }

  requestAnimationFrame(update);

  // 播放開始音效
  playSound('mp_down.wav', 0.6);
}

// 使用
animateMPChange(60, 50, 100, 300);
```

**CSS 樣式**:
```css
.mp-bar-fill {
  height: 100%;
  background: linear-gradient(to right, #2196f3, #64b5f6);
  transition: width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.3);
}

/* MP 消耗時的閃爍效果 */
.mp-bar-fill.consuming {
  animation: mpFlash 0.3s ease-out;
}

@keyframes mpFlash {
  0% {
    box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.3);
  }
  50% {
    box-shadow: inset 0 0 20px rgba(33, 150, 243, 0.8);
  }
  100% {
    box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.3);
  }
}
```

---

### HP 變化動畫

**用途**: HP 損傷、HP 治療

**時序**:
```
持續時間:  500ms
緩動函數:  ease-out
特效:      震動（損傷）/ 閃光（治療）

示例:
受到傷害: 80/100 → 60/100

時間軸:
0ms    ├─ HP: ████████░░ 80/100
0ms    ├─ 螢幕震動開始
100ms  ├─ 震動結束
100ms  ├─ HP 條開始減少
200ms  ├─ HP: ███████░░░ 70/100  (過渡)
350ms  ├─ HP: ██████░░░░ 65/100  (過渡)
500ms  └─ HP: ██████░░░░ 60/100  (完成)
```

**實現代碼**:
```javascript
// HP 變化動畫（損傷）
function animateHPDamage(fromValue, toValue, maxValue, duration = 500) {
  // 螢幕震動
  shakeScreen(100);

  // 延遲 100ms 後開始 HP 減少
  setTimeout(() => {
    const startTime = performance.now();
    const diff = toValue - fromValue;

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // ease-out 緩動
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = fromValue + diff * easedProgress;

      // 更新 UI
      updateHPBar(currentValue, maxValue);
      updateHPText(Math.round(currentValue), maxValue);

      // 低血量時閃爍
      if (currentValue < maxValue * 0.2) {
        toggleLowHPFlash();
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }, 100);

  // 播放受傷音效
  playSound('damage_taken.wav', 0.7);
}

// HP 變化動畫（治療）
function animateHPHeal(fromValue, toValue, maxValue, duration = 500) {
  // 治療閃光
  healFlash();

  const startTime = performance.now();
  const diff = toValue - fromValue;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const currentValue = fromValue + diff * easedProgress;

    updateHPBar(currentValue, maxValue);
    updateHPText(Math.round(currentValue), maxValue);

    // 顯示浮動 +HP 文字
    if (progress === 0) {
      showFloatingText(`+${toValue - fromValue} HP`, 'heal');
    }

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
  playSound('heal.wav', 0.6);
}

// 螢幕震動
function shakeScreen(duration = 100) {
  const element = document.body;
  element.classList.add('shake');

  setTimeout(() => {
    element.classList.remove('shake');
  }, duration);
}
```

**CSS 樣式**:
```css
/* HP 條 */
.hp-bar-fill {
  background: linear-gradient(to right, #4caf50, #8bc34a);
  transition: width 0.5s ease-out;
}

/* 低血量閃爍 */
.hp-bar-fill.low {
  background: linear-gradient(to right, #f44336, #ff7961);
  animation: lowHPFlash 1s infinite;
}

@keyframes lowHPFlash {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 10px rgba(244, 67, 54, 0.5);
  }
  50% {
    opacity: 0.7;
    box-shadow: 0 0 20px rgba(244, 67, 54, 1);
  }
}

/* 螢幕震動 */
.shake {
  animation: shake 0.1s ease-in-out 0s 2;
}

@keyframes shake {
  0%, 100% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(-5px, 2px);
  }
  50% {
    transform: translate(5px, -2px);
  }
  75% {
    transform: translate(-5px, -2px);
  }
}

/* 治療閃光 */
@keyframes healFlash {
  0%, 100% {
    background: rgba(76, 175, 80, 0);
  }
  50% {
    background: rgba(76, 175, 80, 0.3);
  }
}
```

---

### 升級閃光動畫

**用途**: 等級提升特效

**時序**:
```
持續時間:  300ms × 3 次 = 900ms
緩動函數:  ease-in-out
特效:      閃光 + 粒子 + 音效

時間軸:
0ms    ├─ EXP 條填滿 100%
0ms    ├─ 第一次閃光
100ms  ├─ 閃光淡出
200ms  ├─ 短暫暫停
300ms  ├─ 第二次閃光（更亮）
400ms  ├─ 閃光淡出
500ms  ├─ 短暫暫停
600ms  ├─ 第三次閃光（最亮）
700ms  ├─ 閃光淡出
900ms  ├─ 粒子爆發
1200ms ├─ 升級提示面板出現
1500ms └─ 動畫完成
```

**實現代碼**:
```javascript
// 升級閃光動畫
function playLevelUpAnimation() {
  const container = document.querySelector('.game-container');

  // 第一次閃光
  setTimeout(() => flashScreen(0.3), 0);

  // 第二次閃光
  setTimeout(() => flashScreen(0.5), 300);

  // 第三次閃光（最亮）
  setTimeout(() => flashScreen(0.8), 600);

  // 粒子爆發
  setTimeout(() => {
    createParticleBurst(50, 'gold');
  }, 900);

  // 升級提示面板
  setTimeout(() => {
    showLevelUpModal();
  }, 1200);

  // 播放升級音效
  playSound('level_up.wav', 1.0);
}

// 閃光效果
function flashScreen(intensity = 0.5) {
  const flash = document.createElement('div');
  flash.className = 'level-up-flash';
  flash.style.opacity = intensity;
  document.body.appendChild(flash);

  setTimeout(() => {
    flash.remove();
  }, 100);
}

// 粒子爆發
function createParticleBurst(count = 50, color = 'gold') {
  const container = document.querySelector('.game-container');

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = `particle particle-${color}`;

    // 隨機位置和方向
    const angle = (Math.PI * 2 * i) / count;
    const distance = 100 + Math.random() * 100;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    particle.style.setProperty('--x', `${x}px`);
    particle.style.setProperty('--y', `${y}px`);

    container.appendChild(particle);

    // 1 秒後移除
    setTimeout(() => {
      particle.remove();
    }, 1000);
  }
}
```

**CSS 樣式**:
```css
/* 升級閃光 */
.level-up-flash {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 215, 0, 1);
  pointer-events: none;
  z-index: 9999;
  animation: flashFade 0.1s ease-out forwards;
}

@keyframes flashFade {
  from {
    opacity: var(--intensity, 0.8);
  }
  to {
    opacity: 0;
  }
}

/* 粒子 */
.particle {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  pointer-events: none;
  animation: particleFloat 1s ease-out forwards;
}

.particle-gold {
  background: radial-gradient(circle, #ffd700, #ffed4e);
  box-shadow: 0 0 10px #ffd700;
}

@keyframes particleFloat {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--x), var(--y)) scale(0);
    opacity: 0;
  }
}

/* 升級提示面板 */
.level-up-modal {
  animation: levelUpModalAppear 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes levelUpModalAppear {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}
```

---

### 浮動文字動畫

**用途**: 傷害數字、治療數字、獲得金幣/經驗

**時序**:
```
持續時間:  1000ms
移動距離:  80px（向上）
緩動函數:  ease-out
淡出:      最後 300ms

時間軸:
0ms    ├─ 文字出現 (opacity: 1, y: 0)
700ms  ├─ 開始淡出 (opacity: 1 → 0)
1000ms └─ 完全消失 (opacity: 0, y: -80px)
```

**實現代碼**:
```javascript
// 創建浮動文字
function createFloatingText(text, type, x, y) {
  const element = document.createElement('div');
  element.className = `floating-text floating-text-${type}`;
  element.textContent = text;
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;

  document.body.appendChild(element);

  // 1 秒後自動移除
  setTimeout(() => {
    element.remove();
  }, 1000);

  // 播放對應音效
  const sounds = {
    damage: 'damage_number.wav',
    heal: 'heal.wav',
    gold: 'coin.wav',
    exp: 'exp_gain.wav'
  };

  if (sounds[type]) {
    playSound(sounds[type], 0.5);
  }
}

// 傷害數字
function showDamageNumber(damage, isWeakHit, x, y) {
  const text = isWeakHit ? `${damage}!` : `${damage}`;
  const type = isWeakHit ? 'damage-weak' : 'damage';

  createFloatingText(text, type, x, y);
}

// 治療數字
function showHealNumber(amount, x, y) {
  createFloatingText(`+${amount}`, 'heal', x, y);
}

// 使用示例
showDamageNumber(45, false, 400, 200);  // 普通傷害
showDamageNumber(90, true, 400, 200);   // 弱點傷害
showHealNumber(20, 400, 200);           // 治療
```

**CSS 樣式**:
```css
/* 浮動文字基礎 */
.floating-text {
  position: fixed;
  font-family: 'Press Start 2P', monospace;
  font-size: 20px;
  font-weight: bold;
  pointer-events: none;
  z-index: 1000;
  animation: floatUp 1s ease-out forwards;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

/* 普通傷害 */
.floating-text-damage {
  color: #ffffff;
}

/* 弱點傷害 */
.floating-text-damage-weak {
  color: #ff0000;
  font-size: 28px;
  animation: floatUpWobble 1s ease-out forwards;
}

/* 治療 */
.floating-text-heal {
  color: #00ff00;
}

/* 金幣 */
.floating-text-gold {
  color: #ffd700;
}

/* 經驗值 */
.floating-text-exp {
  color: #ff9900;
}

/* 浮動動畫 */
@keyframes floatUp {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: translateY(-80px);
    opacity: 0;
  }
}

/* 弱點傷害動畫（帶晃動） */
@keyframes floatUpWobble {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  10% {
    transform: translateY(-8px) rotate(-5deg);
  }
  20% {
    transform: translateY(-16px) rotate(5deg);
  }
  30% {
    transform: translateY(-24px) rotate(-3deg);
  }
  40% {
    transform: translateY(-32px) rotate(3deg);
  }
  50% {
    transform: translateY(-40px) rotate(0deg);
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: translateY(-80px) rotate(0deg);
    opacity: 0;
  }
}
```

---

## 微交互動畫

### 按鈕動畫

**懸停（Hover）**:
```
持續時間:  150ms
效果:      輕微上移 + 陰影增強
```

**點擊（Click）**:
```
持續時間:  100ms
效果:      下壓 + 陰影減少
```

**實現**:
```css
.button {
  background: linear-gradient(to bottom, #4caf50, #388e3c);
  border: 3px solid #2e7d32;
  box-shadow: 0 4px 0 #1b5e20;
  transition: all 0.15s ease;
  cursor: pointer;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 #1b5e20;
}

.button:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #1b5e20;
}
```

---

### 輸入框動畫

**焦點（Focus）**:
```
持續時間:  200ms
效果:      邊框發光 + 陰影
```

**實現**:
```css
.input {
  border: 2px solid #404040;
  transition: all 0.2s ease;
}

.input:focus {
  border-color: #00ccff;
  box-shadow: 0 0 10px rgba(0, 204, 255, 0.5);
  outline: none;
}
```

---

### 開關動畫

**切換（Toggle）**:
```
持續時間:  200ms
效果:      滑動 + 顏色變化
```

**實現**:
```css
.toggle {
  width: 50px;
  height: 24px;
  background: #808080;
  border-radius: 12px;
  position: relative;
  transition: background 0.2s ease;
  cursor: pointer;
}

.toggle.active {
  background: #4caf50;
}

.toggle-knob {
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.2s ease;
}

.toggle.active .toggle-knob {
  transform: translateX(26px);
}
```

---

## 性能優化

### GPU 加速

**使用 transform 和 opacity**:
```css
/* ✅ 好 - GPU 加速 */
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

### will-change 提示

```css
.animated-element {
  will-change: transform, opacity;
}

/* 動畫完成後移除 */
.animated-element.complete {
  will-change: auto;
}
```

### 減少重繪

```css
.layer {
  transform: translateZ(0);
  backface-visibility: hidden;
  contain: layout style paint;
}
```

---

## 動畫時序總覽表

| 動畫類型 | 持續時間 | 緩動函數 | 特效 |
|---------|---------|---------|-----|
| 打字機效果 | 50ms/字元 | linear | 音效 |
| MP 變化 | 300ms | ease-out | 閃光 |
| HP 變化 | 500ms | ease-out | 震動/閃光 |
| 升級閃光 | 900ms | ease-in-out | 粒子爆發 |
| 浮動文字 | 1000ms | ease-out | 淡出 |
| 按鈕懸停 | 150ms | ease | 陰影 |
| 按鈕點擊 | 100ms | ease | 下壓 |
| 輸入框焦點 | 200ms | ease | 發光 |
| 開關切換 | 200ms | ease | 滑動 |
| 場景轉場 | 400-800ms | custom | 多種 |

---

## 測試檢查清單

### 性能測試
- [ ] 所有動畫 FPS ≥ 60
- [ ] 無掉幀現象
- [ ] CPU 使用合理
- [ ] 記憶體穩定

### 視覺測試
- [ ] 動畫流暢
- [ ] 時序準確
- [ ] 無閃爍
- [ ] 顏色正確

### 音效同步
- [ ] 音效與動畫同步
- [ ] 音量平衡
- [ ] 無延遲

### 邊界測試
- [ ] 快速連續觸發
- [ ] 低端設備表現
- [ ] 多窗口切換

---

**版本**: v1.0
**最後更新**: 2026-02-05
