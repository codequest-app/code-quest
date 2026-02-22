import { describe, expect, it } from 'vitest';
import type {
  SpriteAtlas,
  SpriteFrame,
  SpriteRef,
  ThemeManifest,
  ThemeName,
} from '../theme-types.ts';

describe('theme-types', () => {
  it('SpriteFrame holds frame coordinates and optional duration', () => {
    const frame: SpriteFrame = { frame: { x: 0, y: 0, w: 32, h: 32 } };
    expect(frame.frame.w).toBe(32);

    const withDuration: SpriteFrame = {
      frame: { x: 32, y: 0, w: 32, h: 32 },
      duration: 150,
    };
    expect(withDuration.duration).toBe(150);
  });

  it('SpriteAtlas has frames keyed by string and meta info', () => {
    const atlas: SpriteAtlas = {
      frames: {
        'hero-down-0': { frame: { x: 0, y: 0, w: 32, h: 32 } },
        'hero-down-1': { frame: { x: 32, y: 0, w: 32, h: 32 }, duration: 150 },
      },
      meta: { image: 'hero.png', size: { w: 96, h: 128 } },
    };
    expect(atlas.frames['hero-down-0'].frame.x).toBe(0);
    expect(atlas.meta.image).toBe('hero.png');
  });

  it('SpriteRef references atlas and sheet paths', () => {
    const ref: SpriteRef = { atlas: 'hero.json', sheet: 'hero.png' };
    expect(ref.atlas).toBe('hero.json');
    expect(ref.sheet).toBe('hero.png');
  });

  it('ThemeManifest accepts a complete manifest', () => {
    const name: ThemeName = 'classic';
    const manifest: ThemeManifest = {
      name: 'Classic Quest',
      version: '1.0.0',
      author: 'Team',
      license: 'CC0',
      description: 'Classic theme',
      spriteSize: { map: 32, battle: 64, enemy: 128 },
      characters: {
        hero: { atlas: 'characters/hero.json', sheet: 'characters/hero.png' },
      },
      enemies: { 'code-golem': 'enemies/golem.png' },
      tileset: { atlas: 'maps/tileset.json', sheet: 'maps/tileset.png' },
      battleBackgrounds: { plains: 'battles/plains.png' },
    };
    expect(manifest.name).toBe('Classic Quest');
    expect(manifest.spriteSize.map).toBe(32);
    expect(manifest.characters.hero.sheet).toBe('characters/hero.png');
    expect(name).toBe('classic');
  });
});
