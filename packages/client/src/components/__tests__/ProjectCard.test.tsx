import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProjectCard } from '../ProjectCard';

describe('ProjectCard', () => {
  it('renders project name', () => {
    render(<ProjectCard name="cc-office" active={false} onSelect={() => {}} />);
    expect(screen.getByText(/cc-office/)).toBeInTheDocument();
  });

  it('has accent border when active', () => {
    const { container } = render(<ProjectCard name="cc-office" active onSelect={() => {}} />);
    const card = container.firstElementChild;
    expect(card?.className).toContain('border-accent');
  });

  it('does not have accent border when inactive', () => {
    const { container } = render(
      <ProjectCard name="cc-office" active={false} onSelect={() => {}} />,
    );
    const card = container.firstElementChild;
    expect(card?.className).not.toContain('border-accent');
  });

  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ProjectCard name="cc-office" active={false} onSelect={onSelect} />);
    await user.click(screen.getByText(/cc-office/));
    expect(onSelect).toHaveBeenCalled();
  });
});
