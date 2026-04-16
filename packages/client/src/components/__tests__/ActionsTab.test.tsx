import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMessageVisibilityStore } from '../../stores/useMessageVisibilityStore';

beforeEach(() => useMessageVisibilityStore.setState({ enabledTypes: null }));
afterEach(() => useMessageVisibilityStore.setState({ enabledTypes: null }));

import { useMessageVisibility } from '../../contexts/channel/MessageVisibilityContext';
import { renderWithChannel } from '../../test/render-with-channel';
import { ActionsTab } from '../ActionsTab';

function SetPartialHooks() {
  const { toggleType } = useMessageVisibility();
  return (
    <button type="button" onClick={() => toggleType('hook_started')}>
      enable-hook_started
    </button>
  );
}

describe('ActionsTab — panels section', () => {
  it('shows Raw Event Panel toggle', async () => {
    await renderWithChannel(
      <ActionsTab flat={false} onToggleRawPanel={vi.fn()} rawPanelActive={false} />,
    );
    expect(screen.getByText(/raw event panel/i)).toBeInTheDocument();
  });

  it('calls onToggleRawPanel when row clicked', async () => {
    const user = userEvent.setup();
    const onToggleRawPanel = vi.fn();
    await renderWithChannel(
      <ActionsTab flat={false} onToggleRawPanel={onToggleRawPanel} rawPanelActive={false} />,
    );
    await user.click(screen.getByText(/raw event panel/i));
    expect(onToggleRawPanel).toHaveBeenCalledOnce();
  });

  it('shows OFF pill when rawPanelActive=false', async () => {
    await renderWithChannel(
      <ActionsTab flat={false} onToggleRawPanel={vi.fn()} rawPanelActive={false} />,
    );
    const toggle = screen.getByTestId('raw-panel-toggle');
    expect(toggle).toHaveAttribute('data-active', 'false');
    expect(toggle.textContent).toContain('OFF');
  });

  it('shows ON pill when rawPanelActive=true', async () => {
    await renderWithChannel(
      <ActionsTab flat={false} onToggleRawPanel={vi.fn()} rawPanelActive={true} />,
    );
    const toggle = screen.getByTestId('raw-panel-toggle');
    expect(toggle).toHaveAttribute('data-active', 'true');
    expect(toggle.textContent).toContain('ON');
  });
});

describe('ActionsTab — message visibility groups', () => {
  it('shows all 5 visibility group labels', async () => {
    await renderWithChannel(
      <ActionsTab flat={false} onToggleRawPanel={vi.fn()} rawPanelActive={false} />,
    );
    expect(screen.getByText('對話')).toBeInTheDocument();
    expect(screen.getByText('工具')).toBeInTheDocument();
    expect(screen.getByText('系統')).toBeInTheDocument();
    expect(screen.getByText('Hooks')).toBeInTheDocument();
    expect(screen.getByText('Debug')).toBeInTheDocument();
  });

  it('conversation group shows ON toggle (on by default)', async () => {
    await renderWithChannel(
      <ActionsTab flat={false} onToggleRawPanel={vi.fn()} rawPanelActive={false} />,
    );
    const convRow = screen.getByTestId('group-row-conversation');
    expect(convRow).toHaveAttribute('data-state', 'all');
    expect(convRow.querySelector('[data-testid="group-toggle"]')?.textContent).toBe('ON');
  });

  it('hooks group shows OFF toggle (off by default)', async () => {
    await renderWithChannel(
      <ActionsTab flat={false} onToggleRawPanel={vi.fn()} rawPanelActive={false} />,
    );
    const hooksRow = screen.getByTestId('group-row-hooks');
    expect(hooksRow).toHaveAttribute('data-state', 'none');
    expect(hooksRow.querySelector('[data-testid="group-toggle"]')?.textContent).toBe('OFF');
  });

  it('clicking group toggle calls toggleGroup', async () => {
    const user = userEvent.setup();
    await renderWithChannel(
      <ActionsTab flat={false} onToggleRawPanel={vi.fn()} rawPanelActive={false} />,
    );
    const hooksRow = screen.getByTestId('group-row-hooks');
    await user.click(hooksRow.querySelector('[data-testid="group-toggle"]')!);
    expect(screen.getByTestId('group-row-hooks')).toHaveAttribute('data-state', 'all');
  });

  it('partial group shows ∂ on toggle pill', async () => {
    const user = userEvent.setup();
    await renderWithChannel(
      <>
        <SetPartialHooks />
        <ActionsTab flat={false} onToggleRawPanel={vi.fn()} rawPanelActive={false} />
      </>,
    );
    await user.click(screen.getByText('enable-hook_started'));
    const hooksRow = screen.getByTestId('group-row-hooks');
    expect(hooksRow).toHaveAttribute('data-state', 'partial');
    expect(hooksRow.querySelector('[data-testid="group-toggle"]')?.textContent).toBe('∂');
  });
});

describe('ActionsTab — expand/collapse (non-flat mode)', () => {
  it('clicking label area expands inline pills', async () => {
    const user = userEvent.setup();
    await renderWithChannel(
      <ActionsTab flat={false} onToggleRawPanel={vi.fn()} rawPanelActive={false} />,
    );
    const hooksRow = screen.getByTestId('group-row-hooks');
    await user.click(hooksRow.querySelector('[data-testid="group-label"]')!);
    expect(screen.getByTestId('type-pill-hook_started')).toBeInTheDocument();
    expect(screen.getByTestId('type-pill-hook_response')).toBeInTheDocument();
  });

  it('clicking pill toggles individual type', async () => {
    function StateProbe() {
      const { groupState } = useMessageVisibility();
      return <div data-testid="hooks-state-probe">{groupState('hooks')}</div>;
    }
    await renderWithChannel(
      <>
        <StateProbe />
        <ActionsTab flat={false} onToggleRawPanel={vi.fn()} rawPanelActive={false} />
      </>,
    );
    expect(screen.getByTestId('hooks-state-probe').textContent).toBe('none');
    act(() => {
      fireEvent.click(
        screen.getByTestId('group-row-hooks').querySelector('[data-testid="group-label"]')!,
      );
    });
    act(() => {
      fireEvent.click(screen.getByTestId('type-pill-hook_started'));
    });
    expect(screen.getByTestId('hooks-state-probe').textContent).toBe('partial');
    expect(screen.getByTestId('group-row-hooks')).toHaveAttribute('data-state', 'partial');
  });

  it('no chevron — group-chevron testid absent', async () => {
    await renderWithChannel(
      <ActionsTab flat={false} onToggleRawPanel={vi.fn()} rawPanelActive={false} />,
    );
    expect(screen.queryByTestId('group-chevron')).not.toBeInTheDocument();
  });

  it('no expandable pills in flat mode', async () => {
    await renderWithChannel(
      <ActionsTab flat={true} onToggleRawPanel={vi.fn()} rawPanelActive={false} />,
    );
    // label click in flat mode should not expand pills
    const hooksRow = screen.getByTestId('group-row-hooks');
    fireEvent.click(hooksRow.querySelector('[data-testid="group-label"]')!);
    expect(screen.queryByTestId('type-pill-hook_started')).not.toBeInTheDocument();
  });
});
