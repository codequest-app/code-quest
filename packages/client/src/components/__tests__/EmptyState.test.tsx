import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders message and action button', () => {
    render(
      <EmptyState
        icon="📁"
        message="No projects yet"
        actionLabel="Add Project"
        onAction={() => {}}
      />,
    );
    expect(screen.getByText('No projects yet')).toBeInTheDocument();
    expect(screen.getByText('Add Project')).toBeInTheDocument();
  });

  it('calls onAction when button clicked', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<EmptyState message="Empty" actionLabel="Do it" onAction={onAction} />);
    await user.click(screen.getByText('Do it'));
    expect(onAction).toHaveBeenCalled();
  });

  it('renders without action button when actionLabel/onAction are omitted', () => {
    render(<EmptyState message="No matches" />);
    expect(screen.getByText('No matches')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
