import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ChatMessage } from '../../../types';
import { MessageBubble } from '../MessageBubble';

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'msg-1',
    role: 'assistant',
    content: 'Hello!',
    ...overrides,
  };
}

describe('MessageBubble', () => {
  it('should render user message with "You" label', () => {
    render(<MessageBubble message={makeMessage({ role: 'user' })} />);

    expect(screen.getByTestId('message-user')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('should render assistant message with "Assistant" label', () => {
    render(<MessageBubble message={makeMessage({ role: 'assistant' })} />);

    expect(screen.getByTestId('message-assistant')).toBeInTheDocument();
    expect(screen.getByText('Assistant')).toBeInTheDocument();
  });

  it('should render message content', () => {
    render(<MessageBubble message={makeMessage({ content: 'Test content' })} />);

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render thinking block when thinking is present', () => {
    render(<MessageBubble message={makeMessage({ thinking: 'Let me think...' })} />);

    expect(screen.getByTestId('thinking-block')).toBeInTheDocument();
  });

  it('should not render thinking block when thinking is absent', () => {
    render(<MessageBubble message={makeMessage()} />);

    expect(screen.queryByTestId('thinking-block')).not.toBeInTheDocument();
  });

  it('should render tool use blocks', () => {
    render(
      <MessageBubble
        message={makeMessage({
          toolUse: [
            { id: 'toolu_01', name: 'Read', input: { file_path: 'test.ts' } },
            { id: 'toolu_02', name: 'Write', input: { file_path: 'out.ts' } },
          ],
        })}
      />,
    );

    const blocks = screen.getAllByTestId('tool-use-block');
    expect(blocks).toHaveLength(2);
    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(screen.getByText('Write')).toBeInTheDocument();
  });

  it('should render tool results', () => {
    render(
      <MessageBubble
        message={makeMessage({
          toolResult: [{ name: 'Read', output: 'file contents here' }],
        })}
      />,
    );

    expect(screen.getByTestId('tool-result')).toBeInTheDocument();
    expect(screen.getByText('file contents here')).toBeInTheDocument();
  });

  it('should show streaming indicator when isStreaming', () => {
    render(<MessageBubble message={makeMessage({ isStreaming: true })} />);

    expect(screen.getByText('●')).toBeInTheDocument();
  });

  it('should not show streaming indicator when not streaming', () => {
    render(<MessageBubble message={makeMessage({ isStreaming: false })} />);

    expect(screen.queryByText('●')).not.toBeInTheDocument();
  });

  it('should render stats bar when stats present', () => {
    render(
      <MessageBubble
        message={makeMessage({
          stats: { costUsd: 0.001, durationMs: 500, inputTokens: 10, outputTokens: 5 },
        })}
      />,
    );

    expect(screen.getByTestId('stats-bar')).toBeInTheDocument();
  });

  it('should not render stats bar when no stats', () => {
    render(<MessageBubble message={makeMessage()} />);

    expect(screen.queryByTestId('stats-bar')).not.toBeInTheDocument();
  });
});
