# Design — worktree-tree-ui

## 心智模型

**永遠在 folder 上操作。git 把「同一個 project 可以有多個 folder」這件事變可能。**

| | 無 git | 有 git |
|---|---|---|
| Project 列 | 直接是工作面 | 容器（chevron 展開） |
| 點 project 列 | 開 chat 在這 folder | 展開 worktree 列表 |
| Worktree 列 | 不存在 | 每列 = 一個 folder = 一個 branch |
| 點 worktree 列 | — | 開 chat 在這 worktree folder |
| `+ New worktree` | 不顯示 | 跑 `git worktree add` |
| `+ Initialize as git repo` | 顯示 | 不顯示 |

Branch 名只是 worktree folder 的**人類可讀 label**，底層 cwd 還是 folder path。
切 branch（在同一個 worktree 裡 `git checkout`）= git 階段功能，**這個 change 不做**。

## Init repo 的選擇

`git init` 後 HEAD 指向 main 但 ref 不存在（要第一個 commit 才生），
此時 `git worktree add` 會失敗 — 使用者卡住。

選 **`git init` + `git commit --allow-empty -m "Initial commit"`**：
一鍵就緒，副作用可接受（empty commit 是 git 慣用法），undo 直接刪 `.git/`。

## 抓取策略

Lazy on expand + cache（不過期）。`create / delete / initRepo` 主動 invalidate
對應 cwd 的 cache。Active project 的展開觸發走同一條 fetch，不需特殊路徑。

## Active 判定

`activeTab.cwd === worktree.path` 時亮起。**不做 pin override**（避免雙真相）。
project-level active 維持原本 `activeProjectCwd`，跟 tab 解耦。

## Server broadcast 對稱

| 行為 | 廣播 |
|---|---|
| `worktree:create` 成功 | `worktree:added { projectCwd, worktree }` |
| `worktree:delete` 成功 | `worktree:removed { projectCwd, name }` |
| `worktree:initRepo` 成功 | `worktree:added { projectCwd, worktree: main }` |

跟 `projects:added / removed` 對稱，多 tab 即時同步。

## 不進 DB

純 git source-of-truth。Worktree 沒有 `pinned` / `lastOpenedAt` / custom alias —
這些都靠 git 本身的 metadata（branch name, mtime）就夠用。等使用者真的抱怨
排序 / 命名再加 cache 表。

## 砍掉的功能

- **Rename worktree**：git 沒原生 rename（要 `git worktree move` + branch rename），
  且我們沒 DB 存 alias，先砍
- **Pin scope**：上面講過，避免雙真相
- **Archive**：mockup 寫了但語意不清

## TDD 順序：real GitService 先，fake 後

`GitService` 介面已存在（`packages/summoner/src/git/types.ts`），`LocalGitService`
與 `FakeGitService` 都已實作 `createWorktree / listWorktrees / deleteWorktree`。
這個 change 只需新增 `initRepo` + 釘死 `listWorktrees` 對非 git path 的行為。

**順序：先在 `LocalGitService` 用 tmpdir 真 git 跑出契約，再讓 `FakeGitService`
鏡像。** 否則 fake 滿足的 spec 可能 real 根本做不到，client 接上 real 才爆。

### Contract test 模式

抽一組 contract function，real / fake 各跑一遍：

```ts
// packages/summoner/src/git/__tests__/git-service.contract.ts
export function gitServiceContract(
  name: string,
  setup: () => Promise<{ git: GitService; cwd: string }>,
) {
  describe(`${name} — GitService contract`, () => {
    describe('initRepo', () => {
      it('non-git → returns { branch: "main" } + creates .git + has 1 commit');
      it('already a repo → throws AlreadyRepoError');
    });
    describe('listWorktrees', () => {
      it('non-git path → throws NotARepoError');
      it('git repo → returns array including main');
    });
  });
}
```

Real 跑證明 spec 在真環境成立；fake 跑同一組證明替身契約一致。任一邊壞立刻知道。

### 例外型別

新增到 `packages/summoner/src/git/errors.ts`（或 types.ts）：
- `class NotARepoError extends Error`
- `class AlreadyRepoError extends Error`

Server handler catch 後對應到 wire-level error code（`'not_a_repo'` / `'already_a_repo'`）。

## ProjectTree vs ProjectList

`ProjectList` 已被多處引用（Storybook、tests）。新增 `ProjectTree` 並存，
sidebar 切換用哪個。等 ProjectTree 穩定後再考慮取代 ProjectList。
