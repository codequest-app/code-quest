# 互動戰鬥事件設計

**日期**: 2026-02-05
**版本**: v1.0
**基於**: Battle-System-Design.md, Feature-Overview.md

---

## 核心概念

### 問題定義

在戰鬥過程中，Claude Code 可能觸發需要用戶互動的事件：

| 事件類型 | 觸發時機 | 原始行為 |
|---------|---------|---------|
| Plan Mode | EnterPlanMode tool 被調用 | 等待用戶批准計劃 |
| AskUserQuestion | 需要用戶決策 | 顯示選項，等待選擇 |
| 錯誤/警告 | 執行失敗 | 顯示錯誤訊息 |
| 權限請求 | 需要額外權限 | 請求用戶授權 |

**挑戰**: 這些事件會中斷戰鬥流程，需要設計合適的 RPG 化包裝。

---

## 設計方案

### 方案 A: 戰鬥暫停（保守）

**概念**: 將互動事件視為「戰鬥暫停」

```
戰鬥進行中
    ↓
觸發互動事件（Plan Mode / Ask Question）
    ↓
┌─────────────────────────┐
│ ⏸️ 戰鬥暫停            │
│                         │
│ [顯示暫停原因]          │
│ [顯示互動內容]          │
│ [等待用戶回應]          │
└─────────────────────────┘
    ↓
用戶完成互動
    ↓
▶️ 戰鬥繼續
```

**優點**:
- ✅ 簡單直接
- ✅ 不會混淆用戶
- ✅ 實作容易

**缺點**:
- ❌ 破壞沉浸感
- ❌ 不夠 RPG 化
- ❌ 沒有利用遊戲化元素

---

### 方案 B: RPG 化事件（推薦）⭐

**概念**: 將互動事件轉化為戰鬥中的特殊事件

#### 1. Plan Mode → 「戰術規劃」

```
敵人：中等的架構挑戰 Lv.8
     ↓
Claude 進入 Plan Mode
     ↓
┌─────────────────────────────────────┐
│ 🧙 魔法師進入思考狀態...             │
│                                     │
│ 敵人太過強大，需要制定戰術！         │
│                                     │
│ ┌─────────────────────────────┐     │
│ │ 📋 戰術規劃                  │     │
│ │                             │     │
│ │ [顯示 Plan Mode 內容]        │     │
│ │                             │     │
│ │ 建議的戰術:                  │     │
│ │ 1. 分析敵人弱點              │     │
│ │ 2. 準備強力技能              │     │
│ │ 3. 召喚夥伴協助              │     │
│ │                             │     │
│ │ [✅ 批准戰術] [❌ 重新規劃]  │     │
│ └─────────────────────────────┘     │
└─────────────────────────────────────┘
```

**遊戲化設計**:
- 圖標: 🧙 魔法師思考、📋 戰術書
- 狀態: 敵人進入「警戒」狀態（HP 條變黃色）
- 音效: 思考音效、翻書音效
- 動畫: 魔法師周圍浮現符文、戰術圖展開

**UI 呈現**:
```
┌─────────────────────────────────────┐
│ 戰鬥畫面                             │
├─────────────────────────────────────┤
│                                     │
│     🏰 架構挑戰 Lv.8                │
│     HP: ████████░░ 1600/2000        │
│     狀態: ⚠️ 警戒中...             │
│                                     │
│         ⬇️ 等待戰術批准              │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 🧙 魔法師的戰術規劃           │  │
│  │                               │  │
│  │ [Plan Mode 內容顯示]          │  │
│  │                               │  │
│  │ ┌───────────┐  ┌───────────┐  │  │
│  │ │ ✅ 執行戰術│  │ ❌ 取消    │  │  │
│  │ └───────────┘  └───────────┘  │  │
│  └───────────────────────────────┘  │
│                                     │
│     你: CodeMaster Lv.5             │
│     HP: ████████░░ 80/100           │
│     MP: ██████░░░░ 60/100           │
└─────────────────────────────────────┘
```

**實作**:
```javascript
class BattleManager {
  async handlePlanMode(planContent, planFile) {
    // 暫停戰鬥計時
    this.pauseBattle();

    // 敵人進入警戒狀態
    this.currentBattle.enemy.status = 'alerted';

    // 廣播事件
    this.broadcast({
      type: 'battle_event',
      eventType: 'plan_mode',
      event: {
        icon: '🧙',
        title: '戰術規劃',
        description: '魔法師正在制定戰術...',
        planContent,
        planFile,
        actions: [
          {
            id: 'approve',
            label: '✅ 批准戰術',
            style: 'primary',
            mpCost: 0  // 不消耗 MP
          },
          {
            id: 'reject',
            label: '❌ 重新規劃',
            style: 'secondary',
            mpCost: 10  // 重新規劃消耗 MP
          }
        ]
      }
    });

    // 添加戰鬥日誌
    this.addLog('🧙 魔法師進入思考狀態，正在制定戰術...', 'plan_mode');

    // 等待用戶回應
    const userChoice = await this.waitForUserChoice();

    if (userChoice === 'approve') {
      this.addLog('✅ 戰術已批准，繼續執行！', 'plan_approved');
      // 繼續執行 Plan
      await this.executePlan();
    } else {
      this.addLog('❌ 取消戰術，重新思考中...', 'plan_rejected');
      // 消耗 MP
      this.player.mp -= 10;
      // 退出 Plan Mode
      await this.exitPlanMode();
    }

    // 恢復戰鬥
    this.resumeBattle();
  }
}
```

---

#### 2. AskUserQuestion → 「敵人發問攻擊」

**概念**: 將問題轉化為敵人的特殊攻擊

```
戰鬥進行中
     ↓
Claude 調用 AskUserQuestion
     ↓
┌─────────────────────────────────────┐
│ 🐛 Bug怪物 使用 [混淆發問]！        │
│                                     │
│ 敵人發起疑問攻擊，必須正確回答！     │
│                                     │
│ ┌─────────────────────────────┐     │
│ │ ❓ 敵人的問題                │     │
│ │                             │     │
│ │ "你想要使用哪種測試框架？"   │     │
│ │                             │     │
│ │ 選項:                        │     │
│ │ ⚔️ A. Jest (推薦)           │     │
│ │ 🛡️ B. Mocha                │     │
│ │ 🔮 C. Vitest                │     │
│ │ 📝 D. 其他...               │     │
│ │                             │     │
│ │ ⚠️ 選擇錯誤會受到傷害！      │     │
│ └─────────────────────────────┘     │
└─────────────────────────────────────┘
```

**遊戲化設計**:
- 技能名稱: 根據問題類型生成
  - 技術選擇 → "技術抉擇"
  - 確認操作 → "確認陷阱"
  - 多選題 → "多重困惑"
- 狀態: 玩家進入「被提問」狀態
- 時間限制: 可選，增加緊張感
- 獎懲機制:
  - 正確回答 → 獲得 Buff（攻擊力 +10%, 持續 2 回合）
  - 錯誤回答 → 受到傷害（消耗 MP）

**UI 呈現**:
```
┌─────────────────────────────────────┐
│ 🐛 Bug怪物 Lv.5                     │
│ HP: ███░░░ 300/750                  │
│                                     │
│ 💬 Bug怪物 使用 [技術抉擇]！        │
│                                     │
│ ┌─────────────────────────────┐     │
│ │ ❓ 你想要使用哪種測試框架？  │     │
│ │                             │     │
│ │ [A] Jest (推薦)             │     │
│ │     • 流行、功能完整          │     │
│ │     • React 推薦             │     │
│ │                             │     │
│ │ [B] Mocha                   │     │
│ │     • 靈活、可定制            │     │
│ │     • 需要額外配置            │     │
│ │                             │     │
│ │ [C] Vitest                  │     │
│ │     • 快速、Vite 整合        │     │
│ │     • 較新                   │     │
│ │                             │     │
│ │ [D] 其他...                 │     │
│ │     [輸入框]                 │     │
│ └─────────────────────────────┘     │
│                                     │
│ ⏱️ 限時 60 秒 (可選)               │
│ 💡 提示: 選對獲得 Buff！            │
└─────────────────────────────────────┘
```

