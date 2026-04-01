import { spawnSync } from 'node:child_process';

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
