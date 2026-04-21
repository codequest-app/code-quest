import { segments as s } from '@code-quest/summoner/test';
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { COMPOSE_PLACEHOLDER, emitAssistantTurn } from '../../test/helpers';
import { renderWithChannel } from '../../test/render-with-channel';
import { ComposeInput } from '../ComposeInput';
import { MessageList } from '../MessageList';

async function renderWithMessages() {
  const { claude } = await renderWithChannel(<MessageList />);
  await emitAssistantTurn(claude, 'Hi');
}

/** Wait for programmatic scroll lock to expire (500ms timeout in scrollToEnd) */
async function waitForScrollUnlock() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 600));
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
      await new Promise((r) => setTimeout(r, 600));
    });

    const container = screen.getByTestId('message-list');
    simulateScrolledUp(container);

    // Set spy AFTER initial messages settled, clear any prior calls
    const scrollIntoView = vi.fn();
    screen.getByTestId('message-list-bottom').scrollIntoView = scrollIntoView;

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
      await new Promise((r) => setTimeout(r, 600));
    });

    const scrollIntoView = vi.fn();
    screen.getByTestId('message-list-bottom').scrollIntoView = scrollIntoView;

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
        <ComposeInput />
      </>,
    );
    const container = screen.getByTestId('message-list');

    // Wait for initial programmatic scroll to settle, then scroll up
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600));
    });
    simulateScrolledUp(container);

    const scrollIntoView = vi.fn();
    screen.getByTestId('message-list-bottom').scrollIntoView = scrollIntoView;

    await userEvent.type(screen.getByPlaceholderText(COMPOSE_PLACEHOLDER), 'hi{Enter}');

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
    screen.getByTestId('message-list-bottom').scrollIntoView = scrollIntoView;

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
    const container = screen.getByTestId('message-list');
    act(() => simulateScrolledUp(container));
    expect(screen.getByRole('button', { name: /scroll to bottom/i })).toBeInTheDocument();
  });

  it('calls scrollIntoView when button is clicked', async () => {
    const user = userEvent.setup();
    await renderWithMessages();
    await waitForScrollUnlock();
    const container = screen.getByTestId('message-list');
    act(() => simulateScrolledUp(container));
    const scrollIntoView = vi.fn();
    screen.getByTestId('message-list-bottom').scrollIntoView = scrollIntoView;
    await user.click(screen.getByRole('button', { name: /scroll to bottom/i }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant' });
  });

  it('hides button when scrolled back to bottom', async () => {
    await renderWithMessages();
    await waitForScrollUnlock();
    const container = screen.getByTestId('message-list');
    act(() => simulateScrolledUp(container));
    expect(screen.getByRole('button', { name: /scroll to bottom/i })).toBeInTheDocument();
    act(() => simulateScrolledToBottom(container));
    expect(screen.queryByRole('button', { name: /scroll to bottom/i })).not.toBeInTheDocument();
  });

  it('scroll button has z-float so it appears above the chat input overlay', async () => {
    await renderWithMessages();
    await waitForScrollUnlock();
    const container = screen.getByTestId('message-list');
    act(() => simulateScrolledUp(container));
    const btn = screen.getByRole('button', { name: /scroll to bottom/i });
    expect(btn.className).toMatch(/\bz-float\b/);
  });
});
