import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { WorkspaceLayout } from '../../../components/WorkspaceLayout';
import { createFakeClaude } from '../../../test/fake-claude';
import { PluginProvider } from '../../PluginContext';
import { SessionProvider } from '../../SessionContext';
import { SocketProvider } from '../../SocketContext';
import { TabProvider, useTab } from '../../TabContext';

function TabTitle() {
  const { tabs, activeTabId } = useTab();
  const title = activeTabId ? tabs[activeTabId]?.title : undefined;
  return <span data-testid="tab-title">{title ?? '(none)'}</span>;
}

async function setup() {
  const claude = createFakeClaude();
  render(
    <SocketProvider socket={claude.socket}>
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
  return { claude, user };
}

describe('title derived from messages', () => {
  it('sets tab title from first user message', async () => {
    const { user } = await setup();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'Fix the login bug please');
    await user.keyboard('{Enter}');

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
