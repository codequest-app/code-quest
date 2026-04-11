import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Project } from '../../contexts/ProjectContext';
import { ProjectList } from '../ProjectList';

const projects: Project[] = [
  { cwd: '/cc-office', name: 'cc-office' },
  { cwd: '/DQ', name: 'DQ' },
];

describe('ProjectList', () => {
  it('renders project cards', () => {
    render(
      <ProjectList
        projects={projects}
        activeProjectCwd="/cc-office"
        onSelect={() => {}}
        onAdd={() => {}}
      />,
    );
    expect(screen.getByText(/cc-office/)).toBeInTheDocument();
    expect(screen.getByText(/DQ/)).toBeInTheDocument();
  });

  it('renders Add button', () => {
    render(
      <ProjectList projects={[]} activeProjectCwd={null} onSelect={() => {}} onAdd={() => {}} />,
    );
    expect(screen.getByText(/Add/)).toBeInTheDocument();
  });

  it('calls onAdd when Add button clicked', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<ProjectList projects={[]} activeProjectCwd={null} onSelect={() => {}} onAdd={onAdd} />);
    await user.click(screen.getByText(/Add/));
    expect(onAdd).toHaveBeenCalled();
  });

  it('calls onSelect with cwd when card clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ProjectList
        projects={projects}
        activeProjectCwd="/cc-office"
        onSelect={onSelect}
        onAdd={() => {}}
      />,
    );
    await user.click(screen.getByText(/DQ/));
    expect(onSelect).toHaveBeenCalledWith('/DQ');
  });
});
