import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useChannelMessages } from '@/contexts/channel';
import { useChannelStore } from '@/stores/ChannelStoreContext';
import { renderWithChannel } from '@/test/render-with-channel';

function ActionsTestUI() {
  const isCancelling = useChannelStore((s) => s.status === 'cancelling');
  const actions = useChannelMessages();
  return (
    <div>
      <span role="status" aria-label="cancelling">
        {String(isCancelling)}
      </span>
      <button type="button" onClick={() => actions.abort()}>
        Abort
      </button>
      <button type="button" onClick={() => actions.kill()}>
        Kill
      </button>
    </div>
  );
}

describe('ChannelActions', () => {
  it('abort sets status to cancelling', async () => {
    await renderWithChannel(<ActionsTestUI />);
    expect(screen.getByRole('status', { name: 'cancelling' })).toHaveTextContent('false');

    await userEvent.click(screen.getByText('Abort'));

    expect(screen.getByRole('status', { name: 'cancelling' })).toHaveTextContent('true');
  });

  it('kill does not set status to cancelling (unlike abort)', async () => {
    await renderWithChannel(<ActionsTestUI />);
    await userEvent.click(screen.getByText('Kill'));
    expect(screen.getByRole('status', { name: 'cancelling' })).toHaveTextContent('false');
  });
});