**實作**:
```javascript
class BattleManager {
  async handleAskUserQuestion(questions) {
    // 暫停戰鬥計時
    this.pauseBattle();

    // 生成技能名稱
    const skillName = this.generateQuestionSkillName(questions);

    // 敵人使用技能
    this.addLog(
      `${this.currentBattle.enemy.name} 使用 [${skillName}]！`,
      'enemy_skill'
    );

    // 廣播問題事件
    this.broadcast({
      type: 'battle_event',
      eventType: 'enemy_question',
      event: {
        icon: '❓',
        skillName,
        description: '敵人發起疑問攻擊！必須回答才能繼續戰鬥！',
        questions,
        timeLimit: 60,  // 可選
        rewards: {
          correct: {
            buff: { attack: 10, duration: 2 },
            message: '✅ 回答正確！獲得攻擊力提升！'
          },
          incorrect: {
            damage: 20,
            message: '❌ 回答錯誤！受到混淆傷害！'
          }
        }
      }
    });

    // 等待用戶回答
    const answers = await this.waitForUserAnswer();

    // 驗證答案（這裡簡化處理，實際由 Claude 驗證）
    const isCorrect = await this.validateAnswer(answers);

    if (isCorrect) {
      // 正確回答 - 獲得 Buff
      this.applyBuff(this.player, {
        attack: 10,
        duration: 2
      });
      this.addLog('✅ 回答正確！攻擊力 +10% (持續 2 回合)', 'buff');
    } else {
      // 錯誤回答 - 受到傷害
      this.player.mp -= 20;
      this.addLog('❌ 回答錯誤！受到混淆傷害 -20 MP', 'damage');

      this.broadcast({
        type: 'player_damaged',
        damage: 20,
        playerMp: this.player.mp
      });
    }

    // 恢復戰鬥
    this.resumeBattle();
  }

  generateQuestionSkillName(questions) {
    const question = questions[0];

    // 根據問題類型生成技能名
    if (question.options && question.options.length > 2) {
      return '多重困惑';
    } else if (question.question.includes('哪')) {
      return '技術抉擇';
    } else if (question.question.includes('是否') || question.question.includes('要不要')) {
      return '確認陷阱';
    } else {
      return '疑問攻擊';
    }
  }
}
```

---

#### 3. 錯誤/警告 → 「反噬傷害」

```
技能執行失敗
     ↓
┌─────────────────────────────────────┐
│ ⚠️ 技能反噬！                       │
│                                     │
│ 代碼生成術施放失敗！                 │
│ 受到反噬傷害 -15 MP                 │
│                                     │
│ 錯誤訊息:                            │
│ "權限不足，無法寫入文件"             │
│                                     │
│ [🔄 重試] [❌ 取消]                 │
└─────────────────────────────────────┘
```

**實作**:
```javascript
class BattleManager {
  async handleSkillError(skillName, error) {
    // 計算反噬傷害
    const backlashDamage = 15;

    this.player.mp -= backlashDamage;

    this.addLog(
      `⚠️ ${skillName} 施放失敗！受到反噬傷害 -${backlashDamage} MP`,
      'skill_error'
    );

    // 廣播錯誤事件
    this.broadcast({
      type: 'battle_event',
      eventType: 'skill_backlash',
      event: {
        icon: '⚠️',
        title: '技能反噬',
        skillName,
        damage: backlashDamage,
        error: error.message,
        actions: [
          { id: 'retry', label: '🔄 重試', mpCost: 5 },
          { id: 'cancel', label: '❌ 取消', mpCost: 0 }
        ]
      }
    });

    const choice = await this.waitForUserChoice();

    if (choice === 'retry') {
      this.player.mp -= 5;
      this.addLog('🔄 消耗 5 MP 重新施放技能...', 'retry');
      await this.retrySkill(skillName);
    } else {
      this.addLog('❌ 取消技能施放', 'cancel');
    }
  }
}
```

---

#### 4. 權限請求 → 「力量借用」

```
需要額外權限
     ↓
┌─────────────────────────────────────┐
│ 🔐 需要借用額外力量！               │
│                                     │
│ 技能 [檔案操作術] 需要額外權限：     │
│                                     │
│ 📂 允許工具:                        │
│    • Write (寫入文件)               │
│    • Bash (執行命令)                │
│                                     │
│ ⚠️ 授權後將消耗額外 10 MP           │
│                                     │
│ [✅ 授權] [❌ 拒絕]                 │
└─────────────────────────────────────┘
```

---

### 方案 C: 戰前處理（折衷）

**概念**: 在戰鬥開始前處理互動事件

```
用戶輸入複雜 Prompt
     ↓
分析複雜度 → 需要 Plan Mode
     ↓
┌─────────────────────────────────────┐
│ ⚔️ 戰前準備                         │
│                                     │
│ 檢測到強敵！需要制定戰術！           │
│                                     │
│ [Plan Mode 內容]                    │
│                                     │
│ [批准] [修改]                       │
└─────────────────────────────────────┘
     ↓
批准後才開始戰鬥
     ↓
進入戰鬥畫面
```

**優點**:
- ✅ 不中斷戰鬥流程
- ✅ 邏輯清晰

**缺點**:
- ❌ Plan Mode 可能在戰鬥中途觸發
- ❌ 限制了 Plan Mode 的使用場景

---

#### 5. Bash 工具執行 → 「指令魔法」

**概念**: 將命令執行轉化為不同類型的魔法施放

**命令分類**:

| 命令類型 | 魔法名稱 | 圖標 | 施法時間 | MP 消耗 |
|---------|---------|------|---------|--------|
| `git commit` | 版本封印術 | 📦 | 快速 | 5 |
| `git push` | 遠程傳送術 | 🚀 | 中等 | 10 |
| `npm install` | 依賴召喚術 | 📚 | 慢 | 15 |
| `npm test` | 試煉之法 | 🧪 | 中等 | 8 |
| `npm build` | 構築魔法 | 🏗️ | 慢 | 12 |
| `ls`/`pwd` | 偵察術 | 👁️ | 即時 | 2 |
| 其他命令 | 系統魔法 | ⚙️ | 依命令 | 依命令 |

**UI 呈現**:
```
┌─────────────────────────────────────┐
│ ⚔️ 你使用 [版本封印術]！           │
│                                     │
│ 🧙 施法中...                        │
│ ████████░░ 80%                      │
│                                     │
│ 📝 施法日誌:                        │
│ > git add .                         │
│ > git commit -m "Add feature"       │
│                                     │
│ ✅ 施法成功！-5 MP                  │
│ 💾 代碼已封印至版本庫               │
└─────────────────────────────────────┘
```

