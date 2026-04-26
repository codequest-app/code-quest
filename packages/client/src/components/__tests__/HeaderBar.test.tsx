import { segments as s } from '@code-quest/summoner/test';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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

describe('HeaderBar layout', () => {
  it('title is left-aligned (flex-1, no text-center)', async () => {
    await renderHeaderBar({ title: 'My Session' });
    const titleEl = screen.getByText('My Session');
    expect(titleEl.className).toMatch(/flex-1/);
    expect(titleEl.className).not.toMatch(/text-center/);
    expect(titleEl.className).not.toMatch(/text-right/);
  });
});

describe('HeaderBar resume button', () => {
  it('shows clock/history button', async () => {
    await renderHeaderBar({ onOpenResume: vi.fn() });
    expect(screen.getByTitle('Session history')).toBeInTheDocument();
  });

  it('calls onOpenResume when clock button clicked', async () => {
    const onOpenResume = vi.fn();
    const user = userEvent.setup();
    await renderHeaderBar({ onOpenResume });
    await user.click(screen.getByTitle('Session history'));
    expect(onOpenResume).toHaveBeenCalledOnce();
  });

  it('does not show clock button when onOpenResume is not provided', async () => {
    await renderHeaderBar();
    expect(screen.queryByTitle('Session history')).not.toBeInTheDocument();
  });
});
