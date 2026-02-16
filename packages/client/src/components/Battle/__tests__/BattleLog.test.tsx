import type { BattleLogEntry } from '@code-quest/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BattleLog } from '../BattleLog';

describe('BattleLog', () => {
  it('renders log entries', () => {
    const entries: BattleLogEntry[] = [
      { id: '1', timestamp: Date.now(), message: 'Battle started!', type: 'info' },
      { id: '2', timestamp: Date.now(), message: 'Used 讀心術!', type: 'skill' },
    ];
    render(<BattleLog entries={entries} />);
    expect(screen.getByText('Battle started!')).toBeDefined();
    expect(screen.getByText('Used 讀心術!')).toBeDefined();
  });

  it('renders empty when no entries', () => {
    render(<BattleLog entries={[]} />);
    const log = screen.getByTestId('battle-log');
    expect(log.children).toHaveLength(0);
  });
});
