import type { BattleState } from '@code-quest/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlayerStatus } from '../PlayerStatus';

const battle: BattleState = {
  enemy: { name: 'Test', type: 'general', level: 1, hp: 100, maxHp: 100 },
  phase: 'active',
  playerLevel: 1,
  playerHp: 80,
  playerMaxHp: 100,
  playerMp: 30,
  playerMaxMp: 50,
  playerExp: 150,
  comboCount: 0,
  log: [],
  goldEarned: 0,
  expEarned: 0,
  isPaused: false,
};

describe('PlayerStatus', () => {
  it('renders HP, MP, and EXP', () => {
    render(<PlayerStatus battle={battle} />);
    expect(screen.getByTestId('player-hp')).toHaveTextContent('80/100');
    expect(screen.getByTestId('player-mp')).toHaveTextContent('30/50');
    expect(screen.getByTestId('player-exp')).toHaveTextContent('150');
  });

  it('uses ProgressBar for HP and MP', () => {
    render(<PlayerStatus battle={battle} />);
    expect(screen.getByTestId('progress-bar-hp')).toBeDefined();
    expect(screen.getByTestId('progress-bar-mp')).toBeDefined();
  });
});
