import { segments as s } from '@code-quest/summoner/test';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MessageList } from '@/components/chat/conversation/MessageList';
import { SendButton } from '@/test/helpers';
import { renderWithChannel } from '@/test/render-with-channel';

// ── Helpers ──

const spinner = () => screen.queryByRole('status', { name: 'spinner-verb' });

async function setupChannel() {
  const { claude, channelId } = await renderWithChannel(<MessageList />, {
    initSegment: s.init('sess'),
  });
  return { claude, channelId };
}

// Emit a complete turn so messages.length > 0 with status='idle' (onResult sets idle).
async function setupChannelWithIdleMessage() {
  const { claude, channelId } = await setupChannel();
  await act(async () => {
    await claude.emitSegment(s.user('go'));
    await claude.emitSegment(s.assistant('reply'));
    await claude.emitSegment(s.result());
  });
  return { claude, channelId };
}

async function setupChannelWithProcessing() {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  const { claude, channelId } = await renderWithChannel(
    <>
      <MessageList />
      <SendButton message="go" />
    </>,
    { initSegment: s.init('sess') },
  );
  // Populate messages so spinner is visible
  await act(async () => {
    await claude.emitSegment(s.user('init'));
    await claude.emitSegment(s.assistant('reply'));
    await claude.emitSegment(s.result());
  });
  // Click SendButton: sets status='processing', adds user message
  await user.click(screen.getByText('TriggerSend'));
  return { claude, channelId };
}

// ── session:states cross-window sync ──

describe('session:states cross-window sync', () => {
  it('session:states busy shows spinner', async () => {
    const { claude, channelId } = await setupChannelWithIdleMessage();

    await act(async () => {
      claude.pushSessionState(channelId, 'busy');
    });

    expect(spinner()).toBeInTheDocument();
  });

  it('session:states idle hides spinner after busy', async () => {
    const { claude, channelId } = await setupChannelWithIdleMessage();

    await act(async () => {
      claude.pushSessionState(channelId, 'busy');
    });
    await act(async () => {
      claude.pushSessionState(channelId, 'idle');
    });

    expect(spinner()).not.toBeInTheDocument();
  });

  it('processing status ignores session:states idle broadcast', async () => {
    const { claude, channelId } = await setupChannelWithProcessing();

    // Idle broadcast should not clear the spinner while still processing
    await act(async () => {
      claude.pushSessionState(channelId, 'idle');
    });

    expect(spinner()).toBeInTheDocument();
  });

  it('cancelling status ignores session:states idle broadcast', async () => {
    const { claude, channelId } = await setupChannelWithProcessing();

    // Simulate cancel — sets status='cancelling'
    await act(async () => {
      claude.pushSessionState(channelId, 'busy');
    });
    // Now abort to get cancelling
    await act(async () => {
      await claude.send('chat:cancel', { channelId });
    });

    // Idle broadcast should be ignored while cancelling
    await act(async () => {
      claude.pushSessionState(channelId, 'idle');
    });

    expect(spinner()).toBeInTheDocument();
  });
});

// ── session:closed ──

describe('session:closed', () => {
  it('inserts a type:error message "CLI session has ended."', async () => {
    const { claude, channelId } = await setupChannel();

    await act(async () => {
      claude.pushSessionClosed(channelId);
    });

    const errorEl = await screen.findByText('CLI session has ended.');
    expect(errorEl.closest('[data-type="error"]')).toBeInTheDocument();
  });

  it('inserts custom error then "CLI session has ended." when error payload present', async () => {
    const { claude, channelId } = await setupChannel();

    await act(async () => {
      claude.pushSessionClosed(channelId, 'Rate limit exceeded');
    });

    const customEl = await screen.findByText('Rate limit exceeded');
    expect(customEl.closest('[data-type="error"]')).toBeInTheDocument();
    const endedEl = screen.getByText('CLI session has ended.');
    expect(endedEl.closest('[data-type="error"]')).toBeInTheDocument();
  });

  it('sets status to disconnected so subsequent session:states busy does not re-enable spinner', async () => {
    const { claude, channelId } = await setupChannel();

    // session:closed adds an error message and sets status=disconnected
    await act(async () => {
      claude.pushSessionClosed(channelId);
    });

    // session:states { busy } arriving after disconnect should be ignored
    await act(async () => {
      claude.pushSessionState(channelId, 'busy');
    });

    expect(spinner()).not.toBeInTheDocument();
  });
});
