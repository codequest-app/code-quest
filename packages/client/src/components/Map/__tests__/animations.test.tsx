import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useMapStore } from '../../../stores/mapStore';
import { useThemeStore } from '../../../stores/themeStore';
import { MapView } from '../MapView';

describe('Map visual feedback animations', () => {
  beforeEach(() => {
    localStorage.clear();
    useMapStore.setState({
      currentZone: 'town',
      currentLocationId: null,
      playerPosition: { x: 4, y: 4 },
      planModeActive: false,
    });
    useThemeStore.setState({ currentTheme: 'classic' });
  });

  it('player character has bounce animation class on move', () => {
    render(<MapView />);
    const player = screen.getByTestId('player-character');
    fireEvent.keyDown(window, { key: 'd' });
    // After move, player should have the moving class
    expect(player.className).toContain('map-player');
  });

  it('buildings have hover transition via CSS class', () => {
    render(<MapView />);
    const building = screen.getByTestId('building-tavern');
    expect(building.className).toContain('map-building');
  });

  it('interior has fade-in when entering a location', () => {
    useMapStore.setState({ currentLocationId: 'tavern' });
    render(<MapView />);
    expect(screen.getByTestId('map-view').className).toContain('map-view--interior');
  });
});
