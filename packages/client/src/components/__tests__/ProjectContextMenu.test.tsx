import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProjectContextMenu } from '../ProjectContextMenu';

describe('ProjectContextMenu', () => {
  it('renders the "Resume session…" item; clicking calls onSelectResume', async () => {
    const onSelectResume = vi.fn();
    render(
      <ProjectContextMenu x={100} y={200} onSelectResume={onSelectResume} onClose={() => {}} />,
    );

    const item = screen.getByRole('menuitem', { name: /resume session/i });
    await userEvent.setup({ pointerEventsCheck: 0 }).click(item);
    expect(onSelectResume).toHaveBeenCalledTimes(1);
  });

  it('outside click calls onClose', async () => {
    const onClose = vi.fn();
    render(
      <div>
        <button type="button" data-testid="outside">
          outside
        </button>
        <ProjectContextMenu x={100} y={200} onSelectResume={() => {}} onClose={onClose} />
      </div>,
    );

    await userEvent.setup({ pointerEventsCheck: 0 }).click(screen.getByTestId('outside'));
    expect(onClose).toHaveBeenCalled();
  });

  it('Escape key calls onClose', async () => {
    const onClose = vi.fn();
    render(<ProjectContextMenu x={0} y={0} onSelectResume={() => {}} onClose={onClose} />);

    await userEvent.setup({ pointerEventsCheck: 0 }).keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('positions itself at given x/y via fixed positioning', () => {
    render(<ProjectContextMenu x={42} y={84} onSelectResume={() => {}} onClose={() => {}} />);
    const menu = screen.getByRole('menu');
    expect(menu.style.position).toBe('fixed');
    expect(menu.style.left).toBe('42px');
    expect(menu.style.top).toBe('84px');
  });
});
