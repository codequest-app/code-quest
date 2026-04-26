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

  it('shows ⌘K button by default (no props needed)', async () => {
    await renderHeaderBar();
    expect(screen.getByTitle('Command Palette (⌘K)')).toBeInTheDocument();
  });
});

describe('HeaderBar actions', () => {
  it('calls onOpenCommandPalette when ⌘K button clicked', async () => {
    const onOpenCommandPalette = vi.fn();
    const user = userEvent.setup();
    await renderHeaderBar({ onOpenCommandPalette });
    await user.click(screen.getByTitle('Command Palette (⌘K)'));
    expect(onOpenCommandPalette).toHaveBeenCalledOnce();
  });

  it('does not show Raw or Search buttons', async () => {
    await renderHeaderBar();
    expect(screen.queryByTitle('Raw Events')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Search messages')).not.toBeInTheDocument();
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

describe('HeaderBar resumeSlot', () => {
  it('renders resumeSlot when provided', async () => {
    await renderHeaderBar({
      resumeSlot: (
        <button type="button" title="Session history">
          history
        </button>
      ),
    });
    expect(screen.getByTitle('Session history')).toBeInTheDocument();
  });

  it('does not render resumeSlot when not provided', async () => {
    await renderHeaderBar();
    expect(screen.queryByTitle('Session history')).not.toBeInTheDocument();
  });
});
