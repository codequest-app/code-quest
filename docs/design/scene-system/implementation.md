# Scene System - Implementation

## 場景管理器 (SceneManager)

### 完整實現

**檔案**: `bridge/scene/SceneManager.js`

```javascript
const PromptAnalyzer = require('./PromptAnalyzer');
const ResourceManager = require('./ResourceManager');

class SceneManager {
  constructor(wsServer) {
    this.wsServer = wsServer;
    this.currentScene = 'explore'; // 'explore' | 'battle'
    this.analyzer = new PromptAnalyzer();
    this.resourceMgr = new ResourceManager();

    this.sceneConfig = {
      explore: {
        name: '探索模式',
        icon: '🏰',
        bgColor: '#1a4d2e',
        resources: {
          hpRegen: 2,   // HP/秒
          mpRegen: 1    // MP/秒
        }
      },
      battle: {
        name: '戰鬥模式',
        icon: '⚔️',
        bgColor: '#4d1a1a',
        resources: {
          hpRegen: 0,     // HP/秒
          mpRegen: 0.1    // MP/秒
        }
      }
    };
  }

  /**
   * 獲取當前場景
   */
  getCurrentScene() {
    return this.currentScene;
  }

  /**
   * 處理用戶 Prompt
   */
  async handlePrompt(prompt, player) {
    // 分析 Prompt 類型
    const analysis = this.analyzer.analyze(prompt);

    if (analysis.type === 'task') {
      // 任務型 → 進入戰鬥
      await this.switchToBattle(analysis, player);
    } else {
      // 對話型 → 保持探索
      this.handleDialogue(prompt, player);
    }

    return analysis;
  }

  /**
   * 切換到戰鬥模式
   */
  async switchToBattle(analysis, player) {
    if (this.currentScene === 'battle') {
      // 已在戰鬥中
      return;
    }

    console.log('🎬 切換到戰鬥模式');

    // 1. 停止探索模式資源恢復
    this.resourceMgr.stopRegen();

    // 2. 生成敵人
    const enemy = this.generateEnemy(analysis);

    // 3. 播放切換動畫
    await this.playTransition('explore_to_battle', { enemy });

    // 4. 切換場景
    this.currentScene = 'battle';

    // 5. 開始戰鬥模式資源恢復
    this.resourceMgr.startRegen(this.sceneConfig.battle.resources);

    // 6. 廣播場景變更
    this.broadcast({
      type: 'scene_change',
      scene: 'battle',
      enemy,
      config: this.sceneConfig.battle
    });
  }

  /**
   * 切換到探索模式
   */
  async switchToExplore(battleResult) {
    if (this.currentScene === 'explore') {
      // 已在探索中
      return;
    }

    console.log('🎬 切換到探索模式');

    // 1. 停止戰鬥模式資源恢復
    this.resourceMgr.stopRegen();

    // 2. 播放切換動畫
    await this.playTransition('battle_to_explore', battleResult);

    // 3. 切換場景
    this.currentScene = 'explore';

    // 4. 開始探索模式資源恢復
    this.resourceMgr.startRegen(this.sceneConfig.explore.resources);

    // 5. 夥伴 MP 全滿
    this.restoreCompanionsMp();

    // 6. 廣播場景變更
    this.broadcast({
      type: 'scene_change',
      scene: 'explore',
      battleResult,
      config: this.sceneConfig.explore
    });
  }

  /**
   * 逃跑切換
   */
  async escape(player) {
    if (this.currentScene !== 'battle') {
      throw new Error('只能在戰鬥中逃跑');
    }

    // 計算 MP 懲罰
    const mpCost = Math.floor(player.mp * 0.3);
    player.mp = Math.max(0, player.mp - mpCost);

    console.log(`🏃 逃跑成功！消耗 ${mpCost} MP`);

    // 播放逃跑動畫
    await this.playTransition('escape', { mpCost });

    // 切換到探索
    await this.switchToExplore({ result: 'escape', mpCost });
  }

  /**
   * 播放場景切換動畫
   */
  async playTransition(type, data) {
    const transitions = {
      explore_to_battle: async (data) => {
        // 1. 畫面震動
        this.broadcast({ type: 'animation', name: 'screen_shake', duration: 300 });
        await this.delay(300);

        // 2. 淡出
        this.broadcast({ type: 'animation', name: 'fade_out', duration: 200 });
        await this.delay(200);

        // 3. 敵人出現
        this.broadcast({
          type: 'animation',
          name: 'enemy_appear',
          enemy: data.enemy,
          duration: 500
        });
        await this.delay(500);

        // 4. 淡入戰鬥場景
        this.broadcast({ type: 'animation', name: 'fade_in', duration: 300 });
        await this.delay(300);

        // 5. 戰鬥開始文字
        this.broadcast({ type: 'animation', name: 'battle_start_text', duration: 1000 });
        await this.delay(1000);
      },

      battle_to_explore: async (data) => {
        // 1. 敵人消失
        this.broadcast({ type: 'animation', name: 'enemy_defeat', duration: 500 });
        await this.delay(500);

        // 2. 勝利文字
        this.broadcast({ type: 'animation', name: 'victory_text', duration: 1000 });
        await this.delay(1000);

        // 3. 顯示獎勵
        this.broadcast({
          type: 'animation',
          name: 'show_rewards',
          rewards: data.rewards,
          duration: 2000
        });
        await this.delay(2000);

        // 4. 如果升級
        if (data.levelUp) {
          this.broadcast({ type: 'animation', name: 'level_up', duration: 2000 });
          await this.delay(2000);
        }

        // 5. 淡出
        this.broadcast({ type: 'animation', name: 'fade_out', duration: 300 });
        await this.delay(300);

        // 6. 淡入探索場景
        this.broadcast({ type: 'animation', name: 'fade_in', duration: 300 });
        await this.delay(300);
      },

      escape: async (data) => {
        // 1. 煙霧效果
        this.broadcast({ type: 'animation', name: 'escape_smoke', duration: 500 });
        await this.delay(500);

        // 2. 逃跑文字
        this.broadcast({
          type: 'animation',
          name: 'escape_text',
          mpCost: data.mpCost,
          duration: 1000
        });
        await this.delay(1000);

        // 3. 淡出
        this.broadcast({ type: 'animation', name: 'fade_out', duration: 300 });
        await this.delay(300);

        // 4. 淡入探索場景
        this.broadcast({ type: 'animation', name: 'fade_in', duration: 300 });
        await this.delay(300);
      }
    };

    if (transitions[type]) {
      await transitions[type](data);
    }
  }

  /**
   * 處理對話型 Prompt
   */
  handleDialogue(prompt, player) {
    // 對話型，不切換場景
    this.broadcast({
      type: 'dialogue',
      prompt,
      scene: 'explore'
    });
  }

  /**
   * 生成敵人（簡化版，完整版在 EnemyGenerator）
   */
  generateEnemy(analysis) {
    return {
      id: `enemy_${Date.now()}`,
      name: `${analysis.category.icon} ${analysis.category.name} Lv.${analysis.level}`,
      level: analysis.level,
      hp: analysis.level * 100,
      maxHp: analysis.level * 100,
      type: analysis.category.type
    };
  }

  /**
   * 恢復夥伴 MP
   */
  restoreCompanionsMp() {
    // 實作：將所有夥伴 MP 恢復到最大值
    this.broadcast({
      type: 'companions_mp_restore'
    });
  }

  broadcast(data) {
    this.wsServer.broadcast(data);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = SceneManager;
```

