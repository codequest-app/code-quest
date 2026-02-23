import { render, screen } from '@testing-library/react';
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
});
