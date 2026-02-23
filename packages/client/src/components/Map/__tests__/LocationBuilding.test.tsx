import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBattleStore } from '../../../stores/battleStore';
import { LocationBuilding } from '../LocationBuilding';

const location = {
  id: 'guild_hall',
  name: 'Guild Hall',
  icon: '🏛️',
  zone: 'town' as const,
  position: { x: 4, y: 1 },
  enterable: true,
  requiresLevel: 1,
  description: 'Worktree management center.',
  restrictInBattle: false,
};

describe('LocationBuilding', () => {
  beforeEach(() => {
    useBattleStore.setState({
      player: { level: 1, totalExp: 0, totalGold: 0 },
    });
  });

  it('displays icon and name', () => {
    render(<LocationBuilding location={location} onEnter={vi.fn()} />);
    expect(screen.getByTestId('building-guild_hall')).toHaveTextContent('🏛️');
    expect(screen.getByTestId('building-guild_hall')).toHaveTextContent('Guild Hall');
  });

  it('calls onEnter when clicked', () => {
    const onEnter = vi.fn();
    render(<LocationBuilding location={location} onEnter={onEnter} />);
    fireEvent.click(screen.getByTestId('building-guild_hall'));
    expect(onEnter).toHaveBeenCalledWith('guild_hall');
  });

  it('positions at correct grid cell', () => {
    render(<LocationBuilding location={location} onEnter={vi.fn()} />);
    const el = screen.getByTestId('building-guild_hall');
    expect(el.style.gridColumn).toBe('5');
    expect(el.style.gridRow).toBe('2');
  });

  it('shows lock icon when requiresLevel > playerLevel', () => {
    const locked = { ...location, id: 'dungeon', requiresLevel: 5 };
    render(<LocationBuilding location={locked} onEnter={vi.fn()} />);
    const el = screen.getByTestId('building-dungeon');
    expect(el).toHaveTextContent('🔒');
    expect(el.className).toContain('map-building--locked');
  });

  it('does not show lock when player level is sufficient', () => {
    useBattleStore.setState({ player: { level: 5, totalExp: 0, totalGold: 0 } });
    const locked = { ...location, id: 'dungeon', requiresLevel: 5 };
    render(<LocationBuilding location={locked} onEnter={vi.fn()} />);
    const el = screen.getByTestId('building-dungeon');
    expect(el).not.toHaveTextContent('🔒');
    expect(el.className).not.toContain('map-building--locked');
  });
});
