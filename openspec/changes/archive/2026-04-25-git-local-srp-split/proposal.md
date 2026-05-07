## Why

`apps/summoner/src/git/local.ts` is ~440 lines and bundles two concerns: plain git commands (status / log / diff / add / commit / push / pull / fetch / initRepo / repo-root resolution) and `git worktree` operations (list / create / remove / rename / archive plus `.claude/worktrees/<slug>` path conventions and slug helpers). The file is difficult to navigate, and worktree path conventions are tangled with command plumbing.

We considered extracting worktree as a peer domain (`LocalWorktreeService` implementing a new `IWorktreeService`) and rejected it: `git worktree` is a `git` subcommand, not a separate domain. Splitting the public interface would manufacture concepts, force every consumer to inject two services where one suffices, and require renaming existing socket events. The cost falls on every call site to buy nothing.

Instead, decompose physically inside `git/` while keeping `IGitService` and `LocalGitService` as the unchanged public surface. Consumers, DI, and socket events are zero-touch.

## What Changes

- Split `apps/summoner/src/git/local.ts` into four files under the same directory, matching the existing class-style service pattern:
  - `local.ts` — `LocalGitService implements IGitService`, a thin facade composing the two helper classes; methods delegate via arrow methods (`status = (cwd) => this.commands.status(cwd)`).
  - `commands.ts` — `GitCommands` class; methods: `status`, `checkout`, `log`, `diff`, `add`, `commit`, `push`, `fetch`, `pull`, `discardFile`, `getRepoRoot`, `getProjectRoot`, `initRepo`, `listBranches`.
  - `worktree.ts` — `GitWorktreeOps` class (constructor takes `GitCommands` for `getRepoRoot`); methods: `createWorktree`, `listWorktrees`, `deleteWorktree`, `renameWorktree`, `archiveWorktree`; plus path conventions (`.claude/worktrees/<slug>`), `branchToSlug`, `generateWorktreeName`. Re-exports `validateWorktreeName` + `detectWorktree` (consumed via `summoner/src/index.ts`).
  - `git-runner.ts` — shared `createGit` + `rawGit` helpers (zero-state utility module, no class).
- The arrow-method delegation boilerplate in `LocalGitService` is acknowledged as a one-time cost paid in exchange for keeping `IGitService` unchanged.

**Skipped from the original plan**: `error-codes.ts` extraction. After reading the actual code, the typed-error patterns are operation-specific one-liners (push has 2, pull has 2, archive has 1) with no shared dictionary. Extracting to a separate module would put one-line regex one indirection away with no readability gain — same anti-pattern as the rejected `defineGitHandler` wrapper.

Explicitly out of scope:
- No `LocalWorktreeService` peer service.
- No `IWorktreeService` interface split; `IGitService` stays exactly as-is.
- No socket event renames; the `archive` event continues to route through worktree-ops internally.
- No DI changes in `apps/server/src/container.ts`.
- No client changes.

## Capabilities

- **summoner-git-architecture**: `LocalGitService` is a thin facade composing `GitCommands` and `GitWorktreeOps` (sharing `git-runner.ts` helpers); `IGitService` and the public service surface are unchanged.
