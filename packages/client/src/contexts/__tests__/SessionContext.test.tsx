import { segments as s } from '@code-quest/summoner/test';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createFakeClaude } from '../../test/fake-claude';
import { renderWithWorkspace } from '../../test/render-with-workspace';
import { PluginProvider } from '../PluginContext';
import { SessionProvider, useSession } from '../SessionContext';
import { SocketProvider } from '../SocketContext';
import { TabProvider } from '../TabContext';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

function ProviderConfigDisplay() {
  const { providerConfig } = useSession();
  if (!providerConfig) return <div data-testid="no-config">no config</div>;
  return <div data-testid="brand-name">{providerConfig.brand.name}</div>;
}

describe('SessionProvider (global config only)', () => {
  it('renders UI after connect and launch', async () => {
    await renderWithWorkspace();
    expect(screen.getByPlaceholderText(/Esc to focus/i)).toBeInTheDocument();
  });

  it('state:update config updates are processed without crash', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'go');
    await user.keyboard('{Enter}');
    await claude.emit(s.assistant('hi'));
    await claude.emit(s.result());

    expect(screen.queryAllByText(/hi/).length).toBeGreaterThan(0);
  });

  it('experiment_gates event does not crash', async () => {
    const { claude } = await renderWithWorkspace();
    await claude.emit(s.experimentGates({ review_upsell: true }));

    expect(screen.getByPlaceholderText(/Esc to focus/i)).toBeInTheDocument();
  });

  it('disconnect shows toast warning', async () => {
    const { toast } = await import('sonner');
    const { claude } = await renderWithWorkspace();

    await act(async () => {
      claude.socket.disconnect();
    });

    expect(toast.warning).toHaveBeenCalledWith('Disconnected from server');
  });

  it('does not crash on reconnect', async () => {
    const { claude } = await renderWithWorkspace();

    await act(async () => {
      claude.socket.disconnect();
    });
    await act(async () => {
      claude.socket.connect();
    });

    expect(claude.socket.connected).toBe(true);
  });

  it('providerConfig is available after init', async () => {
    const claude = createFakeClaude();

    render(
      <SocketProvider socket={claude.socket}>
        <SessionProvider>
          <PluginProvider>
            <TabProvider>
              <ProviderConfigDisplay />
            </TabProvider>
          </PluginProvider>
        </SessionProvider>
      </SocketProvider>,
    );

    // After connect + init, providerConfig should be populated
    expect(await screen.findByTestId('brand-name')).toHaveTextContent('Claude');
  });
});
