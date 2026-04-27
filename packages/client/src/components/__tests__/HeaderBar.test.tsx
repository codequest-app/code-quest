import { segments as s } from '@code-quest/summoner/test';
import * as Popover from '@radix-ui/react-popover';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithChannel } from '../../test/render-with-channel';
import { HeaderBar } from '../HeaderBar';

async function renderHeaderBar(props: Partial<React.ComponentProps<typeof HeaderBar>> = {}) {
  return renderWithChannel(
    <Popover.Root>
      <HeaderBar {...props} />
    </Popover.Root>,
    {
      initSegment: s.init('sess-1', { model: 'claude-sonnet-4-6' }),
      extraSegments: [
        s.controlResponse('init', {
          models: [{ value: 'claude-sonnet-4-6', displayName: 'Sonnet 4.6' }],
        }),
      ],
    },
  );
}

describe('HeaderBar (context mode)', () => {
  it('shows model badge but no status dot or label', async () => {
    await renderHeaderBar();
    expect(screen.getByText('Sonnet 4.6')).toBeInTheDocument();
    expect(screen.queryByText(/^Connected$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Disconnected$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Processing$/i)).not.toBeInTheDocument();
  });

  it('title prop still works', async () => {
    await renderHeaderBar({ title: 'Fix bug' });
    expect(screen.getByText('Fix bug')).toBeInTheDocument();
  });

  it('shows truncated channelId when no title', async () => {
    const { channelId } = await renderHeaderBar();
    expect(screen.getByText(`${channelId.slice(0, 8)}…`)).toBeInTheDocument();
  });

  it('does not show command palette button (moved to workspace topbar)', async () => {
    await renderHeaderBar();
    expect(screen.queryByTitle('Command Palette (⌘K)')).not.toBeInTheDocument();
  });
});

describe('HeaderBar resume button', () => {
  it('shows clock/history button when showResumeButton is true', async () => {
    await renderHeaderBar({ showResumeButton: true });
    expect(screen.getByTitle('Session history')).toBeInTheDocument();
  });

  it('does not show clock button when showResumeButton is not provided', async () => {
    await renderHeaderBar();
    expect(screen.queryByTitle('Session history')).not.toBeInTheDocument();
  });
});
