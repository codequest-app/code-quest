import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { segments as s } from '@code-quest/summoner/test';
import { describe, expect, it, vi } from 'vitest';
import { PluginProvider } from '../../contexts/PluginContext';
import { SessionProvider } from '../../contexts/SessionContext';
import { SocketProvider } from '../../contexts/SocketContext';
import { TabProvider } from '../../contexts/TabContext';
import { createFakeClaude } from '../../test/fake-claude';
import { AuthDialog } from '../AuthDialog';

function renderAuth(opts: { open?: boolean; withSession?: boolean } = {}) {
  const { open = true, withSession = false } = opts;
  const claude = createFakeClaude();
  const onClose = vi.fn();

  if (withSession) {
    claude.prepareInit(s.init('auth-sess'));
  }

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

async function renderAuthWithSession() {
  const ctx = renderAuth({ withSession: true });
  // Launch session so there's an active channel
  await act(async () => {
    ctx.claude.socket.emit('session:launch' as never, { channelId: 'auth-ch' }, () => {});
    await new Promise((r) => queueMicrotask(r));
    await new Promise((r) => queueMicrotask(r));
    await new Promise((r) => queueMicrotask(r));
  });
  return ctx;
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
