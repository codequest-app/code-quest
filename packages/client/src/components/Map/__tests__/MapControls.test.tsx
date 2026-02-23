import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useMapStore } from '../../../stores/mapStore';
import { MapControls } from '../MapControls';

describe('MapControls', () => {
  beforeEach(() => {
    useMapStore.setState({ playerPosition: { x: 4, y: 4 }, currentZone: 'town' });
  });

  it('displays WASD hint', () => {
    render(<MapControls />);
    expect(screen.getByTestId('map-controls')).toHaveTextContent('WASD');
  });

  it('displays Enter hint', () => {
    render(<MapControls />);
    expect(screen.getByTestId('map-controls')).toHaveTextContent('Enter');
  });

  it('renders touch D-pad buttons', () => {
    render(<MapControls />);
    expect(screen.getByTestId('dpad-up')).toBeInTheDocument();
    expect(screen.getByTestId('dpad-down')).toBeInTheDocument();
    expect(screen.getByTestId('dpad-left')).toBeInTheDocument();
    expect(screen.getByTestId('dpad-right')).toBeInTheDocument();
  });

  it('touch D-pad up moves player up', () => {
    render(<MapControls />);
    fireEvent.click(screen.getByTestId('dpad-up'));
    expect(useMapStore.getState().playerPosition.y).toBe(3);
  });

  it('touch D-pad right moves player right', () => {
    render(<MapControls />);
    fireEvent.click(screen.getByTestId('dpad-right'));
    expect(useMapStore.getState().playerPosition.x).toBe(5);
  });
});
