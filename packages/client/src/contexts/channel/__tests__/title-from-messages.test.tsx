import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { WorkspaceLayout } from '@/components/WorkspaceLayout';
import { createFakeSummoner } from '@/test/fake-summoner';
import { sendUserMessage } from '@/test/helpers';
import { PluginProvider } from '../../PluginContext';
import { SessionProvider } from '../../SessionContext';
import { SocketProvider } from '../../SocketContext';
import { TabProvider, useTabState } from '../../TabContext';

function TabTitle() {
  const { tabs, activeTabId } = useTabState();
  const title = activeTabId ? tabs[activeTabId]?.title : undefined;
  return <span data-testid="tab-title">{title ?? '(none)'}</span>;
}

async function setup() {
  const summoner = createFakeSummoner();
  summoner.claude().prepareInit();

  const initReady = new Promise<void>((resolve) => {
    summoner.on('session:init', () => resolve());
  });

  render(
    <SocketProvider socket={summoner.socket}>
      <SessionProvider>
        <PluginProvider>
          <TabProvider>
            <WorkspaceLayout />
            <TabTitle />
          </TabProvider>
        </PluginProvider>
      </SessionProvider>
    </SocketProvider>,
  );
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  await user.click(screen.getByLabelText('New tab'));
  await act(async () => {
    await initReady;
  });
  return { user };
}

describe('title derived from messages', () => {
  it('sets tab title from first user message', async () => {
    const { user } = await setup();
    await sendUserMessage(user, 'Fix the login bug please');

    expect(screen.getByTestId('tab-title')).toHaveTextContent('Fix the login bug please');
  });

  it('does not update title on second message', async () => {
    const { user } = await setup();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);

    await user.click(textarea);
    await user.type(textarea, 'First message');
    await user.keyboard('{Enter}');

    await user.click(textarea);
    await user.type(textarea, 'Second message');
    await user.keyboard('{Enter}');

    expect(screen.getByTestId('tab-title')).toHaveTextContent('First message');
  });
});
