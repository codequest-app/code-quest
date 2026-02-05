# Skills 使用說明

## Skills 位置

**重要**: Skills 應該放在 Claude 配置目錄，而非專案目錄

```
~/.claude/skills/               # Claude 全局 skills 目錄
└── meta/
    └── SKILL.md                # 🎓 Claude 機制專家 (已創建)
```

## 已創建的 Skills

### 🎓 Claude 機制專家 (claude-mechanisms-expert)

**位置**: `~/.claude/skills/meta/SKILL.md`

**用途**: 提供 Claude Skills 和 Subagents 創建指導

**何時使用**:
- 需要創建新的 Skill 時
- 需要創建新的 Subagent 時
- 不確定應該使用 Skill 還是 Subagent
- 需要 Skills/Subagents 最佳實踐建議

**如何調用** (在對話中):

```
當我需要關於 skills 或 agents 的知識時，應該使用:

Skill tool 調用 "claude-mechanisms-expert"
```

**範例諮詢問題**:
- "我想建立一個自動生成單元測試的功能，應該用 Skill 還是 Subagent？"
- "如何創建一個代碼審查的 Subagent？"
- "Skills 的 YAML frontmatter 應該包含哪些欄位？"
- "如何讓多個 Subagents 並行執行？"

## 為什麼 Skills 應該放在 ~/.claude/skills/

1. **全局可用**: 所有專案都能使用
2. **知識持久化**: 不會因為專案刪除而丟失
3. **符合 Claude 慣例**: Claude Code 會掃描此目錄
4. **易於管理**: 集中管理所有 skills

## 專案文件 vs Skills

### 專案目錄中的文件

```
/Users/recca0120/WebstormProjects/cc-office/
├── RPG-CLI-Skills-Design.md      # 設計文檔（說明如何設計）
├── RPG-CLI-Agents-Design.md      # 設計文檔（說明如何設計）
└── Claude-Subagents-Skills-Knowledge.md  # 知識庫（參考資料）
```

這些是**設計文檔**和**知識庫**，用於：
- 記錄設計思路
- 提供範例
- 作為開發參考

### Claude 配置目錄中的 Skills

```
~/.claude/skills/
└── meta/
    └── SKILL.md                  # 可執行的 Skill
```

這些是**可執行的 Skills**，用於：
- 在對話中實際調用
- 提供即時諮詢
- 確保知識不會被遺忘

## Skill 與 Subagent 的差異

參考 `Claude-Subagents-Skills-Knowledge.md` 獲取完整說明。

**簡要區別**:

| 特性 | Skill | Subagent |
|------|-------|----------|
| 定位 | 操作手冊 (Playbook) | 獨立助手 |
| Context | 與主 agent 共享 | 獨立 context window |
| 用途 | 標準化操作流程 | 專門化任務處理 |
| 調用方式 | code_execution tool | delegateToSubagent API |
| 並行執行 | 否 | 是 |

## 下一步

### 創建更多 Skills

根據 `RPG-CLI-Skills-Design.md` 的設計，可以創建：

```
~/.claude/skills/
├── basic/
│   ├── code-generator/SKILL.md
│   ├── doc-writer/SKILL.md
│   └── code-reviewer/SKILL.md
├── advanced/
│   └── architecture-design/SKILL.md
└── combo/
    └── code-review-combo/SKILL.md
```

### 創建 Subagents

根據 `RPG-CLI-Agents-Design.md` 的設計，Subagents 定義可以：

1. **Option A**: 放在專案中作為配置文件
   ```
   /Users/recca0120/WebstormProjects/cc-office/agents/
   └── guardians/
       └── code-guardian.md
   ```

2. **Option B**: 放在 Claude 配置中作為預設 agents
   ```
   ~/.claude/agents/
   └── guardians/
       └── code-guardian.md
   ```

建議：Agents 定義放在專案中，因為：
- 每個專案可能需要不同的 agents
- Agents 配置與專案特性相關
- 可以版本控制

而 Skills 放在 `~/.claude/skills/`，因為：
- Skills 是通用的操作模式
- 跨專案重用
- 知識持久化

## 實際使用範例

### 場景：需要創建一個新 Skill

**Step 1**: 在對話中請求諮詢
```
請幫我設計一個自動生成 API 文檔的 Skill
```

**Step 2**: Claude 應該調用 claude-mechanisms-expert skill
```
[使用 Skill tool 調用]
```

**Step 3**: 獲得專家建議
- Skill 格式範例
- 最佳實踐建議
- 完整的 YAML + instructions

**Step 4**: 創建 Skill 文件
```bash
mkdir -p ~/.claude/skills/documentation
vim ~/.claude/skills/documentation/SKILL.md
```

---

**創建日期**: 2026-02-05
**相關文檔**:
- `Claude-Subagents-Skills-Knowledge.md`: 知識庫
- `RPG-CLI-Skills-Design.md`: Skills 設計
- `RPG-CLI-Agents-Design.md`: Agents 設計
