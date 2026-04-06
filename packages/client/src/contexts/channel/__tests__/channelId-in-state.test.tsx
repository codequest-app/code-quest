import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithChannel } from '@/test/render-with-channel';
import { useChannelMessages } from '../../channel';

function ChannelIdDisplay() {
  const { channelId } = useChannelMessages();
  return <span data-testid="channel-id">{channelId}</span>;
}

describe('channelId in ChannelContext', () => {
  it('channelId is available via useChannelMessages()', async () => {
    const { channelId } = await renderWithChannel(<ChannelIdDisplay />);
    expect(screen.getByTestId('channel-id')).toHaveTextContent(channelId);
  });
});
