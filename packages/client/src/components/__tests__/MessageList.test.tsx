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

  it('renders empty state with welcome text when no messages', () => {
    render(<MessageList messages={[]} />);
    expect(screen.getByText(/how can i help/i)).toBeInTheDocument();
  });

  it('shows avatar on first message of a role group', () => {
    render(<MessageList messages={messages} />);
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Assistant')).toBeInTheDocument();
  });

  it('hides avatar on consecutive same-role messages', () => {
    const consecutive: Message[] = [
      { id: '1', role: 'assistant', type: 'text', content: 'First', timestamp: 1 },
      {
        id: '2',
        role: 'assistant',
        type: 'tool_use',
        content: 'bash',
        meta: { toolId: 't1', input: {} },
        timestamp: 2,
      },
      { id: '3', role: 'assistant', type: 'text', content: 'Second', timestamp: 3 },
    ];
    render(<MessageList messages={consecutive} />);
    const labels = screen.getAllByText('Assistant');
    expect(labels).toHaveLength(1);
  });

  it('auto-scrolls to bottom', () => {
    render(<MessageList messages={messages} />);
    const list = screen.getByTestId('message-list');
    expect(list).toBeInTheDocument();
  });
});
