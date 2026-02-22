import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LocationInterior } from '../LocationInterior';

const location = {
  id: 'tavern',
  name: 'Tavern',
  icon: '🍺',
  zone: 'town' as const,
  position: { x: 1, y: 3 },
  enterable: true,
  requiresLevel: 1,
  description: 'A friendly tavern where you can chat with the AI bartender.',
  restrictInBattle: false,
  shortcutKey: 'H',
};

describe('LocationInterior', () => {
  it('renders location name and icon', () => {
    render(<LocationInterior location={location} onExit={vi.fn()} />);
    expect(screen.getByTestId('location-interior')).toHaveTextContent('Tavern');
    expect(screen.getByTestId('location-interior')).toHaveTextContent('🍺');
  });

  it('renders location description', () => {
    render(<LocationInterior location={location} onExit={vi.fn()} />);
    expect(screen.getByTestId('location-interior')).toHaveTextContent('A friendly tavern');
  });

  it('calls onExit when exit button is clicked', () => {
    const onExit = vi.fn();
    render(<LocationInterior location={location} onExit={onExit} />);
    fireEvent.click(screen.getByTestId('location-exit-btn'));
    expect(onExit).toHaveBeenCalledOnce();
  });

  it('calls onExit when Escape key is pressed', () => {
    const onExit = vi.fn();
    render(<LocationInterior location={location} onExit={onExit} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onExit).toHaveBeenCalledOnce();
  });
});