**實作**:
```javascript
class BattleManager {
  async handleBashCommand(command) {
    // 分析命令類型
    const spellInfo = this.analyzeBashCommand(command);

    // 檢查 MP
    if (this.player.mp < spellInfo.mpCost) {
      this.addLog('❌ MP 不足！無法施放魔法', 'error');
      return;
    }

    // 扣除 MP
    this.player.mp -= spellInfo.mpCost;

    // 廣播施法開始
    this.broadcast({
      type: 'spell_cast',
      spell: {
        name: spellInfo.name,
        icon: spellInfo.icon,
        command,
        estimatedDuration: spellInfo.duration
      }
    });

    this.addLog(
      `⚔️ 你使用 [${spellInfo.name}]！-${spellInfo.mpCost} MP`,
      'player_skill'
    );

    // 執行命令（實際執行）
    const result = await this.executeBashCommand(command, {
      onProgress: (progress) => {
        this.broadcast({
          type: 'spell_progress',
          progress,
          logs: progress.stdout
        });
      }
    });

    // 施法結果
    if (result.success) {
      this.addLog(
        `✅ ${spellInfo.name} 施放成功！`,
        'spell_success'
      );

      // 造成傷害（如果在戰鬥中）
      if (this.currentBattle) {
        const damage = this.calculateSpellDamage(spellInfo);
        await this.dealDamage(this.currentBattle.enemy, damage);
      }
    } else {
      // 施法失敗 → 反噬傷害
      await this.handleSkillError(spellInfo.name, result.error);
    }
  }

  analyzeBashCommand(command) {
    // Git 命令
    if (command.startsWith('git commit')) {
      return {
        name: '版本封印術',
        icon: '📦',
        mpCost: 5,
        duration: 'fast',
        baseDamage: 30
      };
    }

    if (command.startsWith('git push')) {
      return {
        name: '遠程傳送術',
        icon: '🚀',
        mpCost: 10,
        duration: 'medium',
        baseDamage: 50
      };
    }

    // NPM 命令
    if (command.includes('npm install') || command.includes('yarn install')) {
      return {
        name: '依賴召喚術',
        icon: '📚',
        mpCost: 15,
        duration: 'slow',
        baseDamage: 80
      };
    }

    if (command.includes('npm test') || command.includes('yarn test')) {
      return {
        name: '試煉之法',
        icon: '🧪',
        mpCost: 8,
        duration: 'medium',
        baseDamage: 45
      };
    }

    if (command.includes('build')) {
      return {
        name: '構築魔法',
        icon: '🏗️',
        mpCost: 12,
        duration: 'slow',
        baseDamage: 70
      };
    }

    // 查詢命令（低成本）
    if (['ls', 'pwd', 'echo', 'cat'].some(cmd => command.startsWith(cmd))) {
      return {
        name: '偵察術',
        icon: '👁️',
        mpCost: 2,
        duration: 'instant',
        baseDamage: 10
      };
    }

    // 默認
    return {
      name: '系統魔法',
      icon: '⚙️',
      mpCost: 5,
      duration: 'medium',
      baseDamage: 25
    };
  }

  calculateSpellDamage(spellInfo) {
    // 基礎傷害 + 玩家等級加成
    return Math.floor(
      spellInfo.baseDamage * (1 + this.player.level * 0.1)
    );
  }
}
```

---

#### 6. 文件操作 → 「檔案魔法」

**概念**: 將文件操作轉化為魔法書操作

| 操作類型 | 魔法名稱 | 圖標 | 描述 |
|---------|---------|------|------|
| Read | 讀心術 | 📖 | 讀取文件內容 |
| Write | 創造術 | ✍️ | 創建新文件 |
| Edit | 改寫術 | ✏️ | 修改現有文件 |
| Glob | 定位術 | 🔍 | 尋找文件 |
| Grep | 搜索之眼 | 👁️ | 搜索內容 |

**戰鬥中的表現**:
```
┌─────────────────────────────────────┐
│ 📖 你使用 [讀心術]！               │
│                                     │
│ 目標: src/components/Button.tsx     │
│                                     │
│ 🌀 解析文件魔法...                  │
│ ████████████ 100%                   │
│                                     │
│ ✅ 讀取成功！獲得情報！             │
│                                     │
│ 📊 文件情報:                        │
│    • 類型: React Component          │
│    • 行數: 245 行                   │
│    • 複雜度: 中等                   │
│                                     │
│ 💡 發現敵人弱點！                   │
│    下次攻擊 +15% 傷害               │
└─────────────────────────────────────┘
```

**實作**:
```javascript
class BattleManager {
  async handleFileOperation(operation, filePath, content = null) {
    const spellInfo = this.getFileOperationSpell(operation);

    this.addLog(
      `${spellInfo.icon} 你使用 [${spellInfo.name}]！`,
      'player_skill'
    );

    this.broadcast({
      type: 'file_operation',
      operation,
      filePath,
      spellName: spellInfo.name,
      icon: spellInfo.icon
    });

    // 執行操作（實際的文件操作）
    const result = await this.executeFileOperation(
      operation,
      filePath,
      content
    );

    if (result.success) {
      this.addLog(`✅ ${spellInfo.name} 成功！`, 'success');

      // 戰鬥中的效果
      if (this.currentBattle) {
        switch (operation) {
          case 'Read':
            // 讀取獲得情報 → 下次攻擊加成
            this.applyBuff(this.player, {
              attack: 15,
              duration: 1,
              name: '情報優勢'
            });
            this.addLog('💡 發現敵人弱點！下次攻擊 +15%', 'buff');
            break;

          case 'Write':
          case 'Edit':
            // 寫入/編輯造成傷害
            const damage = 40 + this.player.level * 5;
            await this.dealDamage(this.currentBattle.enemy, damage);
            this.addLog(
              `⚔️ 代碼改寫對敵人造成 ${damage} 點傷害！`,
              'damage'
            );
            break;

          case 'Grep':
          case 'Glob':
            // 搜索增加閃避
            this.applyBuff(this.player, {
              evasion: 20,
              duration: 2,
              name: '洞察力'
            });
            this.addLog('🔍 提升洞察力！閃避率 +20%', 'buff');
            break;
        }
      }
    } else {
      await this.handleSkillError(spellInfo.name, result.error);
    }
  }

  getFileOperationSpell(operation) {
    const spells = {
      'Read': { name: '讀心術', icon: '📖', mpCost: 3 },
      'Write': { name: '創造術', icon: '✍️', mpCost: 8 },
      'Edit': { name: '改寫術', icon: '✏️', mpCost: 6 },
      'Glob': { name: '定位術', icon: '🔍', mpCost: 4 },
      'Grep': { name: '搜索之眼', icon: '👁️', mpCost: 5 }
    };

    return spells[operation] || { name: '檔案魔法', icon: '📄', mpCost: 5 };
  }
}
```

---

#### 7. 長時間運行操作 → 「施法進度條」

**概念**: 長時間命令顯示施法進度和即時日誌

**場景**:
- `npm install` - 安裝依賴（30-120秒）
- `npm test` - 執行測試（10-60秒）
- `npm build` - 建構專案（20-90秒）
- 大型文件編譯

**UI 呈現**:
```
┌─────────────────────────────────────┐
│ 🧙 魔法師施放 [依賴召喚術]...      │
│                                     │
│ 施法進度:                            │
│ ████████████░░░░░░ 65%              │
│                                     │
│ 📜 施法日誌 (即時):                 │
│ ┌─────────────────────────────┐     │
│ │ npm install                 │     │
│ │ + react@18.2.0              │     │
│ │ + typescript@5.0.0          │     │
│ │ + vite@4.3.0                │     │
│ │ [████████░░] 65/100         │     │
│ └─────────────────────────────┘     │
│                                     │
│ ⚡ 敵人等待中...                     │
│    (無法行動)                        │
└─────────────────────────────────────┘
```

**特殊規則**:
- 施法期間敵人**暫停行動**（類似 ATB 系統的施法延遲）
- 顯示即時輸出作為「施法日誌」
- 如果施法被中斷（Ctrl+C），視為「施法中斷」受到反噬傷害

