export function navigateItems<T extends { id: string }>(
  key: string,
  items: T[],
  activeId: string | null,
): { newActiveId: string | null; shouldSelect: boolean } {
  if (key === 'Enter' || key === 'Tab') {
    return { newActiveId: activeId, shouldSelect: true };
  }
  if (key === 'ArrowDown' || key === 'ArrowUp') {
    if (items.length === 0) return { newActiveId: activeId, shouldSelect: false };
    const idx = items.findIndex((i) => i.id === activeId);
    const next =
      key === 'ArrowDown'
        ? idx < items.length - 1
          ? idx + 1
          : 0
        : idx > 0
          ? idx - 1
          : items.length - 1;
    return { newActiveId: items[next]?.id ?? null, shouldSelect: false };
  }
  return { newActiveId: activeId, shouldSelect: false };
}
