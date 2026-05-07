import { describe, expect, it } from 'vitest';
import type { MenuItem } from '../build-menu-items.ts';
import { isNavKey, navigateItems } from '../menu-navigation.ts';

function item(id: string): MenuItem {
  return { id, label: id, section: 'test' };
}

describe('isNavKey', () => {
  it.each(['ArrowDown', 'ArrowUp', 'Enter', 'Tab'])('returns true for %s', (key) => {
    expect(isNavKey(key)).toBe(true);
  });

  it.each(['Escape', 'a', ' ', ''])('returns false for %s', (key) => {
    expect(isNavKey(key)).toBe(false);
  });
});

describe('navigateItems', () => {
  const items = [item('a'), item('b'), item('c')];

  it('ArrowDown moves to next item', () => {
    expect(navigateItems('ArrowDown', items, 'a')).toEqual({
      newActiveId: 'b',
      shouldSelect: false,
    });
  });

  it('ArrowDown wraps from last to first', () => {
    expect(navigateItems('ArrowDown', items, 'c')).toEqual({
      newActiveId: 'a',
      shouldSelect: false,
    });
  });

  it('ArrowUp moves to previous item', () => {
    expect(navigateItems('ArrowUp', items, 'b')).toEqual({ newActiveId: 'a', shouldSelect: false });
  });

  it('ArrowUp wraps from first to last', () => {
    expect(navigateItems('ArrowUp', items, 'a')).toEqual({ newActiveId: 'c', shouldSelect: false });
  });

  it('Enter signals shouldSelect', () => {
    expect(navigateItems('Enter', items, 'b')).toEqual({ newActiveId: 'b', shouldSelect: true });
  });

  it('Tab signals shouldSelect', () => {
    expect(navigateItems('Tab', items, 'b')).toEqual({ newActiveId: 'b', shouldSelect: true });
  });
});
