import type { SessionSummary } from '@code-quest/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SessionRow } from '../SessionRow';

const baseSession: SessionSummary = {
  id: 's1',
  provider: 'claude',
  command: 'claude',
  args: '--verbose',
  mode: 'interactive',
  role: 'user',
  cwd: '/Users/test/project',
  createdAt: '2026-01-01T00:00:00Z',
};

const noop = vi.fn();
const defaultProps = {
  isExpanded: false,
  isCurrent: false,
  isRemote: false,
  onExpand: noop,
  onSelect: noop,
  onDeleted: noop,
};

describe('SessionRow', () => {
  it('shows session ID prefix when no title', () => {
    render(<SessionRow session={baseSession} {...defaultProps} />);
    expect(screen.getByText('s1')).toBeInTheDocument();
  });

  it('shows title when available', () => {
    render(<SessionRow session={{ ...baseSession, title: 'Fix login bug' }} {...defaultProps} />);
    expect(screen.getByText('Fix login bug')).toBeInTheDocument();
  });

  it('shows time', () => {
    render(<SessionRow session={baseSession} {...defaultProps} />);
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it('shows lastAssistantMessage as preview', () => {
    render(
      <SessionRow
        session={{ ...baseSession, lastAssistantMessage: 'All tests pass now' }}
        {...defaultProps}
      />,
    );
    expect(screen.getByTestId('session-preview')).toHaveTextContent('All tests pass now');
  });

  it('truncates lastAssistantMessage at 80 chars', () => {
    render(
      <SessionRow
        session={{ ...baseSession, lastAssistantMessage: 'B'.repeat(100) }}
        {...defaultProps}
      />,
    );
    const preview = screen.getByTestId('session-preview');
    expect(preview.textContent!.length).toBeLessThanOrEqual(83);
  });

  it('shows last folder name from cwd', () => {
    render(<SessionRow session={baseSession} {...defaultProps} />);
    expect(screen.getByText('project')).toBeInTheDocument();
    expect(screen.queryByText(/\/Users\/test\/project/)).not.toBeInTheDocument();
  });

  it('does not show args in list view', () => {
    render(<SessionRow session={baseSession} {...defaultProps} />);
    expect(screen.queryByText(/--verbose/)).not.toBeInTheDocument();
  });
});
