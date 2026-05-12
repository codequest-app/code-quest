import { describe, expect, it, vi } from 'vitest';
import { dispatchSelectedItem, isNavKey, navigateItems } from '../menu-navigation.ts';
import type { MenuItem } from '../menu-types.ts';
import { SLASH_SECTION } from '../menu-types.ts';

function item(id: string, section = 'test'): MenuItem {
  return { id, label: id, section };
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

describe('dispatchSelectedItem', () => {
  const opts = () => ({
    insertSlash: vi.fn(),
    executeSlash: vi.fn(),
    shouldInsert: false,
    selectItem: vi.fn(),
    close: vi.fn(),
  });

  it('Tab on slash command item inserts text, not executes', () => {
    const o = opts();
    dispatchSelectedItem({ id: 'compact', label: '/compact', section: SLASH_SECTION }, 'Tab', o);
    expect(o.insertSlash).toHaveBeenCalledWith('/compact ');
    expect(o.selectItem).not.toHaveBeenCalled();
  });

  it('Tab on non-slash item (context/model) calls selectItem', () => {
    const o = opts();
    dispatchSelectedItem(item('add-file', 'Context'), 'Tab', o);
    expect(o.selectItem).toHaveBeenCalled();
    expect(o.insertSlash).not.toHaveBeenCalled();
  });

  it('Enter on slash command item executes and closes', () => {
    const o = opts();
    dispatchSelectedItem({ id: 'compact', label: '/compact', section: SLASH_SECTION }, 'Enter', o);
    expect(o.executeSlash).toHaveBeenCalledWith('/compact');
    expect(o.close).toHaveBeenCalled();
  });
});
