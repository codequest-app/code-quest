import * as fs from 'node:fs';
import * as path from 'node:path';
import { expect, test } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

const OUT_DIR = path.join(__dirname, '../tmp/layout-dump');

test.beforeAll(() => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
});

async function dismissOnboarding(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    localStorage.setItem(
      'code-quest:preferences',
      JSON.stringify({
        state: { isOnboardingDismissed: true, isReviewUpsellDismissed: true },
        version: 0,
      }),
    );
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
}

async function ensureProjectAndTab(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle');
  await dismissOnboarding(page);

  // Ensure sidebar is open so we can select a project
  if (
    !(await page
      .getByTestId('sidebar-panel')
      .isVisible({ timeout: 1000 })
      .catch(() => false))
  ) {
    // Mobile: use ☰ button in mobile-topbar
    const menuBtn = page.getByRole('button', { name: 'Menu' });
    // Tablet: use ActivityBar Projects button
    const activityBtn = page.getByTitle('Projects');
    if (await menuBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await menuBtn.click();
      await page.waitForTimeout(300);
    } else if (await activityBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await activityBtn.click();
      await page.waitForTimeout(300);
    }
  }

  // If sidebar shows a project, click it to set it as active
  const sidebarPanel = page.getByTestId('sidebar-panel');
  if (await sidebarPanel.isVisible({ timeout: 1000 }).catch(() => false)) {
    const projectBtn = sidebarPanel.getByRole('button').first();
    if (await projectBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await projectBtn.click();
      await page.waitForTimeout(300);
    }
  }

  // Case 1: already has a tab open
  if (
    await page
      .getByTestId('tab-bar')
      .isVisible({ timeout: 2000 })
      .catch(() => false)
  )
    return;

  // Case 2: no projects yet — add one via dialog
  const addBtn = page.getByTestId('empty-add-project');
  if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await addBtn.click();
    const firstItem = page.getByRole('treeitem').first();
    await firstItem.waitFor({ state: 'visible', timeout: 10000 });
    await firstItem.click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Open' }).click();
    await page.waitForTimeout(800);
  }

  // Case 3 (+ Case 2 after project added): has project but no open tab
  const newSession = page.getByRole('button', { name: /New Session/i });
  const newTab = page.getByLabel('New tab');
  if (await newSession.isVisible({ timeout: 2000 }).catch(() => false)) {
    await newSession.click();
  } else if (await newTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await newTab.click();
  }
  await page.waitForTimeout(800);
}

for (const vp of VIEWPORTS) {
  test(`layout dump — ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/');
    await ensureProjectAndTab(page);

    // Ensure the active project's content is visible (not hidden)
    await page
      .getByTestId('tab-bar')
      .waitFor({ state: 'visible', timeout: 10000 })
      .catch(() => {});

    await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}.png`) });

    const layoutChain = await page.evaluate(() => {
      const relevant = [
        'display',
        'flex-direction',
        'flex',
        'flex-grow',
        'flex-shrink',
        'flex-basis',
        'width',
        'height',
        'min-width',
        'max-width',
        'overflow-x',
        'overflow-y',
        'position',
        'min-height',
      ];

      const getInfo = (el: Element) => {
        const s = window.getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const styles: Record<string, string> = {};
        for (const k of relevant) {
          const v = s.getPropertyValue(k);
          if (
            v &&
            v !== '0px' &&
            v !== 'none' &&
            v !== 'normal' &&
            v !== 'visible' &&
            v !== 'static'
          ) {
            styles[k] = v;
          }
        }
        return {
          tag: el.tagName,
          testId: el.getAttribute('data-testid') || undefined,
          class: el.getAttribute('class')?.replace(/\s+/g, ' ').trim() || undefined,
          rect: {
            w: Math.round(r.width),
            h: Math.round(r.height),
            x: Math.round(r.x),
            y: Math.round(r.y),
          },
          styles,
        };
      };

      const root = document.querySelector('[data-testid="message-list"]');
      if (!root) return null;
      const chain: object[] = [];
      let el: Element | null = root;
      while (el && el.tagName !== 'BODY') {
        chain.unshift(getInfo(el));
        el = el.parentElement;
      }
      return chain;
    });

    const output = JSON.stringify({ viewport: vp, layoutChain }, null, 2);
    fs.writeFileSync(path.join(OUT_DIR, `${vp.name}.json`), output);
    console.log(`\n=== ${vp.name} ===\n${output}`);

    expect(layoutChain).not.toBeNull();
  });
}
