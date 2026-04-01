import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function execGit(
  args: string[],
  opts?: { timeout?: number; cwd?: string },
): Promise<string> {
  const { stdout } = await execFileAsync('git', args, {
    cwd: opts?.cwd ?? process.cwd(),
    timeout: opts?.timeout,
  });
  return stdout;
}

/** Try checkout with fallback strategies: direct → fetch+checkout → track origin. */
export async function checkoutBranch(branch: string): Promise<void> {
  try {
    await execGit(['checkout', branch]);
  } catch {
    try {
      await execGit(['fetch', 'origin']);
      await execGit(['checkout', branch]);
    } catch {
      await execGit(['checkout', '--track', `origin/${branch}`]);
    }
  }
}
