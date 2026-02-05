# Claude Code 官方指南總結

**來源**: Claude Code 官方文檔 (https://code.claude.com/docs)
**更新日期**: 2026-02-05

---

## Skills (技能系統)

### 定義

Skills 是擴展 Claude 能力的模組化指令檔案。每個 skill 包含：
- **YAML frontmatter**: 配置 skill 行為
- **Markdown 內容**: Claude 執行 skill 時遵循的指令

### 存放位置

| 位置 | 路徑 | 適用範圍 |
|------|------|----------|
| Personal | `~/.claude/skills/<skill-name>/SKILL.md` | 你的所有專案 |
| Project | `.claude/skills/<skill-name>/SKILL.md` | 僅此專案 |
| Plugin | `<plugin>/skills/<skill-name>/SKILL.md` | Plugin 啟用處 |

**優先級**: enterprise > personal > project

**重要**: Skills **不需要**屬於 plugin！可以獨立存在。

### Skill 目錄結構

```
my-skill/
├── SKILL.md           # 主要指令（必須）
├── template.md        # 可選：範本
├── examples/
│   └── sample.md      # 可選：範例
└── scripts/
    └── helper.sh      # 可選：腳本
```

### SKILL.md 格式

```yaml
---
name: explain-code
description: Explains code with visual diagrams and analogies. Use when explaining how code works, teaching about a codebase, or when the user asks "how does this work?"
---

When explaining code, always include:

1. **Start with an analogy**: Compare the code to something from everyday life
2. **Draw a diagram**: Use ASCII art to show the flow, structure, or relationships
3. **Walk through the code**: Explain step-by-step what happens
```

### Frontmatter 欄位

| 欄位 | 必要 | 說明 |
|------|------|------|
| `name` | No | Skill 名稱（預設用目錄名）。只能用小寫字母、數字、連字號，最多 64 字元 |
| `description` | Recommended | 說明 skill 做什麼、何時使用。Claude 用此判斷何時調用 |
| `argument-hint` | No | 自動完成時顯示的提示，如 `[issue-number]` |
| `disable-model-invocation` | No | 設為 `true` 禁止 Claude 自動調用，只能用 `/name` 手動調用。預設 `false` |
| `user-invocable` | No | 設為 `false` 從 `/` 選單隱藏。預設 `true` |
| `allowed-tools` | No | Skill 啟用時 Claude 可用的工具 |
| `model` | No | 使用的模型 |
| `context` | No | 設為 `fork` 在 subagent 中執行 |
| `agent` | No | 當 `context: fork` 時使用哪個 subagent 類型 |
| `hooks` | No | Skill 生命週期的 hooks |

**重要**:
- **沒有** `skill_id` 或 `version` 欄位
- **沒有** `tools` 欄位（只有 `allowed-tools`）

### Skill 類型

**Reference content** (參考內容):
- 添加 Claude 應用於當前工作的知識
- 慣例、模式、風格指南、領域知識
- inline 執行，與對話上下文並行

**Task content** (任務內容):
- 給 Claude 特定操作的逐步指令
- 部署、提交、代碼生成
- 通常設 `disable-model-invocation: true` 只手動調用

### 調用方式

1. **斜線命令**: `/skill-name [arguments]`
2. **Claude 自動調用**: 當 description 符合時
3. **Skill tool**: `Skill(skill-name)` (可能有權限限制)

### 字串替換

| 變數 | 說明 |
|------|------|
| `$ARGUMENTS` | 所有傳入的參數 |
| `$ARGUMENTS[N]` | 第 N 個參數（0-based） |
| `$N` | `$ARGUMENTS[N]` 的簡寫 |
| `${CLAUDE_SESSION_ID}` | 當前 session ID |

### 動態內容注入

使用 `` !`command` `` 語法在 skill 執行前運行 shell 命令：

```yaml
---
name: pr-summary
description: Summarize changes in a pull request
---

## Pull request context
- PR diff: !`gh pr diff`
- PR comments: !`gh pr view --comments`
```

### 在 Subagent 中執行

設定 `context: fork` 讓 skill 在隔離的 subagent 中執行：

```yaml
---
name: deep-research
description: Research a topic thoroughly
context: fork
agent: Explore
---

Research $ARGUMENTS thoroughly...
```

---

## Subagents (子代理系統)

### 定義

Subagents 是專門化的 AI 助手，處理特定類型的任務。每個 subagent：
- 在**獨立的 context window** 中運行
- 擁有**自定義 system prompt**
- 具有**特定工具訪問權限**
- 擁有**獨立權限**

### 內建 Subagents

| Subagent | 模型 | 工具 | 用途 |
|----------|------|------|------|
| **Explore** | Haiku | 只讀工具 | 快速代碼搜尋、代碼庫探索 |
| **Plan** | Inherit | 只讀工具 | Plan mode 的代碼庫研究 |
| **general-purpose** | Inherit | 所有工具 | 複雜、多步驟任務 |
| Bash | Inherit | - | 在獨立上下文執行命令 |
| statusline-setup | Sonnet | - | 配置 status line |
| Claude Code Guide | Haiku | - | 回答 Claude Code 問題 |

### 存放位置

| 位置 | 路徑 | 優先級 |
|------|------|--------|
| CLI flag | `--agents` JSON | 1 (最高) |
| Project | `.claude/agents/<name>.md` | 2 |
| User | `~/.claude/agents/<name>.md` | 3 |
| Plugin | `<plugin>/agents/<name>.md` | 4 (最低) |

### Subagent 文件格式

```markdown
---
name: code-reviewer
description: Reviews code for quality and best practices
tools: Read, Glob, Grep
model: sonnet
---

You are a code reviewer. When invoked, analyze the code and provide
specific, actionable feedback on quality, security, and best practices.
```

### Frontmatter 欄位

| 欄位 | 必要 | 說明 |
|------|------|------|
| `name` | Yes | 唯一識別符（小寫字母和連字號） |
| `description` | Yes | Claude 何時委派給此 subagent |
| `tools` | No | Subagent 可用的工具。省略時繼承所有工具 |
| `disallowedTools` | No | 拒絕的工具 |
| `model` | No | `sonnet`, `opus`, `haiku`, 或 `inherit`。預設 `inherit` |
| `permissionMode` | No | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` |
| `skills` | No | 啟動時載入到 subagent 上下文的 skills（完整內容） |
| `hooks` | No | Subagent 生命週期的 hooks |
| `memory` | No | 持久記憶範圍：`user`, `project`, `local` |

### 創建 Subagent

**互動式創建**:
```bash
/agents
# 選擇 "Create new agent"
```

**手動創建**:
```bash
# User-level
mkdir -p ~/.claude/agents
vim ~/.claude/agents/my-agent.md

# Project-level
mkdir -p .claude/agents
vim .claude/agents/my-agent.md
```

**CLI 創建**:
```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer",
    "prompt": "You are a senior code reviewer...",
    "tools": ["Read", "Grep"],
    "model": "sonnet"
  }
}'
```

### Permission Modes

| Mode | 行為 |
|------|------|
| `default` | 標準權限檢查 |
| `acceptEdits` | 自動接受文件編輯 |
| `dontAsk` | 自動拒絕權限提示 |
| `bypassPermissions` | 跳過所有權限檢查 |
| `plan` | Plan mode（只讀探索） |

### Preload Skills

使用 `skills` 欄位將 skill 內容注入 subagent 啟動時的上下文：

```yaml
---
name: api-developer
description: Implement API endpoints following team conventions
skills:
  - api-conventions
  - error-handling-patterns
