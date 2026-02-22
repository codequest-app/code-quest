import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlayerCharacter } from '../PlayerCharacter';

describe('PlayerCharacter', () => {
  it('renders at correct grid position', () => {
    render(<PlayerCharacter position={{ x: 3, y: 5 }} />);
    const el = screen.getByTestId('player-character');
    expect(el.style.gridColumn).toBe('4');
    expect(el.style.gridRow).toBe('6');
  });

  it('displays player emoji', () => {
    render(<PlayerCharacter position={{ x: 0, y: 0 }} />);
    expect(screen.getByTestId('player-character')).toHaveTextContent('🧙');
  });
});
