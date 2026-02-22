export type Zone = 'town' | 'wilderness' | 'dungeon';

export interface MapPosition {
  x: number;
  y: number;
}

export interface LocationDef {
  id: string;
  name: string;
  icon: string;
  zone: Zone;
  position: MapPosition;
  enterable: boolean;
  requiresLevel: number;
  description: string;
  restrictInBattle: boolean;
  shortcutKey?: string;
}

export type WildernessSubZoneId = 'forest' | 'mountains' | 'wasteland' | 'volcano';

export interface WildernessSubZone {
  id: WildernessSubZoneId;
  name: string;
  icon: string;
  encounterRate: number;
  complexityRange: { min: number; max: number };
}

export interface MapTheme {
  name: string;
  cssClass: string;
  colors: {
    background: string;
    ground: string;
    building: string;
    buildingHover: string;
    text: string;
    accent: string;
    statusBar: string;
  };
}
