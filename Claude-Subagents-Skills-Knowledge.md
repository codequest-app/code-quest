# Claude Subagents & Skills 知識庫

**文檔創建日期**: 2026-02-05
**版本**: v1.0
**來源**: Anthropic 官方文檔與最新研究

---

## 目錄

1. [Subagents 子代理系統](#subagents-子代理系統)
2. [Skills 技能系統](#skills-技能系統)
3. [Multi-Agent 多代理架構](#multi-agent-多代理架構)
4. [Skills vs MCP](#skills-vs-mcp)
5. [實作指南](#實作指南)

---

## Subagents 子代理系統

### 核心概念

**定義**: Subagents 是專門化的 AI 助手，用於處理特定類型的任務。

**關鍵特性**:
- 每個 subagent 在**獨立的 context window** 中運行
- 擁有**自定義 system prompt**
- 具有**特定的工具訪問權限**
- 擁有**獨立的權限控制**

### 工作原理

```
當 Claude 遇到符合 subagent 描述的任務時:
  ↓
委派給該 subagent
  ↓
Subagent 獨立工作
  ↓
返回結果給主 agent
```

### 主要優勢

1. **保持上下文清晰**
   - 將探索和實作保持在主對話之外
   - 避免污染主 context

2. **強制約束**
   - 限制 subagent 可以使用的工具
   - 提供安全邊界

3. **成本控制**
   - 將任務路由到更快、更便宜的模型（如 Haiku）
   - 優化 token 使用

4. **並行執行**
   - 多個 subagent 可以同時運行
   - 大幅加快複雜工作流程

**範例**: 代碼審查時，可以同時運行:
- `style-checker` subagent
- `security-scanner` subagent
- `test-coverage` subagent

### 創建 Subagent

#### 基本結構

Subagent 定義包含兩部分：
1. **Frontmatter**（元數據和配置）
2. **Body**（system prompt）

```yaml
---
name: code-reviewer
description: Reviews code for quality, security, and best practices
tools:
  - read
  - grep
model: claude-sonnet-4-5
---

You are a strict code reviewer specializing in:
- Code quality and readability
- Security vulnerabilities
- Performance issues
- Best practices

When reviewing code, provide:
- Clear severity ratings (Critical/High/Medium/Low)
- Specific improvement suggestions with code examples
- Explanation of impact and risks
```

#### 必要欄位

**name** (必須):
- Subagent 的唯一識別名稱

**description** (必須):
- 描述 subagent 的用途和專長
- Claude 使用此描述判斷何時委派任務

**tools** (可選):
- 限制 subagent 可以使用的工具
- 預設: 繼承主 agent 的工具權限

**model** (可選):
- 指定使用的模型（如 `claude-haiku-4` 節省成本）
- 預設: 與主 agent 相同

### SDK 整合

```javascript
// 定義 subagent
const codeReviewer = {
  name: 'code-reviewer',
  description: 'Reviews code for quality and security',
  systemPrompt: `You are a code reviewer...`,
  tools: ['read', 'grep'],
  model: 'claude-sonnet-4'
}

// 調用 subagent
const result = await agent.delegateToSubagent(
  codeReviewer,
  'Review this authentication module for security issues'
)
```

### 並行執行

```javascript
// 同時運行多個 subagents
const [styleResult, securityResult, testResult] = await Promise.all([
  agent.delegateToSubagent(styleChecker, code),
  agent.delegateToSubagent(securityScanner, code),
  agent.delegateToSubagent(testCoverage, code)
])
```

---

## Skills 技能系統

### 核心概念

**定義**: Agent Skills 是模組化的能力，用於擴展 Claude 的功能。

**組成**:
- **Instructions**（指令）
- **Metadata**（元數據）
- **Optional Resources**（可選資源：腳本、模板等）

### 工作原理

```
當任務相關時:
  ↓
Claude 自動使用 Skill
  ↓
執行 Skill 中的 instructions
  ↓
使用提供的 resources
  ↓
返回結果
```

### API 整合

Skills 通過 **Messages API** 的 **code execution tool** 整合：

```javascript
{
  model: "claude-3-7-sonnet-20250219",
  tools: [
    {
      type: "code_execution_2024",
      // Skills 在 container 參數中指定
      container: {
        skills: [
          {
            type: "builtin",
            skill_id: "pptx",
            version: "1.0"
          },
          {
            type: "custom",
            skill_id: "custom_skill_123",
            version: "2.1"
          }
        ]
      }
    }
  ],
  messages: [...]
}
```

### 預置 Skills

Anthropic 提供的預置 Skills：

1. **PowerPoint (pptx)**
   - 創建和編輯 PowerPoint 簡報

2. **Excel (xlsx)**
   - 創建和編輯 Excel 試算表

3. **Word (docx)**
   - 創建和編輯 Word 文檔

4. **PDF**
   - 創建和處理 PDF 文件

### 自定義 Skills

#### 結構

```
my-skill/
├── SKILL.md          # 主要定義文件
├── template.py       # 可選：腳本
├── example.json      # 可選：範例資料
└── resources/        # 可選：其他資源
```

#### SKILL.md 格式

```yaml
---
skill_id: my-custom-skill
version: 1.0
description: Brief description of what this skill does
---

# Skill Instructions

Detailed instructions on how to use this skill...

## Usage

When the user asks for X, you should:
1. Step one
2. Step two
3. Step three

## Examples

Example usage...
```

#### 創建流程

1. 創建資料夾和 SKILL.md
2. 在 Claude Console 上傳
3. 獲得 skill_id
4. 在 API 中引用

```bash
my-skill/
└── SKILL.md
```

```yaml
---
skill_id: code-formatter
version: 1.0
description: Formats code according to best practices
tools:
  - code_execution
---

You are a code formatter that:
- Applies consistent style
- Adds proper indentation
- Organizes imports
- Follows language-specific conventions

When formatting code:
1. Identify the programming language
2. Apply appropriate style guide
3. Preserve functionality
4. Provide before/after comparison
```

### Skills 管理

**Console 操作**:
- 創建新 Skill
- 查看 Skill 列表
- 升級 Skill 版本
- 刪除 Skill

**版本控制**:
- 每個 Skill 有版本號
- 可以指定使用特定版本
- 升級不影響使用舊版本的應用

---

## Multi-Agent 多代理架構

### Anthropic 的多代理研究

**研究發現**（2026）:

> Multi-agent 系統（Claude Opus 4 作為主 agent + Claude Sonnet 4 subagents）**勝過** 單一 Claude Opus 4 **90.2%**

**關鍵洞察**:
- Multi-agent 架構有效擴展了超出單一 agent 限制的任務的 token 使用
- 專門化 subagents 提升整體表現

### Claude Cowork

**發布日期**: 2026年1月12日

**定位**: 第一個真正的自主數字同事

**能力**:
- 獨立管理本地文件系統
- 編排複雜的專案工作流
- 執行多步驟任務，無需持續人工提示

### 隱藏的多代理系統

**發現**: Claude Code 的二進制中包含 `TeammateTool`

**狀態**: 完全實作但使用 feature flag 關閉

**意義**: Anthropic 正在開發完整的多 agent 協調系統

### 產業趨勢（2026）

**演進方向**:
```
Single-Agent Workflows
  ↓
Multi-Agent Coordination Systems
  ↓
Specialized Agents 並行工作
  ↓
獨立的 Context Windows
```

**新技能需求**:
- 任務分解（Task Decomposition）
- 協調協議（Coordination Protocols）

### 部署技術

**MCP** (Model Context Protocol):
- 提供 agents 訪問數據和工具的標準方式

**A2A** (Agent-to-Agent Protocol):
- Agents 之間通訊的協議

**範例架構**:
```
Claude on Vertex AI
  ├── MCP (訪問數據源)
  └── A2A (Agent 間通訊)
```

---

## Skills vs MCP

### 定位差異

**MCP (Model Context Protocol)**:
- **定位**: "Plumbing"（管道系統）
- **功能**: 給予 agents **訪問能力**
- **作用**: 連接數據和操作

**Skills**:
- **定位**: "Playbooks"（操作手冊）
- **功能**: 使 agent 輸出**可靠、可審計、安全**
- **作用**: 定義如何使用數據和操作

### 互補關係

```
Production-Grade Agentic Systems
  ↓
需要兩者配合:
  ├── MCP: 暴露數據和行動
  └── Skills: 定義如何使用它們
```

**範例**:
- **MCP**: 提供訪問客戶資料庫的能力
- **Skill**: 定義如何安全查詢、處理隱私、格式化輸出

### 使用場景

**只用 MCP**:
- Agent 有訪問能力
- 但行為不可預測
- 缺乏標準化輸出

**只用 Skills**:
- Agent 知道怎麼做
- 但沒有訪問數據的能力

**MCP + Skills**:
- Agent 既能訪問數據
- 又知道如何正確使用
- 輸出可靠且可審計

---

## 實作指南

### 何時使用 Subagent

✅ **適合場景**:
- 需要**專門化處理**的任務
- 需要**隔離 context** 的操作
- 可以**並行執行**的工作
- 需要**成本優化**（使用 Haiku）
- 需要**限制工具訪問**的場景

❌ **不適合場景**:
- 簡單、單一步驟的任務
- 需要完整 context 的操作
- 頻繁來回的對話

### 何時使用 Skills

✅ **適合場景**:
- **可重複使用**的操作模式
- 需要**標準化輸出**的任務
- 包含**資源文件**（模板、腳本）
- 需要**版本控制**的能力

❌ **不適合場景**:
- 一次性操作
- 高度動態的任務
- 不需要標準化的場景

### 組合使用

**最佳實踐**:

1. **定義 Skills** 來標準化操作
   ```yaml
   ---
   skill_id: api-integration
   ---
   When integrating an API:
   1. Validate credentials
   2. Test connection
   3. Handle errors
   ```

2. **創建 Subagents** 來專門化處理
   ```yaml
   ---
   name: api-tester
   description: Tests and validates API integrations
   ---
   You are an API testing specialist...
   ```

3. **Subagent 使用 Skills**
   - Subagent 在其 context 中可以訪問 Skills
   - 提供結構化的操作方式

---

## 參考資源

### 官方文檔

**Subagents**:
- [Create custom subagents - Claude Code Docs](https://code.claude.com/docs/en/sub-agents)
- [Subagents in the SDK - Claude API Docs](https://platform.claude.com/docs/en/agent-sdk/subagents)

**Skills**:
- [Agent Skills - Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [Extend Claude with skills - Claude Code Docs](https://code.claude.com/docs/en/skills)
- [GitHub - anthropics/skills](https://github.com/anthropics/skills)

**Multi-Agent**:
- [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Deploying multi-agent systems using MCP and A2A](https://www.anthropic.com/webinars/deploying-multi-agent-systems-using-mcp-and-a2a-with-claude-on-vertex-ai)

### 社群資源

- [GitHub - VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) - 100+ 專門化 subagents
- [10 Claude Code Sub-Agent Examples](https://blog.stackademic.com/10-claude-code-sub-agent-examples-with-templates-you-can-use-immediately-a1159437ee2a)
- [Claude Skills vs MCP: The 2026 Guide](https://www.cometapi.com/claude-skills-vs-mcp-the-2026-guide-to-agentic-architecture/)

### 深入學習

- [Claude Skills: A First Principles Deep Dive](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/)
- [Claude Code's Hidden Multi-Agent System](https://paddo.dev/blog/claude-code-hidden-swarm/)
- [Building Effective Agents - Anthropic Research](https://www.anthropic.com/research/building-effective-agents)

---

## 關鍵洞察總結

### Subagents 精髓

1. **Context 隔離**是核心優勢
2. **並行執行**大幅提升效率
3. **專門化** system prompt 提升品質
4. **成本控制**通過模型選擇

### Skills 精髓

1. **模組化**和**可重用性**
2. **標準化輸出**提供可預測性
3. **版本控制**支持迭代改進
4. **與 MCP 配合**形成完整系統

### Multi-Agent 精髓

1. **任務分解**是關鍵能力
2. **專門化 agents**優於單一通用 agent
3. **並行協作**突破 token 限制
4. **協調協議**（MCP, A2A）是基礎設施

---

**文檔版本**:
- v1.0 (2026-02-05): 基於 2026 年最新文檔和研究的知識庫
