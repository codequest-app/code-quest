import type { WorktreeInfo } from '@code-quest/shared';

/** Search all fetched project listings for a worktree whose path matches
 *  `cwd`. Returns `{ worktree, projectCwd }` so callers can derive a
 *  `projectName/branch` scope tag. Null when not fetched / non-git. */
export function findWorktreeByCwd(
  listing: Record<string, WorktreeInfo[] | 'not_a_repo'>,
  cwd: string | undefined,
): { worktree: WorktreeInfo; projectCwd: string } | null {
  if (!cwd) return null;
  for (const [projectCwd, entry] of Object.entries(listing)) {
    if (!Array.isArray(entry)) continue;
    const match = entry.find((w) => w.path === cwd);
    if (match) return { worktree: match, projectCwd };
  }
  return null;
}
