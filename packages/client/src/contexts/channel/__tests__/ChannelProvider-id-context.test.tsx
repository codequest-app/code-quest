import { segments as s } from '@code-quest/summoner/test';
import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithChannel } from '@/test/render-with-channel';
import { useChannelId } from '../ChannelIdContext';
import { useSessionId } from '../SessionIdContext';

function IdDisplay() {
  const channelId = useChannelId();
  const sessionId = useSessionId();
  return (
    <>
      <span data-testid="channel-id">{channelId}</span>
      <span data-testid="session-id">{sessionId === null ? 'null' : sessionId}</span>
    </>
  );
}

describe('ChannelProvider exposes ChannelIdContext + SessionIdContext', () => {
  it('useChannelId() returns the channelId prop of ChannelProvider', async () => {
    const { channelId } = await renderWithChannel(<IdDisplay />, { channelId: 'ch-smoke' });
    expect(screen.getByTestId('channel-id')).toHaveTextContent(channelId);
  });

  it('useSessionId() reflects the sessionId delivered via session:init', async () => {
    const { claude, channelId } = await renderWithChannel(<IdDisplay />, { skipInit: true });
    expect(screen.getByTestId('session-id')).toHaveTextContent('null');

    await act(async () => {
      await claude.initialize({ launch: { channelId } }, s.init('sess-from-init'));
    });

    expect(screen.getByTestId('session-id')).toHaveTextContent('sess-from-init');
  });
});
