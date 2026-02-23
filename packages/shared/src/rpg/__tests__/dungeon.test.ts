import { describe, expect, it } from 'vitest';
import { DUNGEON_LOCATIONS } from '../locations.ts';

describe('DUNGEON_LOCATIONS', () => {
  it('has at least 3 dungeon locations', () => {
    expect(DUNGEON_LOCATIONS.length).toBeGreaterThanOrEqual(3);
  });

  it('all locations belong to dungeon zone', () => {
    for (const loc of DUNGEON_LOCATIONS) {
      expect(loc.zone).toBe('dungeon');
    }
  });

  it('all ids are unique', () => {
    const ids = DUNGEON_LOCATIONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all locations have non-empty description', () => {
    for (const loc of DUNGEON_LOCATIONS) {
      expect(loc.description.length).toBeGreaterThan(0);
    }
  });

  it('includes bug_cave and arch_maze', () => {
    const ids = DUNGEON_LOCATIONS.map((l) => l.id);
    expect(ids).toContain('bug_cave');
    expect(ids).toContain('arch_maze');
  });

  it('dungeons require higher levels', () => {
    for (const loc of DUNGEON_LOCATIONS) {
      expect(loc.requiresLevel).toBeGreaterThanOrEqual(3);
    }
  });
});
