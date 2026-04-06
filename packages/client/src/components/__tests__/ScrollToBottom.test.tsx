import { segments as s } from '@code-quest/summoner/test';
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockAllIsIntersecting,
  resetIntersectionMocking,
  setupIntersectionMocking,
} from 'react-intersection-observer/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emitAssistantTurn } from '../../test/helpers';
import { renderWithChannel } from '../../test/render-with-channel';
import { MessageList } from '../MessageList';

beforeEach(() => {
  setupIntersectionMocking(vi.fn);
});

afterEach(() => {
  resetIntersectionMocking();
});

async function renderWithMessages() {
  const { claude } = await renderWithChannel(<MessageList />);
  await emitAssistantTurn(claude, 'Hi');
}

describe('Auto-scroll behavior', () => {
  it('does not force scroll to bottom for pending_action when user scrolled up', async () => {
    const { claude } = await renderWithChannel(<MessageList />);
    await emitAssistantTurn(claude, 'Hello');

    // Wait for programmatic scroll timeout to expire
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600));
    });

    // Simulate user scrolled up: set isAtBottom to false
    const container = screen.getByTestId('message-list');
    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 400, configurable: true });
    fireEvent.scroll(container);

    // Set spy AFTER initial messages settled, clear any prior calls
    const scrollIntoView = vi.fn();
    screen.getByTestId('message-list-bottom').scrollIntoView = scrollIntoView;

    // Emit a pending_action (permission request)
    await claude.emit(s.controlRequestBash('req-1', { command: 'ls' }));

    // Should NOT have scrolled — user was reading above
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('uses instant scroll for streaming deltas (content grew, no new message)', async () => {
    const { claude } = await renderWithChannel(<MessageList />);
    await claude.emit(s.textDelta('Hello '));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 600));
    });

    const scrollIntoView = vi.fn();
    screen.getByTestId('message-list-bottom').scrollIntoView = scrollIntoView;

    // Content grows but no new message → instant scroll
    await claude.emit(s.textDelta('world'));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant' });
  });

  it('auto-scrolls when streaming delta grows content while user is at bottom', async () => {
    const { claude } = await renderWithChannel(<MessageList />);
    // Start streaming — textDelta creates/grows a message
    await claude.emit(s.textDelta('Hello '));

    // User is at bottom (default)
    const scrollIntoView = vi.fn();
    screen.getByTestId('message-list-bottom').scrollIntoView = scrollIntoView;

    // More streaming content arrives — content grows but messages.length unchanged
    await claude.emit(s.textDelta('world'));

    expect(scrollIntoView).toHaveBeenCalled();
  });
});

describe('Scroll to bottom button', () => {
  it('does not show button when bottom is visible', async () => {
    await renderWithMessages();
    act(() => mockAllIsIntersecting(true));
    expect(screen.queryByRole('button', { name: /scroll to bottom/i })).not.toBeInTheDocument();
  });

  it('shows button when bottom is not visible', async () => {
    await renderWithMessages();
    act(() => mockAllIsIntersecting(false));
    expect(screen.getByRole('button', { name: /scroll to bottom/i })).toBeInTheDocument();
  });

  it('calls scrollIntoView when button is clicked', async () => {
    const user = userEvent.setup();
    await renderWithMessages();
    act(() => mockAllIsIntersecting(false));
    const scrollIntoView = vi.fn();
    const bottomEl = screen.getByTestId('message-list-bottom');
    bottomEl.scrollIntoView = scrollIntoView;
    await user.click(screen.getByRole('button', { name: /scroll to bottom/i }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('hides button when scrolled back to bottom', async () => {
    await renderWithMessages();
    act(() => mockAllIsIntersecting(false));
    expect(screen.getByRole('button', { name: /scroll to bottom/i })).toBeInTheDocument();
    act(() => mockAllIsIntersecting(true));
    expect(screen.queryByRole('button', { name: /scroll to bottom/i })).not.toBeInTheDocument();
  });
});
