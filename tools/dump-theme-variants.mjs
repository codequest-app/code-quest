#!/usr/bin/env node
// Dump CSS vars + screenshots for every (theme × density) combination.
// Run storybook-static via http-server on port 6107 before invoking.
//   pnpm -C apps/web build-storybook --quiet
//   apps/web/node_modules/.bin/http-server apps/web/storybook-static -p 6107 --silent &
//   node tools/dump-theme-variants.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const OUT_DIR = new URL('./snapshots/theme-variants/', import.meta.url);
const URL_ =
  'http://127.0.0.1:6107/iframe.html?id=components-emptystate--no-sessions&viewMode=story';
const COMBINATIONS = [
  { theme: 'dark', density: 'comfortable' },
  { theme: 'dark', density: 'compact' },
  { theme: 'light', density: 'comfortable' },
  { theme: 'light', density: 'compact' },
];

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });

for (const { theme, density } of COMBINATIONS) {
  await page.goto(URL_, { waitUntil: 'networkidle' });
  await page.evaluate(
    ([t, d]) => {
      document.documentElement.dataset.theme = t;
      document.documentElement.dataset.density = d;
    },
    [theme, density],
  );

  const vars = await page.evaluate(() => {
    const el = document.documentElement;
    const cs = getComputedStyle(el);
    const out = {};
    for (let i = 0; i < cs.length; i++) {
      const n = cs[i];
      if (n.startsWith('--color-') || n.startsWith('--font-') || n === '--spacing') {
        out[n] = cs.getPropertyValue(n).trim();
      }
    }
    out['html.fontSize'] = cs.fontSize;
    out['html.dataTheme'] = el.getAttribute('data-theme') ?? '(unset)';
    out['html.dataDensity'] = el.getAttribute('data-density') ?? '(unset)';
    return out;
  });

  const sorted = Object.fromEntries(Object.entries(vars).sort(([a], [b]) => a.localeCompare(b)));
  const name = `${theme}-${density}`;
  await writeFile(new URL(`${name}.json`, OUT_DIR), `${JSON.stringify(sorted, null, 2)}\n`);
  await page.screenshot({ path: new URL(`${name}.png`, OUT_DIR).pathname, fullPage: false });
  console.log(`✓ ${name}`);
}

await browser.close();
