import { type SimpleGit, simpleGit } from 'simple-git';
import { logger } from '../../logger.ts';

/** Create a simple-git instance for the given working directory (fallback: process.cwd()). */
export function createGit(cwd?: string): SimpleGit {
  return simpleGit({ baseDir: cwd ?? process.cwd(), trimmed: true });
}

/** Try checkout with fallback: direct → fetch+checkout → --track origin. */
export async function checkoutWithFallback(git: SimpleGit, branch: string): Promise<void> {
  try {
    await git.checkout(branch);
    return;
  } catch (err) {
    // strategy 1 failed
    logger.debug(err, 'Checkout strategy 1 failed (direct checkout)');
  }
  try {
    await git.fetch('origin');
    await git.checkout(branch);
    return;
  } catch (err) {
    // strategy 2 failed
    logger.debug(err, 'Checkout strategy 2 failed (fetch + checkout)');
  }
  await git.checkout(['-t', `origin/${branch}`]);
}

/** Run raw git command, return stdout + exitCode. Logs failures at debug level. */
export async function rawGit(
  git: SimpleGit,
  args: string[],
): Promise<{ stdout: string; exitCode: number }> {
  try {
    const stdout = await git.raw(args);
    return { stdout, exitCode: 0 };
  } catch (err) {
    logger.debug({ err, args }, 'git raw command failed');
    return { stdout: '', exitCode: 1 };
  }
}
