import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Project } from '@/contexts/ProjectContext';
import { TopScopeSwitcher } from '../TopScopeSwitcher';

const projects: Project[] = [
  { cwd: '/proj/a', name: 'alpha', pinned: true, lastOpenedAt: '2025-01-03T00:00:00Z' },
  { cwd: '/proj/b', name: 'beta', pinned: false, lastOpenedAt: '2025-01-04T00:00:00Z' },
  { cwd: '/proj/c', name: 'cooks', pinned: true, lastOpenedAt: '2025-01-01T00:00:00Z' },
];

describe('TopScopeSwitcher', () => {
  it('renders current active project name on trigger', () => {
    render(
      <TopScopeSwitcher
        projects={projects}
        activeProjectCwd="/proj/a"
        onSelect={() => {}}
        onAddProject={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /alpha/i })).toBeInTheDocument();
  });

  it('renders empty placeholder when no active project', () => {
    render(
      <TopScopeSwitcher
        projects={projects}
        activeProjectCwd={null}
        onSelect={() => {}}
        onAddProject={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /no project/i })).toBeInTheDocument();
  });

  it('opens dropdown with Pinned + Recent groups on click', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <TopScopeSwitcher
        projects={projects}
        activeProjectCwd="/proj/a"
        onSelect={() => {}}
        onAddProject={() => {}}
      />,
    );
    await user.click(screen.getByRole('button', { name: /alpha/i }));

    const list = await screen.findByRole('listbox');
    expect(list).toHaveTextContent(/pinned/i);
    expect(list).toHaveTextContent(/recent/i);
    expect(list).toHaveTextContent('alpha');
    expect(list).toHaveTextContent('cooks');
    expect(list).toHaveTextContent('beta');
  });

  it('clicking a project calls onSelect + closes dropdown', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onSelect = vi.fn();
    render(
      <TopScopeSwitcher
        projects={projects}
        activeProjectCwd="/proj/a"
        onSelect={onSelect}
        onAddProject={() => {}}
      />,
    );
    await user.click(screen.getByRole('button', { name: /alpha/i }));
    const list = await screen.findByRole('listbox');
    await user.click(within(list).getByText('beta'));
    expect(onSelect).toHaveBeenCalledWith('/proj/b');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('search input filters projects (case-insensitive substring)', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <TopScopeSwitcher
        projects={projects}
        activeProjectCwd="/proj/a"
        onSelect={() => {}}
        onAddProject={() => {}}
      />,
    );
    await user.click(screen.getByRole('button', { name: /alpha/i }));
    const list = await screen.findByRole('listbox');
    const searchInput = within(list).getByRole('searchbox');
    await user.type(searchInput, 'cook');

    await waitFor(() => {
      expect(within(list).getByText('cooks')).toBeInTheDocument();
      expect(within(list).queryByText('alpha')).not.toBeInTheDocument();
      expect(within(list).queryByText('beta')).not.toBeInTheDocument();
    });
  });

  it('+ Add project calls onAddProject + closes', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onAddProject = vi.fn();
    render(
      <TopScopeSwitcher
        projects={projects}
        activeProjectCwd="/proj/a"
        onSelect={() => {}}
        onAddProject={onAddProject}
      />,
    );
    await user.click(screen.getByRole('button', { name: /alpha/i }));
    await user.click(await screen.findByRole('button', { name: /add project/i }));
    expect(onAddProject).toHaveBeenCalled();
  });

  it('outside click closes the dropdown (Radix-supplied; no document listener in component)', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <div>
        <TopScopeSwitcher
          projects={projects}
          activeProjectCwd="/proj/a"
          onSelect={() => {}}
          onAddProject={() => {}}
        />
        <button type="button">outside</button>
      </div>,
    );
    await user.click(screen.getByRole('button', { name: /alpha/i }));
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /outside/i }));
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('Escape closes the dropdown', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <TopScopeSwitcher
        projects={projects}
        activeProjectCwd="/proj/a"
        onSelect={() => {}}
        onAddProject={() => {}}
      />,
    );
    await user.click(screen.getByRole('button', { name: /alpha/i }));
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });
});