**實作**:
```javascript
class BattleManager {
  async handleLongRunningCommand(command) {
    const spellInfo = this.analyzeBashCommand(command);

    // 開始施法
    this.addLog(
      `🧙 魔法師開始施放 [${spellInfo.name}]...`,
      'casting'
    );

    // 暫停敵人行動
    this.pauseEnemyTurn();

    this.broadcast({
      type: 'long_cast_start',
      spell: spellInfo,
      command
    });

    // 執行命令，監聽進度
    const result = await this.executeBashCommand(command, {
      onProgress: (data) => {
        // 更新施法進度
        this.broadcast({
          type: 'cast_progress',
          progress: data.progress,  // 0-100
          stdout: data.stdout,
          stderr: data.stderr
        });
      },
      onCancel: () => {
        // 施法中斷
        this.handleCastInterrupted(spellInfo);
      }
    });

    if (result.success) {
      this.addLog(`✅ ${spellInfo.name} 施放完成！`, 'cast_complete');

      // 造成高額傷害（長時間施法的回報）
      const damage = this.calculateSpellDamage(spellInfo) * 1.5;
      await this.dealDamage(this.currentBattle.enemy, damage);

      this.addLog(
        `💥 強力魔法命中！造成 ${damage} 點傷害！`,
        'damage'
      );
    } else {
      await this.handleSkillError(spellInfo.name, result.error);
    }

    // 恢復敵人行動
    this.resumeEnemyTurn();
  }

  handleCastInterrupted(spellInfo) {
    this.addLog('⚠️ 施法被中斷！受到反噬傷害！', 'interrupt');

    // 反噬傷害（消耗的 MP 不退回 + 額外懲罰）
    const backlashDamage = 10;
    this.player.hp -= backlashDamage;

    this.broadcast({
      type: 'cast_interrupted',
      backlashDamage,
      playerHp: this.player.hp
    });
  }
}
```

---

#### 8. 並行操作 → 「多重施法」

**概念**: 同時執行多個工具時，顯示為「多重施法」

**場景**:
```javascript
// Claude Code 並行調用多個工具
// 例如：同時讀取 3 個文件
Read(file1.ts) + Read(file2.ts) + Grep(pattern)
```

**UI 呈現**:
```
┌─────────────────────────────────────┐
│ 🔮 多重施法！                       │
│                                     │
│ ⚡ 同時施放 3 個魔法：              │
│                                     │
│ 📖 [讀心術] file1.ts                │
│ ████████████ 完成                   │
│                                     │
│ 📖 [讀心術] file2.ts                │
│ ████████████ 完成                   │
│                                     │
│ 👁️ [搜索之眼] "function"           │
│ ████████░░░░ 75%                    │
│                                     │
│ 💫 連擊效果！傷害 +25%              │
└─────────────────────────────────────┘
```

**特殊效果**:
- 2-3 個並行操作 → 「雙重施法」，傷害 +15%
- 4-5 個並行操作 → 「多重施法」，傷害 +25%
- 6+ 個並行操作 → 「究極魔法」，傷害 +40%，但消耗 2x MP

**實作**:
```javascript
class BattleManager {
  async handleParallelOperations(operations) {
    const count = operations.length;

    // 計算多重施法等級
    const comboInfo = this.getComboInfo(count);

    this.addLog(
      `🔮 ${comboInfo.name}！同時施放 ${count} 個魔法！`,
      'combo'
    );

    // 額外 MP 消耗
    const extraMpCost = comboInfo.extraMpCost;
    if (this.player.mp < extraMpCost) {
      this.addLog('❌ MP 不足！無法多重施法', 'error');
      // 降級為順序執行
      return await this.handleSequentialOperations(operations);
    }

    this.player.mp -= extraMpCost;

    this.broadcast({
      type: 'parallel_cast',
      comboName: comboInfo.name,
      operations: operations.map(op => ({
        type: op.tool,
        icon: this.getToolIcon(op.tool),
        target: op.target
      })),
      damageBonus: comboInfo.damageBonus
    });

    // 並行執行所有操作
    const results = await Promise.all(
      operations.map(op => this.executeOperation(op))
    );

    // 檢查成功數量
    const successCount = results.filter(r => r.success).length;

    if (successCount === count) {
      // 全部成功 - 連擊效果
      this.addLog(
        `💫 完美連擊！所有魔法命中！`,
        'combo_success'
      );

      // 造成高額傷害
      const baseDamage = 50 * count;
      const damage = Math.floor(
        baseDamage * (1 + comboInfo.damageBonus / 100)
      );

      await this.dealDamage(this.currentBattle.enemy, damage);

      this.addLog(
        `💥 連擊傷害 ${damage} (基礎: ${baseDamage}, 加成: +${comboInfo.damageBonus}%)`,
        'damage'
      );

      // 獲得連擊 Buff
      this.applyBuff(this.player, {
        attack: 10,
        duration: 2,
        name: '連擊勢頭'
      });

    } else if (successCount > 0) {
      // 部分成功
      this.addLog(
        `⚠️ ${successCount}/${count} 個魔法成功施放`,
        'partial_success'
      );

      const damage = 30 * successCount;
      await this.dealDamage(this.currentBattle.enemy, damage);

    } else {
      // 全部失敗 - 嚴重反噬
      this.addLog('❌ 多重施法失敗！受到嚴重反噬！', 'combo_fail');
      this.player.hp -= 20;
      this.player.mp -= 10;
    }
  }

  getComboInfo(count) {
    if (count <= 1) {
      return { name: '單一施法', damageBonus: 0, extraMpCost: 0 };
    } else if (count <= 3) {
      return { name: '雙重施法', damageBonus: 15, extraMpCost: 5 };
    } else if (count <= 5) {
      return { name: '多重施法', damageBonus: 25, extraMpCost: 10 };
    } else {
      return { name: '究極魔法', damageBonus: 40, extraMpCost: 15 };
    }
  }
}
```

---

#### 9. Task 工具（子 Agent）→ 「召喚術」

**概念**: 啟動 Subagent 轉化為召喚夥伴（已在 Agent-Battle-Companion-Design.md 中涵蓋）

**戰鬥表現**:
```
┌─────────────────────────────────────┐
│ 🌟 召喚術發動！                     │
│                                     │
│ 召喚夥伴: Bash 專家 Lv.3            │
│                                     │
│ 🧙 夥伴加入戰鬥！                   │
│ HP: ████████████ 200/200            │
│ MP: ████████░░░░ 80/100             │
│                                     │
│ 技能:                                │
│ ⚔️ Git 魔法 (8 MP)                 │
│ 🔧 系統命令 (5 MP)                 │
│                                     │
│ 💬 "讓我來幫你！"                   │
└─────────────────────────────────────┘
```

**實作**:
```javascript
class BattleManager {
  async handleTaskSpawn(agentType, task) {
    this.addLog('🌟 使用召喚術！', 'summon');

    // 消耗 MP
    const summonCost = 20;
    if (this.player.mp < summonCost) {
      this.addLog('❌ MP 不足！無法召喚', 'error');
      return;
    }

    this.player.mp -= summonCost;

    // 創建夥伴
    const companion = await this.companionMgr.summonCompanion(
      agentType,
      task
    );

    this.addLog(
      `🧙 ${companion.name} 加入戰鬥！`,
      'companion_join'
    );

    this.broadcast({
      type: 'companion_summoned',
      companion: {
        id: companion.id,
        name: companion.name,
        level: companion.level,
        hp: companion.hp,
        maxHp: companion.maxHp,
        mp: companion.mp,
        maxMp: companion.maxMp,
        skills: companion.skills
      }
    });

    // 夥伴立即行動
    await this.companionMgr.executeCompanionTurn(companion);
  }
}
```

---

#### 10. 網絡操作 → 「遠程通訊術」

**概念**: 網絡請求轉化為遠程魔法

| 操作 | 魔法名稱 | 圖標 | 描述 |
|------|---------|------|------|
| WebFetch | 資料抓取術 | 🌐 | 抓取網頁內容 |
| WebSearch | 知識搜尋術 | 🔎 | 搜索網絡資訊 |

