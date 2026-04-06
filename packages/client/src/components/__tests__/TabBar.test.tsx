import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TabBar, type TabInfo } from '../TabBar';

const tabs: TabInfo[] = [
  { sessionId: 'sess-1', title: 'Chat 1', status: 'idle' },
  { sessionId: 'sess-2', title: 'Chat 2', status: 'processing' },
  { sessionId: 'sess-3', status: 'disconnected' },
];

function renderTabBar(overrides: Partial<Parameters<typeof TabBar>[0]> = {}) {
  return render(
    <TabBar
      tabs={tabs}
      activeTabId="sess-1"
      onSelectTab={vi.fn()}
      onCloseTab={vi.fn()}
      {...overrides}
    />,
  );
}

describe('TabBar', () => {
  it('renders all tabs', () => {
    renderTabBar();
    expect(screen.getByText('Chat 1')).toBeInTheDocument();
    expect(screen.getByText('Chat 2')).toBeInTheDocument();
    expect(screen.getByText('sess-3'.slice(0, 8))).toBeInTheDocument();
  });

  it('highlights active tab', () => {
    renderTabBar();
    const activeTab = screen.getByRole('tab', { selected: true });
    expect(activeTab).toHaveTextContent('Chat 1');
  });

  it('calls onSelectTab when clicking a tab', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderTabBar({ onSelectTab: onSelect });
    await user.click(screen.getByText('Chat 2'));
    expect(onSelect).toHaveBeenCalledWith('sess-2');
  });

  it('shows confirm dialog before closing tab', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderTabBar({ onCloseTab: onClose });
    await user.click(screen.getByLabelText('Close Chat 1'));

    // Dialog shown with message
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/close this session/i)).toBeInTheDocument();

    // Confirm closes
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledWith('sess-1');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cancel dialog does not close tab', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderTabBar({ onCloseTab: onClose });
    await user.click(screen.getByLabelText('Close Chat 1'));
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('returns null when no tabs', () => {
    const { container } = renderTabBar({ tabs: [], activeTabId: null });
    expect(container.firstChild).toBeNull();
  });

  it('shows status indicator dots', () => {
    renderTabBar();
    const dots = screen.getByTestId('tab-bar').querySelectorAll('.rounded-full');
    expect(dots).toHaveLength(3);
  });

  it('shows green dot for idle session', () => {
    renderTabBar();
    const idleTab = screen.getByText('Chat 1').closest('[role="tab"]')!;
    const dot = idleTab.querySelector('.rounded-full');
    expect(dot).toHaveClass('bg-success');
  });

  it('shows pulsing accent dot for processing session', () => {
    renderTabBar();
    const processingTab = screen.getByText('Chat 2').closest('[role="tab"]')!;
    const dot = processingTab.querySelector('.rounded-full');
    expect(dot).toHaveClass('bg-accent', 'animate-pulse');
  });

  it('shows red dot for disconnected session', () => {
    renderTabBar();
    const disconnectedTab = screen.getByText('sess-3'.slice(0, 8)).closest('[role="tab"]')!;
    const dot = disconnectedTab.querySelector('.rounded-full');
    expect(dot).toHaveClass('bg-danger');
  });

  it('renders + button when onNewTab provided', () => {
    renderTabBar({ onNewTab: vi.fn() });
    expect(screen.getByLabelText('New tab')).toBeInTheDocument();
  });

  it('does not render + button when onNewTab not provided', () => {
    renderTabBar();
    expect(screen.queryByLabelText('New tab')).not.toBeInTheDocument();
  });

  it('calls onNewTab when + button clicked', async () => {
    const user = userEvent.setup();
    const onNewTab = vi.fn();
    renderTabBar({ onNewTab });
    await user.click(screen.getByLabelText('New tab'));
    expect(onNewTab).toHaveBeenCalledOnce();
  });
});
