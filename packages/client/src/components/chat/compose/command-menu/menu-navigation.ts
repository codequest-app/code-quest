import type { MenuItem } from './build-menu-items.ts';

const NAV_KEYS = ['ArrowDown', 'ArrowUp', 'Enter', 'Tab'] as const;

export function isNavKey(key: string): boolean {
  return NAV_KEYS.includes(key as (typeof NAV_KEYS)[number]);
}

export function navigateItems(
  key: string,
  items: MenuItem[],
  activeId: string | null,
): { newActiveId: string | null; shouldSelect: boolean } {
  if (key === 'Enter' || key === 'Tab') {
    return { newActiveId: activeId, shouldSelect: true };
  }
  if (key === 'ArrowDown' || key === 'ArrowUp') {
    if (items.length === 0) return { newActiveId: activeId, shouldSelect: false };
    const idx = items.findIndex((i) => i.id === activeId);
    let nextIndex: number;
    if (key === 'ArrowDown') {
      nextIndex = idx < items.length - 1 ? idx + 1 : 0;
    } else {
      nextIndex = idx > 0 ? idx - 1 : items.length - 1;
    }
    return { newActiveId: items[nextIndex]?.id ?? null, shouldSelect: false };
  }
  return { newActiveId: activeId, shouldSelect: false };
}

export function dispatchSelectedItem(
  item: MenuItem,
  key: string,
  opts: {
    insertSlash: (text: string) => void;
    executeSlash: (label: string) => void;
    shouldInsert: boolean;
    selectItem: (item: MenuItem) => void;
    close: () => void;
  },
): void {
  if (!item.id.startsWith('slash-')) {
    opts.selectItem(item);
    return;
  }
  if (key === 'Tab' || opts.shouldInsert) {
    opts.insertSlash(`${item.label} `);
  } else {
    opts.executeSlash(item.label);
    opts.close();
  }
}
