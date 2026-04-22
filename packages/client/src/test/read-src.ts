import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC_ROOT = resolve(import.meta.dirname, '..');

/** Read a source file (relative to `src/`) as a UTF-8 string — for tests that
 *  assert on raw source content (CSS text, JSX className strings, etc.).
 *  Use this instead of `?raw` imports: Vite's Tailwind/PostCSS plugin chain
 *  returns empty strings for CSS even with `?raw`. */
export function readSrc(relPath: string): string {
  return readFileSync(resolve(SRC_ROOT, relPath), 'utf-8');
}