---

## Prompt 分析器 (PromptAnalyzer)

### 完整實現

**檔案**: `bridge/scene/PromptAnalyzer.js`

```javascript
class PromptAnalyzer {
  constructor() {
    this.ACTION_KEYWORDS = [
      '修復', '創建', '實作', '開發', '建立',
      '重構', '優化', '改進', '更新', '升級',
      '測試', '部署', '設定', '配置', '整合',
      'fix', 'create', 'implement', 'develop', 'build',
      'refactor', 'optimize', 'improve', 'update', 'upgrade',
      'test', 'deploy', 'setup', 'configure', 'integrate'
    ];

    this.CODE_KEYWORDS = [
      'bug', '功能', 'api', '組件', '函數', '類別',
      '代碼', '程式', '檔案', '模組', '套件',
      'component', 'function', 'class', 'code',
      'file', 'module', 'package', 'endpoint'
    ];

    this.QUESTION_KEYWORDS = [
      '什麼', '為什麼', '怎麼', '如何', '是否',
      '解釋', '說明', '介紹', '比較', '區別',
      'what', 'why', 'how', 'explain', 'describe',
      'introduce', 'compare', 'difference'
    ];

    this.CATEGORIES = [
      {
        type: 'code-task',
        name: '代碼挑戰',
        icon: '💻',
        keywords: ['code', '程式', 'function', '函數', 'class', 'implement']
      },
      {
        type: 'bug-hunt',
        name: 'Bug 怪物',
        icon: '🐛',
        keywords: ['bug', 'debug', '錯誤', 'fix', '修復', 'error']
      },
      {
        type: 'architecture',
        name: '架構挑戰',
        icon: '🏰',
        keywords: ['architecture', '架構', 'design', '設計', 'pattern', 'refactor']
      },
      {
        type: 'documentation',
        name: '文檔任務',
        icon: '📜',
        keywords: ['document', '文檔', 'readme', 'comment', '註解', 'explain']
      },
      {
        type: 'testing',
        name: '測試挑戰',
        icon: '🧪',
        keywords: ['test', '測試', 'unit test', 'integration', 'coverage']
      },
      {
        type: 'optimization',
        name: '優化挑戰',
        icon: '⚡',
        keywords: ['optimize', '優化', 'performance', '性能', 'speed', 'efficiency']
      }
    ];
  }

  /**
   * 分析 Prompt
   */
  analyze(prompt) {
    const type = this.identifyType(prompt);

    if (type === 'task') {
      const complexity = this.analyzeComplexity(prompt);
      const category = this.categorizeTask(prompt);

      return {
        type: 'task',
        complexity,
        category,
        level: complexity.level,
        prompt
      };
    } else {
      return {
        type: 'dialogue',
        prompt
      };
    }
  }

  /**
   * 識別 Prompt 類型
   */
  identifyType(prompt) {
    const promptLower = prompt.toLowerCase();

    // 1. 檢查是否為問題型
    const hasQuestionKeyword = this.QUESTION_KEYWORDS.some(kw =>
      promptLower.includes(kw.toLowerCase())
    );

    if (hasQuestionKeyword && prompt.includes('?')) {
      return 'dialogue'; // 明確的問題
    }

    // 2. 檢查是否為任務型
    const hasActionKeyword = this.ACTION_KEYWORDS.some(kw =>
      promptLower.includes(kw.toLowerCase())
    );

    const hasCodeKeyword = this.CODE_KEYWORDS.some(kw =>
      promptLower.includes(kw.toLowerCase())
    );

    if (hasActionKeyword || hasCodeKeyword) {
      return 'task'; // 任務型
    }

    // 3. 短語句視為對話
    if (prompt.length < 20) {
      return 'dialogue';
    }

    // 4. 預設為對話
    return 'dialogue';
  }

  /**
   * 分析複雜度
   */
  analyzeComplexity(prompt) {
    let score = 0;

    // 1. 長度因素 (0-3)
    const length = prompt.length;
    if (length > 200) score += 3;
    else if (length > 100) score += 2;
    else score += 1;

    // 2. 動作關鍵字數量
    const actionCount = this.ACTION_KEYWORDS.filter(kw =>
      prompt.toLowerCase().includes(kw.toLowerCase())
    ).length;
    score += actionCount * 2;

    // 3. 代碼關鍵字數量
    const codeCount = this.CODE_KEYWORDS.filter(kw =>
      prompt.toLowerCase().includes(kw.toLowerCase())
    ).length;
    score += codeCount;

    // 4. 多步驟指令
    if (/並且|然後|接著|and then|after/.test(prompt)) {
      score += 2;
    }

    // 5. 技術棧深度
    const techKeywords = ['架構', '系統', '整合', '遷移', 'architecture', 'system', 'migration'];
    const hasTechKeyword = techKeywords.some(kw =>
      prompt.toLowerCase().includes(kw.toLowerCase())
    );
    if (hasTechKeyword) {
      score += 3;
    }

    // 計算等級 (1-15)
    const level = Math.min(15, Math.max(1, Math.floor(score / 2) + 1));

    return {
      score,
      level,
      difficulty: this.getDifficulty(level)
    };
  }

  /**
   * 任務分類
   */
  categorizeTask(prompt) {
    const promptLower = prompt.toLowerCase();

    for (const cat of this.CATEGORIES) {
      for (const kw of cat.keywords) {
        if (promptLower.includes(kw.toLowerCase())) {
          return cat;
        }
      }
    }

    // 預設為通用任務
    return {
      type: 'general',
      name: '通用任務',
      icon: '❓'
    };
  }

  getDifficulty(level) {
    if (level <= 3) return 'simple';
    if (level <= 7) return 'medium';
    if (level <= 12) return 'hard';
    return 'boss';
  }
}

module.exports = PromptAnalyzer;
```

