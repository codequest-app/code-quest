#!/usr/bin/env node
// Lint for hardcoded color literals inside inline style attributes of .tsx
// files under apps/web/src. Flags #abc / #abcdef / rgb(...) / rgba(...)
// appearing inside style={{ ... }} or style="..." blocks, multi-line aware.
//
// Exit 0 if no hits, 1 if any found.

import { globSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const PATTERN = `${ROOT}/apps/web/src/**/*.tsx`;

// Match hex literals and rgb/rgba calls that start with a digit (literal RGB).
// rgba(var(--color-accent-rgb), 0.2) is accepted because it starts with `v`.
const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d/g;

const files = globSync(PATTERN, {
  exclude: (path) => path.includes('__tests__') || path.endsWith('.stories.tsx'),
});

/** Find balanced `style={{ ... }}` ranges in source text. */
function findStyleBlocks(src) {
  const blocks = [];
  let i = 0;
  while (i < src.length) {
    const hit = src.indexOf('style={{', i);
    if (hit < 0) break;
    // Find the matching `}}` by counting braces starting from the inner `{`
    let j = hit + 'style={'.length; // position on the first `{` inside
    let depth = 0;
    for (; j < src.length; j++) {
      if (src[j] === '{') depth++;
      else if (src[j] === '}') {
        depth--;
        if (depth === 0) {
          j++; // include this `}`
          break;
        }
      }
    }
    blocks.push({ start: hit, end: j, text: src.slice(hit, j) });
    i = j;
  }
  // Also catch single-line string-style: style="..."
  for (const m of src.matchAll(/style="[^"]*"/g)) {
    blocks.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
  }
  return blocks;
}

function lineColAt(src, offset) {
  const before = src.slice(0, offset);
  const line = before.split('\n').length;
  const col = offset - before.lastIndexOf('\n');
  return { line, col };
}

let hitCount = 0;
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const blocks = findStyleBlocks(src);
  for (const block of blocks) {
    for (const color of block.text.matchAll(COLOR_LITERAL)) {
      const absoluteOffset = block.start + (color.index ?? 0);
      const { line, col } = lineColAt(src, absoluteOffset);
      hitCount++;
      console.log(
        `${file.replace(`${ROOT}/`, '')}:${line}:${col}  ${color[0]}`,
      );
    }
  }
}

if (hitCount === 0) {
  console.log('✔ No hardcoded colors in inline styles.');
  process.exit(0);
}

console.log(
  `\n✖ ${hitCount} hardcoded color literal${hitCount === 1 ? '' : 's'} found.`,
);
process.exit(1);
