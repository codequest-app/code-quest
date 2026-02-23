import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NpcEncounter } from '../NpcEncounter';

describe('NpcEncounter', () => {
  const npc = {
    name: 'Wandering Sage',
    icon: '🧙',
    dialogue: 'Beware of the volcano region, young coder.',
  };

  it('renders NPC name and icon', () => {
    render(<NpcEncounter npc={npc} onDismiss={vi.fn()} />);
    expect(screen.getByTestId('npc-encounter')).toHaveTextContent('Wandering Sage');
    expect(screen.getByTestId('npc-encounter')).toHaveTextContent('🧙');
  });

  it('renders dialogue text', () => {
    render(<NpcEncounter npc={npc} onDismiss={vi.fn()} />);
    expect(screen.getByTestId('npc-encounter')).toHaveTextContent('Beware of the volcano');
  });

  it('calls onDismiss when OK button clicked', () => {
    const onDismiss = vi.fn();
    render(<NpcEncounter npc={npc} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByTestId('npc-dismiss-btn'));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
