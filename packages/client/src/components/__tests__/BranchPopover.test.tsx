import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BranchPopover } from '../BranchPopover';

describe('BranchPopover', () => {
  it('lists branches with ✓ on current; current is pinned to top', () => {
    render(
      <BranchPopover
        x={0}
        y={0}
        branches={['main', 'feat/x', 'fix/y']}
        current="feat/x"
        onSelect={() => {}}
        onCreateBranch={() => {}}
        onClose={() => {}}
      />,
    );
    const items = screen.getAllByRole('menuitem').filter((i) => i.dataset.kind === 'branch');
    expect(items[0].textContent).toContain('feat/x');
    expect(items[0].textContent).toContain('✓');
    expect(items.map((i) => i.textContent?.replace(/[✓\s]/g, ''))).toEqual([
      'feat/x',
      'main',
      'fix/y',
    ]);
  });

  it('clicking a branch calls onSelect with that branch + closes', async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <BranchPopover
        x={0}
        y={0}
        branches={['main', 'feat/x']}
        current="main"
        onSelect={onSelect}
        onCreateBranch={() => {}}
        onClose={onClose}
      />,
    );
    await userEvent
      .setup({ pointerEventsCheck: 0 })
      .click(screen.getByRole('menuitem', { name: /feat\/x/ }));
    expect(onSelect).toHaveBeenCalledWith('feat/x');
    expect(onClose).toHaveBeenCalled();
  });

  it('"+ New branch (worktree)" item triggers onCreateBranch + closes', async () => {
    const onCreateBranch = vi.fn();
    const onClose = vi.fn();
    render(
      <BranchPopover
        x={0}
        y={0}
        branches={['main']}
        current="main"
        onSelect={() => {}}
        onCreateBranch={onCreateBranch}
        onClose={onClose}
      />,
    );
    await userEvent
      .setup({ pointerEventsCheck: 0 })
      .click(screen.getByRole('menuitem', { name: /new branch/i }));
    expect(onCreateBranch).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('Escape closes popover', async () => {
    const onClose = vi.fn();
    render(
      <BranchPopover
        x={0}
        y={0}
        branches={['main']}
        current="main"
        onSelect={() => {}}
        onCreateBranch={() => {}}
        onClose={onClose}
      />,
    );
    await userEvent.setup().keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  describe('filter + scroll (v2)', () => {
    function renderMany(count: number, opts?: { current?: string }) {
      const branches = Array.from({ length: count }, (_, i) => `branch-${i}`);
      const onSelect = vi.fn();
      const onCreateBranch = vi.fn();
      const onClose = vi.fn();
      render(
        <BranchPopover
          x={0}
          y={0}
          branches={branches}
          current={opts?.current ?? null}
          onSelect={onSelect}
          onCreateBranch={onCreateBranch}
          onClose={onClose}
        />,
      );
      return { onSelect, onCreateBranch, onClose, branches };
    }

    it('renders a filter input that is auto-focused on open', () => {
      renderMany(5);
      const input = screen.getByRole('textbox', { name: /filter branches/i });
      expect(input).toHaveFocus();
    });

    it('typing in the filter narrows the visible list (case-insensitive)', async () => {
      renderMany(10);
      const user = userEvent.setup();
      await user.type(screen.getByRole('textbox', { name: /filter branches/i }), 'BRANCH-3');
      const items = screen.getAllByRole('menuitem').filter((i) => i.dataset.kind === 'branch');
      expect(items).toHaveLength(1);
      expect(items[0].textContent).toContain('branch-3');
    });

    it('current branch is pinned at the top even when filter does not move it', () => {
      renderMany(5, { current: 'branch-3' });
      const items = screen.getAllByRole('menuitem').filter((i) => i.dataset.kind === 'branch');
      expect(items[0].textContent).toContain('branch-3');
      expect(items[0].textContent).toContain('✓');
    });

    it('list has a bounded max-height and scrolls', () => {
      renderMany(100);
      const list = screen.getByTestId('branch-list');
      // Use getComputedStyle fallback via className presence — jsdom doesn't compute maxHeight from Tailwind.
      expect(list.className).toMatch(/overflow-y-auto/);
      expect(list.className).toMatch(/max-h-/);
    });

    it('ArrowDown / ArrowUp move the keyboard cursor; Enter selects', async () => {
      const { onSelect } = renderMany(5);
      const user = userEvent.setup();
      await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
      // Cursor starts at index 0 (branch-0); two ArrowDowns → branch-2.
      expect(onSelect).toHaveBeenCalledWith('branch-2');
    });

    it('filter empty-state offers "Create from filter" when no branch matches', async () => {
      const { onCreateBranch } = renderMany(3);
      const user = userEvent.setup();
      await user.type(screen.getByRole('textbox', { name: /filter/i }), 'nope');
      const create = await screen.findByRole('menuitem', { name: /create.*nope/i });
      await user.click(create);
      expect(onCreateBranch).toHaveBeenCalledWith('nope');
    });
  });
});
