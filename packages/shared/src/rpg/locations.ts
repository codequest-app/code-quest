import type { LocationDef, MapTheme, WildernessSubZone } from './map-types.ts';

export const TOWN_LOCATIONS: LocationDef[] = [
  {
    id: 'tavern',
    name: 'Tavern',
    icon: '🍺',
    zone: 'town',
    position: { x: 1, y: 3 },
    enterable: true,
    requiresLevel: 1,
    description: 'A friendly tavern where you can chat with the AI bartender.',
    restrictInBattle: false,
    shortcutKey: 'H',
  },
  {
    id: 'shopping_district',
    name: 'Shopping District',
    icon: '🏪',
    zone: 'town',
    position: { x: 7, y: 2 },
    enterable: true,
    requiresLevel: 1,
    description: 'The commercial hub with 7 specialty shops.',
    restrictInBattle: true,
    shortcutKey: 'S',
  },
  {
    id: 'stasis_chamber',
    name: 'Stasis Chamber',
    icon: '⏸️',
    zone: 'town',
    position: { x: 8, y: 6 },
    enterable: true,
    requiresLevel: 1,
    description: 'Time freezes here. A space for deep thinking and Plan Mode.',
    restrictInBattle: false,
    shortcutKey: 'P',
  },
  {
    id: 'guild_hall',
    name: 'Guild Hall',
    icon: '🏛️',
    zone: 'town',
    position: { x: 4, y: 1 },
    enterable: true,
    requiresLevel: 1,
    description: 'Worktree management center and battle monitoring hub.',
    restrictInBattle: false,
    shortcutKey: 'G',
  },
  {
    id: 'player_home',
    name: 'Player Home',
    icon: '🏠',
    zone: 'town',
    position: { x: 4, y: 6 },
    enterable: true,
    requiresLevel: 1,
    description: 'Rest, save, and adjust settings in your personal space.',
    restrictInBattle: true,
    shortcutKey: 'R',
  },
  {
    id: 'training_ground',
    name: 'Training Ground',
    icon: '⚔️',
    zone: 'town',
    position: { x: 1, y: 6 },
    enterable: true,
    requiresLevel: 1,
    description: 'Practice and test skills without consuming resources.',
    restrictInBattle: true,
    shortcutKey: 'T',
  },
  {
    id: 'library',
    name: 'Library',
    icon: '📚',
    zone: 'town',
    position: { x: 7, y: 5 },
    enterable: true,
    requiresLevel: 3,
    description: 'Browse and install MCP tools and extensions.',
    restrictInBattle: true,
    shortcutKey: 'L',
  },
];

export const WILDERNESS_SUB_ZONES: WildernessSubZone[] = [
  {
    id: 'forest',
    name: 'Forest',
    icon: '🌳',
    encounterRate: 0.3,
    complexityRange: { min: 5, max: 8 },
  },
  {
    id: 'mountains',
    name: 'Mountains',
    icon: '⛰️',
    encounterRate: 0.5,
    complexityRange: { min: 8, max: 12 },
  },
  {
    id: 'wasteland',
    name: 'Wasteland',
    icon: '🏜️',
    encounterRate: 0.7,
    complexityRange: { min: 12, max: 15 },
  },
  {
    id: 'volcano',
    name: 'Volcano',
    icon: '🌋',
    encounterRate: 0.9,
    complexityRange: { min: 15, max: 20 },
  },
];

export const WILDERNESS_LOCATIONS: LocationDef[] = [
  {
    id: 'forest',
    name: 'Forest',
    icon: '🌳',
    zone: 'wilderness',
    position: { x: 2, y: 2 },
    enterable: true,
    requiresLevel: 1,
    description: 'Beginner area. Simple tasks and low encounter rate.',
    restrictInBattle: false,
  },
  {
    id: 'mountains',
    name: 'Mountains',
    icon: '⛰️',
    zone: 'wilderness',
    position: { x: 7, y: 2 },
    enterable: true,
    requiresLevel: 3,
    description: 'Intermediate area with moderate encounters.',
    restrictInBattle: false,
  },
  {
    id: 'wasteland',
    name: 'Wasteland',
    icon: '🏜️',
    zone: 'wilderness',
    position: { x: 2, y: 5 },
    enterable: true,
    requiresLevel: 5,
    description: 'Advanced area. High-complexity tasks and frequent battles.',
    restrictInBattle: false,
  },
  {
    id: 'volcano',
    name: 'Volcano',
    icon: '🌋',
    zone: 'wilderness',
    position: { x: 7, y: 5 },
    enterable: true,
    requiresLevel: 8,
    description: 'Expert area. Extreme complexity and near-certain encounters.',
    restrictInBattle: false,
  },
];

export const DUNGEON_LOCATIONS: LocationDef[] = [
  {
    id: 'bug_cave',
    name: 'Bug Cave',
    icon: '🪲',
    zone: 'dungeon',
    position: { x: 2, y: 3 },
    enterable: true,
    requiresLevel: 3,
    description: 'A dark cave crawling with bugs. Debug challenges await.',
    restrictInBattle: false,
  },
  {
    id: 'arch_maze',
    name: 'Architecture Maze',
    icon: '🏗️',
    zone: 'dungeon',
    position: { x: 7, y: 3 },
    enterable: true,
    requiresLevel: 5,
    description: 'A labyrinth of architectural decisions. Refactoring boss inside.',
    restrictInBattle: false,
  },
  {
    id: 'legacy_tomb',
    name: 'Legacy Tomb',
    icon: '🏚️',
    zone: 'dungeon',
    position: { x: 4, y: 1 },
    enterable: true,
    requiresLevel: 8,
    description: 'Ancient legacy code lies here. Only the bravest dare enter.',
    restrictInBattle: false,
  },
];

export interface DungeonBossInfo {
  dungeonId: string;
  bossName: string;
  bossIcon: string;
  recommendedLevel: number;
  bossHp: number;
  description: string;
}

export const DUNGEON_BOSSES: DungeonBossInfo[] = [
  {
    dungeonId: 'bug_cave',
    bossName: 'NullPointer the Destroyer',
    bossIcon: '🪲',
    recommendedLevel: 3,
    bossHp: 50,
    description: 'A massive bug that crashes everything it touches.',
  },
  {
    dungeonId: 'arch_maze',
    bossName: 'Spaghetti Architect',
    bossIcon: '🏗️',
    recommendedLevel: 5,
    bossHp: 120,
    description: 'A tangled mess of circular dependencies and god objects.',
  },
  {
    dungeonId: 'legacy_tomb',
    bossName: 'Ancient Monolith',
    bossIcon: '🏚️',
    recommendedLevel: 8,
    bossHp: 250,
    description: 'A 10,000-line file with no tests and no documentation.',
  },
];

export const BUILT_IN_THEMES: MapTheme[] = [
  {
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
  },
  {
    name: 'dark',
    cssClass: 'dark',
    colors: {
      background: '#1e1e1e',
      ground: '#2d2d30',
      building: '#3c3c3c',
      buildingHover: '#4c4c4c',
      text: '#d4d4d4',
      accent: '#569cd6',
      statusBar: '#252526',
    },
  },
];
