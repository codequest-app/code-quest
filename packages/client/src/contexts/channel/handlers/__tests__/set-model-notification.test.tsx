import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useChannelConfig, useChannelMessages } from '@/contexts/channel/index';
import { renderWithChannel } from '@/test/render-with-channel';

function TestUI() {
  const { setModel } = useChannelConfig();
  const { messages } = useChannelMessages();
  const systemMsgs = messages.filter(
    (m) => m.role === 'system' && m.type === 'slash_command_result',
  );
  return (
    <div>
      <button type="button" onClick={() => setModel('claude-sonnet-4-6')}>
        switch-model
      </button>
      <ul data-testid="notifications">
        {systemMsgs.map((m, i) => (
          <li key={m.id} data-testid={`notif-${i}`}>
            {m.content}
          </li>
        ))}
      </ul>
    </div>
  );
}

describe('setModel — optimistic notification', () => {
  it('immediately adds slash_command_result message when model is switched', async () => {
    const user = userEvent.setup();
    await renderWithChannel(<TestUI />);

    await act(async () => {
      await user.click(screen.getByText('switch-model'));
    });

    expect(screen.getByTestId('notif-0')).toHaveTextContent('claude-sonnet-4-6');
  });
});
