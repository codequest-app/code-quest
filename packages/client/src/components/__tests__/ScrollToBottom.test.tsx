import { segments as s } from '@code-quest/summoner/test';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import {
  mockAllIsIntersecting,
  resetIntersectionMocking,
  setupIntersectionMocking,
} from 'react-intersection-observer/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelProvider } from '../../contexts/channel';
import { PluginProvider } from '../../contexts/PluginContext';
import { SessionProvider } from '../../contexts/SessionContext';
import { SocketProvider } from '../../contexts/SocketContext';
import { TabProvider } from '../../contexts/TabContext';
import { createFakeClaude } from '../../test/fake-claude';
import { MessageList } from '../MessageList';

beforeEach(() => {
  setupIntersectionMocking(vi.fn);
});

afterEach(() => {
  resetIntersectionMocking();
});

async function renderWithMessages() {
  const claude = createFakeClaude();
  const channelId = crypto.randomUUID();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SocketProvider socket={claude.socket}>
      <SessionProvider>
        <PluginProvider>
          <TabProvider>
            <ChannelProvider channelId={channelId}>{children}</ChannelProvider>
          </TabProvider>
        </PluginProvider>
      </SessionProvider>
    </SocketProvider>
  );
  const result = render(<MessageList />, { wrapper });
  await act(async () => {
    await claude.initialize(s.init('sess-1'), { launch: { channelId } });
  });
  // Send message + reply to populate messages
  await claude.emit(s.assistant('Hi'));
  await claude.emit(s.result());
  return result;
}

describe('Scroll to bottom button', () => {
  it('does not show button when bottom is visible', async () => {
    await renderWithMessages();
    act(() => mockAllIsIntersecting(true));
    expect(screen.queryByRole('button', { name: /scroll to bottom/i })).not.toBeInTheDocument();
  });

  it('shows button when bottom is not visible', async () => {
    await renderWithMessages();
    act(() => mockAllIsIntersecting(false));
    expect(screen.getByRole('button', { name: /scroll to bottom/i })).toBeInTheDocument();
  });

  it('calls scrollIntoView when button is clicked', async () => {
    const user = userEvent.setup();
    await renderWithMessages();
    act(() => mockAllIsIntersecting(false));
    const scrollIntoView = vi.fn();
    const bottomEl = screen.getByTestId('message-list-bottom');
    bottomEl.scrollIntoView = scrollIntoView;
    await user.click(screen.getByRole('button', { name: /scroll to bottom/i }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('hides button when scrolled back to bottom', async () => {
    await renderWithMessages();
    act(() => mockAllIsIntersecting(false));
    expect(screen.getByRole('button', { name: /scroll to bottom/i })).toBeInTheDocument();
    act(() => mockAllIsIntersecting(true));
    expect(screen.queryByRole('button', { name: /scroll to bottom/i })).not.toBeInTheDocument();
  });
});
