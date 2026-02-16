import { execFile as execFileCb } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { injectable } from 'inversify';
import type { GitService, MergeResult } from './types.ts';

const execFile = promisify(execFileCb);

@injectable()
export class GitServiceImpl implements GitService {
  private supported = false;
  private initialized = false;
  private projectRoot: string | null = null;

  isWorktreeSupported(): boolean {
    return this.supported;
  }

  getProjectRoot(): string | null {
    return this.projectRoot;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const { stdout } = await execFile('git', ['rev-parse', '--show-toplevel']);
      this.projectRoot = stdout.trim();

      // Verify worktree support by listing
      await execFile('git', ['worktree', 'list'], { cwd: this.projectRoot });
      this.supported = true;
    } catch {
      this.supported = false;
      this.projectRoot = null;
    }
  }

  async createWorktree(id: string): Promise<string> {
    if (!this.projectRoot) {
      throw new Error('GitService not initialized or git not available');
    }

    const worktreePath = path.join(this.projectRoot, '.worktrees', `worker-${id}`);
    const branch = `worker-${id}`;

    await execFile('git', ['worktree', 'add', worktreePath, '-b', branch], {
      cwd: this.projectRoot,
    });

    return worktreePath;
  }

  async removeWorktree(id: string): Promise<void> {
    if (!this.projectRoot) return;

    const worktreePath = path.join(this.projectRoot, '.worktrees', `worker-${id}`);
    const branch = `worker-${id}`;

    try {
      await execFile('git', ['worktree', 'remove', worktreePath, '--force'], {
        cwd: this.projectRoot,
      });
    } catch {
      // Worktree may already be removed
    }

    try {
      await execFile('git', ['branch', '-d', branch], { cwd: this.projectRoot });
    } catch {
      // Branch may already be deleted
    }
  }

  async mergeWorktreeBranch(id: string): Promise<MergeResult> {
    if (!this.projectRoot) {
      return { success: false, branch: `worker-${id}`, error: 'GitService not initialized' };
    }

    const branch = `worker-${id}`;

    try {
      await execFile('git', ['merge', '--no-ff', branch], { cwd: this.projectRoot });
      return { success: true, branch };
    } catch (err) {
      // Abort failed merge
      try {
        await execFile('git', ['merge', '--abort'], { cwd: this.projectRoot });
      } catch {
        // merge --abort may fail if no merge in progress
      }

      const message = err instanceof Error ? err.message : String(err);
      return { success: false, branch, error: message };
    }
  }

  async cleanupAll(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.removeWorktree(id);
    }
  }

  async autoCommitAll(): Promise<boolean> {
    if (!this.projectRoot) {
      throw new Error('GitService not initialized or git not available');
    }

    await execFile('git', ['add', '-A'], { cwd: this.projectRoot });

    try {
      await execFile('git', ['commit', '-m', 'wip: orchestrator auto-commit', '--no-verify'], {
        cwd: this.projectRoot,
      });
      return true;
    } catch {
      // Nothing to commit
      return false;
    }
  }

  async resetLastCommit(): Promise<void> {
    if (!this.projectRoot) return;

    await execFile('git', ['reset', 'HEAD~1'], { cwd: this.projectRoot });
  }
}
