import type { Enemy } from '@code-quest/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EnemyDisplay } from '../EnemyDisplay';

const enemy: Enemy = {
  name: 'Bug Slime',
  type: 'bug-hunt',
  level: 3,
  hp: 200,
  maxHp: 300,
};

describe('EnemyDisplay', () => {
  it('renders enemy name and level', () => {
    render(<EnemyDisplay enemy={enemy} />);
    expect(screen.getByTestId('enemy-name')).toHaveTextContent('Bug Slime');
    expect(screen.getByTestId('enemy-level')).toHaveTextContent('Lv.3');
  });

  it('renders ProgressBar for HP', () => {
    render(<EnemyDisplay enemy={enemy} />);
    const fill = screen.getByTestId('progress-fill-hp');
    // 200/300 ≈ 66.67%
    expect(fill.style.width).toContain('66');
  });

  it('shows HP text', () => {
    render(<EnemyDisplay enemy={enemy} />);
    expect(screen.getByTestId('enemy-hp-text')).toHaveTextContent('200 / 300');
  });
});
