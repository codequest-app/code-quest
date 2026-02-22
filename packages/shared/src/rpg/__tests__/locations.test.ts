import { describe, expect, it } from 'vitest';
import { BUILT_IN_THEMES, TOWN_LOCATIONS } from '../locations.ts';

describe('TOWN_LOCATIONS', () => {
  it('has at least 5 locations', () => {
    expect(TOWN_LOCATIONS.length).toBeGreaterThanOrEqual(5);
  });

  it('all ids are unique', () => {
    const ids = TOWN_LOCATIONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all positions are within grid bounds (0-9, 0-7)', () => {
    for (const loc of TOWN_LOCATIONS) {
      expect(loc.position.x).toBeGreaterThanOrEqual(0);
      expect(loc.position.x).toBeLessThanOrEqual(9);
      expect(loc.position.y).toBeGreaterThanOrEqual(0);
      expect(loc.position.y).toBeLessThanOrEqual(7);
    }
  });

  it('all icons are non-empty strings', () => {
    for (const loc of TOWN_LOCATIONS) {
      expect(loc.icon.length).toBeGreaterThan(0);
    }
  });

  it('all locations belong to town zone', () => {
    for (const loc of TOWN_LOCATIONS) {
      expect(loc.zone).toBe('town');
    }
  });

  it('includes design-spec locations: tavern, shopping, stasis, guild, home', () => {
    const ids = TOWN_LOCATIONS.map((l) => l.id);
    expect(ids).toContain('tavern');
    expect(ids).toContain('shopping_district');
    expect(ids).toContain('stasis_chamber');
    expect(ids).toContain('guild_hall');
    expect(ids).toContain('player_home');
  });

  it('all locations have a non-empty description', () => {
    for (const loc of TOWN_LOCATIONS) {
      expect(loc.description.length).toBeGreaterThan(0);
    }
  });

  it('shopping_district is restricted during battle', () => {
    const shop = TOWN_LOCATIONS.find((l) => l.id === 'shopping_district');
    expect(shop?.restrictInBattle).toBe(true);
  });

  it('stasis_chamber is accessible during battle', () => {
    const stasis = TOWN_LOCATIONS.find((l) => l.id === 'stasis_chamber');
    expect(stasis?.restrictInBattle).toBe(false);
  });

  it('tavern has shortcutKey H', () => {
    const tavern = TOWN_LOCATIONS.find((l) => l.id === 'tavern');
    expect(tavern?.shortcutKey).toBe('H');
  });
});

describe('BUILT_IN_THEMES', () => {
  it('has classic and dark themes', () => {
    const names = BUILT_IN_THEMES.map((t) => t.name);
    expect(names).toContain('classic');
    expect(names).toContain('dark');
  });

  it('all themes have complete colors', () => {
    const requiredKeys = [
      'background',
      'ground',
      'building',
      'buildingHover',
      'text',
      'accent',
      'statusBar',
    ];
    for (const theme of BUILT_IN_THEMES) {
      for (const key of requiredKeys) {
        expect(theme.colors).toHaveProperty(key);
        expect((theme.colors as Record<string, string>)[key].length).toBeGreaterThan(0);
      }
    }
  });
});
