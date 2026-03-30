import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PluginProvider } from '../../contexts/PluginContext';
import { SessionProvider } from '../../contexts/SessionContext';
import { SocketProvider } from '../../contexts/SocketContext';
import { TabProvider } from '../../contexts/TabContext';
import { createFakeClaude } from '../../test/fake-claude';
import { AuthDialog } from '../AuthDialog';

function renderAuth(opts: { open?: boolean } = {}) {
  const { open = true } = opts;
  const claude = createFakeClaude();
  const onClose = vi.fn();

  const result = render(
    <SocketProvider socket={claude.socket}>
      <SessionProvider>
        <PluginProvider>
          <TabProvider>
            <AuthDialog open={open} onClose={onClose} />
          </TabProvider>
        </PluginProvider>
      </SessionProvider>
    </SocketProvider>,
  );

  return { claude, onClose, ...result };
}

describe('AuthDialog', () => {
  it('shows login button when open', () => {
    renderAuth();
    expect(screen.getByText('Login with Browser')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderAuth({ open: false });
    expect(screen.queryByText('Login with Browser')).not.toBeInTheDocument();
  });

  it('shows cancel button', () => {
    renderAuth();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
});
