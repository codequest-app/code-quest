import type { MenuItem } from './build-menu-items';

const NAV_KEYS = ['ArrowDown', 'ArrowUp', 'Enter', 'Tab'] as const;

export { NAV_KEYS };

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
    let next: number;
    if (key === 'ArrowDown') {
      next = idx < items.length - 1 ? idx + 1 : 0;
    } else {
      next = idx > 0 ? idx - 1 : items.length - 1;
    }
    return { newActiveId: items[next]?.id ?? null, shouldSelect: false };
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
) {
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
