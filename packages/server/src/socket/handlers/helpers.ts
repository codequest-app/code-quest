import { execFile, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function execGit(args: string[], timeoutMs?: number): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd: process.cwd(), timeout: timeoutMs });
  return stdout;
}

export function runPluginCommand(args: string[]): { stdout: string; stderr: string; ok: boolean } {
  const result = spawnSync('claude', ['plugin', ...args], {
    timeout: 30_000,
    encoding: 'utf-8',
  });
  return { stdout: result.stdout ?? '', stderr: result.stderr ?? '', ok: result.status === 0 };
}

export async function runPluginCommandAsync(
  args: string[],
): Promise<{ stdout: string; ok: boolean }> {
  try {
    const { stdout } = await execFileAsync('claude', ['plugin', ...args], {
      timeout: 30_000,
      encoding: 'utf-8',
    });
    return { stdout, ok: true };
  } catch {
    return { stdout: '', ok: false };
  }
}

export let rgAvailable = (() => {
  try {
    return spawnSync('rg', ['--version'], { timeout: 3000 }).status === 0;
  } catch {
    return false;
  }
})();

/** Exported for test override */
export function setRgAvailable(value: boolean): void {
  rgAvailable = value;
}

export function rgListFiles(cwd: string): string[] {
  const result = spawnSync(
    'rg',
    ['--files', '--max-depth', '5', '-g', '!node_modules', '-g', '!.git', '-g', '!dist'],
    { cwd, timeout: 10_000, encoding: 'utf-8' },
  );
  return (result.stdout ?? '').split('\n').filter(Boolean);
}