---

Implement API endpoints. Follow the conventions and patterns from the preloaded skills.
```

**注意**:
- 完整 skill 內容被注入，不只是可調用
- Subagents **不繼承**父對話的 skills
- 這是 `context: fork` 的反向操作

### Persistent Memory

啟用 `memory` 讓 subagent 跨對話累積知識：

```yaml
---
name: code-reviewer
description: Reviews code for quality and best practices
memory: user
---

You are a code reviewer. As you review code, update your agent memory with
patterns, conventions, and recurring issues you discover.
```

| Scope | 位置 | 使用時機 |
|-------|------|----------|
| `user` | `~/.claude/agent-memory/<name>/` | 跨所有專案記住學習內容 |
| `project` | `.claude/agent-memory/<name>/` | 專案特定知識，可版本控制 |
| `local` | `.claude/agent-memory-local/<name>/` | 專案特定但不提交版控 |

記憶啟用時：
- System prompt 包含讀寫記憶目錄的指令
- 前 200 行 `MEMORY.md` 被注入
- 自動啟用 Read, Write, Edit 工具

### 前台 vs 背景執行

**前台 Subagents**:
- 阻塞主對話直到完成
- 權限提示和問題會傳遞給用戶

**背景 Subagents**:
- 併發執行，可繼續工作
- 啟動前詢問所需權限
- 無法使用 MCP 工具
- 如需詢問問題會失敗但繼續執行

### Resume Subagents

每次調用創建新實例。要繼續之前的工作：

```
Use the code-reviewer subagent to review the authentication module
[Agent completes]

