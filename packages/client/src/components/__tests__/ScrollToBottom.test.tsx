import { segments as s } from '@code-quest/summoner/test';
import { act, fireEvent, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COMPOSE_PLACEHOLDER, emitAssistantTurn } from '../../test/helpers';
import { renderWithChannel } from '../../test/render-with-channel';
import { ComposeInput } from '../ComposeInput';

const containerRef = createRef<HTMLDivElement>();

import { MessageList } from '../MessageList';

// Fake only setTimeout/clearTimeout so the 500ms scroll-lock can be
// advanced instantly. fireEvent is used over userEvent because the
// latter relies on real-timer microtask scheduling which deadlocks
// even with the limited toFake list.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});

afterEach(() => {
  vi.useRealTimers();
});

async function renderWithMessages() {
  const { claude } = await renderWithChannel(<MessageList />);
  await emitAssistantTurn(claude, 'Hi');
}

/** Advance past the 500ms programmatic-scroll lock in MessageList.scrollToEnd */
async function waitForScrollUnlock() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(600);
  });
}

/** Simulate scrolling up (not at bottom) */
function simulateScrolledUp(container: HTMLElement) {
  Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
  Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true });
  Object.defineProperty(container, 'clientHeight', { value: 400, configurable: true });
  fireEvent.scroll(container);
}

/** Simulate scrolled to bottom */
function simulateScrolledToBottom(container: HTMLElement) {
  Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
  Object.defineProperty(container, 'scrollTop', { value: 600, configurable: true });
  Object.defineProperty(container, 'clientHeight', { value: 400, configurable: true });
  fireEvent.scroll(container);
}

describe('Auto-scroll behavior', () => {
  it('does not force scroll to bottom for pending_action when user scrolled up', async () => {
    const { claude } = await renderWithChannel(<MessageList />);
    await emitAssistantTurn(claude, 'Hello');

    // Wait for programmatic scroll timeout to expire
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    const container = screen.getByLabelText('message-list');
    simulateScrolledUp(container);

    // Set spy AFTER initial messages settled, clear any prior calls
    const scrollIntoView = vi.fn();
    screen.getByLabelText('message-list-bottom').scrollIntoView = scrollIntoView;

    // Emit a pending_action (permission request)
    await act(async () => {
      await claude.emit(s.controlRequestBash('req-1', { command: 'ls' }));
    });

    // Should NOT have scrolled — user was reading above
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('uses instant scroll for streaming deltas (content grew, no new message)', async () => {
    const { claude } = await renderWithChannel(<MessageList />);
    await act(async () => {
      await claude.emit(s.textDelta('Hello '));
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    const scrollIntoView = vi.fn();
    screen.getByLabelText('message-list-bottom').scrollIntoView = scrollIntoView;

    // Content grows but no new message → instant scroll
    await act(async () => {
      await claude.emit(s.textDelta('world'));
    });

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant' });
  });

  it('forces scroll to bottom when the user submits a new message, even if scrolled up', async () => {
    await renderWithChannel(
      <>
        <MessageList />
        <ComposeInput containerRef={containerRef} />
      </>,
    );
    const container = screen.getByLabelText('message-list');

    // Wait for initial programmatic scroll to settle, then scroll up
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    simulateScrolledUp(container);

    const scrollIntoView = vi.fn();
    screen.getByLabelText('message-list-bottom').scrollIntoView = scrollIntoView;

    const input = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
    fireEvent.change(input, { target: { value: 'hi' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Submitting a message MUST pull the view back to the bottom
    expect(scrollIntoView).toHaveBeenCalled();
  });

  it('auto-scrolls when streaming delta grows content while user is at bottom', async () => {
    const { claude } = await renderWithChannel(<MessageList />);
    // Start streaming — textDelta creates/grows a message
    await act(async () => {
      await claude.emit(s.textDelta('Hello '));
    });

    // User is at bottom (default)
    const scrollIntoView = vi.fn();
    screen.getByLabelText('message-list-bottom').scrollIntoView = scrollIntoView;

    // More streaming content arrives — content grows but messages.length unchanged
    await act(async () => {
      await claude.emit(s.textDelta('world'));
    });

    expect(scrollIntoView).toHaveBeenCalled();
  });
});

describe('Scroll to bottom button', () => {
  it('does not show button when at bottom (initial state)', async () => {
    await renderWithMessages();
    expect(screen.queryByRole('button', { name: /scroll to bottom/i })).not.toBeInTheDocument();
  });

  it('shows button when scrolled up', async () => {
    await renderWithMessages();
    await waitForScrollUnlock();
    const container = screen.getByLabelText('message-list');
    act(() => simulateScrolledUp(container));
    expect(screen.getByRole('button', { name: /scroll to bottom/i })).toBeInTheDocument();
  });

  it('calls scrollIntoView when button is clicked', async () => {
    await renderWithMessages();
    await waitForScrollUnlock();
    const container = screen.getByLabelText('message-list');
    act(() => simulateScrolledUp(container));
    const scrollIntoView = vi.fn();
    screen.getByLabelText('message-list-bottom').scrollIntoView = scrollIntoView;
    fireEvent.click(screen.getByRole('button', { name: /scroll to bottom/i }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant' });
  });

  it('hides button when scrolled back to bottom', async () => {
    await renderWithMessages();
    await waitForScrollUnlock();
    const container = screen.getByLabelText('message-list');
    act(() => simulateScrolledUp(container));
    expect(screen.getByRole('button', { name: /scroll to bottom/i })).toBeInTheDocument();
    act(() => simulateScrolledToBottom(container));
    expect(screen.queryByRole('button', { name: /scroll to bottom/i })).not.toBeInTheDocument();
  });

  it('scroll button has z-float so it appears above the chat input overlay', async () => {
    await renderWithMessages();
    await waitForScrollUnlock();
    const container = screen.getByLabelText('message-list');
    act(() => simulateScrolledUp(container));
    const btn = screen.getByRole('button', { name: /scroll to bottom/i });
    expect(btn.className).toMatch(/\bz-float\b/);
  });
});
