import type { GitService } from '@code-quest/summoner';

/**
 * Resolve a session's projectRoot from its cwd.
 *
 * Returns the git common-dir parent (for worktree-aware grouping) when
 * cwd is inside a repo, otherwise falls back to `cwd` itself so the
 * caller always gets a non-null string (matches the required schema).
 */
export async function resolveProjectRoot(gitService: GitService, cwd: string): Promise<string> {
  const root = await gitService.getProjectRoot(cwd).catch(() => null);
  return root ?? cwd;
}
