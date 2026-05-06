import os from 'node:os';

export function parseFsRoots(raw: string | undefined): string[] {
  if (!raw) return [os.homedir()];
  const roots = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return roots.length > 0 ? roots : [os.homedir()];
}
