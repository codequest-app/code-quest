import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TabBar, type TabInfo } from '../TabBar';

const tabs: TabInfo[] = [
  { sessionId: 'sess-1', title: 'Chat 1', status: 'default' },
  { sessionId: 'sess-2', title: 'Chat 2', status: 'pending' },
  { sessionId: 'sess-3', status: 'done' },
];

describe('TabBar', () => {
  it('renders all tabs', () => {
    render(<TabBar tabs={tabs} activeTabId="sess-1" onSelectTab={vi.fn()} onCloseTab={vi.fn()} />);
    expect(screen.getByText('Chat 1')).toBeInTheDocument();
    expect(screen.getByText('Chat 2')).toBeInTheDocument();
    expect(screen.getByText('sess-3'.slice(0, 8))).toBeInTheDocument();
  });

  it('highlights active tab', () => {
    render(<TabBar tabs={tabs} activeTabId="sess-1" onSelectTab={vi.fn()} onCloseTab={vi.fn()} />);
    const activeTab = screen.getByRole('tab', { selected: true });
    expect(activeTab).toHaveTextContent('Chat 1');
  });

  it('calls onSelectTab when clicking a tab', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TabBar tabs={tabs} activeTabId="sess-1" onSelectTab={onSelect} onCloseTab={vi.fn()} />);
    await user.click(screen.getByText('Chat 2'));
    expect(onSelect).toHaveBeenCalledWith('sess-2');
  });

  it('calls onCloseTab when clicking close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<TabBar tabs={tabs} activeTabId="sess-1" onSelectTab={vi.fn()} onCloseTab={onClose} />);
    await user.click(screen.getByLabelText('Close Chat 1'));
    expect(onClose).toHaveBeenCalledWith('sess-1');
  });

  it('returns null when no tabs', () => {
    const { container } = render(
      <TabBar tabs={[]} activeTabId={null} onSelectTab={vi.fn()} onCloseTab={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows status indicator dots', () => {
    render(<TabBar tabs={tabs} activeTabId="sess-1" onSelectTab={vi.fn()} onCloseTab={vi.fn()} />);
    const dots = screen.getByTestId('tab-bar').querySelectorAll('.rounded-full');
    expect(dots).toHaveLength(3);
  });

  it('shows pulsing indicator for pending status', () => {
    render(<TabBar tabs={tabs} activeTabId="sess-1" onSelectTab={vi.fn()} onCloseTab={vi.fn()} />);
    const pendingTab = screen.getByText('Chat 2').closest('[role="tab"]')!;
    const dot = pendingTab.querySelector('.rounded-full');
    expect(dot).toHaveClass('animate-pulse');
  });

  it('shows checkmark for done status', () => {
    render(<TabBar tabs={tabs} activeTabId="sess-1" onSelectTab={vi.fn()} onCloseTab={vi.fn()} />);
    const doneTab = screen.getByText('sess-3'.slice(0, 8)).closest('[role="tab"]')!;
    expect(doneTab).toHaveTextContent('✓');
  });

  it('renders + button when onNewTab provided', () => {
    render(
      <TabBar
        tabs={tabs}
        activeTabId="sess-1"
        onSelectTab={vi.fn()}
        onCloseTab={vi.fn()}
        onNewTab={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('New tab')).toBeInTheDocument();
  });

  it('does not render + button when onNewTab not provided', () => {
    render(<TabBar tabs={tabs} activeTabId="sess-1" onSelectTab={vi.fn()} onCloseTab={vi.fn()} />);
    expect(screen.queryByLabelText('New tab')).not.toBeInTheDocument();
  });

  it('calls onNewTab when + button clicked', async () => {
    const user = userEvent.setup();
    const onNewTab = vi.fn();
    render(
      <TabBar
        tabs={tabs}
        activeTabId="sess-1"
        onSelectTab={vi.fn()}
        onCloseTab={vi.fn()}
        onNewTab={onNewTab}
      />,
    );
    await user.click(screen.getByLabelText('New tab'));
    expect(onNewTab).toHaveBeenCalledOnce();
  });
});
