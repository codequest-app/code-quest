import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBattleStore } from '../../../stores/battleStore';
import { BattleOverlay } from '../BattleOverlay';

describe('BattleOverlay', () => {
  beforeEach(() => {
    useBattleStore.setState({
      battles: new Map(),
      prompts: new Map(),
      player: { level: 1, totalExp: 0, totalGold: 0 },
    });
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

  it('renders ProgressBar in enemy display and player status', () => {
    useBattleStore.getState().startBattle('s1', {
      name: 'Test',
      type: 'general',
      level: 1,
      hp: 50,
      maxHp: 100,
    });

    render(<BattleOverlay sessionId="s1" />);
    expect(screen.getAllByTestId('progress-bar-hp').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('progress-bar-mp')).toBeDefined();
  });

  it('fades out after victory with delay', () => {
    vi.useFakeTimers();
    useBattleStore.getState().startBattle('s1', {
      name: 'Test',
      type: 'general',
      level: 1,
      hp: 0,
      maxHp: 100,
    });
    useBattleStore.getState().updateBattle('s1', { phase: 'victory' });

    render(<BattleOverlay sessionId="s1" />);
    const overlay = screen.getByTestId('battle-overlay');
    expect(overlay.className).not.toContain('battle-overlay-fading');

    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(overlay.className).toContain('battle-overlay-fading');

    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(screen.queryByTestId('battle-overlay')).toBeNull();

    vi.useRealTimers();
  });

  it('shows StasisOverlay when battle is paused for plan_mode', () => {
    useBattleStore.getState().startBattle('s1', {
      name: 'Test',
      type: 'general',
      level: 1,
      hp: 100,
      maxHp: 100,
    });
    useBattleStore.getState().updateBattle('s1', { isPaused: true, pauseReason: 'plan_mode' });

    render(<BattleOverlay sessionId="s1" />);
    expect(screen.getByTestId('stasis-overlay')).toBeInTheDocument();
  });

  it('shows RPGQuestionModal when paused with question', () => {
    useBattleStore.getState().startBattle('s1', {
      name: 'Test',
      type: 'general',
      level: 1,
      hp: 100,
      maxHp: 100,
    });
    useBattleStore.getState().updateBattle('s1', {
      isPaused: true,
      pauseReason: 'question',
      activeDialogue: { question: 'Which?', options: ['A', 'B'] },
    });

    render(<BattleOverlay sessionId="s1" />);
    expect(screen.getByTestId('rpg-question-modal')).toBeInTheDocument();
    expect(screen.getByText('Which?')).toBeInTheDocument();
  });

  it('shows RPGPermissionModal when paused with permission', () => {
    useBattleStore.getState().startBattle('s1', {
      name: 'Test',
      type: 'general',
      level: 1,
      hp: 100,
      maxHp: 100,
    });
    useBattleStore.getState().updateBattle('s1', {
      isPaused: true,
      pauseReason: 'permission',
      activeTrap: { toolName: 'Bash', description: 'run command', riskLevel: 'high' },
    });

    render(<BattleOverlay sessionId="s1" />);
    expect(screen.getByTestId('rpg-permission-modal')).toBeInTheDocument();
    expect(screen.getByText('罠を発見！')).toBeInTheDocument();
  });

  it('does not show modals when battle is not paused', () => {
    useBattleStore.getState().startBattle('s1', {
      name: 'Test',
      type: 'general',
      level: 1,
      hp: 100,
      maxHp: 100,
    });

    render(<BattleOverlay sessionId="s1" />);
    expect(screen.queryByTestId('stasis-overlay')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rpg-question-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rpg-permission-modal')).not.toBeInTheDocument();
  });
});
