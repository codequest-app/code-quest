import type { SessionStateSummary } from '@code-quest/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LiveSessionPopover, type LiveSessionPopoverProps } from '../LiveSessionPopover.tsx';

function makeSession(overrides: Partial<SessionStateSummary> = {}): SessionStateSummary {
  return {
    channelId: 'c1',
    state: 'busy',
    projectRoot: '/repo/code-quest',
    cwd: '/repo/code-quest',
    title: 'Refactor TabContext',
    ...overrides,
  };
}

function renderPopover(overrides: Partial<LiveSessionPopoverProps> = {}) {
  const props: LiveSessionPopoverProps = {
    session: overrides.session ?? makeSession(),
    defaultOpen: true,
    onOpen: overrides.onOpen ?? vi.fn(),
    onStop: overrides.onStop ?? vi.fn(),
    onSplit: overrides.onSplit ?? vi.fn(),
  };
  const result = render(<LiveSessionPopover {...props} />);
  return {
    ...result,
    rerenderWith: (next: Partial<LiveSessionPopoverProps>) =>
      result.rerender(<LiveSessionPopover {...props} {...next} />),
  };
}

describe('LiveSessionPopover', () => {
  it('renders project label, state, title', () => {
    renderPopover();
    expect(screen.getByText(/code-quest/)).toBeInTheDocument();
    expect(screen.getByText(/busy/i)).toBeInTheDocument();
    expect(screen.getByText('Refactor TabContext')).toBeInTheDocument();
  });

  it('Open button fires onOpen with channelId', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    renderPopover({ session: makeSession({ channelId: 'abc' }), onOpen });
    await user.click(screen.getByRole('button', { name: /^open$/i }));
    expect(onOpen).toHaveBeenCalledWith('abc');
  });

  it('Stop button only renders when busy and fires onStop', async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();
    const { rerenderWith } = renderPopover({
      session: makeSession({ channelId: 'abc', state: 'idle' }),
      onStop,
    });
    expect(screen.queryByRole('button', { name: /stop/i })).toBeNull();

    rerenderWith({ session: makeSession({ channelId: 'abc', state: 'busy' }) });
    await user.click(screen.getByRole('button', { name: /stop/i }));
    expect(onStop).toHaveBeenCalledWith('abc');
  });

  it('Split button fires onSplit with channelId', async () => {
    const user = userEvent.setup();
    const onSplit = vi.fn();
    renderPopover({ session: makeSession({ channelId: 'abc' }), onSplit });
    await user.click(screen.getByRole('button', { name: /split/i }));
    expect(onSplit).toHaveBeenCalledWith('abc');
  });
});