---

## 資源管理器 (ResourceManager)

### 完整實現

**檔案**: `bridge/scene/ResourceManager.js`

```javascript
class ResourceManager {
  constructor() {
    this.regenIntervals = {
      hp: null,
      mp: null
    };
    this.currentRates = {
      hp: 0,
      mp: 0
    };
  }

  /**
   * 開始資源恢復
   */
  startRegen(rates) {
    this.stopRegen(); // 先停止舊的

    this.currentRates = rates;

    // HP 恢復
    if (rates.hpRegen > 0) {
      this.regenIntervals.hp = setInterval(() => {
        this.regenHp(rates.hpRegen);
      }, 1000); // 每秒
    }

    // MP 恢復
    if (rates.mpRegen > 0) {
      this.regenIntervals.mp = setInterval(() => {
        this.regenMp(rates.mpRegen);
      }, 1000); // 每秒
    }

    console.log(`🔄 資源恢復啟動: HP ${rates.hpRegen}/s, MP ${rates.mpRegen}/s`);
  }

  /**
   * 停止資源恢復
   */
  stopRegen() {
    if (this.regenIntervals.hp) {
      clearInterval(this.regenIntervals.hp);
      this.regenIntervals.hp = null;
    }

    if (this.regenIntervals.mp) {
      clearInterval(this.regenIntervals.mp);
      this.regenIntervals.mp = null;
    }

    console.log('⏸️ 資源恢復停止');
  }

  /**
   * 恢復 HP
   */
  regenHp(amount) {
    // 實作：透過 GameState 恢復玩家 HP
    const player = this.getPlayer();

    if (player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + amount);
      this.broadcastResourceUpdate('hp', player.hp);
    }
  }

  /**
   * 恢復 MP
   */
  regenMp(amount) {
    // 實作：透過 GameState 恢復玩家 MP
    const player = this.getPlayer();

    if (player.mp < player.maxMp) {
      player.mp = Math.min(player.maxMp, player.mp + amount);
      this.broadcastResourceUpdate('mp', player.mp);
    }
  }

  /**
   * 消耗資源
   */
  consumeResource(type, amount) {
    const player = this.getPlayer();

    if (type === 'hp') {
      player.hp = Math.max(0, player.hp - amount);
    } else if (type === 'mp') {
      player.mp = Math.max(0, player.mp - amount);
    }

    this.broadcastResourceUpdate(type, player[type]);
  }

  /**
   * 檢查資源是否足夠
   */
  hasEnoughResource(type, amount) {
    const player = this.getPlayer();
    return player[type] >= amount;
  }

  getPlayer() {
    // 實作：從 GameState 獲取玩家
    // 這裡簡化為返回全局玩家對象
    return global.gameState?.player || { hp: 100, maxHp: 100, mp: 100, maxMp: 100 };
  }

  broadcastResourceUpdate(type, value) {
    // 實作：廣播資源更新
    if (global.wsServer) {
      global.wsServer.broadcast({
        type: 'resource_update',
        resource: type,
        value
      });
    }
  }
}

module.exports = ResourceManager;
```

