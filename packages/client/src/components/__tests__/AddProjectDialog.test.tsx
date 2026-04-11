import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SocketProvider } from '../../contexts/SocketContext';
import { createFakeSummoner } from '../../test/fake-summoner';
import { AddProjectDialog } from '../AddProjectDialog';

function setup() {
  const summoner = createFakeSummoner();
  summoner.filesystem().setRoots(['/projects']);
  summoner.filesystem().addDirectory('/projects', ['cc-office', 'DQ']);

  function Wrapper({ children }: { children: ReactNode }) {
    return <SocketProvider socket={summoner.socket}>{children}</SocketProvider>;
  }

  return { Wrapper };
}

describe('AddProjectDialog', () => {
  it('renders dialog with title and tree', async () => {
    const { Wrapper } = setup();
    render(<AddProjectDialog open onSelect={() => {}} onClose={() => {}} />, { wrapper: Wrapper });

    expect(screen.getByText('Select Project Directory')).toBeInTheDocument();
    expect(await screen.findByRole('treeitem', { name: 'projects' })).toBeInTheDocument();
  });

  it('Cancel closes dialog', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setup();
    const onClose = vi.fn();
    render(<AddProjectDialog open onSelect={() => {}} onClose={onClose} />, { wrapper: Wrapper });

    await user.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render when open is false', () => {
    const { Wrapper } = setup();
    render(<AddProjectDialog open={false} onSelect={() => {}} onClose={() => {}} />, {
      wrapper: Wrapper,
    });
    expect(screen.queryByText('Select Project Directory')).not.toBeInTheDocument();
  });
});
