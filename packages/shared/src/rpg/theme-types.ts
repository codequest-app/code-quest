export type ThemeName = string;

export interface SpriteFrame {
  frame: { x: number; y: number; w: number; h: number };
  duration?: number;
}

export interface SpriteAtlas {
  frames: Record<string, SpriteFrame>;
  meta: { image: string; size: { w: number; h: number } };
}

export interface SpriteRef {
  atlas: string;
  sheet: string;
}

export interface ThemeManifest {
  name: string;
  version: string;
  author: string;
  license: string;
  description: string;
  spriteSize: { map: number; battle: number; enemy: number };
  characters: Record<string, SpriteRef>;
  enemies: Record<string, string>;
  tileset: SpriteRef;
  battleBackgrounds: Record<string, string>;
}