**UI 呈現**:
```
┌─────────────────────────────────────┐
│ 🌐 使用 [資料抓取術]！             │
│                                     │
│ 目標: https://api.example.com       │
│                                     │
│ 🌀 建立魔法連結...                  │
│ ████████░░░░ 連線中...              │
│                                     │
│ ✅ 抓取成功！獲得情報！             │
│                                     │
│ 📊 獲得資料:                        │
│    • 狀態: 200 OK                   │
│    • 大小: 2.4 KB                   │
│                                     │
│ 💡 情報價值 +10%                    │
└─────────────────────────────────────┘
```

**特殊規則**:
- 網絡操作可能失敗（404, timeout）→ 「通訊中斷」
- 成功獲得外部資訊 → 獲得「知識增益」Buff
- 搜索到關鍵資訊 → 發現敵人弱點

---

#### 11. 背景任務 → 「自動施法」

**概念**: `run_in_background` 的任務作為自動持續施法

**UI 呈現**:
```
┌─────────────────────────────────────┐
│ ⚙️ 背景施法啟動                     │
│                                     │
│ 🔮 持續魔法: [構築魔法]             │
│    狀態: 進行中...                   │
│    預計: 45 秒                       │
│                                     │
│ 💫 此魔法在背景運行，可繼續戰鬥！   │
└─────────────────────────────────────┘

[戰鬥繼續...]

┌─────────────────────────────────────┐
│ ✅ 背景施法完成！                   │
│                                     │
│ 🔮 [構築魔法] 已完成！              │
│                                     │
│ 💥 自動對敵人造成 80 點傷害！       │
└─────────────────────────────────────┘
```

**實作**:
```javascript
class BattleManager {
  async handleBackgroundTask(command) {
    const spellInfo = this.analyzeBashCommand(command);

    this.addLog(
      `⚙️ 啟動背景施法: [${spellInfo.name}]`,
      'background_spell'
    );

    // 啟動背景任務
    const taskId = await this.startBackgroundTask(command);

    this.broadcast({
      type: 'background_spell_start',
      taskId,
      spell: spellInfo
    });

    // 監聽任務完成
    this.watchBackgroundTask(taskId, async (result) => {
      if (result.success) {
        this.addLog(
          `✅ 背景施法 [${spellInfo.name}] 完成！`,
          'background_complete'
        );

        // 造成延遲傷害
        if (this.currentBattle) {
          const damage = this.calculateSpellDamage(spellInfo);
          await this.dealDamage(this.currentBattle.enemy, damage);

          this.addLog(
            `💥 背景魔法命中！造成 ${damage} 點傷害！`,
            'damage'
          );
        }

        this.broadcast({
          type: 'background_spell_complete',
          taskId,
          damage
        });

      } else {
        this.addLog(
          `❌ 背景施法失敗: ${result.error}`,
          'error'
        );
      }
    });
  }
}
```

---

#### 12. 流式輸出 → 「持續效果」

**概念**: 即時輸出的命令作為「持續傷害/治療」效果

**場景**:
- 測試運行 → 每通過一個測試造成傷害
- 建構過程 → 每完成一個模塊造成傷害
- 日誌輸出 → 即時顯示在戰鬥日誌

**UI 呈現**:
```
┌─────────────────────────────────────┐
│ 🧪 [試煉之法] 持續施法中...        │
│                                     │
│ 📜 即時效果:                        │
│ ✅ Test: Button renders → 敵人 -10  │
│ ✅ Test: Click handler → 敵人 -10   │
│ ✅ Test: Props validation → 敵人 -10│
│ ❌ Test: Edge case → 你 -5          │
│ ✅ Test: Snapshot → 敵人 -10        │
│                                     │
│ 總計: 4/5 通過                      │
│ 累計傷害: 40                         │
└─────────────────────────────────────┘
```

**實作**:
```javascript
class BattleManager {
  async handleStreamingCommand(command) {
    const spellInfo = this.analyzeBashCommand(command);

    this.addLog(
      `🌀 ${spellInfo.name} 持續施法中...`,
      'streaming'
    );

    let totalDamage = 0;

    // 執行命令，監聽流式輸出
    await this.executeBashCommand(command, {
      onStreamData: async (line) => {
        // 分析輸出內容
        const effect = this.analyzeStreamLine(line, spellInfo);

        if (effect.type === 'damage') {
          // 對敵人造成傷害
          await this.dealDamage(
            this.currentBattle.enemy,
            effect.amount
          );
          totalDamage += effect.amount;

          this.addLog(
            `✅ ${effect.message} → 敵人 -${effect.amount}`,
            'stream_damage'
          );

        } else if (effect.type === 'backlash') {
          // 反噬傷害
          this.player.hp -= effect.amount;

          this.addLog(
            `❌ ${effect.message} → 你 -${effect.amount}`,
            'stream_backlash'
          );
        }

        // 更新 UI
        this.broadcast({
          type: 'stream_effect',
          line,
          effect
        });
      }
    });

    this.addLog(
      `✨ ${spellInfo.name} 完成！累計傷害: ${totalDamage}`,
      'stream_complete'
    );
  }

  analyzeStreamLine(line, spellInfo) {
    // 測試通過
    if (line.includes('✓') || line.includes('PASS')) {
      return {
        type: 'damage',
        amount: 10,
        message: line.trim()
      };
    }

    // 測試失敗
    if (line.includes('✗') || line.includes('FAIL')) {
      return {
        type: 'backlash',
        amount: 5,
        message: line.trim()
      };
    }

    // 建構成功
    if (line.includes('built successfully')) {
      return {
        type: 'damage',
        amount: 30,
        message: '建構完成'
      };
    }

    // 一般輸出（不造成效果）
    return {
      type: 'log',
      message: line.trim()
    };
  }
}
```

---

## 推薦方案總結

### 最佳實踐：混合方案 ⭐

**規則**:

#### A. 互動事件（需要用戶決策）

| 事件類型 | 處理方式 | 遊戲化呈現 | 優先級 |
|---------|---------|-----------|--------|
| Plan Mode (戰鬥前) | 戰前準備 | 📋 制定戰術 | P1 |
| Plan Mode (戰鬥中) | RPG 化事件 | 🧙 戰術規劃 | P2 |
| AskUserQuestion | RPG 化事件 | ❓ 敵人發問攻擊 | P1 |
| 錯誤/警告 | RPG 化事件 | ⚠️ 技能反噬 | P1 |
| 權限請求 | RPG 化事件 | 🔐 力量借用 | P2 |

#### B. 工具執行事件（自動執行）

| 事件類型 | 處理方式 | 遊戲化呈現 | MP 消耗 | 優先級 |
|---------|---------|-----------|---------|--------|
| Bash 命令 | 指令魔法 | ⚔️ 多種魔法（見分類） | 2-15 | P1 |
| 文件讀取 (Read) | 檔案魔法 | 📖 讀心術 | 3 | P1 |
| 文件寫入 (Write) | 檔案魔法 | ✍️ 創造術 | 8 | P1 |
| 文件編輯 (Edit) | 檔案魔法 | ✏️ 改寫術 | 6 | P1 |
| 內容搜索 (Grep) | 探索魔法 | 👁️ 搜索之眼 | 5 | P2 |
| 文件搜索 (Glob) | 探索魔法 | 🔍 定位術 | 4 | P2 |
| 並行操作 (2-5+) | 多重施法 | 🔮 連擊魔法 | 5-15 額外 | P2 |
| 子 Agent (Task) | 召喚術 | 🌟 召喚夥伴 | 20 | P1 |
| 網絡請求 (WebFetch) | 遠程通訊術 | 🌐 資料抓取術 | 10 | P3 |
| 網絡搜索 (WebSearch) | 遠程通訊術 | 🔎 知識搜尋術 | 12 | P3 |
| 背景任務 | 自動施法 | ⚙️ 背景魔法 | 依任務 | P3 |
| 流式輸出 | 持續效果 | 🌀 持續傷害/治療 | - | P2 |

#### C. Bash 命令細分（指令魔法）

