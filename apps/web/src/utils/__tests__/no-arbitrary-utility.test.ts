import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const COMPONENTS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../components');

/**
 * Disallow `\w+-[Npx]` literal-pixel arbitraries (e.g. `text-[10px]`,
 * `h-[38px]`, `max-h-[480px]`). Tailwind v4 integer spacing covers these
 * via `text-xs`, `h-9`, `max-h-120`, etc. Existing @theme tokens absorb
 * the rest.
 *
 * No exceptions — every literal-pixel arbitrary must collapse to a
 * Tailwind built-in (text-xs, h-11, max-w-50, max-h-dialog-body utility,
 * backdrop-blur-xs, etc.). Project's `--spacing: 0.21875rem` means
 * integer N maps to N × 3.5px; pick the nearest within the 1-2 px
 * tolerance from `tailwind-v4` skill's "差 1-2px 就近取" rule.
 */
const ARBITRARY_PX_RE = /\b[\w-]+-\[\d*\.?\d+px\]/g;
const ALLOWED_EXACTLY = new Set<string>();

async function* walk(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__') continue;
      yield* walk(full);
    } else if (entry.isFile() && /\.tsx?$/.test(entry.name) && !/\.test\./.test(entry.name)) {
      yield full;
    }
  }
}

describe('design tokens', () => {
  it('no component className uses literal-pixel arbitrary utilities', async () => {
    const offenders: string[] = [];
    for await (const file of walk(COMPONENTS_DIR)) {
      const content = await readFile(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        const matches = line.match(ARBITRARY_PX_RE);
        if (!matches) return;
        for (const m of matches) {
          if (ALLOWED_EXACTLY.has(m)) continue;
          offenders.push(`${file}:${i + 1}  ${m}`);
        }
      });
    }
    expect(
      offenders,
      `Replace these literal-pixel arbitraries with Tailwind built-ins (text-xs, h-9, max-h-120, etc.):\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