---

## UI 狀態管理

### React Store 實現

**檔案**: `ui/src/stores/sceneStore.ts`

```typescript
import create from 'zustand';

interface SceneState {
  // 當前場景
  currentScene: 'explore' | 'battle';

  // 場景配置
  sceneConfig: {
    explore: SceneConfig;
    battle: SceneConfig;
  };

  // 切換動畫狀態
  transitionState: {
    isTransitioning: boolean;
    type: string | null;
    progress: number;
  };

  // Actions
  setScene: (scene: 'explore' | 'battle') => void;
  startTransition: (type: string) => void;
  updateTransitionProgress: (progress: number) => void;
  endTransition: () => void;
}

interface SceneConfig {
  name: string;
  icon: string;
  bgColor: string;
  resources: {
    hpRegen: number;
    mpRegen: number;
  };
}

const useSceneStore = create<SceneState>((set) => ({
  currentScene: 'explore',

  sceneConfig: {
    explore: {
      name: '探索模式',
      icon: '🏰',
      bgColor: '#1a4d2e',
      resources: {
        hpRegen: 2,
        mpRegen: 1
      }
    },
    battle: {
      name: '戰鬥模式',
      icon: '⚔️',
      bgColor: '#4d1a1a',
      resources: {
        hpRegen: 0,
        mpRegen: 0.1
      }
    }
  },

  transitionState: {
    isTransitioning: false,
    type: null,
    progress: 0
  },

  setScene: (scene) => set({ currentScene: scene }),

  startTransition: (type) => set({
    transitionState: {
      isTransitioning: true,
      type,
      progress: 0
    }
  }),

  updateTransitionProgress: (progress) => set((state) => ({
    transitionState: {
      ...state.transitionState,
      progress
    }
  })),

  endTransition: () => set({
    transitionState: {
      isTransitioning: false,
      type: null,
      progress: 0
    }
  })
}));

export default useSceneStore;
```

