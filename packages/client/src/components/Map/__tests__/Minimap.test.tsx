import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useMapStore } from '../../../stores/mapStore';
import { Minimap } from '../Minimap';

describe('Minimap', () => {
  beforeEach(() => {
    useMapStore.setState({
      currentZone: 'town',
      playerPosition: { x: 4, y: 4 },
    });
  });

  it('renders minimap container', () => {
    render(<Minimap />);
    expect(screen.getByTestId('minimap')).toBeInTheDocument();
  });

  it('renders location dots for town', () => {
    render(<Minimap />);
    const dots = screen.getByTestId('minimap').querySelectorAll('.minimap-dot');
    expect(dots.length).toBeGreaterThan(0);
  });

  it('renders player dot', () => {
    render(<Minimap />);
    expect(screen.getByTestId('minimap-player')).toBeInTheDocument();
  });

  it('player dot position reflects store', () => {
    useMapStore.setState({ playerPosition: { x: 2, y: 3 } });
    render(<Minimap />);
    const dot = screen.getByTestId('minimap-player');
    expect(dot.style.left).toBe('20%');
    expect(dot.style.top).toBe('37.5%');
  });

  // Task 65: Clickable minimap
  it('clicking a location dot moves player to that position', () => {
    render(<Minimap />);
    const dots = screen.getByTestId('minimap').querySelectorAll('[data-testid^="minimap-loc-"]');
    expect(dots.length).toBeGreaterThan(0);
    fireEvent.click(dots[0]);
    const pos = useMapStore.getState().playerPosition;
    // Player should have moved (not at default 4,4 anymore)
    expect(pos.x !== 4 || pos.y !== 4).toBe(true);
  });
});
