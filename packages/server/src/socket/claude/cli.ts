import { execFile, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
  // Claude CLI truncates stdout when it detects a non-TTY pipe.
  // Redirecting to a temp file bypasses this detection and gives complete output.
  const dir = mkdtempSync(join(tmpdir(), 'cc-plugin-'));
  const outFile = join(dir, 'out.json');
  try {
    await execFileAsync('bash', ['-c', `claude plugin ${args.join(' ')} > ${outFile}`], {
      timeout: 30_000,
    });
    const stdout = readFileSync(outFile, 'utf-8');
    return { stdout, ok: true };
  } catch (err) {
    logger.warn({ err }, 'Failed to run plugin command async');
    return { stdout: '', ok: false };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