---

## 場景組件實現

### SceneContainer 組件

**檔案**: `ui/src/components/Scene/SceneContainer.tsx`

```tsx
import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useSceneStore from '../../stores/sceneStore';
import ExploreScene from './ExploreScene';
import BattleScene from './BattleScene';
import SceneTransition from './SceneTransition';

const SceneContainer: React.FC = () => {
  const { currentScene, sceneConfig, transitionState } = useSceneStore();

  const currentConfig = sceneConfig[currentScene];

  return (
    <div
      className="scene-container"
      style={{ backgroundColor: currentConfig.bgColor }}
    >
      {/* 場景切換動畫層 */}
      <AnimatePresence>
        {transitionState.isTransitioning && (
          <SceneTransition
            type={transitionState.type}
            progress={transitionState.progress}
          />
        )}
      </AnimatePresence>

      {/* 場景內容 */}
      <AnimatePresence mode="wait">
        {currentScene === 'explore' ? (
          <motion.div
            key="explore"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ExploreScene />
          </motion.div>
        ) : (
          <motion.div
            key="battle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <BattleScene />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SceneContainer;
```

---

### SceneTransition 組件

**檔案**: `ui/src/components/Scene/SceneTransition.tsx`

```tsx
import React from 'react';
import { motion } from 'framer-motion';

interface SceneTransitionProps {
  type: string | null;
  progress: number;
}

const SceneTransition: React.FC<SceneTransitionProps> = ({ type, progress }) => {
  const getAnimation = () => {
    switch (type) {
      case 'explore_to_battle':
        return (
          <>
            {progress < 0.3 && (
              <motion.div
                className="screen-shake"
                animate={{
                  x: [0, -5, 5, -5, 5, 0],
                  y: [0, 2, -2, 2, -2, 0]
                }}
                transition={{ duration: 0.3 }}
              />
            )}

            {progress >= 0.3 && progress < 0.5 && (
              <motion.div
                className="fade-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
            )}

            {progress >= 0.5 && progress < 0.8 && (
              <motion.div
                className="enemy-appear"
                initial={{ y: -200, scale: 0.5, rotate: 180, opacity: 0 }}
                animate={{ y: 0, scale: 1, rotate: 0, opacity: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
              >
                {/* 敵人圖標會在這裡 */}
              </motion.div>
            )}

            {progress >= 0.8 && (
              <motion.div
                className="battle-start-text"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{
                  scale: [0.5, 1.2, 0.9, 1.1, 1],
                  opacity: 1
                }}
                transition={{ duration: 1 }}
              >
                ⚔️ 戰鬥開始！
              </motion.div>
            )}
          </>
        );

      case 'battle_to_explore':
        return (
          <>
            {progress < 0.2 && (
              <motion.div
                className="enemy-defeat"
                animate={{
                  opacity: [1, 0.3, 1, 0.3, 0],
                  scale: [1, 1, 1, 1, 0.2],
                  rotate: [0, 0, 0, 0, 360]
                }}
                transition={{ duration: 0.5 }}
              >
                {/* 敵人消失動畫 */}
              </motion.div>
            )}

            {progress >= 0.2 && progress < 0.4 && (
              <motion.div
                className="victory-text"
                initial={{ scale: 0, rotate: -180, opacity: 0 }}
                animate={{
                  scale: [0, 1.3, 0.9, 1],
                  rotate: [-180, 10, -5, 0],
                  opacity: 1
                }}
                transition={{ duration: 1 }}
              >
                ✨ 勝利！
              </motion.div>
            )}

            {progress >= 0.4 && (
              <motion.div
                className="rewards-display"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* 獎勵顯示 */}
              </motion.div>
            )}
          </>
        );

      case 'escape':
        return (
          <>
            {progress < 0.5 && (
              <motion.div
                className="escape-smoke"
                initial={{ scale: 1, opacity: 1 }}
                animate={{
                  scale: 2,
                  opacity: 0,
                  filter: 'blur(10px)'
                }}
                transition={{ duration: 0.5 }}
              >
                💨
              </motion.div>
            )}

            {progress >= 0.5 && (
              <motion.div
                className="escape-text"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                🏃 逃跑成功！
              </motion.div>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="scene-transition-overlay">
      {getAnimation()}
    </div>
  );
};

export default SceneTransition;
```

