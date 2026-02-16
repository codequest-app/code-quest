import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useBattleStore } from '../../../stores/battleStore';
import { BattleOverlay } from '../BattleOverlay';

describe('BattleOverlay', () => {
  beforeEach(() => {
    useBattleStore.setState({ battles: new Map() });
  });

  it('renders nothing when no battle exists', () => {
    const { container } = render(<BattleOverlay sessionId="s1" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders battle overlay when battle exists', () => {
    useBattleStore.getState().startBattle('s1', {
      name: 'Code Golem',
      type: 'code-task',
      level: 2,
      hp: 200,
      maxHp: 200,
    });

    render(<BattleOverlay sessionId="s1" />);
    expect(screen.getByTestId('battle-overlay')).toBeDefined();
    expect(screen.getByTestId('enemy-name')).toHaveTextContent('Code Golem');
    expect(screen.getByTestId('player-status')).toBeDefined();
    expect(screen.getByTestId('message-box')).toBeDefined();
  });

  it('shows victory message when phase is victory', () => {
    const store = useBattleStore.getState();
    store.startBattle('s1', {
      name: 'Bug Slime',
      type: 'bug-hunt',
      level: 1,
      hp: 100,
      maxHp: 100,
    });
    useBattleStore.getState().updateBattle('s1', {
      phase: 'victory',
      goldEarned: 50,
      expEarned: 30,
    });

    render(<BattleOverlay sessionId="s1" />);
    expect(screen.getByTestId('message-box')).toHaveTextContent('勝利');
  });
});
