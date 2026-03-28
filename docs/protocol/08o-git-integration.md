### 7.18 Git 操作流程

**方向**：WebView → Extension → Git CLI

**用途**：提供 branch checkout、狀態檢查、skipped branch 追蹤等 git 操作。

---

#### 7.18.1 Branch Checkout（checkout_branch）

**位置**：第 50356、50757–50821 行

```
WebView ──(checkout_branch { branch })──→ Extension
  ↓
嘗試策略（依序嘗試，直到成功）：
  ↓
1. git checkout <branch>
   成功 → 完成
   失敗 ↓
2. git fetch origin <branch>
   然後 git checkout <branch>
   成功 → 完成
   失敗 ↓
3. git checkout -b <branch> origin/<branch>
   （建立追蹤遠端的本地分支）
   成功 → 完成
   失敗 ↓
4. git checkout --track origin/<branch>
   成功 → 完成
   失敗 → 回傳錯誤
  ↓
成功後：git branch --set-upstream-to=origin/<branch>
  ↓
回傳 { type: "checkout_branch_response", success, error? }
```

---

#### 7.18.2 Git Status 檢查（check_git_status）

**位置**：第 50358、50823–50848 行

```
WebView ──(check_git_status)──→ Extension
  ↓
執行 git status --porcelain -uno
  ↓
解析輸出：每行前兩個字元為狀態碼，之後為檔案路徑
  ↓
回傳：
{
  type: "check_git_status_response",
  isClean: true | false,
  changedFiles: [
    { status: "M ", file: "src/app.ts" },
    { status: " M", file: "README.md" }
  ]
}
```

`-uno` flag 排除未追蹤的檔案。

---

#### 7.18.3 更新 Skipped Branch（update_skipped_branch）

**位置**：第 50360、50850–50861 行

```
WebView ──(update_skipped_branch { sessionId, branch, failed })──→ Extension
  ↓
呼叫 sessionStorage.appendSkippedBranch(sessionId, branch, failed)
  ↓
在 session JSONL 中追加：
{
  "type": "teleport-skipped-branch",
  "branch": "feature-branch",
  "failed": true
}
  ↓
更新記憶體 Map：
  skippedBranches.set(sessionId, branch)
  若 failed → branchCheckoutFailures.set(sessionId, true)
  ↓
回傳 { type: "update_skipped_branch_response" }
```

此功能與 Session Teleportation（§7.12）配合使用：teleport 後若 branch checkout 失敗，記錄跳過的分支。

---

#### 7.18.4 通用命令執行（exec）

**位置**：第 50373–50374 行

```
WebView ──(exec { command, args })──→ Extension
  ↓
execCommand(command, args)（第 50374 行附近）：
  child_process.spawn(command, args, { cwd: this.cwd })
  ↓
回傳：
{
  type: "exec_response",
  exitCode: 0,
  stdout: "命令輸出",
  stderr: "錯誤輸出"
}
```

> 此為通用命令執行介面，不限於 git 命令。