| 命令類型 | 魔法名稱 | 圖標 | MP 消耗 | 施法時間 |
|---------|---------|------|---------|----------|
| `git commit` | 版本封印術 | 📦 | 5 | 快速 |
| `git push` | 遠程傳送術 | 🚀 | 10 | 中等 |
| `git pull` | 同步魔法 | 🔄 | 8 | 中等 |
| `npm install` | 依賴召喚術 | 📚 | 15 | 慢 |
| `npm test` | 試煉之法 | 🧪 | 8 | 中等 |
| `npm build` | 構築魔法 | 🏗️ | 12 | 慢 |
| `npm run dev` | 開發召喚 | 🔥 | 10 | 中等 |
| `ls` / `pwd` | 偵察術 | 👁️ | 2 | 即時 |
| `rm` / `mkdir` | 環境改造術 | 🔨 | 5 | 快速 |
| 其他命令 | 系統魔法 | ⚙️ | 5 | 依命令 |

**實作優先級**:

```
Phase 2.5 (戰鬥系統基礎) - Week 5-6:
─────────────────────────────────────────
互動事件（基礎處理）:
- ✅ Plan Mode 基礎處理（暫停戰鬥）
- ✅ AskUserQuestion 基礎處理（暫停戰鬥）
- ✅ 錯誤處理基礎（顯示錯誤）

工具執行（P1 - 基礎 RPG 化）:
- ⭐ Bash 命令基礎分類（git, npm, 一般命令）
- ⭐ 文件操作基礎（Read, Write, Edit）
- ⭐ Task 工具（召喚夥伴，已在 Companion 系統中）
- ⭐ 基礎戰鬥日誌顯示

Phase 3 (完善和擴展) - Week 7-10:
─────────────────────────────────────────
互動事件（完整 RPG 化）:
- ⭐ Plan Mode RPG 化（戰術規劃）
- ⭐ AskUserQuestion RPG 化（敵人發問攻擊）
- ⭐ 錯誤處理 RPG 化（技能反噬 + 重試機制）
- ⭐ 權限請求 RPG 化（力量借用）

工具執行（P2 - 進階功能）:
- ⭐ Bash 命令完整分類（10+ 種魔法）
- ⭐ 並行操作（多重施法 + 連擊系統）
- ⭐ 長時間運行操作（施法進度條）
- ⭐ 流式輸出（持續效果）
- ⭐ 搜索工具（Grep, Glob）

Phase 4 (優化和特效) - Week 11+:
─────────────────────────────────────────
工具執行（P3 - 特殊功能）:
- 🌟 網絡操作（WebFetch, WebSearch）
- 🌟 背景任務（自動施法）
- 🌟 更多 Bash 命令細分
- 🌟 自定義魔法映射（用戶配置）
```

---

## 技術實作

### Bridge Layer 事件偵測

```javascript
// bridge/index.js
class RPGBridge {
  constructor() {
    this.claudeProcess = null;
    this.battleMgr = null;
    this.outputBuffer = '';
  }

  async handleClaudeOutput(data) {
    this.outputBuffer += data.toString();

    // 偵測 Plan Mode
    if (this.detectPlanMode(this.outputBuffer)) {
      const planContent = this.extractPlanContent(this.outputBuffer);

      if (this.battleMgr && this.battleMgr.currentBattle) {
        // 戰鬥中 - RPG 化處理
        await this.battleMgr.handlePlanMode(planContent);
      } else {
        // 戰鬥前 - 正常處理
        await this.handlePlanModeNormal(planContent);
      }
    }

    // 偵測 AskUserQuestion
    if (this.detectAskUserQuestion(this.outputBuffer)) {
      const questions = this.extractQuestions(this.outputBuffer);

      if (this.battleMgr && this.battleMgr.currentBattle) {
        // 戰鬥中 - 敵人發問攻擊
        await this.battleMgr.handleAskUserQuestion(questions);
      } else {
        // 戰鬥外 - 正常處理
        await this.handleQuestionsNormal(questions);
      }
    }

    // 偵測錯誤
    if (this.detectError(this.outputBuffer)) {
      const error = this.extractError(this.outputBuffer);

      if (this.battleMgr && this.battleMgr.currentBattle) {
        // 戰鬥中 - 技能反噬
        await this.battleMgr.handleSkillError(
          this.currentSkill,
          error
        );
      }
    }
  }

  detectPlanMode(output) {
    // 偵測 EnterPlanMode 工具調用
    return output.includes('<invoke name="EnterPlanMode">') ||
           output.includes('進入計劃模式');
  }

  detectAskUserQuestion(output) {
    // 偵測 AskUserQuestion 工具調用
    return output.includes('<invoke name="AskUserQuestion">');
  }

  extractQuestions(output) {
    // 從輸出中提取問題內容
    // 解析 AskUserQuestion 的 JSON 參數
    const match = output.match(
      /<parameter name="questions">(.*?)<\/antml:parameter>/s
    );

    if (match) {
      return JSON.parse(match[1]);
    }

    return [];
  }
}
```

---

## UI 組件設計

### BattleEventModal 組件

```tsx
// ui/src/components/Battle/BattleEventModal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BattleEvent {
  eventType: 'plan_mode' | 'enemy_question' | 'skill_backlash' | 'permission_request';
  icon: string;
  title: string;
  description: string;
  content?: any;
  actions: Array<{
    id: string;
    label: string;
    style: 'primary' | 'secondary' | 'danger';
    mpCost?: number;
  }>;
}

interface BattleEventModalProps {
  event: BattleEvent | null;
  onAction: (actionId: string) => void;
}

const BattleEventModal: React.FC<BattleEventModalProps> = ({
  event,
  onAction
}) => {
  if (!event) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="battle-event-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="battle-event-modal"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          {/* 標題 */}
          <div className="event-header">
            <span className="event-icon">{event.icon}</span>
            <h2 className="event-title">{event.title}</h2>
          </div>

          {/* 描述 */}
          <p className="event-description">{event.description}</p>

          {/* 內容區域（根據事件類型渲染） */}
          <div className="event-content">
            {event.eventType === 'plan_mode' && (
              <PlanModeContent content={event.content} />
            )}

            {event.eventType === 'enemy_question' && (
              <QuestionContent questions={event.content} />
            )}

            {event.eventType === 'skill_backlash' && (
              <ErrorContent error={event.content} />
            )}
          </div>

          {/* 行動按鈕 */}
          <div className="event-actions">
            {event.actions.map(action => (
              <button
                key={action.id}
                className={`event-action ${action.style}`}
                onClick={() => onAction(action.id)}
              >
                {action.label}
                {action.mpCost > 0 && (
                  <span className="mp-cost">-{action.mpCost} MP</span>
                )}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Plan Mode 內容組件
const PlanModeContent: React.FC<{ content: string }> = ({ content }) => (
  <div className="plan-mode-content">
    <div className="plan-icon">📋</div>
    <div className="plan-text">
      <pre>{content}</pre>
    </div>
  </div>
);

// 問題內容組件
const QuestionContent: React.FC<{ questions: any[] }> = ({ questions }) => (
  <div className="question-content">
    {questions.map((q, idx) => (
      <div key={idx} className="question-item">
        <h3 className="question-header">{q.header}</h3>
        <p className="question-text">{q.question}</p>

        <div className="question-options">
          {q.options.map((opt, optIdx) => (
            <label key={optIdx} className="option-label">
              <input
                type={q.multiSelect ? 'checkbox' : 'radio'}
                name={`question-${idx}`}
                value={opt.label}
              />
              <span className="option-content">
                <strong>{opt.label}</strong>
                <p>{opt.description}</p>
              </span>
            </label>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default BattleEventModal;
```

---

## 樣式設計

