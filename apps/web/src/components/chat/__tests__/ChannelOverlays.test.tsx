import { segments as s } from '@code-quest/test-kit';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { btwSignal } from '@/features/btw/btw-feature';
import { renderWithChannel } from '@/test/render-with-channel';
import { ChannelOverlays } from '../ChannelOverlays.tsx';

afterEach(() => {
  btwSignal.setState({ open: false, question: '', answer: null, loading: false, error: null });
});

describe('ChannelOverlays', () => {
  it('renders nothing when no pending events', async () => {
    const { container } = await renderWithChannel(<ChannelOverlays />);
    expect(container.firstChild).toBeNull();
  });

  it('shows ContentPreviewDialog when pendingDiffReview is set', async () => {
    const { claude } = await renderWithChannel(<ChannelOverlays />);
    await act(async () => {
      await claude.emitSegment(
        s.controlRequestOpenDiff('diff-1', {
          originalFilePath: '/tmp/old.ts',
          newFilePath: '/tmp/new.ts',
        }),
      );
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows ElicitationDialog when pendingElicitation is set', async () => {
    const { claude } = await renderWithChannel(<ChannelOverlays />);
    await act(async () => {
      await claude.emitSegment(
        s.controlRequestElicitation('elic-1', { message: 'Please confirm' }),
      );
    });
    expect(screen.queryAllByText(/confirm/i).length).toBeGreaterThan(0);
  });

  it('shows SideQuestionDialog when btw open is true', async () => {
    await renderWithChannel(<ChannelOverlays />);
    act(() => {
      btwSignal.setState({
        open: true,
        question: 'side question?',
        answer: null,
        loading: false,
        error: null,
      });
    });
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('closes SideQuestionDialog when closed', async () => {
    const user = userEvent.setup();
    await renderWithChannel(<ChannelOverlays />);
    act(() => {
      btwSignal.setState({
        open: true,
        question: 'test?',
        answer: null,
        loading: false,
        error: null,
      });
    });
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    expect(btwSignal.getState().open).toBe(false);
  });
});
