import { execFile } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);

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

export interface WorktreeInfo {
  name: string;
  path: string;
  branch?: string;
}

async function git(args: string[], cwd: string): Promise<{ stdout: string; exitCode: number }> {
  try {
    const { stdout } = await exec('git', args, { cwd });
    return { stdout, exitCode: 0 };
  } catch (error: unknown) {
    const e = error as { stdout?: string; code?: number };
    return { stdout: e.stdout ?? '', exitCode: e.code ?? 1 };
  }
}

export async function getRepoRoot(cwd: string): Promise<string | null> {
  const result = await git(['rev-parse', '--show-toplevel'], cwd);
  return result.exitCode === 0 ? result.stdout.trim() : null;
}

export async function getDefaultBranch(repoRoot: string): Promise<string> {
  const result = await git(['symbolic-ref', 'refs/remotes/origin/HEAD'], repoRoot);
  if (result.exitCode === 0) {
    const ref = result.stdout.trim();
    return ref.replace('refs/remotes/origin/', '');
  }
  // Fallback: try common names
  for (const name of ['main', 'master']) {
    const check = await git(
      ['rev-parse', '--verify', '--quiet', `refs/remotes/origin/${name}`],
      repoRoot,
    );
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
  const check = await git(['rev-parse', '--show-toplevel'], worktreePath);
  if (check.exitCode === 0 && resolve(check.stdout.trim()) === resolve(worktreePath)) {
    return { name: worktreeName, path: worktreePath, branch: branchName };
  }

  // Create directory
  await mkdir(join(repoRoot, '.claude', 'worktrees'), { recursive: true });

  // Fetch and determine base
  const defaultBranch = await getDefaultBranch(repoRoot);
  const fetchResult = await git(['fetch', 'origin', defaultBranch], repoRoot);
  const base = fetchResult.exitCode === 0 ? `origin/${defaultBranch}` : 'HEAD';

  // Clean up
  await git(['worktree', 'prune'], repoRoot);
  await git(['branch', '-D', branchName], repoRoot);

  // Create worktree
  const result = await git(['worktree', 'add', '-b', branchName, worktreePath, base], repoRoot);
  if (result.exitCode !== 0) {
    throw new Error(result.stdout.trim() || 'git worktree add failed');
  }

  return { name: worktreeName, path: worktreePath, branch: branchName };
}

export async function listWorktrees(repoRoot: string): Promise<WorktreeInfo[]> {
  const result = await git(['worktree', 'list', '--porcelain'], repoRoot);
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

  await git(['worktree', 'remove', worktreePath], repoRoot);
  await git(['branch', '-D', branchName], repoRoot);
}

export function detectWorktree(path: string): WorktreeInfo | null {
  const match = WORKTREE_PATH_RE.exec(path);
  if (!match) return null;
  return { name: match[1], path };
}
