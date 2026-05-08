import { $ } from 'bun';

const TARGETS = [
  'bun-darwin-arm64',
  'bun-darwin-x64',
  'bun-linux-x64',
  'bun-linux-arm64',
  'bun-windows-x64',
] as const;

const input = 'dist/main.js';

for (const target of TARGETS) {
  const name = target.replace('bun-', 'summoner-');
  const ext = target.includes('windows') ? '.exe' : '';
  const outfile = `dist/${name}${ext}`;

  await $`bun build ${input} --compile --target=${target} --outfile=${outfile}`;
  console.log(`✓ ${outfile}`);
}

console.log('All targets compiled');