Continue that code review and now analyze the authorization logic
[Claude resumes the subagent with full context]
```

Subagent transcripts 保存在：
`~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl`

### 使用時機

**使用 Subagent** 當：
- 任務產生大量不需要的輸出
- 想要強制特定工具限制
- 工作是獨立的，可返回摘要
- 需要並行執行

**使用主對話** 當：
- 需要頻繁來回
- 多個階段共享大量上下文
- 快速、有針對性的更改
- 延遲很重要

**使用 Skills** 當：
- 想要可重用的提示
- 在主對話上下文中執行

---

## Skills vs Subagents 對比

| 特性 | Skills | Subagents |
|------|--------|-----------|
| **定位** | 操作手冊（Playbooks） | 獨立助手 |
| **Context** | 與主對話共享 | 獨立 context window |
| **執行方式** | Inline 或 fork | 獨立執行 |
| **用途** | 標準化操作流程 | 專門化任務處理 |
| **調用** | `/skill-name` 或自動 | 委派或明確請求 |
| **並行** | 否（除非 fork） | 是 |
| **繼承** | 無（subagent 需明確 preload） | Skills 可被 preload |
| **工具限制** | `allowed-tools` | `tools` 或 `disallowedTools` |
| **持久記憶** | 否 | 是（`memory` 欄位） |

## Skills + Subagents 組合使用

### 1. Skill 在 Subagent 中執行

```yaml
# SKILL.md
---
name: deep-research
context: fork
agent: Explore
---
Research task...
```

### 2. Subagent Preload Skills

```yaml
# agent.md
---
name: api-developer
skills:
  - api-conventions
---
Implement APIs...
```

### 3. 兩者配合架構

```
Main Conversation
  ↓
  ├─ Skill: code-generator (inline)
  │
  ├─ Subagent: code-reviewer (fork)
  │   └─ Preloaded: security-scan skill
  │
  └─ Skill: deploy (fork in Bash agent)
```

---

## 關鍵差異：我之前的錯誤

### ❌ 錯誤理解

1. **Skills 必須在 Plugin 中**: 錯！可以獨立存在
2. **Frontmatter 有 `skill_id`**: 錯！只有 `name`
3. **Frontmatter 有 `version`**: 錯！沒有版本欄位
4. **Frontmatter 有 `tools`**: 錯！是 `allowed-tools`
5. **Skills 需要在 settings.json 註冊**: 錯！自動發現
6. **需要重啟 Claude Code**: 錯！立即生效

### ✅ 正確理解

1. **Skills 可獨立存在**: `~/.claude/skills/` 或 `.claude/skills/`
2. **Frontmatter 簡潔**: 只需 `name` 和 `description`
3. **自動發現**: 不需註冊、不需重啟
4. **調用方式**: `/skill-name` 或 Claude 自動
5. **可在 Subagent 執行**: 設 `context: fork`
6. **Subagents 可 preload skills**: 用 `skills` 欄位

---

## 實用模式

### Pattern 1: 階段式開發

```
1. Skill: code-generator → 生成代碼
2. Subagent: code-reviewer → 審查代碼
3. Skill: commit → 提交代碼
```

### Pattern 2: 並行研究

```
啟動多個 Explore subagents 同時研究不同模組
```

### Pattern 3: 隔離高容量操作

```
Subagent 執行測試，只返回摘要給主對話
```

### Pattern 4: 知識累積

```
Subagent with memory: user
跨專案學習和累積最佳實踐
```

---

## 參考資源

**官方文檔**:
- [Skills](https://code.claude.com/docs/en/skills)
- [Subagents](https://code.claude.com/docs/en/sub-agents)
- [Plugins](https://code.claude.com/docs/en/plugins)
- [Hooks](https://code.claude.com/docs/en/hooks)

**相關工具**:
- [Agent Skills Open Standard](https://agentskills.io)
- [MCP (Model Context Protocol)](https://code.claude.com/docs/en/mcp)
