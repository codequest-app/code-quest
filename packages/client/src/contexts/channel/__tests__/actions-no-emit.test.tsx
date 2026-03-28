import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithChannel } from '../../../test/render-with-channel';
import { useChannelMessages } from '../../channel';

function ActionsTestUI() {
  const { isCancelling, ...actions } = useChannelMessages();
  return (
    <div>
      <span data-testid="cancelling">{String(isCancelling)}</span>
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
    expect(screen.getByTestId('cancelling')).toHaveTextContent('false');

    await userEvent.click(screen.getByText('Abort'));

    expect(screen.getByTestId('cancelling')).toHaveTextContent('true');
  });

  it('kill does not throw', async () => {
    await renderWithChannel(<ActionsTestUI />);
    await userEvent.click(screen.getByText('Kill'));
  });
});
