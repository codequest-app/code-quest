import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBattleStore } from '../../../stores/battleStore';
import { BattleOverlay } from '../BattleOverlay';

const defaultHandlers = {
  onQuestionAnswer: vi.fn(),
  onAllowTool: vi.fn(),
  onDenyTool: vi.fn(),
};

describe('BattleOverlay', () => {
  beforeEach(() => {
    useBattleStore.setState({
      battles: new Map(),
      prompts: new Map(),
      player: { level: 1, totalExp: 0, totalGold: 0 },
    });
  });

  it('renders nothing when no battle exists', () => {
    const { container } = render(<BattleOverlay sessionId="s1" {...defaultHandlers} />);
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

    render(<BattleOverlay sessionId="s1" {...defaultHandlers} />);
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

    render(<BattleOverlay sessionId="s1" {...defaultHandlers} />);
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

    render(<BattleOverlay sessionId="s1" {...defaultHandlers} />);
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

    render(<BattleOverlay sessionId="s1" {...defaultHandlers} />);
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

    render(<BattleOverlay sessionId="s1" {...defaultHandlers} />);
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

    render(<BattleOverlay sessionId="s1" {...defaultHandlers} />);
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

    render(<BattleOverlay sessionId="s1" {...defaultHandlers} />);
    expect(screen.getByTestId('rpg-permission-modal')).toBeInTheDocument();
    expect(screen.getByText('罠を発見！')).toBeInTheDocument();
  });

  it('shows model indicator when modelId is set', () => {
    useBattleStore.getState().startBattle('s1', {
      name: 'Test',
      type: 'general',
      level: 1,
      hp: 100,
      maxHp: 100,
    });
    useBattleStore.getState().updateBattle('s1', { modelId: 'opus' });

    render(<BattleOverlay sessionId="s1" {...defaultHandlers} />);
    expect(screen.getByTestId('model-indicator')).toHaveTextContent('👑');
    expect(screen.getByTestId('model-indicator')).toHaveTextContent('OPUS');
  });

  it('shows WorktreeIndicator when worktreePath is set', () => {
    useBattleStore.getState().startBattle('s1', {
      name: 'Test',
      type: 'general',
      level: 1,
      hp: 100,
      maxHp: 100,
    });
    useBattleStore.getState().updateBattle('s1', {
      worktreePath: '/tmp/wt-1',
      worktreeBranch: 'feat/task-1',
    });

    render(<BattleOverlay sessionId="s1" {...defaultHandlers} />);
    expect(screen.getByTestId('worktree-indicator')).toBeInTheDocument();
    expect(screen.getByText(/feat\/task-1/)).toBeInTheDocument();
  });

  it('does not show model indicator when modelId is absent', () => {
    useBattleStore.getState().startBattle('s1', {
      name: 'Test',
      type: 'general',
      level: 1,
      hp: 100,
      maxHp: 100,
    });

    render(<BattleOverlay sessionId="s1" {...defaultHandlers} />);
    expect(screen.queryByTestId('model-indicator')).not.toBeInTheDocument();
  });

  it('should call onQuestionAnswer with selected option when question option is selected', () => {
    const onQuestionAnswer = vi.fn();
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
      activeDialogue: { question: 'Which?', options: ['Option A', 'Option B'] },
    });

    render(
      <BattleOverlay sessionId="s1" {...defaultHandlers} onQuestionAnswer={onQuestionAnswer} />,
    );

    // Press Enter to select the first option (default selected index is 0)
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onQuestionAnswer).toHaveBeenCalledWith('s1', 'Option A');
  });

  it('should call onAllowTool when permission is allowed', () => {
    const onAllowTool = vi.fn();
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

    render(<BattleOverlay sessionId="s1" {...defaultHandlers} onAllowTool={onAllowTool} />);

    fireEvent.click(screen.getByTestId('allow-button'));
    expect(onAllowTool).toHaveBeenCalledWith('s1', 'Bash');
  });

  it('should call onDenyTool when permission is denied', () => {
    const onDenyTool = vi.fn();
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

    render(<BattleOverlay sessionId="s1" {...defaultHandlers} onDenyTool={onDenyTool} />);

    fireEvent.click(screen.getByTestId('deny-button'));
    expect(onDenyTool).toHaveBeenCalledWith('s1');
  });

  it('does not show modals when battle is not paused', () => {
    useBattleStore.getState().startBattle('s1', {
      name: 'Test',
      type: 'general',
      level: 1,
      hp: 100,
      maxHp: 100,
    });

    render(<BattleOverlay sessionId="s1" {...defaultHandlers} />);
    expect(screen.queryByTestId('stasis-overlay')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rpg-question-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rpg-permission-modal')).not.toBeInTheDocument();
  });
});
