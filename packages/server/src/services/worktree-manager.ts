import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { WorktreeInfo } from '@code-quest/shared';
import { createGit, rawGit } from '../socket/utils/git.ts';

const MAX_NAME_LENGTH = 100;
const VALID_NAME_RE = /^[a-zA-Z0-9._-]+$/;
const PATH_TRAVERSAL_RE = /\.\./;
const WORKTREE_PATH_RE = /[/\\]\.claude[/\\]worktrees[/\\]([^/\\]+)$/;

export function validateWorktreeName(name: string): void {
  if (!name) {
    throw new Error('Invalid worktree name: name is required');
  }
  if (!VALID_NAME_RE.test(name)) {
    throw new Error('Invalid worktree name: only letters, numbers, dots, hyphens, and underscores');
  }
  if (name.length > MAX_NAME_LENGTH) {
    throw new Error(
      `Invalid worktree name: must be ${MAX_NAME_LENGTH} characters or fewer (got ${name.length})`,
    );
  }
  if (PATH_TRAVERSAL_RE.test(name)) {
    throw new Error('Invalid worktree name: must not contain ".." path segments');
  }
  if (name.endsWith('.') || name.endsWith('.lock')) {
    throw new Error('Invalid worktree name: must not end with "." or ".lock"');
  }
}

function generateWorktreeName(): string {
  return `claude-session-${new Date()
    .toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, 14)}`;
}

export async function getRepoRoot(cwd: string): Promise<string | null> {
  try {
    return (await createGit(cwd).revparse(['--show-toplevel'])).trim();
  } catch {
    return null;
  }
}

export async function getDefaultBranch(repoRoot: string): Promise<string> {
  const git = createGit(repoRoot);
  const result = await rawGit(git, ['symbolic-ref', 'refs/remotes/origin/HEAD']);
  if (result.exitCode === 0) {
    return result.stdout.trim().replace('refs/remotes/origin/', '');
  }
  for (const name of ['main', 'master']) {
    const check = await rawGit(git, [
      'rev-parse',
      '--verify',
      '--quiet',
      `refs/remotes/origin/${name}`,
    ]);
    if (check.exitCode === 0) return name;
  }
  return 'main';
}

export async function createWorktree(repoRoot: string, name?: string): Promise<WorktreeInfo> {
  const worktreeName = name || generateWorktreeName();
  validateWorktreeName(worktreeName);

  const worktreePath = join(repoRoot, '.claude', 'worktrees', worktreeName);
  const branchName = `worktree-${worktreeName}`;

  // Check if already a valid worktree
  const check = await rawGit(createGit(worktreePath), ['rev-parse', '--show-toplevel']);
  if (check.exitCode === 0 && resolve(check.stdout.trim()) === resolve(worktreePath)) {
    return { name: worktreeName, path: worktreePath, branch: branchName };
  }

  await mkdir(join(repoRoot, '.claude', 'worktrees'), { recursive: true });

  const git = createGit(repoRoot);
  const defaultBranch = await getDefaultBranch(repoRoot);
  const fetchResult = await rawGit(git, ['fetch', 'origin', defaultBranch]);
  const base = fetchResult.exitCode === 0 ? `origin/${defaultBranch}` : 'HEAD';

  await rawGit(git, ['worktree', 'prune']);
  await rawGit(git, ['branch', '-D', branchName]);

  const result = await rawGit(git, ['worktree', 'add', '-b', branchName, worktreePath, base]);
  if (result.exitCode !== 0) {
    throw new Error(result.stdout.trim() || 'git worktree add failed');
  }

  return { name: worktreeName, path: worktreePath, branch: branchName };
}

export async function listWorktrees(repoRoot: string): Promise<WorktreeInfo[]> {
  const result = await rawGit(createGit(repoRoot), ['worktree', 'list', '--porcelain']);
  if (result.exitCode !== 0) return [];

  const worktrees: WorktreeInfo[] = [];
  let current: Partial<WorktreeInfo & { worktreePath: string }> = {};

  for (const line of result.stdout.split('\n')) {
    if (line.startsWith('worktree ')) {
      current.worktreePath = line.slice('worktree '.length);
    } else if (line.startsWith('branch ')) {
      current.branch = line.slice('branch '.length).replace('refs/heads/', '');
    } else if (line === '') {
      if (current.worktreePath) {
        const match = WORKTREE_PATH_RE.exec(current.worktreePath);
        if (match) {
          worktrees.push({
            name: match[1],
            path: current.worktreePath,
            branch: current.branch,
          });
        }
      }
      current = {};
    }
  }

  return worktrees;
}

export async function deleteWorktree(repoRoot: string, name: string): Promise<void> {
  validateWorktreeName(name);
  const worktreePath = join(repoRoot, '.claude', 'worktrees', name);
  const branchName = `worktree-${name}`;
  const git = createGit(repoRoot);

  await rawGit(git, ['worktree', 'remove', worktreePath]);
  await rawGit(git, ['branch', '-D', branchName]);
}

export function detectWorktree(path: string): WorktreeInfo | null {
  const match = WORKTREE_PATH_RE.exec(path);
  if (!match) return null;
  return { name: match[1], path };
}
