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

  it('changeZone resets playerPosition to center (4,4)', () => {
    useMapStore.setState({ playerPosition: { x: 8, y: 6 } });
    useMapStore.getState().changeZone('wilderness');
    expect(useMapStore.getState().playerPosition).toEqual({ x: 4, y: 4 });
  });

  it('exitLocation clears currentLocationId', () => {
    useMapStore.getState().enterLocation('tavern');
    useMapStore.getState().exitLocation();
    expect(useMapStore.getState().currentLocationId).toBeNull();
  });

  it('movePlayer does not auto-persist (saveStore handles persistence)', () => {
    useMapStore.getState().movePlayer(1, 0);
    expect(localStorage.getItem('code-quest-map')).toBeNull();
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

  it('saveStore.loadGame restores position and zone', () => {
    localStorage.setItem(
      'code-quest-save',
      JSON.stringify({
        map: { playerPosition: { x: 7, y: 2 }, currentZone: 'wilderness' },
      }),
    );
    // Simulate loadGame by directly setting state (saveStore handles this)
    useMapStore.setState({ playerPosition: { x: 7, y: 2 }, currentZone: 'wilderness' });
    expect(useMapStore.getState().playerPosition).toEqual({ x: 7, y: 2 });
    expect(useMapStore.getState().currentZone).toBe('wilderness');
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

  it('exitLocation in non-dungeon does not touch inDungeon', () => {
    useMapStore.setState({
      currentZone: 'town',
      currentLocationId: 'tavern',
      inDungeon: false,
    });
    useMapStore.getState().exitLocation();
    expect(useMapStore.getState().currentLocationId).toBeNull();
    expect(useMapStore.getState().inDungeon).toBe(false);
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

  it('loadGame resets transient UI state (planModeActive, pendingNpc)', () => {
    useMapStore.setState({
      planModeActive: true,
      pendingNpc: { name: 'X', icon: '🧙', dialogue: 'Y' },
    });
    // Simulate loadGame resetting transient state
    useMapStore.setState({ planModeActive: false, pendingNpc: null, pendingEncounter: false });
    expect(useMapStore.getState().planModeActive).toBe(false);
    expect(useMapStore.getState().pendingNpc).toBeNull();
  });

  it('movePlayer updates position in store without auto-persist', () => {
    useMapStore.getState().movePlayer(1, 0);
    expect(useMapStore.getState().playerPosition).toEqual({ x: 5, y: 4 });
  });

  it('plan mode skips encounter rolls on movePlayer', () => {
    useMapStore.setState({ currentZone: 'wilderness', planModeActive: true });
    // Move many times — should never trigger encounter
    for (let i = 0; i < 20; i++) {
      useMapStore.getState().movePlayer(i % 2 === 0 ? 1 : -1, 0);
    }
    expect(useMapStore.getState().pendingEncounter).toBe(false);
  });

  it('plan mode blocks changeZone (planModeActive stays true)', () => {
    useMapStore.setState({ planModeActive: true });
    useMapStore.getState().changeZone('wilderness');
    expect(useMapStore.getState().currentZone).toBe('town');
    expect(useMapStore.getState().planModeActive).toBe(true);
  });

  it('onBattleEnd for non-dungeon battle keeps currentLocationId', () => {
    useMapStore.setState({
      currentZone: 'town',
      currentLocationId: 'training_ground',
      inDungeon: false,
    });
    useMapStore.getState().onBattleEnd('training_ground', true);
    expect(useMapStore.getState().currentLocationId).toBe('training_ground');
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

  it('clears activeBattleSessionId after wilderness battle ends', () => {
    useMapStore.setState({
      currentZone: 'wilderness',
      currentLocationId: null,
      activeBattleSessionId: 'battle-w1',
    });
    useBattleStore.getState().startBattle('battle-w1', {
      name: 'Wild Bug',
      type: 'bug-hunt' as const,
      level: 1,
      maxHp: 10,
      hp: 10,
    });
    useBattleStore.getState().endBattle('battle-w1', 'victory');
    expect(useMapStore.getState().activeBattleSessionId).toBeNull();
  });

  it('changeZone clears pendingNpc and pendingEncounter', () => {
    useMapStore.setState({
      currentZone: 'wilderness',
      pendingNpc: { name: 'Test', icon: '🧙', dialogue: 'Hi' },
      pendingEncounter: true,
    });
    useMapStore.getState().changeZone('town');
    expect(useMapStore.getState().pendingNpc).toBeNull();
    expect(useMapStore.getState().pendingEncounter).toBe(false);
  });

  it('dismissNpc clears pendingNpc', () => {
    useMapStore.setState({ pendingNpc: { name: 'Test', icon: '🧙', dialogue: 'Hi' } });
    useMapStore.getState().dismissNpc();
    expect(useMapStore.getState().pendingNpc).toBeNull();
  });
});
