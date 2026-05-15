import { segments as s } from '@code-quest/summoner/test';
import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MessageList } from '@/components/chat/conversation/MessageList';
import { createFakeSummoner } from '@/test/fake-summoner';
import { joinChannel, setupClientWindows } from '@/test/helpers';
import { renderWithChannel } from '@/test/render-with-channel';

async function setup() {
  const summoner = createFakeSummoner();
  const claude = summoner.claude();
  const channelId = await claude.initialize(s.init('cli-sess'));
  await renderWithChannel(<MessageList />, { summoner, channelId, skipInit: true });
  return { claude, channelId };
}

describe('interrupt messages', () => {
  it('renders [Request interrupted by user] as warning status, not user bubble', async () => {
    const { claude } = await setup();

    await act(async () => {
      await claude.emitSegment(s.user('[Request interrupted by user]'));
      await new Promise<void>((r) => queueMicrotask(r));
    });

    expect(screen.getByText('Interrupted by user')).toBeInTheDocument();
    expect(screen.queryByText('[Request interrupted by user]')).not.toBeInTheDocument();
  });

  it('renders [Request interrupted by user for tool use] as warning status, not user bubble', async () => {
    const { claude } = await setup();

    await act(async () => {
      await claude.emitSegment(s.user('[Request interrupted by user for tool use]'));
      await new Promise<void>((r) => queueMicrotask(r));
    });

    expect(screen.getByText('Interrupted by user')).toBeInTheDocument();
    expect(
      screen.queryByText('[Request interrupted by user for tool use]'),
    ).not.toBeInTheDocument();
  });

  it('renders interrupt message from session history', async () => {
    const { windowA, windowB, channelId } = await setupClientWindows();

    await windowA.send('chat:send', { channelId, message: 'go' });
    await windowA.claude().emitSegment(s.user('[Request interrupted by user for tool use]'));
    await windowA.claude().emitSegment(s.result());

    await renderWithChannel(<MessageList />, { summoner: windowB, channelId, skipInit: true });
    await joinChannel(windowB, channelId);

    expect(screen.getByText('Interrupted by user')).toBeInTheDocument();
  });
});