```css
/* ui/src/styles/battle-events.css */

.battle-event-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.battle-event-modal {
  background: linear-gradient(135deg, #2C3E50 0%, #34495E 100%);
  border: 3px solid #F39C12;
  border-radius: 12px;
  padding: 32px;
  max-width: 600px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  font-family: 'Press Start 2P', monospace;
}

.event-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.event-icon {
  font-size: 48px;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.event-title {
  font-size: 20px;
  color: #F39C12;
  text-shadow: 2px 2px 0 #000;
}

.event-description {
  color: #ECF0F1;
  font-size: 12px;
  line-height: 1.8;
  margin-bottom: 24px;
}

.event-content {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #34495E;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  max-height: 400px;
  overflow-y: auto;
}

.event-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.event-action {
  padding: 12px 24px;
  border: 2px solid;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.event-action.primary {
  background: #27AE60;
  border-color: #2ECC71;
  color: white;
}

.event-action.primary:hover {
  background: #2ECC71;
  transform: scale(1.05);
}

.event-action.secondary {
  background: #3498DB;
  border-color: #5DADE2;
  color: white;
}

.event-action.danger {
  background: #E74C3C;
  border-color: #EC7063;
  color: white;
}

.mp-cost {
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
}
```

---

## 完整流程示例

### 場景：戰鬥中觸發 Plan Mode

```
1. 用戶輸入複雜 Prompt
   "請幫我重構整個系統架構，並確保向後兼容"

2. 生成敵人
   敵人: 傳說的架構巨龍 Lv.15
   HP: 4500

3. 開始戰鬥
   顯示戰鬥畫面

4. Claude 分析後進入 Plan Mode

5. Bridge 偵測到 EnterPlanMode

6. BattleManager.handlePlanMode() 觸發

7. UI 顯示戰術規劃事件
   ┌─────────────────────────┐
   │ 🧙 戰術規劃            │
   │                         │
   │ 魔法師制定戰術:         │
   │ 1. 分析現有架構         │
   │ 2. 設計新架構           │
   │ 3. 制定遷移計劃         │
   │ 4. 編寫兼容層           │
   │                         │
   │ [✅ 批准] [❌ 取消]     │
   └─────────────────────────┘

8. 用戶點擊「批准」

9. 繼續執行 Plan

10. Plan 完成，退出 Plan Mode

11. 恢復戰鬥流程
```

---

## 總結

### 推薦方案

**Phase 2.5 (基礎實作)**:
- 使用方案 A（戰鬥暫停）作為基礎
- 簡單直接，快速實現

**Phase 3 (完善)**:
- 升級為方案 B（RPG 化事件）
- 增強沉浸感和遊戲性

### 關鍵設計原則

1. ✅ **不破壞原有功能**: Plan Mode 和 AskUserQuestion 正常工作
2. ✅ **增強體驗**: 用 RPG 元素包裝互動事件
3. ✅ **保持一致性**: 所有互動事件使用統一的 UI 組件
4. ✅ **可配置**: 用戶可選擇是否啟用 RPG 化（設定中切換）

---

## 工具執行事件完整列表

### 總覽

所有 Claude Code 工具執行都會被 RPG 化，以下是完整映射：

**核心原則**:
1. ✅ **每個工具都有對應的魔法** - 無論是 Bash、Read、Write 還是其他工具
2. ✅ **MP 消耗與複雜度成正比** - 簡單查詢 2-3 MP，複雜操作 10-15 MP
3. ✅ **戰鬥中的效果多樣化** - 造成傷害、獲得 Buff、發現弱點等
4. ✅ **即時反饋** - 所有操作都有視覺和遊戲化反饋
5. ✅ **失敗有代價** - 錯誤造成反噬傷害，鼓勵謹慎操作

### 特殊機制總結

#### 1. 連擊系統（並行操作）
```
2-3 工具並行 → 雙重施法 (+15% 傷害, +5 MP)
4-5 工具並行 → 多重施法 (+25% 傷害, +10 MP)
6+ 工具並行  → 究極魔法 (+40% 傷害, +15 MP)
```

#### 2. 施法時間系統
```
即時 (0-0.5s)  : 偵察術 (ls, pwd, echo)
快速 (0.5-2s)  : 讀心術 (Read), 版本封印術 (git commit)
中等 (2-10s)   : 改寫術 (Edit), 試煉之法 (npm test)
慢 (10s+)      : 依賴召喚術 (npm install), 構築魔法 (build)
```

長時間施法會：
- 顯示進度條
- 暫停敵人行動（ATB 系統）
- 完成後造成額外傷害（+50%）

#### 3. 戰鬥效果系統

| 工具類型 | 主要效果 | 次要效果 |
|---------|---------|---------|
| Read | 發現弱點 → 攻擊 +15% (1回合) | 造成 10-20 傷害 |
| Write/Edit | 造成 30-50 傷害 | - |
| Grep/Glob | 提升閃避 +20% (2回合) | 造成 15-25 傷害 |
| Bash (git) | 造成 30-50 傷害 | 可能獲得「穩定」Buff |
| Bash (npm) | 造成 50-80 傷害 | 長施法時間 |
| Task | 召喚夥伴 | 夥伴獨立行動 |
| WebFetch | 獲得「知識增益」+10% | 造成 20-30 傷害 |
| 並行 (3+) | 連擊傷害 +25% | 獲得「連擊勢頭」Buff |

#### 4. 流式輸出特殊處理

支援流式輸出的命令（測試、建構）會觸發「持續效果」：

```javascript
// 測試執行範例
✅ Test 1 passed → 敵人 -10 HP
✅ Test 2 passed → 敵人 -10 HP
❌ Test 3 failed → 你 -5 HP (反噬)
✅ Test 4 passed → 敵人 -10 HP

總計: 3/4 通過
累計傷害: 30
反噬傷害: 5
```

#### 5. 背景任務機制

背景任務（`run_in_background: true`）：
- 啟動時消耗 MP
- 在背景執行，不阻塞戰鬥
- 完成時自動觸發效果
- UI 顯示「背景施法中...」指示器

**範例**:
```
[啟動] npm run build (背景)
→ 消耗 12 MP，開始背景施法

[45秒後，戰鬥進行中]
→ ✅ 背景魔法完成！
→ 💥 自動對敵人造成 70 點傷害
```

### MP 消耗速查表

```
【查詢操作】 2-4 MP
  ls, pwd, echo         → 2 MP
  Read                  → 3 MP
  Glob                  → 4 MP
  Grep                  → 5 MP

【修改操作】 5-8 MP
  git commit            → 5 MP
  Edit                  → 6 MP
  Write                 → 8 MP
  npm test              → 8 MP

【重型操作】 10-15 MP
  git push              → 10 MP
  WebFetch              → 10 MP
  npm build             → 12 MP
  WebSearch             → 12 MP
  npm install           → 15 MP

【特殊操作】 15-20+ MP
  Task (召喚)           → 20 MP
  並行 (額外消耗)       → 5-15 MP
  多重施法加成          → 依數量
```

### 實作檢查清單

**Phase 2.5 必須完成**:
- [ ] Bash 命令偵測與分類（至少 git, npm）
- [ ] Read/Write/Edit 工具 RPG 化
- [ ] 基礎戰鬥日誌系統
- [ ] MP 消耗計算
- [ ] 簡單的傷害計算
- [ ] 錯誤處理（反噬傷害）
- [ ] Task 工具整合（召喚系統）

**Phase 3 進階功能**:
- [ ] Bash 命令完整分類（10+ 種）
- [ ] 並行操作偵測（多重施法）
- [ ] 長時間運行進度條
- [ ] 流式輸出處理
- [ ] 戰鬥效果系統（Buff/Debuff）
- [ ] Grep/Glob 工具
- [ ] Plan Mode/AskUserQuestion RPG 化

