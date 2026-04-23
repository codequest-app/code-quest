import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorktreeContextMenu } from '../WorktreeContextMenu';

describe('WorktreeContextMenu', () => {
  it('renders full menu: Open here / Open in new chat / Copy path / Rename / Archive / Delete', () => {
    render(
      <WorktreeContextMenu
        x={0}
        y={0}
        onOpenHere={() => {}}
        onOpenInNewChat={() => {}}
        onCopyPath={() => {}}
        onRename={() => {}}
        onArchive={() => {}}
        onDelete={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole('menuitem', { name: /open here/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /open in new chat/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /copy path/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /rename/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /archive/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument();
  });

  it('Open here triggers onOpenHere + closes', async () => {
    const onOpenHere = vi.fn();
    const onClose = vi.fn();
    render(
      <WorktreeContextMenu
        x={0}
        y={0}
        onOpenHere={onOpenHere}
        onOpenInNewChat={() => {}}
        onCopyPath={() => {}}
        onRename={() => {}}
        onArchive={() => {}}
        onDelete={() => {}}
        onClose={onClose}
      />,
    );
    await userEvent
      .setup({ pointerEventsCheck: 0 })
      .click(screen.getByRole('menuitem', { name: /open here/i }));
    expect(onOpenHere).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('Open in new chat triggers onOpenInNewChat and closes', async () => {
    const onOpenInNewChat = vi.fn();
    const onClose = vi.fn();
    render(
      <WorktreeContextMenu
        x={0}
        y={0}
        onOpenInNewChat={onOpenInNewChat}
        onCopyPath={() => {}}
        onDelete={() => {}}
        onClose={onClose}
      />,
    );
    await userEvent
      .setup({ pointerEventsCheck: 0 })
      .click(screen.getByRole('menuitem', { name: /open in new chat/i }));
    expect(onOpenInNewChat).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('Copy path triggers onCopyPath and closes', async () => {
    const onCopyPath = vi.fn();
    const onClose = vi.fn();
    render(
      <WorktreeContextMenu
        x={0}
        y={0}
        onOpenInNewChat={() => {}}
        onCopyPath={onCopyPath}
        onDelete={() => {}}
        onClose={onClose}
      />,
    );
    await userEvent
      .setup({ pointerEventsCheck: 0 })
      .click(screen.getByRole('menuitem', { name: /copy path/i }));
    expect(onCopyPath).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('Delete triggers onDelete and closes', async () => {
    const onDelete = vi.fn();
    const onClose = vi.fn();
    render(
      <WorktreeContextMenu
        x={0}
        y={0}
        onOpenInNewChat={() => {}}
        onCopyPath={() => {}}
        onDelete={onDelete}
        onClose={onClose}
      />,
    );
    await userEvent
      .setup({ pointerEventsCheck: 0 })
      .click(screen.getByRole('menuitem', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('Escape closes menu', async () => {
    const onClose = vi.fn();
    render(
      <WorktreeContextMenu
        x={0}
        y={0}
        onOpenInNewChat={() => {}}
        onCopyPath={() => {}}
        onDelete={() => {}}
        onClose={onClose}
      />,
    );
    await userEvent.setup().keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
