import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBattleStore } from '../../../stores/battleStore';
import { useMapStore } from '../../../stores/mapStore';
import { useShopStore } from '../../../stores/shopStore';
import { useThemeStore } from '../../../stores/themeStore';
import { useWorktreeStore } from '../../../stores/worktreeStore';
import { LocationInterior } from '../LocationInterior';

function makeLoc(overrides: Partial<Parameters<typeof LocationInterior>[0]['location']> = {}) {
  return {
    id: 'tavern',
    name: 'Tavern',
    icon: '🍺',
    zone: 'town' as const,
    position: { x: 1, y: 3 },
    enterable: true,
    requiresLevel: 1,
    description: 'A friendly tavern where you can chat with the AI bartender.',
    restrictInBattle: false,
    shortcutKey: 'H',
    ...overrides,
  };
}

describe('LocationInterior', () => {
  beforeEach(() => {
    useWorktreeStore.setState({
      worktrees: [{ name: 'main', branch: 'main', status: 'stable' as const }],
    });
    useMapStore.setState({ planModeActive: false });
  });

  it('renders location name and icon', () => {
    render(<LocationInterior location={makeLoc()} onExit={vi.fn()} />);
    expect(screen.getByTestId('location-interior')).toHaveTextContent('Tavern');
    expect(screen.getByTestId('location-interior')).toHaveTextContent('🍺');
  });

  it('renders location description', () => {
    render(<LocationInterior location={makeLoc()} onExit={vi.fn()} />);
    expect(screen.getByTestId('location-interior')).toHaveTextContent('A friendly tavern');
  });

  it('calls onExit when exit button is clicked', () => {
    const onExit = vi.fn();
    render(<LocationInterior location={makeLoc()} onExit={onExit} />);
    fireEvent.click(screen.getByTestId('location-exit-btn'));
    expect(onExit).toHaveBeenCalledOnce();
  });

  it('calls onExit when Escape key is pressed', () => {
    const onExit = vi.fn();
    render(<LocationInterior location={makeLoc()} onExit={onExit} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onExit).toHaveBeenCalledOnce();
  });

  // Tavern chat UI
  it('renders tavern with chat input and message area', () => {
    render(<LocationInterior location={makeLoc({ id: 'tavern' })} onExit={vi.fn()} />);
    expect(screen.getByTestId('interior-tavern')).toBeInTheDocument();
    expect(screen.getByTestId('tavern-input')).toBeInTheDocument();
    expect(screen.getByTestId('tavern-messages')).toBeInTheDocument();
  });

  it('tavern shows welcome message from bartender', () => {
    render(<LocationInterior location={makeLoc({ id: 'tavern' })} onExit={vi.fn()} />);
    expect(screen.getByTestId('tavern-messages')).toHaveTextContent('AI bartender');
  });

  it('tavern input submits message and shows it with auto-reply', () => {
    render(<LocationInterior location={makeLoc({ id: 'tavern' })} onExit={vi.fn()} />);
    const input = screen.getByTestId('tavern-input');
    fireEvent.change(input, { target: { value: 'Hello bartender' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    expect(screen.getByTestId('tavern-messages')).toHaveTextContent('Hello bartender');
    // Auto-reply from bartender
    expect(
      screen.getByTestId('tavern-messages').querySelectorAll('.tavern-msg--bartender').length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('renders shopping district with 7 sub-shops', () => {
    render(
      <LocationInterior
        location={makeLoc({ id: 'shopping_district', name: 'Shopping District', icon: '🏪' })}
        onExit={vi.fn()}
      />,
    );
    const el = screen.getByTestId('interior-shopping');
    expect(el).toBeInTheDocument();
    // 7 shops
    const shops = el.querySelectorAll('[data-testid^="shop-"]');
    expect(shops.length).toBe(7);
  });

  it('renders stasis chamber with plan mode button', () => {
    render(
      <LocationInterior
        location={makeLoc({ id: 'stasis_chamber', name: 'Stasis Chamber', icon: '⏸️' })}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('interior-stasis')).toBeInTheDocument();
    expect(screen.getByTestId('stasis-plan-btn')).toBeInTheDocument();
  });

  it('stasis chamber shows plan mode UI when activated', () => {
    render(
      <LocationInterior
        location={makeLoc({ id: 'stasis_chamber', name: 'Stasis Chamber', icon: '⏸️' })}
        onExit={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('stasis-plan-btn'));
    expect(screen.getByTestId('stasis-plan-active')).toBeInTheDocument();
    expect(screen.getByTestId('stasis-plan-active')).toHaveTextContent('Plan Mode Active');
  });

  it('stasis chamber can exit plan mode', () => {
    render(
      <LocationInterior
        location={makeLoc({ id: 'stasis_chamber', name: 'Stasis Chamber', icon: '⏸️' })}
        onExit={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('stasis-plan-btn'));
    fireEvent.click(screen.getByTestId('stasis-exit-plan-btn'));
    expect(screen.queryByTestId('stasis-plan-active')).toBeNull();
    expect(screen.getByTestId('stasis-plan-btn')).toBeInTheDocument();
  });

  it('stasis chamber wires plan mode to mapStore', () => {
    expect(useMapStore.getState().planModeActive).toBe(false);
    render(
      <LocationInterior
        location={makeLoc({ id: 'stasis_chamber', name: 'Stasis Chamber', icon: '⏸️' })}
        onExit={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('stasis-plan-btn'));
    expect(useMapStore.getState().planModeActive).toBe(true);
    fireEvent.click(screen.getByTestId('stasis-exit-plan-btn'));
    expect(useMapStore.getState().planModeActive).toBe(false);
  });

  it('renders guild hall with worktree list and create button', () => {
    render(
      <LocationInterior
        location={makeLoc({ id: 'guild_hall', name: 'Guild Hall', icon: '🏛️' })}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('interior-guild')).toBeInTheDocument();
    expect(screen.getByTestId('interior-guild')).toHaveTextContent('Worktree');
    expect(screen.getByTestId('guild-worktree-list')).toBeInTheDocument();
    expect(screen.getByTestId('guild-create-btn')).toBeInTheDocument();
  });

  it('guild hall shows worktrees from store', () => {
    useWorktreeStore.setState({
      worktrees: [
        { name: 'main', branch: 'main', status: 'stable' as const },
        { name: 'feat', branch: 'feature/x', status: 'active' as const },
      ],
    });
    render(
      <LocationInterior
        location={makeLoc({ id: 'guild_hall', name: 'Guild Hall', icon: '🏛️' })}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('worktree-main')).toBeInTheDocument();
    expect(screen.getByTestId('worktree-feat')).toBeInTheDocument();
  });

  it('guild hall can create new worktree', () => {
    render(
      <LocationInterior
        location={makeLoc({ id: 'guild_hall', name: 'Guild Hall', icon: '🏛️' })}
        onExit={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('guild-create-btn'));
    fireEvent.change(screen.getByTestId('guild-name-input'), { target: { value: 'new-wt' } });
    fireEvent.change(screen.getByTestId('guild-branch-input'), { target: { value: 'feat/new' } });
    fireEvent.click(screen.getByTestId('guild-submit-btn'));
    expect(useWorktreeStore.getState().worktrees.length).toBe(2);
    expect(useWorktreeStore.getState().worktrees[1].name).toBe('new-wt');
  });

  it('guild hall can remove non-main worktree', () => {
    useWorktreeStore.setState({
      worktrees: [
        { name: 'main', branch: 'main', status: 'stable' as const },
        { name: 'temp', branch: 'temp', status: 'idle' as const },
      ],
    });
    render(
      <LocationInterior
        location={makeLoc({ id: 'guild_hall', name: 'Guild Hall', icon: '🏛️' })}
        onExit={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('worktree-remove-temp'));
    expect(useWorktreeStore.getState().worktrees.length).toBe(1);
  });

  it('renders player home with rest and settings', () => {
    render(
      <LocationInterior
        location={makeLoc({ id: 'player_home', name: 'Player Home', icon: '🏠' })}
        onExit={vi.fn()}
      />,
    );
    const el = screen.getByTestId('interior-home');
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent('Rest');
    expect(el).toHaveTextContent('Settings');
  });

  it('renders training ground with practice button', () => {
    render(
      <LocationInterior
        location={makeLoc({ id: 'training_ground', name: 'Training Ground', icon: '⚔️' })}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('interior-training')).toBeInTheDocument();
    expect(screen.getByTestId('training-practice-btn')).toBeInTheDocument();
  });

  it('training ground practice button calls onPractice', () => {
    const onPractice = vi.fn();
    render(
      <LocationInterior
        location={makeLoc({ id: 'training_ground', name: 'Training Ground', icon: '⚔️' })}
        onExit={vi.fn()}
        onPractice={onPractice}
      />,
    );
    fireEvent.click(screen.getByTestId('training-practice-btn'));
    expect(onPractice).toHaveBeenCalledOnce();
  });

  it('renders library with MCP tool list', () => {
    render(
      <LocationInterior
        location={makeLoc({ id: 'library', name: 'Library', icon: '📚' })}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('interior-library')).toBeInTheDocument();
    expect(screen.getByTestId('interior-library')).toHaveTextContent('MCP');
    expect(screen.getByTestId('mcp-tool-list')).toBeInTheDocument();
  });

  it('library tool install button toggles', () => {
    render(
      <LocationInterior
        location={makeLoc({ id: 'library', name: 'Library', icon: '📚' })}
        onExit={vi.fn()}
      />,
    );
    const btn = screen.getByTestId('mcp-toggle-web-search');
    expect(btn).toHaveTextContent('Install');
    fireEvent.click(btn);
    expect(btn).toHaveTextContent('Uninstall');
  });

  it('clicking a sub-shop shows shop detail view', () => {
    render(
      <LocationInterior
        location={makeLoc({ id: 'shopping_district', name: 'Shopping District', icon: '🏪' })}
        onExit={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('shop-skills'));
    expect(screen.getByTestId('shop-detail')).toBeInTheDocument();
    expect(screen.getByTestId('shop-detail')).toHaveTextContent('Skills Shop');
  });

  it('shop detail has back button to return to shop list', () => {
    render(
      <LocationInterior
        location={makeLoc({ id: 'shopping_district', name: 'Shopping District', icon: '🏪' })}
        onExit={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('shop-skills'));
    fireEvent.click(screen.getByTestId('shop-back-btn'));
    expect(screen.queryByTestId('shop-detail')).toBeNull();
    expect(screen.getByTestId('interior-shopping')).toBeInTheDocument();
  });

  it('each sub-shop shows unique placeholder content', () => {
    const shopIds = ['skills', 'forge', 'mcp-library', 'subagent', 'treasury', 'training', 'bank'];
    render(
      <LocationInterior
        location={makeLoc({ id: 'shopping_district', name: 'Shopping District', icon: '🏪' })}
        onExit={vi.fn()}
      />,
    );
    for (const shopId of shopIds) {
      fireEvent.click(screen.getByTestId(`shop-${shopId}`));
      const detail = screen.getByTestId('shop-detail');
      expect(detail).toBeInTheDocument();
      // Each shop should have descriptive content
      expect(detail.textContent?.length).toBeGreaterThan(50);
      expect(detail.textContent).not.toContain('Coming soon');
      fireEvent.click(screen.getByTestId('shop-back-btn'));
    }
  });

  it('renders dungeon interior with boss info and engage button', () => {
    render(
      <LocationInterior
        location={makeLoc({
          id: 'bug_cave',
          name: 'Bug Cave',
          icon: '🪲',
          zone: 'dungeon',
          description: 'A dark cave crawling with bugs.',
        })}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('interior-dungeon')).toBeInTheDocument();
    expect(screen.getByTestId('interior-dungeon')).toHaveTextContent('NullPointer');
    expect(screen.getByTestId('interior-dungeon')).toHaveTextContent('Lv.3');
    expect(screen.getByTestId('dungeon-engage-btn')).toBeInTheDocument();
  });

  it('each dungeon shows unique boss info', () => {
    const { unmount } = render(
      <LocationInterior
        location={makeLoc({
          id: 'arch_maze',
          name: 'Architecture Maze',
          icon: '🏗️',
          zone: 'dungeon',
        })}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('interior-dungeon')).toHaveTextContent('Spaghetti');
    unmount();
    render(
      <LocationInterior
        location={makeLoc({ id: 'legacy_tomb', name: 'Legacy Tomb', icon: '🏚️', zone: 'dungeon' })}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('interior-dungeon')).toHaveTextContent('Ancient Monolith');
  });

  it('dungeon engage button calls onEngageBoss with location id', () => {
    const onEngageBoss = vi.fn();
    render(
      <LocationInterior
        location={makeLoc({
          id: 'bug_cave',
          name: 'Bug Cave',
          icon: '🪲',
          zone: 'dungeon',
          description: 'A dark cave crawling with bugs.',
        })}
        onExit={vi.fn()}
        onEngageBoss={onEngageBoss}
      />,
    );
    fireEvent.click(screen.getByTestId('dungeon-engage-btn'));
    expect(onEngageBoss).toHaveBeenCalledWith('bug_cave');
  });

  it('player home rest button shows rested message on click', () => {
    render(
      <LocationInterior
        location={makeLoc({ id: 'player_home', name: 'Player Home', icon: '🏠' })}
        onExit={vi.fn()}
      />,
    );
    const restBtn = screen.getByText(/Rest/);
    fireEvent.click(restBtn);
    expect(screen.getByTestId('interior-home')).toHaveTextContent('fully rested');
  });

  it('player home settings button opens settings panel', () => {
    render(
      <LocationInterior
        location={makeLoc({ id: 'player_home', name: 'Player Home', icon: '🏠' })}
        onExit={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('home-settings-btn'));
    expect(screen.getByTestId('home-settings-panel')).toBeInTheDocument();
    expect(screen.getByTestId('home-theme-select')).toBeInTheDocument();
  });

  it('player home settings theme select changes theme', () => {
    render(
      <LocationInterior
        location={makeLoc({ id: 'player_home', name: 'Player Home', icon: '🏠' })}
        onExit={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('home-settings-btn'));
    fireEvent.change(screen.getByTestId('home-theme-select'), { target: { value: 'dark' } });
    expect(useThemeStore.getState().currentTheme).toBe('dark');
  });

  it('tavern shows loading when onSendMessage is provided', async () => {
    let resolveMsg: (v: string) => void = () => {};
    const onSendMessage = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveMsg = resolve;
        }),
    );
    render(
      <LocationInterior
        location={makeLoc({ id: 'tavern' })}
        onExit={vi.fn()}
        onSendMessage={onSendMessage}
      />,
    );
    const input = screen.getByTestId('tavern-input');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    expect(screen.getByTestId('tavern-loading')).toBeInTheDocument();
    expect(onSendMessage).toHaveBeenCalledWith('Hello');
    // Resolve the promise
    await vi.waitFor(() => {
      resolveMsg('AI reply');
    });
    await vi.waitFor(() => {
      expect(screen.queryByTestId('tavern-loading')).toBeNull();
      expect(screen.getByTestId('tavern-messages')).toHaveTextContent('AI reply');
    });
  });

  it('skills shop shows items with buy buttons', () => {
    useBattleStore.setState({ player: { level: 1, totalExp: 0, totalGold: 100 } });
    useShopStore.setState({ inventory: [] });
    render(
      <LocationInterior
        location={makeLoc({ id: 'shopping_district', name: 'Shopping District', icon: '🏪' })}
        onExit={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('shop-skills'));
    expect(screen.getByTestId('shop-items')).toBeInTheDocument();
    expect(screen.getByTestId('buy-skill-autocomplete')).toBeInTheDocument();
  });

  it('buying an item deducts gold and shows result', () => {
    useBattleStore.setState({ player: { level: 1, totalExp: 0, totalGold: 100 } });
    useShopStore.setState({ inventory: [] });
    render(
      <LocationInterior
        location={makeLoc({ id: 'shopping_district', name: 'Shopping District', icon: '🏪' })}
        onExit={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('shop-skills'));
    fireEvent.click(screen.getByTestId('buy-skill-autocomplete'));
    expect(screen.getByTestId('shop-buy-result')).toHaveTextContent('Purchased');
    expect(useBattleStore.getState().player.totalGold).toBe(70);
  });
});
