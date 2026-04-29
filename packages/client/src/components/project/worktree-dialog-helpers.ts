import { basename } from '../../utils/basename';

/** Slugify a branch name into a filesystem-safe directory segment.
 *  `feature/my-thing` → `my-thing`, `bug/fix&stuff` → `fix-stuff`. */
export function branchToSlug(branch: string): string {
  return basename(branch)
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Default worktree folder path. Matches claude-code extension convention
 *  (`<repoRoot>/.claude/worktrees/<name>`). See
 *  /Users/user/Desktop/anthropic.claude-code-2.1.45/src/core/main.js:16319 */
export function autoDerivePath(projectCwd: string, branch: string): string {
  const slug = branchToSlug(branch) || 'worktree';
  return `${projectCwd}/.claude/worktrees/${slug}`;
}

/** Build a shell-quoted `git worktree add` command string for the dialog's
 *  command preview. Returns placeholders `<branch>` / `<path>` when inputs
 *  are empty so the preview stays sensible while the user is typing. */
export function buildWorktreeCommand(opts: {
  mode: 'existing' | 'new';
  branch: string;
  baseBranch?: string;
  path: string;
}): string {
  const { mode, branch, baseBranch, path } = opts;
  const b = branch || '<branch>';
  const p = path || '<path>';
  if (mode === 'existing') return `git worktree add ${p} ${b}`;
  const base = baseBranch || 'main';
  return `git worktree add -b ${b} ${p} ${base}`;
}
