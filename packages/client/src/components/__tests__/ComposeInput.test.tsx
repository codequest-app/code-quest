import { segments as s } from '@code-quest/summoner/test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ChannelProvider } from '../../contexts/channel';
import { PluginProvider } from '../../contexts/PluginContext';
import { SessionProvider } from '../../contexts/SessionContext';
import { SocketProvider } from '../../contexts/SocketContext';
import { TabProvider } from '../../contexts/TabContext';
import { createFakeClaude } from '../../test/fake-claude';
import { ComposeInput } from '../ComposeInput';

async function renderWithProviders() {
  const claude = createFakeClaude();
  const channelId = await claude.initialize(s.init('sess-1'));
  const result = render(
    <SocketProvider socket={claude.socket}>
      <SessionProvider>
        <PluginProvider>
          <TabProvider>
            <ChannelProvider channelId={channelId}>
              <ComposeInput />
            </ChannelProvider>
          </TabProvider>
        </PluginProvider>
      </SessionProvider>
    </SocketProvider>,
  );
  return { claude, channelId, ...result };
}

describe('ComposeInput', () => {
  it('renders textarea with placeholder', async () => {
    await renderWithProviders();
    expect(screen.getByPlaceholderText('⌘ Esc to focus or unfocus Claude')).toBeInTheDocument();
  });

  it('typing updates the textarea value', async () => {
    await renderWithProviders();
    const textarea = screen.getByPlaceholderText('⌘ Esc to focus or unfocus Claude');
    await userEvent.type(textarea, 'hello');
    expect(textarea).toHaveValue('hello');
  });

  it('shows processing placeholder when status is processing', async () => {
    const { claude } = await renderWithProviders();
    // Send message without result → status becomes processing
    const textarea = screen.getByPlaceholderText('⌘ Esc to focus or unfocus Claude');
    await userEvent.type(textarea, 'go');
    await userEvent.keyboard('{Enter}');
    await claude.emit(s.assistant('thinking...'));

    expect(screen.getByPlaceholderText('Queue another message…')).toBeInTheDocument();
  });

  it('Enter submits and clears textarea', async () => {
    await renderWithProviders();
    const textarea = screen.getByPlaceholderText('⌘ Esc to focus or unfocus Claude');
    await userEvent.type(textarea, 'hello{Enter}');
    expect(textarea).toHaveValue('');
  });

  it('renders without error when no attachments', async () => {
    await renderWithProviders();
    expect(screen.getByPlaceholderText('⌘ Esc to focus or unfocus Claude')).toBeInTheDocument();
  });
});
