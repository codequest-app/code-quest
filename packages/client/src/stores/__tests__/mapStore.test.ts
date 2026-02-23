import { beforeEach, describe, expect, it } from 'vitest';
import { useBattleStore } from '../battleStore';
import { useMapStore } from '../mapStore';

describe('mapStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useMapStore.setState({
      currentZone: 'town',
      currentLocationId: null,
      playerPosition: { x: 4, y: 4 },
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
});
