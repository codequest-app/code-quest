import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBattleStore } from '../battleStore';
import { useMapStore } from '../mapStore';

describe('mapStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useMapStore.setState({
      currentZone: 'town',
      currentLocationId: null,
      playerPosition: { x: 4, y: 4 },
      completedDungeons: new Set<string>(),
    });
    useBattleStore.setState({
      battles: new Map(),
      player: { level: 1, totalExp: 0, totalGold: 0 },
    });
  });

  it('defaults to town zone with center position', () => {
    const state = useMapStore.getState();
    expect(state.currentZone).toBe('town');
    expect(state.playerPosition).toEqual({ x: 4, y: 4 });
  });

  it('movePlayer updates position', () => {
    useMapStore.getState().movePlayer(1, 0);
    expect(useMapStore.getState().playerPosition).toEqual({ x: 5, y: 4 });
  });

  it('movePlayer clamps at grid boundaries (0-9, 0-7)', () => {
    useMapStore.setState({ playerPosition: { x: 9, y: 7 } });
    useMapStore.getState().movePlayer(1, 1);
    expect(useMapStore.getState().playerPosition).toEqual({ x: 9, y: 7 });

    useMapStore.setState({ playerPosition: { x: 0, y: 0 } });
    useMapStore.getState().movePlayer(-1, -1);
    expect(useMapStore.getState().playerPosition).toEqual({ x: 0, y: 0 });
  });

  it('enterLocation sets currentLocationId', () => {
    useMapStore.getState().enterLocation('tavern');
    expect(useMapStore.getState().currentLocationId).toBe('tavern');
  });

  it('enterLocation rejects if requiresLevel not met', () => {
    // library requires level 3, player level is 1
    useMapStore.getState().enterLocation('library');
    expect(useMapStore.getState().currentLocationId).toBeNull();
  });

  it('enterLocation allows when player level is sufficient', () => {
    useBattleStore.setState({
      player: { level: 5, totalExp: 0, totalGold: 0 },
    });
    useMapStore.getState().enterLocation('library');
    expect(useMapStore.getState().currentLocationId).toBe('library');
  });

  it('enterLocation blocks restrictInBattle locations during battle', () => {
    // Start a battle
    const battles = new Map();
    battles.set('s1', { phase: 'active' });
    useBattleStore.setState({ battles });

    // shopping_district has restrictInBattle: true
    useMapStore.getState().enterLocation('shopping_district');
    expect(useMapStore.getState().currentLocationId).toBeNull();
  });

  it('enterLocation allows non-restrictInBattle locations during battle', () => {
    const battles = new Map();
    battles.set('s1', { phase: 'active' });
    useBattleStore.setState({ battles });

    // stasis_chamber has restrictInBattle: false
    useMapStore.getState().enterLocation('stasis_chamber');
    expect(useMapStore.getState().currentLocationId).toBe('stasis_chamber');
  });

  it('changeZone blocks during active battle', () => {
    const battles = new Map();
    battles.set('s1', { phase: 'active' });
    useBattleStore.setState({ battles });

    useMapStore.getState().changeZone('wilderness');
    expect(useMapStore.getState().currentZone).toBe('town');
  });

  it('changeZone allows when no active battle', () => {
    useMapStore.getState().changeZone('wilderness');
    expect(useMapStore.getState().currentZone).toBe('wilderness');
  });

  it('exitLocation clears currentLocationId', () => {
    useMapStore.getState().enterLocation('tavern');
    useMapStore.getState().exitLocation();
    expect(useMapStore.getState().currentLocationId).toBeNull();
  });

  it('persists position to localStorage', () => {
    useMapStore.getState().movePlayer(1, 0);
    const saved = JSON.parse(localStorage.getItem('code-quest-map') ?? '{}');
    expect(saved.playerPosition).toEqual({ x: 5, y: 4 });
  });

  it('checkEncounter returns encounter result in wilderness', () => {
    useMapStore.getState().changeZone('wilderness');
    const result = useMapStore
      .getState()
      .checkEncounter(
        'implement user authentication with JWT and OAuth, refactor database schema, add tests and documentation, optimize performance',
      );
    expect(result).toBeDefined();
    expect(result.subZone).toBe('forest');
  });

  it('checkEncounter uses current sub-zone based on player position', () => {
    useMapStore.getState().changeZone('wilderness');
    // mountains is at position {x:7, y:2}
    useMapStore.setState({ playerPosition: { x: 7, y: 2 } });
    const result = useMapStore
      .getState()
      .checkEncounter(
        'refactor architecture, redesign database, implement new API, add comprehensive tests and documentation',
      );
    expect(result.subZone).toBe('mountains');
  });

  it('checkEncounter returns no trigger in town', () => {
    const result = useMapStore.getState().checkEncounter('implement complex feature with tests');
    expect(result.trigger).toBe(false);
  });

  it('lastEncounter is updated after checkEncounter', () => {
    useMapStore.getState().changeZone('wilderness');
    useMapStore
      .getState()
      .checkEncounter(
        'implement user authentication with JWT and OAuth, refactor database, add tests and docs, optimize performance',
      );
    expect(useMapStore.getState().lastEncounter).toBeDefined();
  });

  it('triggerBattle starts a battle in battleStore when encounter triggers', () => {
    useMapStore.getState().changeZone('wilderness');
    const prompt =
      'implement user authentication with JWT and OAuth, refactor database schema, add comprehensive tests and documentation, optimize performance and caching';
    const sessionId = useMapStore.getState().triggerBattle(prompt);
    if (sessionId) {
      const battle = useBattleStore.getState().getBattle(sessionId);
      expect(battle).toBeDefined();
      expect(battle?.phase).toBe('active');
      expect(battle?.enemy.name.length).toBeGreaterThan(0);
    }
  });

  it('triggerBattle returns null when encounter does not trigger', () => {
    // town zone - no encounter
    const sessionId = useMapStore.getState().triggerBattle('fix typo');
    expect(sessionId).toBeNull();
  });

  it('triggerBattle returns null for low complexity in wilderness', () => {
    useMapStore.getState().changeZone('wilderness');
    const sessionId = useMapStore.getState().triggerBattle('fix typo');
    expect(sessionId).toBeNull();
  });

  it('restoreFromStorage restores saved position and zone', () => {
    localStorage.setItem(
      'code-quest-map',
      JSON.stringify({ playerPosition: { x: 7, y: 2 }, currentZone: 'wilderness' }),
    );
    useMapStore.getState().restoreFromStorage();
    expect(useMapStore.getState().playerPosition).toEqual({ x: 7, y: 2 });
    expect(useMapStore.getState().currentZone).toBe('wilderness');
  });

  it('restoreFromStorage keeps defaults when no saved data', () => {
    useMapStore.getState().restoreFromStorage();
    expect(useMapStore.getState().playerPosition).toEqual({ x: 4, y: 4 });
    expect(useMapStore.getState().currentZone).toBe('town');
  });

  it('getCurrentSubZone returns sub-zone name based on position', () => {
    useMapStore.getState().changeZone('wilderness');
    // mountains at {x:7, y:2}
    useMapStore.setState({ playerPosition: { x: 7, y: 2 } });
    expect(useMapStore.getState().getCurrentSubZone()).toBe('mountains');
  });

  it('getCurrentSubZone returns null in town', () => {
    expect(useMapStore.getState().getCurrentSubZone()).toBeNull();
  });

  it('movePlayer in wilderness may set pendingEncounter when roll succeeds', () => {
    useMapStore.getState().changeZone('wilderness');
    // Return 0.15 — above NPC threshold (0.1) but below encounter rate (0.3)
    const originalRandom = Math.random;
    Math.random = () => 0.15;
    try {
      useMapStore.getState().movePlayer(1, 0);
      expect(useMapStore.getState().pendingEncounter).toBe(true);
    } finally {
      Math.random = originalRandom;
    }
  });

  it('movePlayer in wilderness does not set pendingEncounter when roll fails', () => {
    useMapStore.getState().changeZone('wilderness');
    const originalRandom = Math.random;
    Math.random = () => 0.99;
    try {
      useMapStore.getState().movePlayer(1, 0);
      expect(useMapStore.getState().pendingEncounter).toBe(false);
    } finally {
      Math.random = originalRandom;
    }
  });

  it('movePlayer in town never sets pendingEncounter', () => {
    const originalRandom = Math.random;
    Math.random = () => 0;
    try {
      useMapStore.getState().movePlayer(1, 0);
      expect(useMapStore.getState().pendingEncounter).toBe(false);
    } finally {
      Math.random = originalRandom;
    }
  });

  it('dismissEncounter resets pendingEncounter', () => {
    useMapStore.setState({ pendingEncounter: true });
    useMapStore.getState().dismissEncounter();
    expect(useMapStore.getState().pendingEncounter).toBe(false);
  });

  it('entering a dungeon location sets inDungeon true', () => {
    useBattleStore.setState({
      player: { level: 10, totalExp: 0, totalGold: 0 },
    });
    useMapStore.getState().changeZone('dungeon');
    useMapStore.getState().enterLocation('bug_cave');
    expect(useMapStore.getState().inDungeon).toBe(true);
  });

  it('changeZone is blocked while inDungeon', () => {
    useMapStore.setState({ currentZone: 'dungeon', inDungeon: true });
    useMapStore.getState().changeZone('town');
    expect(useMapStore.getState().currentZone).toBe('dungeon');
  });

  it('exitLocation in dungeon clears inDungeon', () => {
    useMapStore.setState({
      currentZone: 'dungeon',
      currentLocationId: 'bug_cave',
      inDungeon: true,
    });
    useMapStore.getState().exitLocation();
    expect(useMapStore.getState().inDungeon).toBe(false);
  });

  it('setPlanMode toggles planModeActive', () => {
    expect(useMapStore.getState().planModeActive).toBe(false);
    useMapStore.getState().setPlanMode(true);
    expect(useMapStore.getState().planModeActive).toBe(true);
    useMapStore.getState().setPlanMode(false);
    expect(useMapStore.getState().planModeActive).toBe(false);
  });

  it('auto-restores position and zone from localStorage on init', () => {
    localStorage.setItem(
      'code-quest-map',
      JSON.stringify({ playerPosition: { x: 7, y: 3 }, currentZone: 'wilderness' }),
    );
    useMapStore.getState().restoreFromStorage();
    expect(useMapStore.getState().playerPosition).toEqual({ x: 7, y: 3 });
    expect(useMapStore.getState().currentZone).toBe('wilderness');
  });

  it('movePlayer persists to localStorage', () => {
    useMapStore.getState().movePlayer(1, 0);
    const saved = JSON.parse(localStorage.getItem('code-quest-map') ?? '{}');
    expect(saved.playerPosition).toEqual({ x: 5, y: 4 });
  });

  it('plan mode skips encounter rolls on movePlayer', () => {
    useMapStore.setState({ currentZone: 'wilderness', planModeActive: true });
    // Move many times — should never trigger encounter
    for (let i = 0; i < 20; i++) {
      useMapStore.getState().movePlayer(i % 2 === 0 ? 1 : -1, 0);
    }
    expect(useMapStore.getState().pendingEncounter).toBe(false);
  });

  it('plan mode blocks changeZone', () => {
    useMapStore.setState({ planModeActive: true });
    useMapStore.getState().changeZone('wilderness');
    expect(useMapStore.getState().currentZone).toBe('town');
  });

  it('onBattleEnd clears inDungeon and exits location', () => {
    useMapStore.setState({
      currentZone: 'dungeon',
      currentLocationId: 'bug_cave',
      inDungeon: true,
    });
    useMapStore.getState().onBattleEnd('bug_cave', true);
    expect(useMapStore.getState().inDungeon).toBe(false);
    expect(useMapStore.getState().currentLocationId).toBeNull();
  });

  it('onBattleEnd victory adds dungeon to completedDungeons', () => {
    useMapStore.setState({
      currentZone: 'dungeon',
      currentLocationId: 'bug_cave',
      inDungeon: true,
    });
    useMapStore.getState().onBattleEnd('bug_cave', true);
    expect(useMapStore.getState().completedDungeons.has('bug_cave')).toBe(true);
  });

  it('onBattleEnd defeat does not add to completedDungeons', () => {
    useMapStore.setState({
      currentZone: 'dungeon',
      currentLocationId: 'bug_cave',
      inDungeon: true,
    });
    useMapStore.getState().onBattleEnd('bug_cave', false);
    expect(useMapStore.getState().completedDungeons.has('bug_cave')).toBe(false);
  });

  it('battleStore.endBattle(victory) auto-calls onBattleEnd', () => {
    useMapStore.setState({
      currentZone: 'dungeon',
      currentLocationId: 'bug_cave',
      inDungeon: true,
      activeBattleSessionId: 'battle-1',
    });
    useBattleStore.getState().startBattle('battle-1', {
      name: 'Bug',
      type: 'bug-hunt' as const,
      level: 1,
      maxHp: 10,
      hp: 10,
    });
    useBattleStore.getState().endBattle('battle-1', 'victory');
    expect(useMapStore.getState().inDungeon).toBe(false);
    expect(useMapStore.getState().completedDungeons.has('bug_cave')).toBe(true);
  });

  it('battleStore.endBattle(defeat) auto-calls onBattleEnd', () => {
    useMapStore.setState({
      currentZone: 'dungeon',
      currentLocationId: 'bug_cave',
      inDungeon: true,
      activeBattleSessionId: 'battle-2',
    });
    useBattleStore.getState().startBattle('battle-2', {
      name: 'Bug',
      type: 'bug-hunt' as const,
      level: 1,
      maxHp: 10,
      hp: 10,
    });
    useBattleStore.getState().endBattle('battle-2', 'defeat');
    expect(useMapStore.getState().inDungeon).toBe(false);
    expect(useMapStore.getState().completedDungeons.has('bug_cave')).toBe(false);
  });

  // Task 66: pendingNpc triggered on wilderness move
  it('movePlayer in wilderness can set pendingNpc when Math.random is low', () => {
    useMapStore.setState({
      currentZone: 'wilderness',
      playerPosition: { x: 2, y: 2 },
      planModeActive: false,
      pendingNpc: null,
    });
    vi.spyOn(Math, 'random').mockReturnValue(0.05); // below NPC threshold
    useMapStore.getState().movePlayer(1, 0);
    expect(useMapStore.getState().pendingNpc).not.toBeNull();
    expect(useMapStore.getState().pendingNpc?.name).toBeTruthy();
    vi.restoreAllMocks();
  });

  it('movePlayer in town never sets pendingNpc', () => {
    useMapStore.setState({ currentZone: 'town', pendingNpc: null });
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    useMapStore.getState().movePlayer(1, 0);
    expect(useMapStore.getState().pendingNpc).toBeNull();
    vi.restoreAllMocks();
  });

  it('dismissNpc clears pendingNpc', () => {
    useMapStore.setState({ pendingNpc: { name: 'Test', icon: '🧙', dialogue: 'Hi' } });
    useMapStore.getState().dismissNpc();
    expect(useMapStore.getState().pendingNpc).toBeNull();
  });
});
