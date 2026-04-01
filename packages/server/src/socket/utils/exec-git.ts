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
