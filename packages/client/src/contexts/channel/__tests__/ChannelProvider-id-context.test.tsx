import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithChannel } from '@/test/render-with-channel';
import { useChannelId } from '../ChannelIdContext';

function IdDisplay() {
  const channelId = useChannelId();
  return <span data-testid="channel-id">{channelId}</span>;
}

describe('ChannelProvider exposes ChannelIdContext', () => {
  it('useChannelId() returns the channelId prop of ChannelProvider', async () => {
    const { channelId } = await renderWithChannel(<IdDisplay />, { channelId: 'ch-smoke' });
    expect(screen.getByTestId('channel-id')).toHaveTextContent(channelId);
  });
});
