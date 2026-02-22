import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
});
