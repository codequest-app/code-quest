import { execFile, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import { logger } from '../../logger.ts';

const execFileAsync = promisify(execFile);

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
  } catch (err) {
    logger.debug(err, 'Failed to run plugin command async');
    return { stdout: '', ok: false };
  }
}
