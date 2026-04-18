#!/usr/bin/env node
// Dump CSS custom properties & font metrics from <html> for regression diff.
// Usage:
//   pnpm -C packages/client build-storybook --quiet
//   npx http-server packages/client/storybook-static -p 6107 --silent &
//   node tools/dump-css-vars.mjs > tools/snapshots/css-vars.json
import { chromium } from 'playwright';

const URL = process.env.DUMP_URL ?? 'http://127.0.0.1:6107/iframe.html?id=components-emptystate--no-sessions&viewMode=story';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(URL, { waitUntil: 'networkidle' });

const vars = await page.evaluate(() => {
  const el = document.documentElement;
  const cs = getComputedStyle(el);
  const out = {};
  for (let i = 0; i < cs.length; i++) {
    const name = cs[i];
    if (name.startsWith('--color-') || name.startsWith('--font-')) {
      out[name] = cs.getPropertyValue(name).trim();
    }
  }
  out['html.fontSize'] = cs.fontSize;
  out['html.dataTheme'] = el.getAttribute('data-theme') ?? '(unset)';
  out['html.dataFont'] = el.getAttribute('data-font') ?? '(unset)';
  out['body.fontFamily'] = getComputedStyle(document.body).fontFamily;
  return out;
});

await browser.close();
const sorted = Object.fromEntries(Object.entries(vars).sort(([a], [b]) => a.localeCompare(b)));
process.stdout.write(`${JSON.stringify(sorted, null, 2)}\n`);