**Phase 4 優化**:
- [ ] 背景任務支援
- [ ] 網絡操作 (WebFetch/WebSearch)
- [ ] 自定義魔法映射配置
- [ ] 更多視覺特效
- [ ] 音效支援

---

## 技術整合建議

### Bridge Layer 架構更新

```javascript
// bridge/toolDetector.js
class ToolDetector {
  /**
   * 偵測 Claude Code 工具調用
   * 從 stdout/stderr 解析工具名稱和參數
   */
  detectToolCall(output) {
    // 偵測 function_calls 區塊
    const toolCallMatch = output.match(
      /<invoke name="(\w+)">(.*?)<\/antml:invoke>/s
    );

    if (!toolCallMatch) return null;

    const toolName = toolCallMatch[1];
    const params = this.extractParams(toolCallMatch[2]);

    return {
      tool: toolName,
      params,
      timestamp: Date.now()
    };
  }

  extractParams(paramBlock) {
    const params = {};
    const paramMatches = paramBlock.matchAll(
      /<parameter name="(\w+)">(.*?)<\/antml:parameter>/gs
    );

    for (const match of paramMatches) {
      params[match[1]] = match[2];
    }

    return params;
  }
}

// bridge/toolMapper.js
class ToolMapper {
  /**
   * 將工具調用映射為 RPG 魔法
   */
  mapToolToSpell(toolCall) {
    const { tool, params } = toolCall;

    switch (tool) {
      case 'Bash':
        return this.mapBashToSpell(params.command);

      case 'Read':
        return {
          name: '讀心術',
          icon: '📖',
          mpCost: 3,
          type: 'file_operation',
          effect: 'discover_weakness'
        };

      case 'Write':
        return {
          name: '創造術',
          icon: '✍️',
          mpCost: 8,
          type: 'file_operation',
          effect: 'damage'
        };

      case 'Edit':
        return {
          name: '改寫術',
          icon: '✏️',
          mpCost: 6,
          type: 'file_operation',
          effect: 'damage'
        };

      case 'Task':
        return {
          name: '召喚術',
          icon: '🌟',
          mpCost: 20,
          type: 'summon',
          effect: 'summon_companion'
        };

      // ... 其他工具
    }
  }

  mapBashToSpell(command) {
    if (command.startsWith('git commit')) {
      return {
        name: '版本封印術',
        icon: '📦',
        mpCost: 5,
        type: 'git_magic',
        effect: 'damage',
        baseDamage: 30
      };
    }

    if (command.includes('npm install')) {
      return {
        name: '依賴召喚術',
        icon: '📚',
        mpCost: 15,
        type: 'npm_magic',
        effect: 'heavy_damage',
        baseDamage: 80,
        castTime: 'slow'
      };
    }

    // ... 更多映射
  }
}

// bridge/rpgBattle.js
class RPGBridge {
  async handleToolExecution(toolCall) {
    // 1. 映射為魔法
    const spell = this.toolMapper.mapToolToSpell(toolCall);

    // 2. 檢查 MP
    if (this.player.mp < spell.mpCost) {
      this.addLog('❌ MP 不足！', 'error');
      return;
    }

    // 3. 扣除 MP
    this.player.mp -= spell.mpCost;

    // 4. 廣播施法
    this.broadcast({
      type: 'spell_cast',
      spell,
      tool: toolCall.tool
    });

    // 5. 執行實際工具（透過 Claude CLI）
    const result = await this.executeActualTool(toolCall);

    // 6. 處理結果
    if (result.success) {
      await this.handleSpellSuccess(spell, result);
    } else {
      await this.handleSpellFailure(spell, result.error);
    }
  }
}
```

### 並行操作偵測

```javascript
class ParallelDetector {
  constructor() {
    this.pendingCalls = [];
    this.parallelWindow = 100; // 100ms 內視為並行
  }

  /**
   * 偵測並行工具調用
   */
  detectParallel(toolCall) {
    const now = Date.now();

    // 清理過期的 pending calls
    this.pendingCalls = this.pendingCalls.filter(
      call => now - call.timestamp < this.parallelWindow
    );

    // 添加當前調用
    this.pendingCalls.push(toolCall);

    // 如果有 2+ 個調用，視為並行
    if (this.pendingCalls.length >= 2) {
      const parallelCalls = [...this.pendingCalls];
      this.pendingCalls = [];  // 清空

      return {
        isParallel: true,
        count: parallelCalls.length,
        calls: parallelCalls
      };
    }

    return {
      isParallel: false,
      count: 1,
      calls: [toolCall]
    };
  }
}
```

---

## 最終總結

### 推薦實作方案

**Phase 2.5 (基礎實作)**:
- 互動事件：使用方案 A（戰鬥暫停）作為基礎
- 工具執行：實作 P1 工具的基礎 RPG 化（Bash, Read, Write, Edit, Task）
- 簡單直接，快速實現核心功能

**Phase 3 (完善)**:
- 互動事件：升級為方案 B（完整 RPG 化）
- 工具執行：實作 P2 工具（並行、長時間運行、流式輸出、搜索）
- 增強沉浸感和遊戲性

**Phase 4 (優化)**:
- 工具執行：實作 P3 工具（網絡、背景任務）
- 特效和音效
- 自定義配置

### 關鍵設計原則

1. ✅ **不破壞原有功能**: 所有 Claude Code 工具照常運作
2. ✅ **增強體驗**: 用 RPG 元素包裝所有操作
3. ✅ **保持一致性**: 所有事件使用統一的 UI 和遊戲化邏輯
4. ✅ **即時反饋**: 每個操作都有視覺和遊戲化反饋
5. ✅ **合理成本**: MP 消耗與操作複雜度成正比
6. ✅ **失敗代價**: 錯誤造成反噬，鼓勵謹慎操作
7. ✅ **可配置**: 用戶可選擇 RPG 化程度（設定中切換）

### 涵蓋範圍總結

**本設計文檔涵蓋**:

✅ **互動事件** (4 種):
- Plan Mode（戰術規劃）
- AskUserQuestion（敵人發問攻擊）
- 錯誤/警告（技能反噬）
- 權限請求（力量借用）

✅ **工具執行事件** (12+ 種):
- Bash 命令（10+ 種魔法分類）
- 文件操作（Read, Write, Edit - 3 種魔法）
- 搜索工具（Grep, Glob - 2 種魔法）
- Task 工具（召喚術）
- 網絡操作（WebFetch, WebSearch - 2 種魔法）
- 並行操作（多重施法系統）
- 長時間運行（施法進度條）
- 流式輸出（持續效果）
- 背景任務（自動施法）

✅ **遊戲機制**:
- MP 消耗系統（2-20+ MP，分級明確）
- 連擊系統（並行操作加成）
- 施法時間系統（即時/快速/中等/慢）
- 戰鬥效果系統（傷害/Buff/弱點發現）
- 反噬機制（失敗懲罰）
- 背景施法（非阻塞執行）

✅ **技術實作**:
- ToolDetector（工具偵測）
- ToolMapper（工具映射為魔法）
- ParallelDetector（並行偵測）
- BattleManager 整合
- UI 組件設計
- WebSocket 事件定義

### 未來擴展方向

**可能的新增工具**:
- MCP 工具調用 → 「外部力量召喚」
- NotebookEdit → 「魔法書編輯術」
- Git 其他操作（rebase, merge, etc.） → 更多版本魔法
- Docker 操作 → 「容器召喚術」
- 資料庫操作 → 「數據魔法」

**可能的新機制**:
- 魔法連鎖（Chain Casting）：連續成功施法獲得加成
- 魔法暴擊（Critical Cast）：低機率 2x 效果
- 魔法反彈（Reflect）：敵人可能反彈某些魔法
- 元素系統（Element）：不同工具類型有元素屬性

---

**版本**: v2.0
**最後更新**: 2026-02-05
**變更**: 新增工具執行事件 RPG 化（12+ 種工具類型）