---

## WebSocket 整合

### 場景變更事件處理

**檔案**: `ui/src/hooks/useSceneEvents.ts`

```typescript
import { useEffect } from 'react';
import useSceneStore from '../stores/sceneStore';
import useWebSocket from './useWebSocket';

const useSceneEvents = () => {
  const { setScene, startTransition, updateTransitionProgress, endTransition } = useSceneStore();
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    if (!lastMessage) return;

    const data = JSON.parse(lastMessage.data);

    switch (data.type) {
      case 'scene_change':
        // 場景變更
        setScene(data.scene);
        break;

      case 'animation':
        // 動畫事件
        handleAnimation(data);
        break;

      case 'resource_update':
        // 資源更新（由 ResourceManager 觸發）
        // 更新 UI 中的 HP/MP 顯示
        break;

      default:
        break;
    }
  }, [lastMessage]);

  const handleAnimation = (data: any) => {
    const { name, duration } = data;

    startTransition(name);

    // 模擬進度更新
    const steps = duration / 100; // 每 100ms 更新一次
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      updateTransitionProgress(progress);

      if (progress >= 1) {
        clearInterval(interval);
        endTransition();
      }
    }, 100);
  };
};

export default useSceneEvents;
```

---

## 測試策略

### Prompt 分析測試

```javascript
describe('PromptAnalyzer', () => {
  const analyzer = new PromptAnalyzer();

  test('識別對話型 Prompt', () => {
    const result = analyzer.analyze('什麼是閉包？');
    expect(result.type).toBe('dialogue');
  });

  test('識別任務型 Prompt', () => {
    const result = analyzer.analyze('修復登入按鈕的 Bug');
    expect(result.type).toBe('task');
  });

  test('複雜度計算正確', () => {
    const simple = analyzer.analyze('修復按鈕');
    expect(simple.level).toBeLessThan(4);

    const complex = analyzer.analyze('重構整個認證系統並確保向後兼容');
    expect(complex.level).toBeGreaterThan(10);
  });

  test('任務分類正確', () => {
    const bugTask = analyzer.analyze('debug 這個錯誤');
    expect(bugTask.category.type).toBe('bug-hunt');

    const codeTask = analyzer.analyze('實作一個新功能');
    expect(codeTask.category.type).toBe('code-task');
  });
});
```

### 場景切換測試

```javascript
describe('SceneManager', () => {
  let sceneMgr;
  let mockWsServer;

  beforeEach(() => {
    mockWsServer = { broadcast: jest.fn() };
    sceneMgr = new SceneManager(mockWsServer);
  });

  test('初始場景為探索模式', () => {
    expect(sceneMgr.getCurrentScene()).toBe('explore');
  });

  test('任務型 Prompt 切換到戰鬥', async () => {
    const mockPlayer = { hp: 100, mp: 100 };
    await sceneMgr.handlePrompt('修復 Bug', mockPlayer);

    expect(sceneMgr.getCurrentScene()).toBe('battle');
    expect(mockWsServer.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'scene_change', scene: 'battle' })
    );
  });

  test('對話型 Prompt 保持探索', async () => {
    const mockPlayer = { hp: 100, mp: 100 };
    await sceneMgr.handlePrompt('什麼是閉包？', mockPlayer);

    expect(sceneMgr.getCurrentScene()).toBe('explore');
  });

  test('逃跑消耗 30% MP', async () => {
    const mockPlayer = { hp: 100, mp: 100 };

    // 先進入戰鬥
    sceneMgr.currentScene = 'battle';

    await sceneMgr.escape(mockPlayer);

    expect(mockPlayer.mp).toBe(70); // 100 - 30
    expect(sceneMgr.getCurrentScene()).toBe('explore');
  });
});
```

---

## 總結

場景系統實現涵蓋：

**✅ 場景管理**:
- SceneManager: 統一場景控制
- 自動場景切換
- 動畫流程管理

**✅ Prompt 分析**:
- PromptAnalyzer: 智能識別類型
- 複雜度評分
- 任務分類

**✅ 資源管理**:
- ResourceManager: 自動恢復
- 場景相關規則
- 實時更新

**✅ UI 整合**:
- React Store 狀態管理
- WebSocket 事件處理
- 動畫組件實現
