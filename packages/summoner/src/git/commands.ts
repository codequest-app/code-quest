import { readFile } from 'node:fs/promises';
import { isAbsolute, resolve, sep } from 'node:path';
import {
  errMsg,
  type GitDiffResult,
  type GitLogResult,
  type GitStatusResult,
} from '@code-quest/shared';
import type { SimpleGit } from 'simple-git';
import { AlreadyRepoError, NotARepoError } from './errors.ts';
import { createGit, rawGit } from './git-runner.ts';

const NOTHING_TO_COMMIT = 'nothing-to-commit';

function toChangedFile(f: { index: string; working_dir: string; path: string }) {
  return { status: `${f.index}${f.working_dir}`.trim(), file: f.path };
}

function toLogEntry(e: { hash: string; message: string; author_name: string; date: string }) {
  return { hash: e.hash, message: e.message, author: e.author_name, date: e.date };
}

export class GitCommands {
  async status(cwd: string): Promise<GitStatusResult> {
    const git = createGit(cwd);
    const s = await git.status();
    return {
      branch: s.current ?? 'unknown',
      isClean: s.isClean(),
      changedFiles: s.files.map(toChangedFile),
      ahead: s.ahead,
      behind: s.behind,
      hasUpstream: s.tracking != null,
    };
  }

  async checkout(cwd: string, branch: string): Promise<void> {
    const git = createGit(cwd);
    await this.checkoutWithFallback(git, branch);
  }

  async log(cwd: string, limit?: number): Promise<GitLogResult> {
    const git = createGit(cwd);
    const result = await git.log({ maxCount: limit ?? 20 });
    return { entries: result.all.map(toLogEntry) };
  }

  async diff(cwd: string, filePath?: string, status?: string): Promise<GitDiffResult> {
    const git = createGit(cwd);
    if (!filePath) {
      return { diff: await git.diff() };
    }
    if (status === '??') {
      const result = await rawGit(git, ['show', `:${filePath}`]).catch(() => null);
      if (result?.exitCode === 0) {
        return {
          diff: `+++ b/${filePath}\n${result.stdout
            .split('\n')
            .map((l) => `+${l}`)
            .join('\n')}`,
        };
      }
      const content = await readFile(resolve(cwd, filePath), 'utf-8').catch(() => '');
      return {
        diff: `+++ b/${filePath}\n${content
          .split('\n')
          .map((l) => `+${l}`)
          .join('\n')}`,
      };
    }
    // status is the trimmed `${index}${working_dir}` from toChangedFile.
    // Single-char 'M'/'D' is ambiguous (could be staged-only or unstaged-only after trim),
    // so use HEAD diff which covers both. 'A' is always staged-only.
    if (status === 'A') {
      return { diff: await git.diff(['--staged', '--', filePath]) };
    }
    return { diff: await git.diff(['HEAD', '--', filePath]) };
  }

  async add(cwd: string, paths?: string[]): Promise<{ ok: true } | { error: string }> {
    const args = paths && paths.length > 0 ? ['add', '--', ...paths] : ['add', '-A'];
    const result = await rawGit(createGit(cwd), args);
    return result.exitCode === 0
      ? { ok: true }
      : { error: result.stdout.trim() || `git ${args.join(' ')} failed` };
  }

  async commit(
    cwd: string,
    message: string,
  ): Promise<{ ok: true; hash: string } | { error: string }> {
    const git = createGit(cwd);
    const status = await git.status();
    if (status.staged.length === 0) return { error: NOTHING_TO_COMMIT };
    const result = await rawGit(git, ['commit', '-m', message]);
    if (result.exitCode !== 0) {
      return { error: result.stdout.trim() || 'git commit failed' };
    }
    const hash = (await rawGit(git, ['rev-parse', 'HEAD'])).stdout.trim();
    return { ok: true, hash };
  }

