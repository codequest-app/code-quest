import { describe, expect, it } from 'vitest';
import type { LocationDef, MapPosition, MapTheme, Zone } from '../map-types.ts';

describe('map-types', () => {
  it('Zone accepts town, wilderness, dungeon', () => {
    const zones: Zone[] = ['town', 'wilderness', 'dungeon'];
    expect(zones).toHaveLength(3);
  });

  it('MapPosition holds x and y', () => {
    const pos: MapPosition = { x: 3, y: 5 };
    expect(pos.x).toBe(3);
    expect(pos.y).toBe(5);
  });

  it('LocationDef has all required fields', () => {
    const loc: LocationDef = {
      id: 'guild',
      name: 'Guild Hall',
      icon: '🏛️',
      zone: 'town',
      position: { x: 4, y: 3 },
      enterable: true,
      requiresLevel: 1,
      description: 'Worktree management center.',
      restrictInBattle: false,
      shortcutKey: 'G',
    };
    expect(loc.id).toBe('guild');
    expect(loc.enterable).toBe(true);
    expect(loc.shortcutKey).toBe('G');
    expect(loc.description).toBeTruthy();
    expect(loc.restrictInBattle).toBe(false);
  });

  it('LocationDef shortcutKey is optional', () => {
    const loc: LocationDef = {
      id: 'shop',
      name: 'Shop',
      icon: '🏪',
      zone: 'town',
      position: { x: 2, y: 2 },
      enterable: true,
      requiresLevel: 1,
      description: 'A shop.',
      restrictInBattle: true,
    };
    expect(loc.shortcutKey).toBeUndefined();
  });

  it('MapTheme has name, cssClass, and colors', () => {
    const theme: MapTheme = {
      name: 'classic',
      cssClass: 'classic',
      colors: {
        background: '#F5F5DC',
        ground: '#8FBC8F',
        building: '#D2B48C',
        buildingHover: '#C4A882',
        text: '#2C3E50',
        accent: '#4A90E2',
        statusBar: '#3C3C3C',
      },
    };
    expect(theme.cssClass).toBe('classic');
    expect(Object.keys(theme.colors)).toHaveLength(7);
  });
});
