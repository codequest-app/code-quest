import type { SessionStateSummary } from '@code-quest/schemas';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TopbarLiveSessions } from '../TopbarLiveSessions.tsx';

function s(overrides: Partial<SessionStateSummary> = {}): SessionStateSummary {
  return {
    channelId: 'c1',
    state: 'busy',
    projectRoot: '/repo/code-quest',
    cwd: '/repo/code-quest',
    ...overrides,
  };
}

describe('TopbarLiveSessions', () => {
  it('renders nothing when no live sessions', () => {
    render(<TopbarLiveSessions sessions={[]} onActivate={vi.fn()} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('renders a pill for each live session with project label', () => {
    render(
      <TopbarLiveSessions
        sessions={[
          s({ channelId: 'c1', projectRoot: '/repo/foo', cwd: '/repo/foo' }),
          s({ channelId: 'c2', projectRoot: '/repo/bar', cwd: '/repo/bar', state: 'idle' }),
        ]}
        onActivate={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /^foo \(/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^bar \(/ })).toBeInTheDocument();
  });

  it('busy session pill has aria-label including "busy"', () => {
    render(<TopbarLiveSessions sessions={[s({ state: 'busy' })]} onActivate={vi.fn()} />);
    expect(screen.getByRole('button', { name: /busy/i })).toBeInTheDocument();
  });

  it('click pill invokes onActivate with channelId', async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    render(<TopbarLiveSessions sessions={[s({ channelId: 'abc' })]} onActivate={onActivate} />);
    await user.click(screen.getByRole('button', { name: /^code-quest \(/ }));
    expect(onActivate).toHaveBeenCalledWith('abc');
  });

  it('clicking ⋯ button opens LiveSessionPopover', async () => {
    const user = userEvent.setup();
    render(<TopbarLiveSessions sessions={[s({ channelId: 'abc' })]} onActivate={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /more.*code-quest/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('popover Open invokes onActivate (same as pill click)', async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    render(<TopbarLiveSessions sessions={[s({ channelId: 'abc' })]} onActivate={onActivate} />);
    await user.click(screen.getByRole('button', { name: /more.*code-quest/i }));
    await user.click(screen.getByRole('button', { name: /^open$/i }));
    expect(onActivate).toHaveBeenCalledWith('abc');
  });

  it('caps visible pills to 5 + overflow chip', () => {
    const sessions = Array.from({ length: 7 }, (_, i) =>
      s({ channelId: `c${i}`, projectRoot: `/repo/p${i}`, cwd: `/repo/p${i}` }),
    );
    render(<TopbarLiveSessions sessions={sessions} onActivate={vi.fn()} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
    // First 5 pills (p0..p4) visible by aria-label; p5/p6 hidden behind overflow.
    for (const i of [0, 1, 2, 3, 4]) {
      expect(screen.getByRole('button', { name: new RegExp(`^p${i} \\(`) })).toBeInTheDocument();
    }
    expect(screen.queryByRole('button', { name: /^p5 \(/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^p6 \(/ })).toBeNull();
  });
});
