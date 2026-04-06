import { segments as s } from '@code-quest/summoner/test';
import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithChannel } from '../../test/render-with-channel';
import { HeaderBar } from '../HeaderBar';

async function renderHeaderBar(props: Partial<React.ComponentProps<typeof HeaderBar>> = {}) {
  return renderWithChannel(<HeaderBar {...props} />, {
    initSegment: s.init('sess-1', { model: 'claude-sonnet-4-6' }),
    extraSegments: [
      s.controlResponse('init', {
        models: [{ value: 'claude-sonnet-4-6', displayName: 'Sonnet 4.6' }],
      }),
    ],
  });
}

describe('HeaderBar (context mode)', () => {
  it('reads status from context — shows Connected when idle', async () => {
    await renderHeaderBar();
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
    expect(screen.getByText('Sonnet 4.6')).toBeInTheDocument();
  });

  it('reads status from context — shows Disconnected', async () => {
    const { claude } = await renderHeaderBar();
    await act(async () => {
      claude.socket.disconnect();
    });
    expect(screen.getByText(/disconnected/i)).toBeInTheDocument();
  });

  it('title prop still works', async () => {
    await renderHeaderBar({ title: 'Fix bug' });
    expect(screen.getByText('Fix bug')).toBeInTheDocument();
  });

  it('shows truncated channelId when no title', async () => {
    const { channelId } = await renderHeaderBar();
    expect(screen.getByText(`${channelId.slice(0, 8)}…`)).toBeInTheDocument();
  });

  it('onToggleRaw prop shows Raw button', async () => {
    await renderHeaderBar({ onToggleRaw: () => {} });
    expect(screen.getByTitle('Raw Events')).toBeInTheDocument();
  });
});
