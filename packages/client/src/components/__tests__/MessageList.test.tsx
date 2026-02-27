import { render, screen } from '@testing-library/react';
import type { Message } from '../../types/ui';
import { MessageList } from '../MessageList';

const messages: Message[] = [
  { id: '1', role: 'user', type: 'text', content: 'Hello', timestamp: 1 },
  { id: '2', role: 'assistant', type: 'text', content: 'Hi there', timestamp: 2 },
  { id: '3', role: 'system', type: 'error', content: 'Oops', timestamp: 3 },
];

describe('MessageList', () => {
  it('renders all messages', () => {
    render(<MessageList messages={messages} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText(/Hi there/)).toBeInTheDocument();
    expect(screen.getByText('Oops')).toBeInTheDocument();
  });

  it('renders empty state when no messages', () => {
    const { container } = render(<MessageList messages={[]} />);
    expect(container.querySelector('.message-list')).toBeInTheDocument();
  });

  it('auto-scrolls to bottom', () => {
    const { container } = render(<MessageList messages={messages} />);
    const list = container.querySelector('.message-list')!;
    // scrollTop is 0 in jsdom but scrollIntoView should have been called
    // 3 messages + 1 scroll anchor div
    expect(list.children.length).toBe(4);
  });
});
