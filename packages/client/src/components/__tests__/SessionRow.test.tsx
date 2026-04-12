import type { SessionSummary } from '@code-quest/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SessionRow } from '../SessionRow';

const baseSession: SessionSummary = {
  channelId: 's1',
  provider: 'claude',
  command: 'claude',
  args: '--verbose',
  mode: 'interactive',
  role: 'user',
  cwd: '/Users/test/project',
  createdAt: new Date(Date.now() - 7 * 86400_000).toISOString(),
};

const noop = vi.fn();

describe('SessionRow', () => {
  it('shows firstUserMessage when no title', () => {
    render(
      <SessionRow session={{ ...baseSession, firstUserMessage: 'Hello world' }} onSelect={noop} />,
    );
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('shows "Untitled" when no title and no firstUserMessage', () => {
    render(<SessionRow session={baseSession} onSelect={noop} />);
    expect(screen.getByText('Untitled')).toBeInTheDocument();
  });

  it('shows title when available', () => {
    render(<SessionRow session={{ ...baseSession, title: 'Fix login bug' }} onSelect={noop} />);
    expect(screen.getByText('Fix login bug')).toBeInTheDocument();
  });

  it('shows relative date', () => {
    render(<SessionRow session={baseSession} onSelect={noop} />);
    expect(screen.getByText('7d')).toBeInTheDocument();
  });

  it('does not show cwd or preview', () => {
    render(
      <SessionRow
        session={{ ...baseSession, lastAssistantMessage: 'hello', cwd: '/foo/bar' }}
        onSelect={noop}
      />,
    );
    expect(screen.queryByText('bar')).not.toBeInTheDocument();
    expect(screen.queryByText('hello')).not.toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const onSelect = vi.fn();
    render(<SessionRow session={{ ...baseSession, title: 'My Session' }} onSelect={onSelect} />);
    await userEvent.click(screen.getByText('My Session'));
    expect(onSelect).toHaveBeenCalledWith('s1');
  });

  it('renders rename/delete buttons when callbacks provided', () => {
    const onRename = vi.fn();
    const onDelete = vi.fn();
    render(
      <SessionRow
        session={{ ...baseSession, title: 'Test' }}
        onSelect={noop}
        onRename={onRename}
        onDelete={onDelete}
      />,
    );
    expect(screen.getByTitle('Rename')).toBeInTheDocument();
    expect(screen.getByTitle('Delete')).toBeInTheDocument();
  });

  it('highlights search query in title', () => {
    render(
      <SessionRow
        session={{ ...baseSession, title: 'Fix login bug' }}
        onSelect={noop}
        searchQuery="login"
      />,
    );
    const mark = screen.getByText('login');
    expect(mark.tagName).toBe('MARK');
  });

  it('shows date alongside action buttons (not replaced)', () => {
    render(
      <SessionRow session={baseSession} onSelect={noop} onRename={vi.fn()} onDelete={vi.fn()} />,
    );
    // Date is always in DOM alongside actions
    expect(screen.getByText('7d')).toBeInTheDocument();
    expect(screen.getByTitle('Rename')).toBeInTheDocument();
  });
});
