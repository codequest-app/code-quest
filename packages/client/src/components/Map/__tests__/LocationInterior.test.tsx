import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LocationInterior } from '../LocationInterior';

function makeLoc(overrides: Partial<Parameters<typeof LocationInterior>[0]['location']> = {}) {
  return {
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
    ...overrides,
  };
}

describe('LocationInterior', () => {
  it('renders location name and icon', () => {
    render(<LocationInterior location={makeLoc()} onExit={vi.fn()} />);
    expect(screen.getByTestId('location-interior')).toHaveTextContent('Tavern');
    expect(screen.getByTestId('location-interior')).toHaveTextContent('🍺');
  });

  it('renders location description', () => {
    render(<LocationInterior location={makeLoc()} onExit={vi.fn()} />);
    expect(screen.getByTestId('location-interior')).toHaveTextContent('A friendly tavern');
  });

  it('calls onExit when exit button is clicked', () => {
    const onExit = vi.fn();
    render(<LocationInterior location={makeLoc()} onExit={onExit} />);
    fireEvent.click(screen.getByTestId('location-exit-btn'));
    expect(onExit).toHaveBeenCalledOnce();
  });

  it('calls onExit when Escape key is pressed', () => {
    const onExit = vi.fn();
    render(<LocationInterior location={makeLoc()} onExit={onExit} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onExit).toHaveBeenCalledOnce();
  });

  // Location-specific content tests
  it('renders tavern chat placeholder', () => {
    render(<LocationInterior location={makeLoc({ id: 'tavern' })} onExit={vi.fn()} />);
    expect(screen.getByTestId('interior-tavern')).toBeInTheDocument();
    expect(screen.getByTestId('interior-tavern')).toHaveTextContent('AI bartender');
  });

  it('renders shopping district with 7 sub-shops', () => {
    render(
      <LocationInterior
        location={makeLoc({ id: 'shopping_district', name: 'Shopping District', icon: '🏪' })}
        onExit={vi.fn()}
      />,
    );
    const el = screen.getByTestId('interior-shopping');
    expect(el).toBeInTheDocument();
    // 7 shops
    const shops = el.querySelectorAll('[data-testid^="shop-"]');
    expect(shops.length).toBe(7);
  });

  it('renders stasis chamber with plan mode placeholder', () => {
    render(
      <LocationInterior
        location={makeLoc({ id: 'stasis_chamber', name: 'Stasis Chamber', icon: '⏸️' })}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('interior-stasis')).toBeInTheDocument();
    expect(screen.getByTestId('interior-stasis')).toHaveTextContent('Plan Mode');
  });

  it('renders guild hall with worktree placeholder', () => {
    render(
      <LocationInterior
        location={makeLoc({ id: 'guild_hall', name: 'Guild Hall', icon: '🏛️' })}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('interior-guild')).toBeInTheDocument();
    expect(screen.getByTestId('interior-guild')).toHaveTextContent('Worktree');
  });

  it('renders player home with rest and settings', () => {
    render(
      <LocationInterior
        location={makeLoc({ id: 'player_home', name: 'Player Home', icon: '🏠' })}
        onExit={vi.fn()}
      />,
    );
    const el = screen.getByTestId('interior-home');
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent('Rest');
    expect(el).toHaveTextContent('Settings');
  });

  it('renders training ground placeholder', () => {
    render(
      <LocationInterior
        location={makeLoc({ id: 'training_ground', name: 'Training Ground', icon: '⚔️' })}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('interior-training')).toBeInTheDocument();
  });

  it('renders library placeholder', () => {
    render(
      <LocationInterior
        location={makeLoc({ id: 'library', name: 'Library', icon: '📚' })}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('interior-library')).toBeInTheDocument();
    expect(screen.getByTestId('interior-library')).toHaveTextContent('MCP');
  });

  it('player home rest button shows rested message on click', () => {
    render(
      <LocationInterior
        location={makeLoc({ id: 'player_home', name: 'Player Home', icon: '🏠' })}
        onExit={vi.fn()}
      />,
    );
    const restBtn = screen.getByText(/Rest/);
    fireEvent.click(restBtn);
    expect(screen.getByTestId('interior-home')).toHaveTextContent('fully rested');
  });
});
