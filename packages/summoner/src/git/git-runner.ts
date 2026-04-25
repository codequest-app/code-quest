import { errMsg } from '@code-quest/shared';
import { GitResponseError, type SimpleGit, simpleGit } from 'simple-git';

export function createGit(cwd?: string): SimpleGit {
  return simpleGit({ baseDir: cwd ?? process.cwd(), trimmed: true });
}

export async function rawGit(
  git: SimpleGit,
  args: string[],
): Promise<{ stdout: string; exitCode: number }> {
  try {
    const stdout = await git.raw(args);
    return { stdout, exitCode: 0 };
  } catch (err) {
    console.debug('[GitService] git raw failed:', args.join(' '), errMsg(err));
    // simple-git puts the parsed git output on `.git` (often empty) — fall back
    // to the actual error message so downstream callers can surface a real
    // diagnostic instead of an empty 'failed (exit 1)' string.
    const fromGitField =
      err instanceof GitResponseError && typeof err.git === 'string' ? err.git : '';
    const stdout = fromGitField || errMsg(err);
    return { stdout, exitCode: 1 };
  }
}
