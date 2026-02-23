import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useMapStore } from '../../../stores/mapStore';
import { useThemeStore } from '../../../stores/themeStore';
import { MapView } from '../MapView';

describe('MapView', () => {
  beforeEach(() => {
    localStorage.clear();
    useMapStore.setState({
      currentZone: 'town',
      currentLocationId: null,
      playerPosition: { x: 4, y: 4 },
    });
    useThemeStore.setState({ currentTheme: 'classic' });
  });

  it('renders all town buildings', () => {
    render(<MapView />);
    expect(screen.getByTestId('building-tavern')).toBeDefined();
    expect(screen.getByTestId('building-shopping_district')).toBeDefined();
    expect(screen.getByTestId('building-stasis_chamber')).toBeDefined();
    expect(screen.getByTestId('building-guild_hall')).toBeDefined();
    expect(screen.getByTestId('building-player_home')).toBeDefined();
  });

  it('renders player character', () => {
    render(<MapView />);
    expect(screen.getByTestId('player-character')).toBeDefined();
  });

  it('applies theme CSS class', () => {
    render(<MapView />);
    expect(screen.getByTestId('map-view').classList.contains('map-view--classic')).toBe(true);
  });

  it('WASD keys move player', () => {
    render(<MapView />);
    fireEvent.keyDown(window, { key: 'd' });
    expect(useMapStore.getState().playerPosition.x).toBe(5);

    fireEvent.keyDown(window, { key: 'a' });
    expect(useMapStore.getState().playerPosition.x).toBe(4);

    fireEvent.keyDown(window, { key: 'w' });
    expect(useMapStore.getState().playerPosition.y).toBe(3);

    fireEvent.keyDown(window, { key: 's' });
    expect(useMapStore.getState().playerPosition.y).toBe(4);
  });

  it('Arrow keys move player', () => {
    render(<MapView />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(useMapStore.getState().playerPosition.x).toBe(5);
  });

  it('renders status bar and controls', () => {
    render(<MapView />);
    expect(screen.getByTestId('map-status-bar')).toBeDefined();
    expect(screen.getByTestId('map-controls')).toBeDefined();
  });

  it('shows interior view when a location is entered', () => {
    useMapStore.setState({ currentLocationId: 'tavern' });
    render(<MapView />);
    expect(screen.getByTestId('location-interior')).toBeDefined();
    expect(screen.queryByTestId('player-character')).toBeNull();
  });

  it('exits interior and returns to grid on exit button', () => {
    useMapStore.setState({ currentLocationId: 'tavern' });
    render(<MapView />);
    fireEvent.click(screen.getByTestId('location-exit-btn'));
    expect(useMapStore.getState().currentLocationId).toBeNull();
    expect(screen.getByTestId('player-character')).toBeDefined();
  });

  it('renders wilderness locations when zone is wilderness', () => {
    useMapStore.setState({ currentZone: 'wilderness', playerPosition: { x: 2, y: 2 } });
    render(<MapView />);
    expect(screen.getByTestId('building-forest')).toBeInTheDocument();
    expect(screen.getByTestId('building-mountains')).toBeInTheDocument();
    expect(screen.getByTestId('building-wasteland')).toBeInTheDocument();
    expect(screen.getByTestId('building-volcano')).toBeInTheDocument();
    expect(screen.queryByTestId('building-tavern')).toBeNull();
  });

  it('switches from town to wilderness via zone button after confirmation', () => {
    render(<MapView />);
    fireEvent.click(screen.getByTestId('zone-btn-wilderness'));
    fireEvent.click(screen.getByTestId('zone-confirm-btn'));
    expect(useMapStore.getState().currentZone).toBe('wilderness');
    expect(screen.getByTestId('building-forest')).toBeInTheDocument();
  });

  it('renders dungeon locations when zone is dungeon', () => {
    useMapStore.setState({ currentZone: 'dungeon', playerPosition: { x: 2, y: 3 } });
    render(<MapView />);
    expect(screen.getByTestId('building-bug_cave')).toBeInTheDocument();
    expect(screen.getByTestId('building-arch_maze')).toBeInTheDocument();
    expect(screen.getByTestId('building-legacy_tomb')).toBeInTheDocument();
  });

  it('shows zone confirmation dialog when switching zones', () => {
    render(<MapView />);
    fireEvent.click(screen.getByTestId('zone-btn-wilderness'));
    expect(screen.getByTestId('zone-confirm-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('zone-confirm-dialog')).toHaveTextContent('Wilderness');
  });

  it('confirms zone change on confirm button', () => {
    render(<MapView />);
    fireEvent.click(screen.getByTestId('zone-btn-wilderness'));
    fireEvent.click(screen.getByTestId('zone-confirm-btn'));
    expect(useMapStore.getState().currentZone).toBe('wilderness');
    expect(screen.queryByTestId('zone-confirm-dialog')).toBeNull();
  });

  it('cancels zone change on cancel button', () => {
    render(<MapView />);
    fireEvent.click(screen.getByTestId('zone-btn-wilderness'));
    fireEvent.click(screen.getByTestId('zone-cancel-btn'));
    expect(useMapStore.getState().currentZone).toBe('town');
    expect(screen.queryByTestId('zone-confirm-dialog')).toBeNull();
  });

  it('shows encounter overlay when pendingEncounter is true', () => {
    useMapStore.setState({ currentZone: 'wilderness', pendingEncounter: true });
    render(<MapView />);
    expect(screen.getByTestId('encounter-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('encounter-overlay')).toHaveTextContent('Encounter');
  });

  it('encounter overlay Fight button dismisses and does not crash', () => {
    useMapStore.setState({ currentZone: 'wilderness', pendingEncounter: true });
    render(<MapView />);
    fireEvent.click(screen.getByTestId('encounter-fight-btn'));
    expect(useMapStore.getState().pendingEncounter).toBe(false);
  });

  it('encounter overlay Flee button dismisses encounter', () => {
    useMapStore.setState({ currentZone: 'wilderness', pendingEncounter: true });
    render(<MapView />);
    fireEvent.click(screen.getByTestId('encounter-flee-btn'));
    expect(useMapStore.getState().pendingEncounter).toBe(false);
    expect(screen.queryByTestId('encounter-overlay')).toBeNull();
  });

  it('no encounter overlay when pendingEncounter is false', () => {
    useMapStore.setState({ currentZone: 'wilderness', pendingEncounter: false });
    render(<MapView />);
    expect(screen.queryByTestId('encounter-overlay')).toBeNull();
  });

  it('wilderness map grid has sub-zone CSS modifier class', () => {
    useMapStore.setState({ currentZone: 'wilderness', playerPosition: { x: 2, y: 2 } });
    render(<MapView />);
    const grid = screen.getByTestId('map-view').querySelector('.map-view__grid');
    expect(grid?.className).toMatch(/map-view__grid--/);
  });

  it('town map grid has no sub-zone modifier', () => {
    useMapStore.setState({ currentZone: 'town' });
    render(<MapView />);
    const grid = screen.getByTestId('map-view').querySelector('.map-view__grid');
    expect(grid?.className).not.toMatch(/map-view__grid--/);
  });

  it('renders minimap component', () => {
    render(<MapView />);
    expect(screen.getByTestId('minimap')).toBeInTheDocument();
    expect(screen.getByTestId('minimap-player')).toBeInTheDocument();
  });

  it('minimap shows location dots for current zone', () => {
    useMapStore.setState({ currentZone: 'wilderness' });
    render(<MapView />);
    const minimap = screen.getByTestId('minimap');
    const dots = minimap.querySelectorAll('.minimap-dot:not(.minimap-player)');
    expect(dots.length).toBe(4); // forest, mountains, wasteland, volcano
  });

  it('shows interior class when inside a location', () => {
    useMapStore.setState({ currentLocationId: 'tavern' });
    render(<MapView />);
    expect(screen.getByTestId('map-view').className).toContain('map-view--interior');
  });
});
