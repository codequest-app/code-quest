import type { SessionSummary } from '@code-quest/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SessionRow } from '../SessionRow';

const baseSession: SessionSummary = {
  id: 's1',
  provider: 'claude',
  command: 'claude',
  args: '',
  mode: 'interactive',
  role: 'user',
  createdAt: '2026-01-01T00:00:00Z',
  title: 'Test Session',
};

const noop = vi.fn();

describe('SessionRow subtitle', () => {
  it('renders firstUserMessage as subtitle truncated to 60 chars', () => {
    const longMsg = 'A'.repeat(80);
    render(
      <SessionRow
        session={{ ...baseSession, firstUserMessage: longMsg }}
        isExpanded={false}
        isCurrent={false}
        isRemote={false}
        onExpand={noop}
        onSelect={noop}
        onDeleted={noop}
      />,
    );
    const subtitle = screen.getByTestId('session-subtitle');
    expect(subtitle).toBeInTheDocument();
    expect(subtitle.textContent!.length).toBeLessThanOrEqual(63); // 60 + "..."
  });

  it('does not render subtitle when firstUserMessage is undefined', () => {
    render(
      <SessionRow
        session={baseSession}
        isExpanded={false}
        isCurrent={false}
        isRemote={false}
        onExpand={noop}
        onSelect={noop}
        onDeleted={noop}
      />,
    );
    expect(screen.queryByTestId('session-subtitle')).not.toBeInTheDocument();
  });
});
