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
});
