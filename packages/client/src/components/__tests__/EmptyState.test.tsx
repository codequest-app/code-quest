import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders Add Project button', () => {
    render(<EmptyState onAddProject={() => {}} />);
    expect(screen.getByText(/Add Project/)).toBeInTheDocument();
  });

  it('calls onAddProject when button clicked', async () => {
    const user = userEvent.setup();
    const onAddProject = vi.fn();
    render(<EmptyState onAddProject={onAddProject} />);
    await user.click(screen.getByText(/Add Project/));
    expect(onAddProject).toHaveBeenCalled();
  });
});