  async push(cwd: string): Promise<{ ok: true } | { error: string }> {
    const result = await rawGit(createGit(cwd), ['push']);
    if (result.exitCode === 0) return { ok: true };
    const out = result.stdout.toLowerCase();
    if (/no upstream|set-upstream/.test(out)) return { error: 'no-upstream' };
    if (/rejected|non-fast-forward/.test(out)) return { error: 'rejected' };
    return { error: result.stdout.trim() || 'git push failed' };
  }

  async fetch(cwd: string): Promise<{ ok: true } | { error: string }> {
    const result = await rawGit(createGit(cwd), ['fetch', '--all']);
    if (result.exitCode === 0) return { ok: true };
    return { error: result.stdout.trim() || 'git fetch failed' };
  }

  async discardFile(cwd: string, file: string): Promise<{ ok: true } | { error: string }> {
    const result = await rawGit(createGit(cwd), ['checkout', '--', file]);
    if (result.exitCode === 0) return { ok: true };
    return { error: result.stdout.trim() || `git checkout -- ${file} failed` };
  }

  async pull(cwd: string): Promise<{ ok: true; fastForwarded: boolean } | { error: string }> {
    const result = await rawGit(createGit(cwd), ['pull', '--ff-only']);
    if (result.exitCode === 0) {
      const fastForwarded = !/already up.to.date/i.test(result.stdout);
      return { ok: true, fastForwarded };
    }
    const out = result.stdout.toLowerCase();
    if (/not possible to fast-forward|non-fast-forward|divergent/.test(out)) {
      return { error: 'non-ff' };
    }
    if (/no tracking information|no upstream/.test(out)) {
      return { error: 'no-upstream' };
    }
    return { error: result.stdout.trim() || 'git pull failed' };
  }

  async getRepoRoot(cwd: string): Promise<string | null> {
    try {
      return (await createGit(cwd).revparse(['--show-toplevel'])).trim();
    } catch (err) {
      console.debug('[GitService] getRepoRoot failed:', errMsg(err));
      return null;
    }
  }

  async getProjectRoot(cwd: string): Promise<string | null> {
    try {
      const git = createGit(cwd);
      const commonDir = (await git.revparse(['--git-common-dir'])).trim();
      const absolute = isAbsolute(commonDir) ? commonDir : resolve(cwd, commonDir);
      const dotGitIdx = absolute.lastIndexOf(`${sep}.git`);
      if (dotGitIdx === -1) return absolute;
      return absolute.slice(0, dotGitIdx);
    } catch (err) {
      console.debug('[GitService] getProjectRoot failed:', errMsg(err));
      return null;
    }
  }

  async initRepo(cwd: string): Promise<{ branch: string }> {
    if ((await this.getRepoRoot(cwd)) !== null) throw new AlreadyRepoError(cwd);
    const git = createGit(cwd);
    await git.raw(['init', '-b', 'main']);
    await git.raw([
      '-c',
      'user.email=cc-office@local',
      '-c',
      'user.name=cc-office',
      'commit',
      '--allow-empty',
      '-m',
      'Initial commit',
    ]);
    return { branch: 'main' };
  }

  async listBranches(repoRoot: string): Promise<string[]> {
    if ((await this.getRepoRoot(repoRoot)) === null) throw new NotARepoError(repoRoot);
    const result = await rawGit(createGit(repoRoot), [
      'branch',
      '--list',
      '--format=%(refname:short)',
    ]);
    if (result.exitCode === 0) {
      return result.stdout
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    }
    return [];
  }

  /** Three-strategy checkout: local → fetch+local → tracking branch from origin. */
  private async checkoutWithFallback(git: SimpleGit, branch: string): Promise<void> {
    try {
      await git.checkout(branch);
      return;
    } catch (err) {
      console.debug('[GitService] checkout strategy 1 failed:', errMsg(err));
    }
    try {
      await git.fetch('origin');
      await git.checkout(branch);
      return;
    } catch (err) {
      console.debug('[GitService] checkout strategy 2 failed:', errMsg(err));
    }
    await git.checkout(['-t', `origin/${branch}`]);
  }
}
