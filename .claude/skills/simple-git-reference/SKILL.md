# simple-git Reference

## Instance

```ts
import simpleGit, { SimpleGit } from 'simple-git';

// Per-repo instance (lightweight, has internal task queue)
const git: SimpleGit = simpleGit({ baseDir: cwd, trimmed: true });
```

- 一個 instance per repo cwd（不需要 singleton）
- `maxConcurrentProcesses` 預設 5，多 instance 同 repo 可能 lock contention

## API

```ts
// status
const s = await git.status();
// s.current — branch name | null (detached)
// s.isClean() — boolean
// s.files — Array<{ path, index, working_dir }>  (status codes: M, A, D, ?, !)

// log
const l = await git.log({ maxCount: 20 });
// l.all — Array<{ hash, date, message, author_name, author_email }>
// ⚠️ 沒有 maxCount 會撈全部 history

// diff
const d = await git.diff();              // unstaged changes (string)
const d2 = await git.diff(['--cached']); // staged
// diff() 回傳 string，要結構化用 diffSummary()

// checkout
await git.checkout('branch');
// fetch + checkout fallback:
await git.fetch('origin', branch).then(() => git.checkout(branch));

// revparse
const root = await git.revparse(['--show-toplevel']);

// raw — 任何沒有專用 method 的操作
await git.raw(['worktree', 'add', '-b', branch, path, base]);
await git.raw(['worktree', 'list', '--porcelain']);
await git.raw(['worktree', 'remove', path]);
await git.raw(['symbolic-ref', 'refs/remotes/origin/HEAD']);
```

## Error Handling

```ts
import { GitError } from 'simple-git';

try {
  await git.checkout('nonexistent');
} catch (e) {
  if (e instanceof GitError) {
    // e.message — stderr text
  }
}
```

- 大多數失敗丟 `GitError`
- `GitResponseError` 只在 git exit 0 但 parsed response 有問題時出現（如 merge conflict）

## TypeScript Types

Package 自帶 types：`SimpleGit`, `StatusResult`, `LogResult`, `DefaultLogFields`, `GitError`, `SimpleGitOptions`

## Testing

```ts
// 用 DI：wrap simple-git 在 thin service，注入 mock
// 或 vi.mock:
import simpleGit from 'simple-git';
vi.mock('simple-git');

const mockGit = {
  status: vi.fn().mockResolvedValue({ current: 'main', isClean: () => true, files: [] }),
  log: vi.fn().mockResolvedValue({ all: [], latest: null }),
  diff: vi.fn().mockResolvedValue(''),
  raw: vi.fn().mockResolvedValue(''),
};
vi.mocked(simpleGit).mockReturnValue(mockGit as any);
```

## status() 回傳 → 我們的格式轉換

```ts
// simple-git StatusResult.files[].index / working_dir 是單字元 status code
// 我們需要: { status: string, file: string }
// 轉換: files.map(f => ({ status: `${f.index}${f.working_dir}`.trim(), file: f.path }))
```

## log() 回傳 → 我們的格式轉換

```ts
// simple-git: { hash, date, message, author_name }
// 我們需要: { hash, message, author, date }
// 轉換: all.map(e => ({ hash: e.hash, message: e.message, author: e.author_name, date: e.date }))
```
