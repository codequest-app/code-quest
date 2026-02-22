import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MapControls } from '../MapControls';

describe('MapControls', () => {
  it('displays WASD hint', () => {
    render(<MapControls />);
    expect(screen.getByTestId('map-controls')).toHaveTextContent('WASD');
  });

  it('displays Enter hint', () => {
    render(<MapControls />);
    expect(screen.getByTestId('map-controls')).toHaveTextContent('Enter');
  });
});
