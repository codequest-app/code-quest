import { describe, expect, it } from 'vitest';
import type { MenuItem } from '../build-menu-items';
import { computeMenuLayout, filterMenuItems } from '../menu-layout';

function item(overrides: Partial<MenuItem>): MenuItem {
  return {
    id: 'x',
    label: 'X',
    section: 'Context',
    ...overrides,
  };
}

describe('filterMenuItems', () => {
  it('returns every non-filterOnly item when filter is empty', () => {
    const items = [
      item({ id: 'a', label: 'Alpha' }),
      item({ id: 'b', label: 'Beta', filterOnly: true }),
      item({ id: 'c', label: 'Gamma' }),
    ];
    expect(filterMenuItems(items, '').map((i) => i.id)).toEqual(['a', 'c']);
  });

  it('keeps items whose label contains filter (case-insensitive)', () => {
    const items = [
      item({ id: 'a', label: 'Send message' }),
      item({ id: 'b', label: 'Delete' }),
      item({ id: 'c', label: 'message cancel' }),
    ];
    expect(filterMenuItems(items, 'MESSAGE').map((i) => i.id)).toEqual(['a', 'c']);
  });

  it('matchFirstToken items compare only the first word of the filter', () => {
    const items = [
      item({ id: 'btw', label: '/btw', matchFirstToken: true }),
      item({ id: 'other', label: '/other' }),
    ];
    // filter "/btw hello world" should still match /btw
    expect(filterMenuItems(items, '/btw hello world').map((i) => i.id)).toEqual(['btw']);
  });

  it('filterOnly items appear when filter is non-empty and match', () => {
    const items = [item({ id: 'new', label: 'New conversation', filterOnly: true })];
    expect(filterMenuItems(items, '').map((i) => i.id)).toEqual([]);
    expect(filterMenuItems(items, 'new').map((i) => i.id)).toEqual(['new']);
  });
});

describe('computeMenuLayout', () => {
  const sections = {
    context: [item({ id: 'ctx1', label: 'Attach file' })],
    model: [item({ id: 'mod1', label: 'Switch model' })],
    customize: [item({ id: 'cust1', label: 'MCP status' })],
    slash: [item({ id: 'slash1', label: '/usage' })],
    settings: [item({ id: 'set1', label: 'Theme' })],
    support: [item({ id: 'sup1', label: 'View help' })],
  };

  it('returns all sections filtered + flatItems in display order when filter is empty', () => {
    const layout = computeMenuLayout(sections, '');
    expect(layout.context.map((i) => i.id)).toEqual(['ctx1']);
    expect(layout.flatItems.map((i) => i.id)).toEqual([
      'ctx1',
      'mod1',
      'cust1',
      'slash1',
      'set1',
      'sup1',
    ]);
  });

  it('suppresses model section entirely when filter matches no model item', () => {
    const layout = computeMenuLayout(sections, 'attach');
    expect(layout.modelVisible).toBe(false);
    expect(layout.flatItems.find((i) => i.id === 'mod1')).toBeUndefined();
  });

  it('modelVisible is true when filter is empty (to show header even if empty section)', () => {
    const layout = computeMenuLayout(sections, '');
    expect(layout.modelVisible).toBe(true);
  });

  it('hasPrev.model reflects whether any context item passed the filter', () => {
    // no match anywhere except model
    const layout = computeMenuLayout(sections, 'switch');
    expect(layout.context).toEqual([]);
    expect(layout.hasPrev.model).toBe(false);
  });

  it('hasPrev cascades: a later section has a prev iff any earlier visible section has content', () => {
    // only slash matches
    const layout = computeMenuLayout(sections, '/usage');
    expect(layout.context).toEqual([]);
    expect(layout.model).toEqual([]);
    expect(layout.customize).toEqual([]);
    expect(layout.modelVisible).toBe(false); // no model match under non-empty filter
    expect(layout.hasPrev.slash).toBe(false); // no preceding visible section
    expect(layout.hasPrev.settings).toBe(true); // slash has content now
  });
});
